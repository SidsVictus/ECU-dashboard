import { useState, useEffect, useRef, useCallback } from 'react';

export type EngineMode = 'idle' | 'city' | 'highway' | 'aggressive' | 'decel';

export interface EngineSnapshot {
  timestamp: number;
  rpm: number;
  engineTemp: number;
  exhaustTemp: number;
  engineLoad: number;
  throttle: number;
  speed: number;
  gear: number;
  vibration: number;
  oilPressure: number;
  fuelPressure: number;
  batteryVoltage: number;
  afr: number;
  intakeAirTemp: number;
  mapSensor: number;
  mode: EngineMode;
  fuelLevel: number;
  coolantTemp: number;
}

export interface HealthScores {
  engine:     number;
  thermal:    number;
  fueling:    number;
  electrical: number;
  mechanical: number;
  overall:    number;
}

export interface RidingConditions {
  idle:       number;
  city:       number;
  highway:    number;
  aggressive: number;
  decel:      number;
}

export interface EngineDataState {
  current:      EngineSnapshot | null;
  history:      EngineSnapshot[];
  health:       HealthScores;
  conditions:   RidingConditions;
  alerts:       string[];
  sessionStart: number;
  peakRpm:      number;
  minRpm:       number;
  peakTemp:     number;
  peakLoad:     number;
}

const clamp  = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp   = (a: number, b: number, t: number)   => a + (b - a) * t;
const jitter = (v: number, range: number)           => v + (Math.random() - 0.5) * range * 2;

const REDLINE = 9500;

const MODE_TARGETS: Record<EngineMode, { rpm: number; load: number; throttle: number }> = {
  idle:       { rpm: 950,  load: 8,  throttle: 4  },
  city:       { rpm: 2800, load: 38, throttle: 30 },
  highway:    { rpm: 4200, load: 62, throttle: 55 },
  aggressive: { rpm: 7800, load: 91, throttle: 88 },
  decel:      { rpm: 1200, load: 5,  throttle: 1  },
};

function pickNextMode(current: EngineMode): EngineMode {
  const transitions: Record<EngineMode, EngineMode[]> = {
    idle:       ['idle', 'city', 'city'],
    city:       ['city', 'city', 'highway', 'aggressive', 'decel', 'idle'],
    highway:    ['highway', 'highway', 'city', 'aggressive', 'decel'],
    aggressive: ['aggressive', 'highway', 'city', 'decel'],
    decel:      ['decel', 'city', 'idle'],
  };
  const opts = transitions[current];
  return opts[Math.floor(Math.random() * opts.length)];
}

function computeGear(speed: number): number {
  if (speed < 15)  return 1;
  if (speed < 30)  return 2;
  if (speed < 55)  return 3;
  if (speed < 80)  return 4;
  if (speed < 110) return 5;
  return 6;
}

function computeHealth(snaps: EngineSnapshot[]): HealthScores {
  if (snaps.length === 0) {
    return { engine: 100, thermal: 100, fueling: 100, electrical: 100, mechanical: 100, overall: 100 };
  }
  const last    = snaps[snaps.length - 1];
  const slice   = snaps.slice(-30);
  const avgLoad = slice.reduce((a, s) => a + s.engineLoad, 0) / slice.length;
  const maxEGT  = Math.max(...slice.map(s => s.exhaustTemp));

  const engine     = clamp(100 - (avgLoad > 85 ? (avgLoad - 85) * 2 : 0) - (last.rpm > 8500 ? 10 : 0), 0, 100);
  const thermal    = clamp(100 - Math.max(0, last.engineTemp - 95) * 2 - Math.max(0, maxEGT - 680) * 0.15, 0, 100);
  const fueling    = clamp(100 - Math.abs(last.afr - 14.7) * 4 - (last.fuelPressure < 2.5 ? 12 : 0), 0, 100);
  const electrical = clamp(100 - (last.batteryVoltage < 12.0 ? 20 : last.batteryVoltage < 12.5 ? 8 : 0), 0, 100);
  const mechanical = clamp(100 - (last.vibration > 5 ? (last.vibration - 5) * 6 : 0) - (last.oilPressure < 2 ? 15 : 0), 0, 100);
  const overall    = Math.round((engine + thermal + fueling + electrical + mechanical) / 5);

  return {
    engine:     Math.round(engine),
    thermal:    Math.round(thermal),
    fueling:    Math.round(fueling),
    electrical: Math.round(electrical),
    mechanical: Math.round(mechanical),
    overall,
  };
}

