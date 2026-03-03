import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { EngineSnapshot } from '../hooks/useEngineData';

interface Props { history: EngineSnapshot[]; peakRpm: number; minRpm: number; }

const REDLINE = 9500;

interface TooltipPayloadItem {
  value: number;
  payload: { peakSoFar?: number };
}
interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const rpm  = payload[0]?.value ?? 0;
  const peak = payload[0]?.payload?.peakSoFar ?? rpm;
  return (
    <div className="custom-tooltip">
      <div className="tooltip-label">t = {label}s</div>
      <div className="tooltip-row">
        <div className="tooltip-color" style={{ background: '#6c8ef5' }} />
        <span className="tooltip-key">RPM</span>
        <span className="tooltip-val">{rpm.toLocaleString()}</span>
      </div>
      <div className="tooltip-minmax">
        <div className="tooltip-minmax-item">Peak <span>{peak.toLocaleString()}</span></div>
        <div className="tooltip-minmax-item">% Redline <span>{((rpm / REDLINE) * 100).toFixed(1)}%</span></div>
      </div>
    </div>
  );
}

export default function RPMChart({ history, peakRpm, minRpm }: Props) {
  const data = history.map((s, i) => ({
    t:    i,
    rpm:  s.rpm,
    mode: s.mode,
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="rpmGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#6c8ef5" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6c8ef5" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" vertical={false} />
          <XAxis
            dataKey="t" tick={{ fill: '#5a5f72', fontSize: 10 }}
            tickLine={false} axisLine={false}
            label={{ value: 'samples', position: 'insideBottomRight', fill: '#5a5f72', fontSize: 9, offset: -4 }}
          />
          <YAxis
            domain={[0, REDLINE + 500]}
            tick={{ fill: '#5a5f72', fontSize: 10 }}
            tickLine={false} axisLine={false}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={REDLINE}
            stroke="#e05c6e"
            strokeDasharray="6 3"
            strokeWidth={1.5}
            label={{ value: 'REDLINE', fill: '#e05c6e', fontSize: 9, position: 'insideTopRight' }}
          />
          <ReferenceLine y={REDLINE * 0.85} stroke="#e8a838" strokeDasharray="4 4" strokeWidth={1} />
          <Area
            type="monotone" dataKey="rpm"
            stroke="#6c8ef5" strokeWidth={2}
            fill="url(#rpmGrad)" dot={false} activeDot={{ r: 4, fill: '#6c8ef5', stroke: '#0e0f13', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mini-stats">
        <div className="mini-stat">
          <div className="mini-stat-label">Peak RPM</div>
          <div className="mini-stat-value blue">{peakRpm.toLocaleString()}</div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-label">Min RPM</div>
          <div className="mini-stat-value teal">{minRpm === Infinity ? '—' : minRpm.toLocaleString()}</div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-label">Redline</div>
          <div className="mini-stat-value">{REDLINE.toLocaleString()}</div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-label">Current %</div>
          <div className="mini-stat-value amber">
            {history.length ? ((history[history.length - 1].rpm / REDLINE) * 100).toFixed(1) : '—'}%
          </div>
        </div>
      </div>
    </div>
  );
}
