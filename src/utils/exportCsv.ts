import { EngineSnapshot } from '../hooks/useEngineData';

export function exportToCsv(history: EngineSnapshot[], sessionStart: number) {
  if (!history.length) return;

  const headers = [
    'timestamp_ms', 'elapsed_s', 'mode',
    'rpm', 'speed_kmh', 'gear',
    'engine_temp_c', 'exhaust_temp_c', 'coolant_temp_c', 'intake_air_temp_c',
    'engine_load_pct', 'throttle_pct',
    'oil_pressure_bar', 'fuel_pressure_bar',
    'battery_voltage_v', 'afr', 'map_sensor_kpa',
    'vibration', 'fuel_level_pct',
  ];

  const rows = history.map(s => [
    s.timestamp,
    ((s.timestamp - sessionStart) / 1000).toFixed(2),
    s.mode,
    s.rpm,
    s.speed.toFixed(1),
    s.gear,
    s.engineTemp.toFixed(1),
    s.exhaustTemp.toFixed(1),
    s.coolantTemp.toFixed(1),
    s.intakeAirTemp.toFixed(1),
    s.engineLoad.toFixed(1),
    s.throttle.toFixed(1),
    s.oilPressure.toFixed(2),
    s.fuelPressure.toFixed(2),
    s.batteryVoltage.toFixed(2),
    s.afr.toFixed(2),
    s.mapSensor.toFixed(1),
    s.vibration.toFixed(2),
    s.fuelLevel.toFixed(2),
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob       = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url        = URL.createObjectURL(blob);
  const link       = document.createElement('a');
  const ts         = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  link.setAttribute('href', url);
  link.setAttribute('download', `ecu_session_${ts}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
