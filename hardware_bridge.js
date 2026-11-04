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
  lastUpdated: new Date().toISOString(),
  connected: false,
  invertPolarity: false,
};

let invertPolarity = false;
let serialPortInstance = null;

// Parse incoming lines from ESP32:
// e.g. "Left LDR: 2462 | Right LDR: 2475 | Servo: 85.0 deg | Temperature: 30.00 C | Pump: OFF"
function parseTelemetryLine(line) {
  if (!line || typeof line !== 'string') return;
  const ldrMatch = line.match(/Left LDR:\s*(\d+)\s*\|\s*Right LDR:\s*(\d+)/i);
  if (ldrMatch) {
    hardwareState.leftLdr = parseInt(ldrMatch[1], 10);
    hardwareState.rightLdr = parseInt(ldrMatch[2], 10);
  }

  const servoMatch = line.match(/Servo:\s*([\d.]+)\s*deg/i);
  if (servoMatch) {
    hardwareState.servo = parseFloat(servoMatch[1]);
  }

  const tempMatch = line.match(/Temperature:\s*([\d.]+)\s*C/i);
  if (tempMatch) {
    hardwareState.temp = parseFloat(tempMatch[1]);
    hardwareState.tempValid = true;
  } else if (line.includes('Sensor error')) {
    hardwareState.tempValid = false;
  }

  const pumpMatch = line.match(/Pump:\s*(ON|OFF)/i);
  if (pumpMatch) {
    hardwareState.pump = pumpMatch[1].toUpperCase() === 'ON';
  }

  hardwareState.lastUpdated = new Date().toISOString();
  hardwareState.connected = true;
}

// Connect to Serial Port
async function initSerial() {
  let targetPort = DEFAULT_COM;

  // Auto-detect if COM9 isn't available
  try {
    const ports = await SerialPort.list();
    console.log('[BRIDGE] Available serial ports:', ports.map(p => `${p.path} (${p.manufacturer || ''})`).join(', '));
    const espPort = ports.find(p => p.path === DEFAULT_COM) || 
                    ports.find(p => (p.manufacturer || '').toLowerCase().includes('silicon') || 
                                    (p.manufacturer || '').toLowerCase().includes('wch') ||
                                    (p.manufacturer || '').toLowerCase().includes('cp210'));
    if (espPort) {
      targetPort = espPort.path;
    }
  } catch (e) {
    console.warn('[BRIDGE] Error listing ports:', e.message);
  }

  console.log(`[BRIDGE] Connecting to ESP32 on ${targetPort} at ${BAUD_RATE} baud...`);
  
  try {
    serialPortInstance = new SerialPort({ path: targetPort, baudRate: BAUD_RATE });
    const parser = serialPortInstance.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    serialPortInstance.on('open', () => {
      console.log(`[BRIDGE] ✅ Connected to ESP32 on ${targetPort}!`);
      hardwareState.connected = true;
    });

    parser.on('data', (data) => {
      console.log('[ESP32 RAW]', data);
      parseTelemetryLine(data);
    });

    serialPortInstance.on('error', (err) => {
      console.error('[BRIDGE] ❌ Serial port error:', err.message);
      hardwareState.connected = false;
    });

    serialPortInstance.on('close', () => {
      console.log('[BRIDGE] ⚠️ Serial port closed. Attempting reconnect in 4s...');
      hardwareState.connected = false;
      setTimeout(initSerial, 4000);
    });
  } catch (err) {
    console.error(`[BRIDGE] Failed to open ${targetPort}:`, err.message);
    setTimeout(initSerial, 5000);
  }
}

// Send Command '1' or '0' to ESP32 (respecting polarity)
function sendPumpCommand(state, overrideInvert = null) {
  const useInvert = overrideInvert !== null ? overrideInvert : invertPolarity;
  const actualCmd = (useInvert ? !state : state) ? '1' : '0';
  hardwareState.pump = !!state;

  if (serialPortInstance && serialPortInstance.isOpen) {
    serialPortInstance.write(actualCmd, (err) => {
      if (err) {
        console.error('[BRIDGE] Error writing to serial:', err.message);
      } else {
        console.log(`[BRIDGE] ⚡ Sent command '${actualCmd}' to ESP32 (Pump ${state ? 'ON' : 'OFF'}, Inverted: ${useInvert})`);
      }
    });
  } else {
    console.warn('[BRIDGE] Serial port not open. Cannot send command to ESP32.');
  }
}

// HTTP Server
const server = http.createServer((req, res) => {
  // Add CORS headers so React Native / Expo can communicate unrestricted
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(hardwareState));
    return;
  }

  if (url.pathname === '/invert') {
    const invArg = url.searchParams.get('state');
    invertPolarity = invArg === '1' || invArg === 'true';
    hardwareState.invertPolarity = invertPolarity;
    console.log(`[BRIDGE] 🔄 Relay Polarity set to: ${invertPolarity ? 'INVERTED (Active HIGH)' : 'STANDARD (Active LOW)'}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, invertPolarity }));
    return;
  }

  if (url.pathname === '/pump') {
    const stateArg = url.searchParams.get('state');
    const newState = stateArg === '1' || stateArg === 'true' || stateArg === 'on';
    const invArg = url.searchParams.get('invert');
    const overrideInvert = invArg !== null ? (invArg === '1' || invArg === 'true') : null;
    sendPumpCommand(newState, overrideInvert);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, pump: hardwareState.pump, invertPolarity }));
    return;
  }

  if (url.pathname === '/pump/on') {
    sendPumpCommand(true);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, pump: true, invertPolarity }));
    return;
  }

  if (url.pathname === '/pump/off') {
    sendPumpCommand(false);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, pump: false, invertPolarity }));
    return;
  }

  // Root test info
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <body style="font-family:sans-serif;text-align:center;padding:40px;background:#0F172A;color:#FFF;">
        <h2>☀️ SolarFlow USB-to-HTTP Hardware Bridge</h2>
        <p>Status: <b>${hardwareState.connected ? 'ESP32 Connected (COM9)' : 'Waiting for ESP32...'}</b></p>
        <p>Current Pump: <b>${hardwareState.pump ? 'ON' : 'OFF'}</b></p>
        <p>Servo: ${hardwareState.servo}&deg; | Temp: ${hardwareState.temp}&deg;C | L: ${hardwareState.leftLdr} | R: ${hardwareState.rightLdr}</p>
        <a href="/pump/on"><button style="padding:12px 24px;font-size:16px;background:#10B981;color:#FFF;border:none;border-radius:8px;margin:8px;cursor:pointer;">Turn Pump ON</button></a>
        <a href="/pump/off"><button style="padding:12px 24px;font-size:16px;background:#EF4444;color:#FFF;border:none;border-radius:8px;margin:8px;cursor:pointer;">Turn Pump OFF</button></a>
      </body>
    </html>
  `);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 SolarFlow ESP32 Hardware Bridge Running on port ${PORT}!`);
  console.log(`Local Access: http://localhost:${PORT}/status`);
  const ips = getLocalIps();
  console.log(`Network Access from your Phone:`);
  ips.forEach(i => console.log(`  👉 http://${i.ip}:${PORT}/`));
  console.log(`======================================================\n`);
  initSerial();
});

