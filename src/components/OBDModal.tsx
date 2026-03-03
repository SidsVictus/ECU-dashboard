import { useState } from 'react';

interface Props {
  onLive: () => void;
  onDemo: () => void;
}

const GITHUB_RELEASE_URL =
  'https://github.com/SidsVictus/ecu-dashboard/releases/latest/download/ECU_OBD2_Bridge.exe';

type Step = 'welcome' | 'choose' | 'live-download';

export default function OBDModal({ onLive, onDemo }: Props) {
  const [step, setStep] = useState<Step>('welcome');

  return (
    <div className="modal-overlay">
      <div className="modal-box">

        {/* Header */}
        <div className="modal-header">
          <div className="modal-logo">⚙</div>
          <div className="modal-title">ECU Live Dashboard</div>
          <div className="modal-subtitle">
            IC Engine Real-Time Monitor &nbsp;·&nbsp; OBD2 Diagnostic System
          </div>
        </div>

        {/* ── STEP 1 — WELCOME ── */}
        {step === 'welcome' && (
          <>
            <div className="modal-body">
              <div className="modal-intro-block">
                <p>
                  Welcome to the <strong>ECU Dashboard</strong> — a real-time engine monitoring
                  system for bikes and cars. Connect your OBD2 diagnostic adapter to view live
                  sensor data, or explore the full dashboard with simulated engine data.
                </p>
              </div>

              <div className="modal-step">
                <div className="step-num">1</div>
                <div className="step-text">
                  <strong>Locate Your OBD2 Port</strong>
                  <span>
                    On bikes it is usually under the seat or near the engine bay.
                    On cars it is under the dashboard near the steering column.
                  </span>
                </div>
              </div>

              <div className="modal-step">
                <div className="step-num">2</div>
                <div className="step-text">
                  <strong>Plug In the OBD2 Adapter</strong>
                  <span>
                    Connect the OBD2 diagnostic cable to the port on your vehicle,
                    then connect the USB end to your laptop.
                  </span>
                </div>
              </div>

              <div className="modal-step">
                <div className="step-num">3</div>
                <div className="step-text">
                  <strong>Turn Ignition to ON</strong>
                  <span>
                    Turn your key to the ON position. Windows will detect
                    the device automatically on the correct COM port.
                  </span>
                </div>
              </div>

              <div className="modal-step">
                <div className="step-num">4</div>
                <div className="step-text">
                  <strong>Select Your Mode Below</strong>
                  <span>
                    Choose Live OBD2 Mode for real data or Demo Mode to explore
                    the dashboard with realistic simulated engine physics.
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setStep('choose')}>
                Next — Choose Mode →
              </button>
              <div className="modal-note">
                No OBD2 cable? Demo Mode simulates full engine data — no downloads needed.
              </div>
            </div>
          </>
        )}

        {/* ── STEP 2 — CHOOSE MODE ── */}
        {step === 'choose' && (
          <>
            <div className="modal-body">
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  How would you like to use the dashboard?
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  You can switch between modes anytime from the settings panel.
                </div>
              </div>

              {/* Live OBD2 Card */}
              <div
                className="mode-card"
                onClick={() => setStep('live-download')}
                style={{ cursor: 'pointer' }}
              >
                <div className="mode-card-top">
                  <span style={{ fontSize: 20 }}>📡</span>
                  <span className="mode-card-title">Live OBD2 Mode</span>
                  <span className="badge badge-green">REAL DATA</span>
                  <span className="mode-card-arrow">→</span>
                </div>
                <div className="mode-card-desc">
                  Reads real-time data directly from your vehicle via the OBD2 adapter.
                  Requires a small bridge app on your laptop. Shows actual RPM,
                  temperatures, load and all ECU sensor values live.
                </div>
              </div>

              {/* Demo Card */}
              <div
                className="mode-card"
                onClick={onDemo}
                style={{ cursor: 'pointer' }}
              >
                <div className="mode-card-top">
                  <span style={{ fontSize: 20 }}>🧪</span>
                  <span className="mode-card-title">Demo / Simulation Mode</span>
                  <span className="badge badge-amber">SIMULATED</span>
                  <span className="mode-card-arrow">→</span>
                </div>
                <div className="mode-card-desc">
                  Physics-based IC engine simulation — realistic RPM curves, temperature
                  profiles, riding conditions and health scoring. No download needed.
                  Perfect for data analysis practice and exploring the dashboard.
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-back" onClick={() => setStep('welcome')}>
                ← Back to setup guide
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3 — LIVE OBD2 DOWNLOAD ── */}
        {step === 'live-download' && (
          <>
            <div className="modal-body">
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Set up the OBD2 Bridge
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  The bridge is a small background app that reads your OBD2 adapter
                  and streams live data to this dashboard. Download it once — runs silently.
                </div>
              </div>

              {/* Download Card */}
              <div className="modal-download-card">
                <div className="modal-download-icon">📥</div>
                <div className="modal-download-details">
                  <div className="modal-download-name">ECU_OBD2_Bridge.exe</div>
                  <div className="modal-download-meta">
                    Windows · ~18 MB · Free · GitHub Releases
                  </div>
                  <div className="modal-download-desc">
                    Double-click to run. No install wizard. Runs silently in the background
                    and streams live engine data to this dashboard automatically.
                  </div>
                </div>
                <a
                  className="modal-dl-btn"
                  href={GITHUB_RELEASE_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  ⬇ Download
                </a>
              </div>

              <div className="modal-step" style={{ paddingTop: 14 }}>
                <div className="step-num">1</div>
                <div className="step-text">
                  <strong>Download and run ECU_OBD2_Bridge.exe</strong>
                  <span>
                    Click Download above. Once downloaded, double-click to run.
                    It starts silently in the background with no window.
                  </span>
                </div>
              </div>

              <div className="modal-step">
                <div className="step-num">2</div>
                <div className="step-text">
                  <strong>Make sure OBD2 cable is connected</strong>
                  <span>
                    Adapter plugged into vehicle port, USB end into your laptop,
                    ignition turned to ON position.
                  </span>
                </div>
              </div>

              <div className="modal-step">
                <div className="step-num">3</div>
                <div className="step-text">
                  <strong>Click Start Live Mode below</strong>
                  <span>
                    The dashboard connects to the bridge automatically and begins
                    showing real sensor data from your vehicle.
                  </span>
                </div>
              </div>

              {/* GitHub note */}
              <div className="modal-github-note">
                <span>🐙</span>
                <div>
                  <strong>Hosted on GitHub Releases</strong> — free, permanent, always
                  the latest version. Maintained by&nbsp;
                  <a
                    href="https://github.com/SidsVictus/ecu-dashboard"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--blue)', textDecoration: 'underline' }}
                  >
                    SidsVictus/ecu-dashboard
                  </a>.
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-primary" onClick={onLive}>
                📡 Start Live Mode →
              </button>
              <button className="btn-back" onClick={() => setStep('choose')}>
                ← Back to mode selection
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