function computeAlerts(snap: EngineSnapshot, health: HealthScores): string[] {
  const alerts: string[] = [];
  if (snap.engineTemp > 105)       alerts.push('⚠ Engine temp critical — check coolant');
  if (snap.exhaustTemp > 750)      alerts.push('⚠ Exhaust temp high — ease throttle');
  if (snap.rpm > REDLINE * 0.93)   alerts.push('⚠ Approaching redline!');
  if (snap.batteryVoltage < 12.0)  alerts.push('⚠ Low battery voltage');
  if (snap.oilPressure < 1.8)      alerts.push('⚠ Low oil pressure');
  if (snap.afr < 12.5)             alerts.push('⚠ Rich mixture detected');
  if (snap.afr > 16.0)             alerts.push('⚠ Lean mixture detected');
  if (health.overall >= 90 && alerts.length === 0) alerts.push('✓ Engine operating normally');
  return alerts;
}

export function useEngineData(intervalMs: number) {
  const MAX_HISTORY = 120;

  const [state, setState] = useState<EngineDataState>({
    current: null,
    history: [],
    health: { engine: 100, thermal: 100, fueling: 100, electrical: 100, mechanical: 100, overall: 100 },
    conditions: { idle: 0, city: 0, highway: 0, aggressive: 0, decel: 0 },
    alerts: [],
    sessionStart: Date.now(),
    peakRpm: 0,
    minRpm: Infinity,
    peakTemp: 0,
    peakLoad: 0,
  });

  const physRef = useRef({
    mode:         'idle' as EngineMode,
    modeTimer:    0,
    rpm:          950,
    engineTemp:   68,
    exhaustTemp:  120,
    engineLoad:   8,
    throttle:     4,
    speed:        0,
    fuelLevel:    100,
    coolantTemp:  68,
    intakeAirTemp: 28,
  });

  const condRef = useRef<Record<EngineMode, number>>({
    idle: 0, city: 0, highway: 0, aggressive: 0, decel: 0,
  });

  const tick = useCallback(() => {
    const p   = physRef.current;
    const now = Date.now();

    // Mode transition
    p.modeTimer--;
    if (p.modeTimer <= 0) {
      p.mode      = pickNextMode(p.mode);
      p.modeTimer = Math.floor(Math.random() * 8) + 4;
    }

    const target = MODE_TARGETS[p.mode];

    // Physics
    p.rpm        = clamp(lerp(p.rpm,        jitter(target.rpm,      60), 0.18), 600, REDLINE);
    p.engineLoad = clamp(lerp(p.engineLoad, jitter(target.load,      2),  0.15), 0, 100);
    p.throttle   = clamp(lerp(p.throttle,   jitter(target.throttle, 2),   0.20), 0, 100);

    const targetSpeed = (p.rpm / REDLINE) * 160 * (target.load / 100) * 1.4;
    p.speed       = clamp(lerp(p.speed, jitter(targetSpeed, 3), 0.12), 0, 180);

    const heatIn  = p.engineLoad * 0.012 + p.rpm * 0.00004;
    const heatOut = (p.engineTemp - 22) * 0.025;
    p.engineTemp  = clamp(p.engineTemp + heatIn - heatOut + jitter(0, 0.3), 60, 130);
    p.coolantTemp = clamp(p.engineTemp - jitter(3, 1.5), 55, 125);

    const egtTarget  = 90 + p.engineLoad * 7.5 + (p.rpm / REDLINE) * 300;
    p.exhaustTemp    = clamp(lerp(p.exhaustTemp, jitter(egtTarget, 15), 0.10), 80, 900);
    p.intakeAirTemp  = clamp(p.intakeAirTemp + jitter(0, 0.05), 20, 55);
    p.fuelLevel      = clamp(p.fuelLevel - 0.0003 * (p.engineLoad / 100), 0, 100);

    const oilPressure     = clamp(1.2 + (p.rpm / REDLINE) * 4.8 + jitter(0, 0.2), 0, 7);
    const fuelPressure    = clamp(2.8 + jitter(0, 0.15), 1, 5);
    const batteryVoltage  = clamp(13.8 + jitter(0, 0.12) - (p.engineLoad > 80 ? 0.4 : 0), 10, 15);
    const afr             = clamp(14.7 + (p.mode === 'aggressive' ? -0.8 : 0) + jitter(0, 0.3), 10, 20);
    const vibration       = clamp(0.5 + (p.rpm / REDLINE) * 6 + jitter(0, 0.4), 0, 10);
    const mapSensor       = clamp(30 + p.engineLoad * 0.65 + jitter(0, 2), 15, 105);
    const gear            = computeGear(p.speed);

    condRef.current[p.mode]++;

    const snap: EngineSnapshot = {
      timestamp:      now,
      rpm:            Math.round(p.rpm),
      engineTemp:     parseFloat(p.engineTemp.toFixed(1)),
      exhaustTemp:    parseFloat(p.exhaustTemp.toFixed(1)),
      engineLoad:     parseFloat(p.engineLoad.toFixed(1)),
      throttle:       parseFloat(p.throttle.toFixed(1)),
      speed:          parseFloat(p.speed.toFixed(1)),
      gear,
      vibration:      parseFloat(vibration.toFixed(2)),
      oilPressure:    parseFloat(oilPressure.toFixed(2)),
      fuelPressure:   parseFloat(fuelPressure.toFixed(2)),
      batteryVoltage: parseFloat(batteryVoltage.toFixed(2)),
      afr:            parseFloat(afr.toFixed(2)),
      intakeAirTemp:  parseFloat(p.intakeAirTemp.toFixed(1)),
      mapSensor:      parseFloat(mapSensor.toFixed(1)),
      mode:           p.mode,
      fuelLevel:      parseFloat(p.fuelLevel.toFixed(2)),
      coolantTemp:    parseFloat(p.coolantTemp.toFixed(1)),
    };

    setState(prev => {
      const newHistory  = [...prev.history, snap].slice(-MAX_HISTORY);
      const health      = computeHealth(newHistory);
      const alerts      = computeAlerts(snap, health);
      const total       = Object.values(condRef.current).reduce((a, b) => a + b, 0) || 1;
      const conditions: RidingConditions = {
        idle:       Math.round((condRef.current.idle       / total) * 100),
        city:       Math.round((condRef.current.city       / total) * 100),
        highway:    Math.round((condRef.current.highway    / total) * 100),
        aggressive: Math.round((condRef.current.aggressive / total) * 100),
        decel:      Math.round((condRef.current.decel      / total) * 100),
      };
      return {
        current:      snap,
        history:      newHistory,
        health,
        conditions,
        alerts,
        sessionStart: prev.sessionStart,
        peakRpm:      Math.max(prev.peakRpm, snap.rpm),
        minRpm:       Math.min(prev.minRpm === Infinity ? snap.rpm : prev.minRpm, snap.rpm),
        peakTemp:     Math.max(prev.peakTemp, snap.engineTemp),
        peakLoad:     Math.max(prev.peakLoad, snap.engineLoad),
      };
    });
  }, []);

  useEffect(() => {
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [tick, intervalMs]);

  return state;
}
