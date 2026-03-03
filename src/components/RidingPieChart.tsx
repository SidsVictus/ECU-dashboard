import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { RidingConditions } from '../hooks/useEngineData';

interface Props { conditions: RidingConditions; }

const SLICES = [
  { key: 'idle',       label: 'Idle',          color: '#5a5f72' },
  { key: 'city',       label: 'City',          color: '#6c8ef5' },
  { key: 'highway',    label: 'Highway',       color: '#4db8a8' },
  { key: 'aggressive', label: 'Aggressive',    color: '#e05c6e' },
  { key: 'decel',      label: 'Deceleration',  color: '#e8a838' },
];

interface PieEntry {
  name: string;
  value: number;
  color: string;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: PieEntry;
}
interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="custom-tooltip">
      <div className="tooltip-row">
        <div className="tooltip-color" style={{ background: d.payload.color }} />
        <span className="tooltip-key">{d.name}</span>
        <span className="tooltip-val">{d.value}%</span>
      </div>
    </div>
  );
}

export default function RidingPieChart({ conditions }: Props) {
  const data: PieEntry[] = SLICES
    .map(s => ({ name: s.label, value: conditions[s.key as keyof RidingConditions], color: s.color }))
    .filter(d => d.value > 0);

  if (data.length === 0) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        Collecting data…
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: '0 0 140px', height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%" cy="50%"
                innerRadius={42} outerRadius={68}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} opacity={0.9} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="pie-legend" style={{ flex: 1 }}>
          {SLICES.map(s => {
            const val = conditions[s.key as keyof RidingConditions];
            return (
              <div key={s.key} className="legend-item">
                <div className="legend-left">
                  <div className="legend-dot" style={{ background: s.color }} />
                  <span className="legend-label">{s.label}</span>
                </div>
                <span className="legend-val">{val}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
