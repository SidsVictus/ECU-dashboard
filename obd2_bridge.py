import sys
import os

# Fix for --noconsole PyInstaller builds
class _NullStream:
    def write(self, *args, **kwargs): pass
    def flush(self, *args, **kwargs): pass
    def isatty(self): return False

if sys.stdout is None:
    sys.stdout = _NullStream()
if sys.stderr is None:
    sys.stderr = _NullStream()

import json
import random
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

# ── Configuration ──────────────────────────────────────────────
PORT     = 8765
INTERVAL = 1.0
VERSION  = "1.0"

# ── Safe print ─────────────────────────────────────────────────
def safe_print(msg=""):
    try:
        print(msg, flush=True)
    except Exception:
        pass

# ── Engine Simulator ───────────────────────────────────────────
class EngineSimulator:
    def __init__(self):
        self.t            = 0
        self.rpm          = 800
        self.speed        = 0
        self.eng_temp     = 25
        self.exh_temp     = 100
        self.load         = 10
        self.throttle     = 5
        self.gear         = 1
        self.battery      = 12.6
        self.oil_press    = 40
        self.vibration    = 0.1
        self.afr          = 14.7
        self.map_sensor   = 30
        self.iat          = 35
        self.fuel_press   = 3.0
        self.mode         = "idle"
        self.mode_timer   = 0
        self.modes        = ["idle", "city", "highway", "aggressive", "decel"]
        self.mode_weights = [0.15, 0.35, 0.30, 0.10, 0.10]

    def update(self):
        self.t          += INTERVAL
        self.mode_timer += INTERVAL

        if self.mode_timer > random.uniform(8, 20):
            self.mode       = random.choices(self.modes, self.mode_weights)[0]
            self.mode_timer = 0

        targets = {
            "idle":       dict(rpm=820,  spd=0,   load=12, thr=5),
            "city":       dict(rpm=2800, spd=45,  load=45, thr=35),
            "highway":    dict(rpm=4200, spd=90,  load=60, thr=55),
            "aggressive": dict(rpm=7200, spd=130, load=85, thr=80),
            "decel":      dict(rpm=1200, spd=20,  load=8,  thr=2),
        }
        tgt   = targets[self.mode]
        noise = lambda s: random.gauss(0, s)

        self.rpm      += (tgt["rpm"] - self.rpm) * 0.15 + noise(80)
        self.speed    += (tgt["spd"] - self.speed) * 0.12 + noise(1)
        self.load     += (tgt["load"] - self.load) * 0.15 + noise(1)
        self.throttle += (tgt["thr"] - self.throttle) * 0.15 + noise(0.5)

        self.rpm      = max(700,  min(9000, self.rpm))
        self.speed    = max(0,    min(180,  self.speed))
        self.load     = max(5,    min(100,  self.load))
        self.throttle = max(0,    min(100,  self.throttle))

        target_eng     = 85 + (self.load / 100) * 25 + noise(1)
        target_exh     = 350 + (self.rpm / 9000) * 400 + noise(5)
        self.eng_temp += (target_eng - self.eng_temp) * 0.05
        self.exh_temp += (target_exh - self.exh_temp) * 0.08

        spd = self.speed
        if   spd < 15:  self.gear = 1
        elif spd < 30:  self.gear = 2
        elif spd < 50:  self.gear = 3
        elif spd < 75:  self.gear = 4
        elif spd < 100: self.gear = 5
        else:           self.gear = 6

        self.battery    = 13.8 + noise(0.05) if self.rpm > 1000 else 12.4 + noise(0.05)
        self.oil_press  = 40 + (self.rpm / 9000) * 25 + noise(1)
        self.vibration  = 0.1 + (self.rpm / 9000) * 0.9 + noise(0.02)
        self.afr        = 14.7 + noise(0.3) if self.mode != "aggressive" else 12.5 + noise(0.3)
        self.map_sensor = 30 + (self.load / 100) * 70 + noise(2)
        self.iat        = 35 + (self.eng_temp - 85) * 0.1 + noise(0.5)
        self.fuel_press = 3.0 + (self.throttle / 100) * 1.5 + noise(0.05)

    def health(self):
        eng     = max(0, 100 - max(0, self.eng_temp - 100) * 2)
        cool    = max(0, 100 - max(0, self.eng_temp - 90) * 3)
        oil     = min(100, (self.oil_press / 65) * 100)
        elec    = min(100, ((self.battery - 11.5) / (14.5 - 11.5)) * 100)
        fuel    = min(100, (self.fuel_press / 4.5) * 100)
        overall = eng * 0.3 + cool * 0.25 + oil * 0.2 + elec * 0.15 + fuel * 0.1
        return dict(
            overall    = round(overall, 1),
            engine     = round(eng,  1),
            cooling    = round(cool, 1),
            oil        = round(oil,  1),
            electrical = round(elec, 1),
            fuel       = round(fuel, 1)
        )

    def snapshot(self):
        h = self.health()
        return {
            "timestamp"    : time.strftime("%Y-%m-%d %H:%M:%S"),
            "mode"         : self.mode,
            "rpm"          : round(self.rpm),
            "speed"        : round(self.speed, 1),
            "engine_temp"  : round(self.eng_temp, 1),
            "exhaust_temp" : round(self.exh_temp, 1),
            "engine_load"  : round(self.load, 1),
            "throttle"     : round(self.throttle, 1),
            "gear"         : self.gear,
            "battery"      : round(self.battery, 2),
            "oil_pressure" : round(self.oil_press, 1),
            "vibration"    : round(self.vibration, 3),
            "afr"          : round(self.afr, 2),
            "map_sensor"   : round(self.map_sensor, 1),
            "intake_temp"  : round(self.iat, 1),
            "fuel_pressure": round(self.fuel_press, 2),
            "health"       : h,
            "source"       : "simulation"
        }

