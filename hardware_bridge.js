const http = require('http');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const os = require('os');

const PORT = 5005;
const DEFAULT_COM = 'COM9';
const BAUD_RATE = 115200;

// Get local IPv4 addresses
function getLocalIps() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({ name, ip: iface.address });
      }
    }
  }
  return ips;
}

// Live state parsed from ESP32 Serial output
let hardwareState = {
  leftLdr: 0,
  rightLdr: 0,
  servo: 90.0,
  temp: 28.5,
  tempValid: true,
  pump: false,
  wiper: 'IDLE',       // 'IDLE', '30CM_FRONT', '30CM_BACK', 'PAUSED'
  wiperPin: 27,
  lastUpdated: new Date().toISOString(),
  connected: false,
  invertPolarity: false,
};

let invertPolarity = false;
let serialPortInstance = null;
let isConnecting = false;
let lineCount = 0;

// Parse incoming lines from ESP32
function parseTelemetryLine(line) {
  if (!line || typeof line !== 'string') return;

  const trimmed = line.trim();
  if (!trimmed) return;

  lineCount++;
  if (lineCount <= 3 || lineCount % 40 === 0 || trimmed.toLowerCase().includes('pump') || trimmed.toLowerCase().includes('wiper')) {
    console.log(`[ESP32] ${trimmed}`);
  }

  // LDR values
  const ldrMatch = trimmed.match(/Left LDR:\s*(\d+)\s*\|?\s*Right LDR:\s*(\d+)/i);
  if (ldrMatch) {
    hardwareState.leftLdr  = parseInt(ldrMatch[1], 10);
    hardwareState.rightLdr = parseInt(ldrMatch[2], 10);
  }

  // Servo angle
  const servoMatch = trimmed.match(/Servo:\s*([\d.]+)(?:\s*deg)?/i);
  if (servoMatch) {
    hardwareState.servo = parseFloat(servoMatch[1]);
  }

  // Temperature
  const tempMatch = trimmed.match(/Temperature:\s*([\d.-]+)\s*C/i);
  if (tempMatch) {
    const val = parseFloat(tempMatch[1]);
    if (!isNaN(val) && val > -55 && val < 125) {
      hardwareState.temp      = val;
      hardwareState.tempValid = true;
    }
  } else if (trimmed.toLowerCase().includes('sensor error') || trimmed.includes('-127')) {
    hardwareState.tempValid = false;
  }

  // Wiper state from serial
  const wiperMatch = trimmed.match(/Wiper:\s*([\w_]+)/i);
  if (wiperMatch) {
    hardwareState.wiper = wiperMatch[1].toUpperCase();
  }

  hardwareState.lastUpdated = new Date().toISOString();
  hardwareState.connected   = true;
}

// Connect to Serial Port
async function initSerial() {
  if (isConnecting) return;
  isConnecting = true;

  let targetPort = DEFAULT_COM;

  try {
    const ports = await SerialPort.list();
    console.log('[BRIDGE] Available serial ports:', ports.map(p => `${p.path} (${p.manufacturer || 'unknown'})`).join(', '));
    
    const espPort = ports.find(p => p.path === DEFAULT_COM) ||
                    ports.find(p =>
                      (p.manufacturer || '').toLowerCase().includes('silicon') ||
                      (p.manufacturer || '').toLowerCase().includes('wch') ||
                      (p.manufacturer || '').toLowerCase().includes('cp210') ||
                      (p.manufacturer || '').toLowerCase().includes('ch340')
                    );
    if (espPort) {
      targetPort = espPort.path;
      console.log(`[BRIDGE] Found ESP32 on ${targetPort} (${espPort.manufacturer || ''})`);
    } else {
      console.warn('[BRIDGE] ⚠️ ESP32 not found in port list. Trying', DEFAULT_COM);
    }
  } catch (e) {
    console.warn('[BRIDGE] Error listing ports:', e.message);
  }

  console.log(`[BRIDGE] Connecting to ${targetPort} at ${BAUD_RATE} baud...`);

  try {
    serialPortInstance = new SerialPort({ path: targetPort, baudRate: BAUD_RATE });

    const parser = serialPortInstance.pipe(new ReadlineParser({ delimiter: '\n' }));

    serialPortInstance.on('open', () => {
      isConnecting = false;
      lineCount = 0;
      console.log(`[BRIDGE] ✅ Serial port ${targetPort} OPEN! Waiting for ESP32 data...`);
      hardwareState.connected = true;
    });

    parser.on('data', (data) => {
      parseTelemetryLine(data);
    });

    serialPortInstance.on('error', (err) => {
      console.error('[BRIDGE] ❌ Serial error:', err.message);
      hardwareState.connected = false;
      isConnecting = false;
      setTimeout(initSerial, 5000);
    });

    serialPortInstance.on('close', () => {
      console.log('[BRIDGE] ⚠️ Serial port closed. Retrying in 4s...');
      hardwareState.connected = false;
      isConnecting = false;
      serialPortInstance = null;
      setTimeout(initSerial, 4000);
    });

  } catch (err) {
    console.error(`[BRIDGE] ❌ Cannot open ${targetPort}:`, err.message);
    isConnecting = false;
    setTimeout(initSerial, 6000);
  }
}

