import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { EngineSnapshot } from '../hooks/useEngineData';

interface Props { history: EngineSnapshot[]; peakTemp: number; }

interface TooltipPayloadItem {
  dataKey: string;
  name: string;
  value: number;
  stroke: string;
}
interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="tooltip-label">Sample {label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="tooltip-row">
          <div className="tooltip-color" style={{ background: p.stroke }} />
          <span className="tooltip-key">{p.name}</span>
          <span className="tooltip-val">{p.value}°C</span>
        </div>
      ))}
      <div className="tooltip-minmax">
        <div className="tooltip-minmax-item">
          Engine safe &lt; <span>100°C</span>
        </div>
        <div className="tooltip-minmax-item">
          EGT safe &lt; <span>750°C</span>
        </div>
      </div>
    </div>
  );
}

export default function TemperatureChart({ history, peakTemp }: Props) {
  const data = history.map((s, i) => ({
    t:       i,
    engine:  s.engineTemp,
    exhaust: s.exhaustTemp,
    coolant: s.coolantTemp,
  }));

  const lastEGT = history.length ? history[history.length - 1].exhaustTemp : 0;

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" vertical={false} />
          <XAxis dataKey="t" tick={{ fill: '#5a5f72', fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#5a5f72', fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle" iconSize={7}
            wrapperStyle={{ fontSize: 11, color: '#9095a8', paddingTop: 8 }}
          />
          <ReferenceLine y={100} stroke="#e05c6e" strokeDasharray="4 3" strokeWidth={1} />
          <Line type="monotone" dataKey="engine"  name="Engine °C"  stroke="#e8a838" strokeWidth={2}   dot={false} activeDot={{ r: 3 }} />
          <Line type="monotone" dataKey="exhaust" name="Exhaust °C" stroke="#e05c6e" strokeWidth={2}   dot={false} activeDot={{ r: 3 }} />
          <Line type="monotone" dataKey="coolant" name="Coolant °C" stroke="#4db8a8" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} strokeDasharray="5 3" />
        </LineChart>
      </ResponsiveContainer>

      <div className="mini-stats">
        <div className="mini-stat">
          <div className="mini-stat-label">Peak Engine</div>
          <div className="mini-stat-value amber">{peakTemp}°C</div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-label">Live EGT</div>
          <div className="mini-stat-value" style={{ color: lastEGT > 750 ? 'var(--rose)' : 'var(--teal)' }}>
            {lastEGT.toFixed(0)}°C
          </div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-label">Engine Safe</div>
          <div className="mini-stat-value">&lt; 100°C</div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-label">EGT Safe</div>
          <div className="mini-stat-value">&lt; 750°C</div>
        </div>
      </div>
    </div>
  );
}