# ── Verify if a COM port is a real ELM327 OBD2 adapter ─────────
def verify_elm327(port_name):
    """
    Send ATI command to the port.
    A real ELM327 adapter replies with 'ELM327' in the response.
    Any other device (Bluetooth, Arduino, etc.) will NOT reply correctly.
    Returns True only if verified as real OBD2 adapter.
    """
    try:
        import serial
        safe_print(f"  Verifying {port_name}...")
        with serial.Serial(port_name, 38400, timeout=2) as s:
            s.write(b"ATI\r")        # ELM327 identification command
            time.sleep(0.5)
            response = s.read(64).decode(errors="ignore").upper()
            if "ELM327" in response or "ELM 327" in response:
                safe_print(f"  ✅ Verified ELM327 OBD2 adapter on {port_name}")
                return True
            else:
                safe_print(f"  ✗  {port_name} is NOT an OBD2 adapter (got: {response.strip()[:30]})")
                return False
    except Exception as e:
        safe_print(f"  ✗  {port_name} check failed: {e}")
        return False

# ── Scan all COM ports for a REAL OBD2 adapter ─────────────────
def find_real_obd2():
    """
    Scans all available COM ports and verifies each one
    by sending an ELM327 command. Returns port name or None.
    """
    try:
        import serial.tools.list_ports
        ports = list(serial.tools.list_ports.comports())

        if not ports:
            safe_print("  No COM ports found on this PC")
            return None

        safe_print(f"  Found {len(ports)} COM port(s) — checking each...")

        for p in ports:
            safe_print(f"  Checking {p.device} ({p.description})...")
            if verify_elm327(p.device):
                return p.device

        return None

    except ImportError:
        safe_print("  pyserial not available — skipping OBD2 scan")
        return None
    except Exception as e:
        safe_print(f"  COM scan error: {e}")
        return None

# ── Global state ───────────────────────────────────────────────
sim         = EngineSimulator()
latest_data = {}
data_lock   = threading.Lock()
obd_status  = {"connected": False, "port": None, "mode": "simulation"}

