import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { EngineSnapshot } from '../hooks/useEngineData';

interface Props { history: EngineSnapshot[]; peakLoad: number; }

interface TooltipPayloadItem {
  value: number;
}
interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const load     = payload[0]?.value ?? 0;
  const throttle = payload[1]?.value ?? 0;
  return (
    <div className="custom-tooltip">
      <div className="tooltip-label">Sample {label}</div>
      <div className="tooltip-row">
        <div className="tooltip-color" style={{ background: '#8b6df5' }} />
        <span className="tooltip-key">Engine Load</span>
        <span className="tooltip-val">{load.toFixed(1)}%</span>
      </div>
      <div className="tooltip-row">
        <div className="tooltip-color" style={{ background: '#4db8a8' }} />
        <span className="tooltip-key">Throttle</span>
        <span className="tooltip-val">{throttle.toFixed(1)}%</span>
      </div>
      <div className="tooltip-minmax">
        <div className="tooltip-minmax-item">High load &gt; <span>80%</span></div>
        <div className="tooltip-minmax-item">Status <span>{load > 80 ? 'Heavy' : load > 50 ? 'Moderate' : 'Light'}</span></div>
      </div>
    </div>
  );
}

export default function EngineLoadChart({ history, peakLoad }: Props) {
  const data = history.map((s, i) => ({
    t:        i,
    load:     s.engineLoad,
    throttle: s.throttle,
  }));

  const avgLoad = history.length
    ? (history.slice(-20).reduce((a, s) => a + s.engineLoad, 0) / Math.min(20, history.length)).toFixed(1)
    : '0';

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#8b6df5" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#8b6df5" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="thrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#4db8a8" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#4db8a8" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" vertical={false} />
          <XAxis dataKey="t" tick={{ fill: '#5a5f72', fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#5a5f72', fontSize: 10 }}
            tickLine={false} axisLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={80} stroke="#e8a838" strokeDasharray="4 3" strokeWidth={1}
            label={{ value: 'HIGH', fill: '#e8a838', fontSize: 9, position: 'insideTopRight' }} />
          <Area type="monotone" dataKey="load"     stroke="#8b6df5" strokeWidth={2}   fill="url(#loadGrad)"  dot={false} activeDot={{ r: 3 }} />
          <Area type="monotone" dataKey="throttle" stroke="#4db8a8" strokeWidth={1.5} fill="url(#thrGrad)"   dot={false} activeDot={{ r: 3 }} />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mini-stats">
        <div className="mini-stat">
          <div className="mini-stat-label">Peak Load</div>
          <div className="mini-stat-value" style={{ color: 'var(--indigo)' }}>{peakLoad.toFixed(1)}%</div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-label">Avg Load (20s)</div>
          <div className="mini-stat-value teal">{avgLoad}%</div>
        </div>
      </div>
    </div>
  );
}