// Send Pump Command '1' (ON) or '0' (OFF) to ESP32
function sendPumpCommand(state, overrideInvert = null) {
  const useInvert = overrideInvert !== null ? overrideInvert : invertPolarity;
  const actualCmd = (useInvert ? !state : state) ? '1' : '0';

  hardwareState.pump = !!state;

  if (serialPortInstance && serialPortInstance.isOpen) {
    serialPortInstance.write(actualCmd, (err) => {
      if (err) {
        console.error('[BRIDGE] ❌ Write error:', err.message);
      } else {
        console.log(`[BRIDGE] ⚡ Sent '${actualCmd}' → Pump ${state ? 'ON ✅' : 'OFF 🔴'} (invert=${useInvert})`);
      }
    });
    if (typeof serialPortInstance.drain === 'function') {
      serialPortInstance.drain();
    }
  } else {
    console.warn('[BRIDGE] ⚠️ Serial not open — cannot send to ESP32.');
  }
}

// Send Wiper Command to ESP32 ('W' = 30cm cycle, 'F' = front 30cm, 'B' = back 30cm, 'S' = stop)
function sendWiperCommand(cmd) {
  if (cmd === 'W') hardwareState.wiper = '30CM_FRONT';
  else if (cmd === 'F') hardwareState.wiper = '30CM_FRONT';
  else if (cmd === 'B') hardwareState.wiper = '30CM_BACK';
  else if (cmd === 'S') hardwareState.wiper = 'IDLE';

  if (serialPortInstance && serialPortInstance.isOpen) {
    serialPortInstance.write(cmd, (err) => {
      if (err) {
        console.error('[BRIDGE] ❌ Wiper write error:', err.message);
      } else {
        console.log(`[BRIDGE] ⚡ Sent '${cmd}' → Wiper Slider (Pin 27) Action: ${hardwareState.wiper}`);
      }
    });
    if (typeof serialPortInstance.drain === 'function') {
      serialPortInstance.drain();
    }
  } else {
    console.warn('[BRIDGE] ⚠️ Serial not open — cannot send wiper command.');
  }
}

// CORS helper
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
}