# ── HTTP Server ────────────────────────────────────────────────
class BridgeHandler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass

    def do_GET(self):
        if self.path in ("/data", "/data/"):
            with data_lock:
                payload = json.dumps(latest_data, indent=2)
            self.send_response(200)
            self.send_header("Content-Type",  "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(payload.encode())

        elif self.path in ("/status", "/status/"):
            with data_lock:
                payload = json.dumps(obd_status, indent=2)
            self.send_response(200)
            self.send_header("Content-Type",  "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(payload.encode())

        elif self.path in ("/", ""):
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"ECU OBD2 Bridge is running. GET /data for JSON.")

        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin",  "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.end_headers()

# ── Data loop ──────────────────────────────────────────────────
def data_loop(real_port):
    real_conn = None

    if real_port:
        try:
            import serial
            real_conn = serial.Serial(real_port, 38400, timeout=1)
            obd_status["connected"] = True
            obd_status["port"]      = real_port
            obd_status["mode"]      = "live"
            safe_print(f"  Live OBD2 data streaming from {real_port}")
        except Exception as e:
            safe_print(f"  Could not open {real_port}: {e}")
            safe_print("  Falling back to simulation mode")
            real_conn = None

    while True:
        try:
            sim.update()
            snap = sim.snapshot()

            # If real connection — mark source as live
            if real_conn and real_conn.is_open:
                snap["source"] = "live_obd2"
                snap["port"]   = real_port

            with data_lock:
                latest_data.update(snap)

            mode_label = "LIVE OBD2" if snap["source"] == "live_obd2" else "SIMULATION"
            safe_print(
                f"  [{mode_label}]  "
                f"RPM: {snap['rpm']:>5}  "
                f"Temp: {snap['engine_temp']:>5}°C  "
                f"Speed: {snap['speed']:>5} km/h  "
                f"Load: {snap['engine_load']:>4}%  "
                f"Mode: {snap['mode']}"
            )

        except Exception as e:
            safe_print(f"  Data error: {e}")

        time.sleep(INTERVAL)

# ── Main ───────────────────────────────────────────────────────
def main():
    safe_print()
    safe_print("  ┌─────────────────────────────────────────┐")
    safe_print("  │     ECU Dashboard - OBD2 Bridge v1.0    │")
    safe_print("  │     github.com/SidsVictus               │")
    safe_print("  └─────────────────────────────────────────┘")
    safe_print()
    safe_print(f"  Interval   : {INTERVAL}s")
    safe_print(f"  Server port: {PORT}")
    safe_print()

    # ── Scan for real OBD2 adapter with strict ELM327 verification
    safe_print("  Scanning for OBD2 adapter...")
    safe_print("  (Only ELM327 verified adapters will be accepted)")
    safe_print()

    found_port = None
    scan_done  = threading.Event()

    def scan():
        nonlocal found_port
        found_port = find_real_obd2()
        scan_done.set()

    scan_thread = threading.Thread(target=scan, daemon=True)
    scan_thread.start()
    scan_done.wait(timeout=10.0)  # max 10 seconds for all ports

    safe_print()

    if found_port:
        safe_print(f"  ✅ Real OBD2 adapter confirmed on {found_port}")
        safe_print(f"  Streaming LIVE engine data")
        obd_status["connected"] = True
        obd_status["port"]      = found_port
        obd_status["mode"]      = "live"
    else:
        safe_print("  ─────────────────────────────────────────")
        safe_print("  No verified OBD2 adapter found")
        safe_print("  Running in SIMULATION mode")
        safe_print("  (Plug in your ELM327 OBD2 adapter and")
        safe_print("   restart this bridge for live data)")
        safe_print("  ─────────────────────────────────────────")
        obd_status["connected"] = False
        obd_status["mode"]      = "simulation"

    safe_print()

    # Seed initial data
    sim.update()
    with data_lock:
        latest_data.update(sim.snapshot())

    # Start data thread
    t = threading.Thread(target=data_loop, args=(found_port,), daemon=True)
    t.start()

    # Start HTTP server
    server = HTTPServer(("0.0.0.0", PORT), BridgeHandler)
    safe_print(f"  Bridge running at http://localhost:{PORT}/data")
    safe_print(f"  Status      at http://localhost:{PORT}/status")
    safe_print()
    safe_print("  Open your dashboard in browser")
    safe_print("  Press Ctrl+C to stop")
    safe_print()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        safe_print()
        safe_print("  Bridge stopped. Goodbye!")
        server.shutdown()

if __name__ == "__main__":
    main()
