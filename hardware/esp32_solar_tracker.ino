/*
 * =========================================================================
 * SolarFlow ESP32 Solar Tracker, Water Pump & 30cm Wiper Controller
 * =========================================================================
 *
 * Pin Configuration:
 *   - LEFT_LDR       : GPIO 34 (Analog In)
 *   - RIGHT_LDR      : GPIO 35 (Analog In)
 *   - SERVO_PIN      : GPIO 18 (PWM Sun Tracker Servo)
 *   - RELAY_PIN      : GPIO 26 (Relay 1: Water Pump)
 *   - WIPER_PIN      : GPIO 27 (Relay 2: Wiper / Slider Motor Forward / Power)
 *   - WIPER_REV_PIN  : GPIO 25 (Optional: Reverse / Direction relay for bi-directional motors)
 *   - TEMP_PIN       : GPIO 4  (DS18B20 OneWire Bus)
 *   - ONBOARD_LED    : GPIO 2  (Built-in Blue LED Indicator)
 *
 * Travel Distance:
 *   - 30 cm stroke = timed run (~3500ms default, easily adjusted)
 *   - Clockwise (Front 30cm) -> Pause 500ms -> Anti-Clockwise (Back 30cm) -> Stop
 * =========================================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ESP32Servo.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// =================================================
//                 WIFI CONFIGURATION
// =================================================
const char* AP_SSID       = "SolarFlow-ESP32";
const char* AP_PASSWORD   = "solarflow123";

// Home / Lab Wi-Fi credentials
const char* WIFI_SSID     = "dlink";
const char* WIFI_PASSWORD = "sit@ssosc";

WebServer server(80);

// =================================================
//                  PIN CONFIGURATION
// =================================================
#define LEFT_LDR       34
#define RIGHT_LDR      35
#define SERVO_PIN      18
#define RELAY_PIN      26  // Water Pump Relay
#define WIPER_PIN      27  // Wiper Motor Relay (Forward / Power)
#define WIPER_REV_PIN  25  // Optional Wiper Reverse Relay (if dual-relay H-bridge used)
#define TEMP_PIN       4   // DS18B20 Temp Sensor
#define ONBOARD_LED    2   // Visual Indicator LED

// Relay Polarity: true = Active LOW (most blue relay boards), false = Active HIGH
const bool RELAY_ACTIVE_LOW = true;
const bool WIPER_ACTIVE_LOW = true;

// =================================================
//                  SERVO SETTINGS
// =================================================
Servo trackerServo;

float currentAngle = 90.0;
float targetAngle  = 90.0;

const int   MIN_ANGLE       = 0;
const int   MAX_ANGLE       = 180;
const int   SENSITIVITY     = 150;
const int   STEP_ANGLE      = 1;
const float SMOOTHING       = 0.12;

const unsigned long TRACK_INTERVAL = 100;
const unsigned long SERVO_INTERVAL = 20;

unsigned long lastTrack = 0;
unsigned long lastServo = 0;

int leftLDR  = 0;
int rightLDR = 0;

// =================================================
//                TEMPERATURE SETTINGS
// =================================================
OneWire oneWire(TEMP_PIN);
DallasTemperature sensors(&oneWire);

float temperature      = -127.0;
bool  temperatureValid = false;

const float TEMP_ON_THRESHOLD  = 30.0;
const float TEMP_OFF_THRESHOLD = 28.0;

const unsigned long TEMP_INTERVAL        = 1000;
const unsigned long TEMP_CONVERSION_TIME = 750;

unsigned long lastTempRequest   = 0;
bool          conversionPending = false;

// =================================================
//                   PUMP SETTINGS
// =================================================
bool pumpOn     = false;
bool manualMode = false;  // false = AUTO (Temp controls), true = MANUAL (App controls)

// =================================================
//          WIPER / 30CM SLIDER MOTOR SETTINGS
// =================================================
// Timing to travel 30 cm (adjust this if your motor is faster or slower):
const unsigned long STROKE_30CM_MS = 3500;  // 3.5 seconds for 30 cm travel

enum WiperState {
  WIPER_IDLE,
  WIPER_FORWARD,       // Moving front 30cm (Clockwise)
  WIPER_PAUSE_BETWEEN, // Brief 500ms pause at 30cm end
  WIPER_BACKWARD       // Returning back 30cm (Anti-Clockwise)
};

WiperState wiperState = WIPER_IDLE;
unsigned long wiperStateStart = 0;
bool isAutoCleaningCycle = false;

// =================================================
//                  STATUS SETTINGS
// =================================================
unsigned long lastStatus = 0;

// =================================================
//                  PUMP RELAY CONTROL
// =================================================
void setPump(bool state) {
  pumpOn = state;

  if (RELAY_ACTIVE_LOW) {
    digitalWrite(RELAY_PIN, state ? LOW : HIGH);
  } else {
    digitalWrite(RELAY_PIN, state ? HIGH : LOW);
  }

  // Visual confirmation on ESP32 board
  digitalWrite(ONBOARD_LED, state ? HIGH : LOW);

  Serial.print("PUMP: ");
  Serial.println(state ? "ON" : "OFF");
}

// =================================================
//             WIPER MOTOR HARDWARE CONTROL
// =================================================
// Energizes/de-energizes the physical relay pins
void setWiperHardware(bool forward, bool backward) {
  bool p27State = false;
  bool p25State = false;

  if (forward) {
    p27State = true;   // Pin 27 ON -> Clockwise / Front
    p25State = false;
  } else if (backward) {
    p27State = false;  // Pin 27 OFF
    p25State = true;   // Pin 25 ON -> Anti-clockwise / Back (if 2nd relay wired)
  } else {
    p27State = false;  // Both OFF -> Stopped
    p25State = false;
  }

  // Apply with polarity
  if (WIPER_ACTIVE_LOW) {
    digitalWrite(WIPER_PIN, p27State ? LOW : HIGH);
    digitalWrite(WIPER_REV_PIN, p25State ? LOW : HIGH);
  } else {
    digitalWrite(WIPER_PIN, p27State ? HIGH : LOW);
    digitalWrite(WIPER_REV_PIN, p25State ? HIGH : LOW);
  }
}

// Start moving Front 30 cm (Clockwise)
void startWiperForward() {
  wiperState = WIPER_FORWARD;
  wiperStateStart = millis();
  setWiperHardware(true, false);
  Serial.println("WIPER: Moving FRONT (30 cm Clockwise)...");
}

// Start moving Back 30 cm (Anti-Clockwise)
void startWiperBackward() {
  wiperState = WIPER_BACKWARD;
  wiperStateStart = millis();
  setWiperHardware(false, true);
  Serial.println("WIPER: Returning BACK (30 cm Anti-Clockwise)...");
}

// Emergency stop wiper
void stopWiper() {
  wiperState = WIPER_IDLE;
  isAutoCleaningCycle = false;
  setWiperHardware(false, false);
  Serial.println("WIPER: STOPPED / IDLE");
}

// Trigger full 30cm Front & 30cm Back automatic sweep cycle
void triggerWiperFullCycle() {
  isAutoCleaningCycle = true;
  startWiperForward();
}

// Non-blocking state machine for the 30 cm front and back movement
void updateWiperMovement() {
  if (wiperState == WIPER_IDLE) return;

  unsigned long elapsed = millis() - wiperStateStart;

  switch (wiperState) {
    case WIPER_FORWARD:
      // Once 30 cm stroke time has elapsed
      if (elapsed >= STROKE_30CM_MS) {
        setWiperHardware(false, false); // Pause motor
        if (isAutoCleaningCycle) {
          wiperState = WIPER_PAUSE_BETWEEN;
          wiperStateStart = millis();
          Serial.println("WIPER: 30 cm reached! Pausing 500ms before return...");
        } else {
          stopWiper();
        }
      }
      break;

    case WIPER_PAUSE_BETWEEN:
      if (elapsed >= 500) { // 500ms brief stop at 30 cm end
        startWiperBackward(); // Reverse back 30cm
      }
      break;

    case WIPER_BACKWARD:
      // Once return 30 cm stroke time has elapsed
      if (elapsed >= STROKE_30CM_MS) {
        stopWiper();
        Serial.println("WIPER: Full 30 cm Front & Back Cycle Completed!");
      }
      break;

    default:
      stopWiper();
      break;
  }
}

// =================================================
//                  LDR READING
// =================================================
int readAverage(int pin) {
  long total = 0;
  for (int i = 0; i < 10; i++) {
    total += analogRead(pin);
    delayMicroseconds(200);
  }
  return total / 10;
}

// =================================================
//                  SERVO TRACKING
// =================================================
void trackSunlight() {
  unsigned long now = millis();

  if (now - lastTrack >= TRACK_INTERVAL) {
    lastTrack = now;

    leftLDR  = readAverage(LEFT_LDR);
    rightLDR = readAverage(RIGHT_LDR);

    int difference = leftLDR - rightLDR;

    if (difference > SENSITIVITY) {
      targetAngle -= STEP_ANGLE;
    } else if (difference < -SENSITIVITY) {
      targetAngle += STEP_ANGLE;
    }

    targetAngle = constrain(targetAngle, MIN_ANGLE, MAX_ANGLE);
  }

  if (now - lastServo >= SERVO_INTERVAL) {
    lastServo = now;

    currentAngle += (targetAngle - currentAngle) * SMOOTHING;

    if (abs(targetAngle - currentAngle) < 0.15) {
      currentAngle = targetAngle;
    }

    trackerServo.write((int)(currentAngle + 0.5));
  }
}

// =================================================
//              TEMPERATURE READING
// =================================================
void updateTemperature() {
  unsigned long now = millis();

  if (!conversionPending && now - lastTempRequest >= TEMP_INTERVAL) {
    sensors.requestTemperatures();
    lastTempRequest   = now;
    conversionPending = true;
  }

  if (conversionPending && now - lastTempRequest >= TEMP_CONVERSION_TIME) {
    float reading = sensors.getTempCByIndex(0);
    conversionPending = false;

    if (reading != DEVICE_DISCONNECTED_C && reading >= -55.0 && reading <= 125.0) {
      temperature      = reading;
      temperatureValid = true;
    } else {
      temperature      = -127.0;
      temperatureValid = false;
    }
  }
}

// =================================================
//             AUTOMATIC PUMP CONTROL
// =================================================
void automaticPumpControl() {
  if (manualMode) return; // User has taken manual control

  if (!temperatureValid) {
    setPump(false);
    return;
  }

  if (temperature >= TEMP_ON_THRESHOLD) {
    setPump(true);
  } else if (temperature <= TEMP_OFF_THRESHOLD) {
    setPump(false);
  }
}

// =================================================
//                 CORS HEADERS
// =================================================
void sendCORS() {
  server.sendHeader("Access-Control-Allow-Origin",  "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "*");
}

// =================================================
//                 STATUS JSON
// =================================================
void handleStatus() {
  sendCORS();

  String wiperStr = "IDLE";
  if (wiperState == WIPER_FORWARD)       wiperStr = "FORWARD";
  else if (wiperState == WIPER_BACKWARD) wiperStr = "BACKWARD";
  else if (wiperState == WIPER_PAUSE_BETWEEN) wiperStr = "PAUSED";

  String json = "{";
  json += "\"leftLdr\":"       + String(leftLDR) + ",";
  json += "\"rightLdr\":"      + String(rightLDR) + ",";
  json += "\"servo\":"         + String(currentAngle, 1) + ",";
  json += "\"temp\":";
  json += temperatureValid ? String(temperature, 2) : "null";
  json += ",";
  json += "\"tempValid\":"     + String(temperatureValid ? "true" : "false") + ",";
  json += "\"pump\":"          + String(pumpOn ? "true" : "false") + ",";
  json += "\"pumpMode\":\""    + String(manualMode ? "manual" : "auto") + "\",";
  json += "\"wiper\":\""       + wiperStr + "\",";
  json += "\"wiperPin\":27,";
  json += "\"connected\":true";
  json += "}";

  server.send(200, "application/json", json);
}

// =================================================
//                 PUMP CONTROL API
// =================================================
void handlePumpOn() {
  sendCORS();
  manualMode = true;
  setPump(true);
  server.send(200, "application/json", "{\"success\":true,\"pump\":true,\"mode\":\"manual\"}");
}

void handlePumpOff() {
  sendCORS();
  manualMode = true;
  setPump(false);
  server.send(200, "application/json", "{\"success\":true,\"pump\":false,\"mode\":\"manual\"}");
}

void handlePump() {
  sendCORS();
  if (server.hasArg("state")) {
    String val = server.arg("state");
    val.toLowerCase();
    if (val == "1" || val == "on" || val == "true") {
      handlePumpOn();
      return;
    } else if (val == "0" || val == "off" || val == "false") {
      handlePumpOff();
      return;
    }
  }
  handleStatus();
}

void handleMode() {
  sendCORS();
  if (server.hasArg("value")) {
    String m = server.arg("value");
    m.toLowerCase();
    if (m == "auto") {
      manualMode = false;
      automaticPumpControl();
      server.send(200, "application/json", "{\"success\":true,\"mode\":\"auto\"}");
      return;
    } else if (m == "manual") {
      manualMode = true;
      server.send(200, "application/json", "{\"success\":true,\"mode\":\"manual\"}");
      return;
    }
  }
  server.send(400, "application/json", "{\"error\":\"Use value=auto or value=manual\"}");
}

// =================================================
//                 WIPER MOTOR API
// =================================================
void handleWiperCycle() {
  sendCORS();
  triggerWiperFullCycle();
  server.send(200, "application/json", "{\"success\":true,\"wiper\":\"CYCLE_30CM_STARTED\"}");
}

void handleWiperForward() {
  sendCORS();
  isAutoCleaningCycle = false;
  startWiperForward();
  server.send(200, "application/json", "{\"success\":true,\"wiper\":\"FORWARD_30CM\"}");
}

void handleWiperBackward() {
  sendCORS();
  isAutoCleaningCycle = false;
  startWiperBackward();
  server.send(200, "application/json", "{\"success\":true,\"wiper\":\"BACKWARD_30CM\"}");
}

void handleWiperStop() {
  sendCORS();
  stopWiper();
  server.send(200, "application/json", "{\"success\":true,\"wiper\":\"STOPPED\"}");
}

// =================================================
//               SERIAL COMMANDS
// =================================================
void handleSerialCommands() {
  while (Serial.available() > 0) {
    char cmd = Serial.read();

    // Pump commands
    if (cmd == '1') {
      manualMode = true;
      setPump(true);
      Serial.println("MANUAL MODE: PUMP ON");
    } else if (cmd == '0') {
      manualMode = true;
      setPump(false);
      Serial.println("MANUAL MODE: PUMP OFF");
    } else if (cmd == 'A' || cmd == 'a') {
      manualMode = false;
      Serial.println("AUTO MODE ENABLED");
      automaticPumpControl();
    }

    // Wiper / 30cm slider motor commands
    else if (cmd == 'W' || cmd == 'w' || cmd == '2') {
      triggerWiperFullCycle();
      Serial.println("WIPER COMMAND: Full 30cm Front & Back Cycle Started!");
    } else if (cmd == 'F' || cmd == 'f') {
      isAutoCleaningCycle = false;
      startWiperForward();
      Serial.println("WIPER COMMAND: Moving Front 30cm (Clockwise)");
    } else if (cmd == 'B' || cmd == 'b') {
      isAutoCleaningCycle = false;
      startWiperBackward();
      Serial.println("WIPER COMMAND: Moving Back 30cm (Anti-Clockwise)");
    } else if (cmd == 'S' || cmd == 's') {
      stopWiper();
      Serial.println("WIPER COMMAND: Stopped");
    }
  }
}

// =================================================
//                   ROOT WEB PAGE
// =================================================
void handleRoot() {
  sendCORS();
  String html = R"rawliteral(
<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SolarFlow ESP32 Hardware Dashboard</title>
<style>
body{font-family:sans-serif;background:#0f172a;color:#fff;text-align:center;padding:16px;margin:0;}
.card{max-width:440px;margin:auto;background:#1e293b;padding:20px;border-radius:16px;border:1px solid #334155;}
button{padding:12px 18px;margin:5px;border:none;border-radius:8px;font-weight:bold;cursor:pointer;font-size:14px;}
.on{background:#16a34a;color:#fff;}.off{background:#dc2626;color:#fff;}
.wiper{background:#8b5cf6;color:#fff;}.btn-blue{background:#2563eb;color:#fff;}
.row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #334155;}
.badge{padding:4px 10px;border-radius:12px;font-size:12px;font-weight:bold;}
</style></head><body>
<div class="card">
<h2>☀️ SolarFlow Controller</h2>
<p>Water Pump (Pin 26) &amp; Wiper Slider 30cm (Pin 27)</p>
<div style="margin:12px 0;">
  <button class="on" onclick="fetch('/pump/on')">Turn Pump ON</button>
  <button class="off" onclick="fetch('/pump/off')">Turn Pump OFF</button>
</div>
<div style="margin:12px 0;">
  <button class="wiper" onclick="fetch('/wiper/cycle')">🔁 30cm Front &amp; Back</button>
  <button class="btn-blue" onclick="fetch('/wiper/forward')">▶ Front 30cm</button>
  <button class="btn-blue" onclick="fetch('/wiper/backward')">◀ Back 30cm</button>
</div>
<div class="row"><span>Water Pump (GPIO 26)</span><b id="pump">--</b></div>
<div class="row"><span>Wiper Motor (GPIO 27)</span><b id="wiper">--</b></div>
<div class="row"><span>Servo Angle</span><b id="servo">--</b></div>
<div class="row"><span>Left LDR (34)</span><b id="left">--</b></div>
<div class="row"><span>Right LDR (35)</span><b id="right">--</b></div>
<div class="row"><span>Temperature</span><b id="temp">--</b></div>
</div>
<script>
setInterval(async ()=>{
  try{
    const r=await fetch('/status');const d=await r.json();
    document.getElementById('pump').innerText=d.pump?'ACTIVE (ON)':'OFF';
    document.getElementById('wiper').innerText=d.wiper;
    document.getElementById('servo').innerText=d.servo+'°';
    document.getElementById('left').innerText=d.leftLdr;
    document.getElementById('right').innerText=d.rightLdr;
    document.getElementById('temp').innerText=d.tempValid?(d.temp+' °C'):'Error';
  }catch(e){}
},1500);
</script></body></html>
)rawliteral";
  server.send(200, "text/html", html);
}

// =================================================
//                  WIFI SETUP
// =================================================
void setupWiFi() {
  WiFi.mode(WIFI_AP_STA);

  // SoftAP
  WiFi.softAP(AP_SSID, AP_PASSWORD);
  Serial.print("SoftAP Created: ");
  Serial.println(AP_SSID);
  Serial.print("AP IP: ");
  Serial.println(WiFi.softAPIP());

  // Station connection
  if (strlen(WIFI_SSID) > 0) {
    Serial.print("Connecting to Wi-Fi SSID: ");
    Serial.println(WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    unsigned long t = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - t < 7000) {
      delay(300);
      Serial.print(".");
    }
    Serial.println();
    if (WiFi.status() == WL_CONNECTED) {
      Serial.print("Connected to Wi-Fi! Station IP: ");
      Serial.println(WiFi.localIP());
    }
  }
}

// =================================================
//                   SETUP
// =================================================
void setup() {
  Serial.begin(115200);
  analogReadResolution(12);

  pinMode(LEFT_LDR, INPUT);
  pinMode(RIGHT_LDR, INPUT);

  // Water Pump Relay (Pin 26)
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, RELAY_ACTIVE_LOW ? HIGH : LOW);
  pumpOn = false;

  // Wiper Motor Relay (Pin 27) & Reverse (Pin 25)
  pinMode(WIPER_PIN, OUTPUT);
  pinMode(WIPER_REV_PIN, OUTPUT);
  digitalWrite(WIPER_PIN, WIPER_ACTIVE_LOW ? HIGH : LOW);
  digitalWrite(WIPER_REV_PIN, WIPER_ACTIVE_LOW ? HIGH : LOW);

  // Onboard LED
  pinMode(ONBOARD_LED, OUTPUT);
  digitalWrite(ONBOARD_LED, LOW);

  // Servo
  trackerServo.setPeriodHertz(50);
  trackerServo.attach(SERVO_PIN, 500, 2400);
  trackerServo.write(90);

  // DS18B20 Temp
  sensors.begin();
  sensors.setResolution(12);
  sensors.setWaitForConversion(false);

  Serial.println();
  Serial.println("====================================================");
  Serial.println(" SolarFlow ESP32 Tracker + Pump + 30cm Wiper Motor");
  Serial.println("====================================================");
  Serial.println("Pins: Pump=26, Wiper=27, WiperRev=25, Servo=18, Temp=4");

  setupWiFi();

  // Web routes
  server.on("/",               HTTP_GET, handleRoot);
  server.on("/status",         HTTP_GET, handleStatus);
  server.on("/pump",           HTTP_GET, handlePump);
  server.on("/pump/on",        HTTP_GET, handlePumpOn);
  server.on("/pump/off",       HTTP_GET, handlePumpOff);
  server.on("/mode",           HTTP_GET, handleMode);
  server.on("/wiper/cycle",    HTTP_GET, handleWiperCycle);
  server.on("/wiper/forward",  HTTP_GET, handleWiperForward);
  server.on("/wiper/backward", HTTP_GET, handleWiperBackward);
  server.on("/wiper/stop",     HTTP_GET, handleWiperStop);

  server.onNotFound([]() {
    sendCORS();
    if (server.method() == HTTP_OPTIONS) server.send(204);
    else server.send(404, "text/plain", "Not Found");
  });

  server.begin();
  Serial.println("HTTP Server active on port 80.");
}

// =================================================
//                   MAIN LOOP
// =================================================
void loop() {
  server.handleClient();
  trackSunlight();
  updateTemperature();
  automaticPumpControl();
  handleSerialCommands();
  updateWiperMovement(); // Runs the 30 cm stroke state machine smoothly

  unsigned long now = millis();
  if (now - lastStatus >= 1000) {
    lastStatus = now;

    Serial.print("Left LDR: ");
    Serial.print(leftLDR);
    Serial.print(" | Right LDR: ");
    Serial.print(rightLDR);
    Serial.print(" | Servo: ");
    Serial.print(currentAngle, 1);
    Serial.print(" deg | Temperature: ");
    if (temperatureValid) {
      Serial.print(temperature, 2);
      Serial.print(" C");
    } else {
      Serial.print("Sensor Error");
    }
    Serial.print(" | Pump: ");
    Serial.print(pumpOn ? "ON" : "OFF");
    Serial.print(" | Mode: ");
    Serial.print(manualMode ? "MANUAL" : "AUTO");
    Serial.print(" | Wiper: ");
    if (wiperState == WIPER_FORWARD)       Serial.println("30CM_FRONT");
    else if (wiperState == WIPER_BACKWARD) Serial.println("30CM_BACK");
    else if (wiperState == WIPER_PAUSE_BETWEEN) Serial.println("PAUSED");
    else Serial.println("IDLE");
  }
}
