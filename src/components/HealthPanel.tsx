import { HealthScores } from '../hooks/useEngineData';

interface Props { health: HealthScores; }

const BARS = [
  { key: 'engine',     label: 'Engine',      icon: '⚙️' },
  { key: 'thermal',    label: 'Thermal',     icon: '🌡️' },
  { key: 'fueling',    label: 'Fueling',     icon: '⛽' },
  { key: 'electrical', label: 'Electrical',  icon: '⚡' },
  { key: 'mechanical', label: 'Mechanical',  icon: '🔩' },
];

function getBarClass(score: number): string {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}

function getGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 55) return 'C';
  return 'D';
}

function getGradeLabel(g: string): string {
  return { A: 'Excellent', B: 'Good', C: 'Fair', D: 'Needs Attention' }[g] ?? '';
}

export default function HealthPanel({ health }: Props) {
  const grade = getGrade(health.overall);

  return (
    <div>
      {/* Overall ring area */}
      <div className="health-ring-wrap" style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative', width: 120, height: 120 }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            {/* Track */}
            <circle cx="60" cy="60" r="50" fill="none" stroke="#1e2130" strokeWidth="10" />
            {/* Fill */}
            <circle
              cx="60" cy="60" r="50"
              fill="none"
              stroke={health.overall >= 85 ? '#4caf82' : health.overall >= 70 ? '#4db8a8' : health.overall >= 50 ? '#e8a838' : '#e05c6e'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(health.overall / 100) * 314} 314`}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div className="overall-score">{health.overall}</div>
            <div className="overall-label">/ 100</div>
          </div>
        </div>
        <div className={`overall-grade ${grade}`}>{grade} — {getGradeLabel(grade)}</div>
      </div>

      {/* Individual bars */}
      {BARS.map(b => {
        const score = health[b.key as keyof HealthScores] as number;
        return (
          <div key={b.key} className="health-item">
            <div className="health-row">
              <div className="health-name">
                <span style={{ marginRight: 6 }}>{b.icon}</span>{b.label}
              </div>
              <div className="health-score">{score}%</div>
            </div>
            <div className="health-bar-track">
              <div
                className={`health-bar-fill ${getBarClass(score)}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