// HTTP Server
const server = http.createServer((req, res) => {
  setCORS(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  } catch {
    res.writeHead(400);
    res.end('Bad URL');
    return;
  }

  const path = url.pathname;

  // ─── GET /status ──────────────────────────────────────
  if (path === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(hardwareState));
    return;
  }

  // ─── PUMP ENDPOINTS ───────────────────────────────────
  if (path === '/pump/on') {
    sendPumpCommand(true);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, pump: true, invertPolarity, connected: hardwareState.connected }));
    return;
  }

  if (path === '/pump/off') {
    sendPumpCommand(false);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, pump: false, invertPolarity, connected: hardwareState.connected }));
    return;
  }

  if (path === '/pump') {
    const stateArg = url.searchParams.get('state');
    if (stateArg !== null) {
      const newState = stateArg === '1' || stateArg === 'true' || stateArg.toLowerCase() === 'on';
      const invArg = url.searchParams.get('invert');
      const overrideInvert = invArg !== null ? (invArg === '1' || invArg === 'true') : null;
      sendPumpCommand(newState, overrideInvert);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, pump: hardwareState.pump, invertPolarity, connected: hardwareState.connected }));
    return;
  }

  // ─── WIPER / 30CM SLIDER MOTOR ENDPOINTS ──────────────
  // Trigger full 30cm front & back cycle
  if (path === '/wiper/cycle') {
    sendWiperCommand('W');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, wiper: '30CM_CYCLE_STARTED', pin: 27 }));
    return;
  }

  // Move 30cm front (Clockwise)
  if (path === '/wiper/forward') {
    sendWiperCommand('F');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, wiper: '30CM_FORWARD_STARTED', pin: 27 }));
    return;
  }

  // Move 30cm back (Anti-Clockwise)
  if (path === '/wiper/backward') {
    sendWiperCommand('B');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, wiper: '30CM_BACKWARD_STARTED', pin: 27 }));
    return;
  }

  // Emergency stop wiper
  if (path === '/wiper/stop') {
    sendWiperCommand('S');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, wiper: 'STOPPED' }));
    return;
  }

  // ─── GET /invert?state=1|0 ────────────────────────────
  if (path === '/invert') {
    const invArg = url.searchParams.get('state');
    invertPolarity = invArg === '1' || invArg === 'true';
    hardwareState.invertPolarity = invertPolarity;
    console.log(`[BRIDGE] 🔄 Polarity: ${invertPolarity ? 'INVERTED (Active HIGH)' : 'STANDARD (Active LOW)'}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, invertPolarity }));
    return;
  }

  // ─── Root Dashboard ───────────────────────────────────
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>SolarFlow Bridge</title>
  <style>
    body{font-family:system-ui,sans-serif;background:#0F172A;color:#F8FAFC;margin:0;padding:20px;text-align:center;}
    .card{background:#1E293B;border-radius:16px;max-width:440px;margin:20px auto;padding:24px;border:1px solid #334155;}
    .row{display:flex;justify-content:space-between;border-bottom:1px solid #334155;padding:10px 0;}
    .btn{display:inline-block;padding:12px 20px;margin:6px;border-radius:12px;font-size:15px;font-weight:700;border:none;cursor:pointer;text-decoration:none;}
    .on{background:#16A34A;color:#FFF;}.off{background:#DC2626;color:#FFF;}
    .wiper{background:#8B5CF6;color:#FFF;}.fwd{background:#2563EB;color:#FFF;}
    .badge{display:inline-block;padding:4px 14px;border-radius:20px;font-weight:700;margin:8px 0;}
    .active{background:#16A34A;}.idle{background:#475569;}
  </style>
</head>
<body>
  <div class="card">
    <h2>☀️ SolarFlow ESP32 Bridge</h2>
    <div class="badge ${hardwareState.connected ? 'active' : 'idle'}">
      ${hardwareState.connected ? '🟢 ESP32 Connected (COM9)' : '🔴 ESP32 Offline'}
    </div>
    <div class="badge ${hardwareState.pump ? 'active' : 'idle'}">PUMP: ${hardwareState.pump ? 'ON' : 'OFF'}</div>
    <div class="badge ${hardwareState.wiper !== 'IDLE' ? 'active' : 'idle'}">WIPER: ${hardwareState.wiper}</div>
    <br>
    <div style="margin:10px 0;">
      <a href="/pump/on" class="btn on">Turn Pump ON</a>
      <a href="/pump/off" class="btn off">Turn Pump OFF</a>
    </div>
    <div style="margin:10px 0;">
      <a href="/wiper/cycle" class="btn wiper">🔁 30cm Front & Back</a>
      <a href="/wiper/forward" class="btn fwd">▶ 30cm Front</a>
      <a href="/wiper/backward" class="btn fwd">◀ 30cm Back</a>
    </div>
    <div style="margin-top:20px;text-align:left;">
      <div class="row"><span>Water Pump (GPIO 26)</span><b>${hardwareState.pump ? 'ACTIVE (ON)' : 'STANDBY (OFF)'}</b></div>
      <div class="row"><span>Wiper Motor (GPIO 27)</span><b>${hardwareState.wiper}</b></div>
      <div class="row"><span>Servo Angle</span><b>${hardwareState.servo}°</b></div>
      <div class="row"><span>Left LDR (Pin 34)</span><b>${hardwareState.leftLdr}</b></div>
      <div class="row"><span>Right LDR (Pin 35)</span><b>${hardwareState.rightLdr}</b></div>
      <div class="row"><span>DS18B20 Temp</span><b>${hardwareState.tempValid ? hardwareState.temp + ' °C' : 'Sensor Error'}</b></div>
      <div class="row"><span>Last Update</span><b>${hardwareState.lastUpdated}</b></div>
    </div>
  </div>
</body>
</html>`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n======================================================');
  console.log(`🚀 SolarFlow ESP32 Bridge  →  Port ${PORT}`);
  console.log(`Local:   http://localhost:${PORT}/`);
  const ips = getLocalIps();
  ips.forEach(i => console.log(`Network: http://${i.ip}:${PORT}/  (${i.name})`));
  console.log('======================================================\n');
  initSerial();
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[BRIDGE] ⚠️  Port ${PORT} already in use — another bridge instance is running. Exiting.`);
    process.exit(0);
  } else {
    throw err;
  }
});
