/*
 * =========================================================================
 * ESP32 Solar Tracker & Pump Controller (Dual Wi-Fi AP + STA + REST API)
 * =========================================================================
 * 
 * Pin Configuration:
 *   - LEFT_LDR:   GPIO 34
 *   - RIGHT_LDR:  GPIO 35
 *   - SERVO_PIN:  GPIO 18
 *   - RELAY_PIN:  GPIO 26 (Water Pump Relay)
 *   - TEMP_PIN:   GPIO 4  (DS18B20 OneWire Bus)
 * 
 * Networking:
 *   - Simultaneous SoftAP ("SolarFlow-ESP32", IP: 192.168.4.1) 
 *     AND Home Wi-Fi Station (STA)
 *   - Built-in Web Dashboard at http://192.168.4.1/ (or your local IP)
 *   - REST API Endpoints:
 *       GET /status       -> Returns live JSON telemetry
 *       GET /pump?state=1 -> Turns Relay Pump ON
 *       GET /pump?state=0 -> Turns Relay Pump OFF
 *       GET /pump/on      -> Shortcut to turn pump ON
 *       GET /pump/off     -> Shortcut to turn pump OFF
 * =========================================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ESP32Servo.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ================ WI-FI SETTINGS ====================
// Option A: Enter your home Wi-Fi credentials here (optional)
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Option B: Built-in Access Point (Always available on IP 192.168.4.1)
const char* AP_SSID       = "SolarFlow-ESP32";
const char* AP_PASSWORD   = "solarflow123";

WebServer server(80);

// ================ PIN CONFIGURATION ================
#define LEFT_LDR   34
#define RIGHT_LDR  35
#define SERVO_PIN  18
#define RELAY_PIN  26
#define TEMP_PIN   4

// Change to false if your relay is active HIGH.
const bool RELAY_ACTIVE_LOW = true;

// ================ SERVO SETTINGS ===================
Servo trackerServo;

float currentAngle = 90.0;
float targetAngle = 90.0;

const int MIN_ANGLE = 0;
const int MAX_ANGLE = 180;
const int SENSITIVITY = 150;
const int STEP_ANGLE = 1;
const float SMOOTHING = 0.12;

const unsigned long TRACK_INTERVAL = 100;
const unsigned long SERVO_INTERVAL = 20;
const int NUM_SAMPLES = 10;

// ================ TEMPERATURE SENSOR ================
OneWire oneWire(TEMP_PIN);
DallasTemperature sensors(&oneWire);

float temperature = DEVICE_DISCONNECTED_C;
bool temperatureValid = false;

const unsigned long TEMP_INTERVAL = 1000;
const unsigned long TEMP_CONVERSION_TIME = 750;

unsigned long lastTempRequest = 0;
bool conversionPending = false;

// ================ STATUS VARIABLES ==================
bool pumpOn = false;

unsigned long lastTrack = 0;
unsigned long lastServo = 0;
unsigned long lastStatus = 0;

int lastLeftLdr = 0;
int lastRightLdr = 0;

// ================ LDR AVERAGING =====================
int readAverage(int pin) {
  long total = 0;
  for (int i = 0; i < NUM_SAMPLES; i++) {
    total += analogRead(pin);
    delayMicroseconds(200);
  }
  return total / NUM_SAMPLES;
}

// ================ PUMP CONTROL ======================
void setPump(bool state) {
  pumpOn = state;

  if (RELAY_ACTIVE_LOW) {
    digitalWrite(RELAY_PIN, state ? LOW : HIGH);
  } else {
    digitalWrite(RELAY_PIN, state ? HIGH : LOW);
  }

  Serial.print("Pump: ");
  Serial.println(state ? "ON" : "OFF");
}

// ================ SERVO TRACKING ====================
void trackSunlight() {
  unsigned long now = millis();

  if (now - lastTrack >= TRACK_INTERVAL) {
    lastTrack = now;

    lastLeftLdr = readAverage(LEFT_LDR);
    lastRightLdr = readAverage(RIGHT_LDR);

    int difference = lastLeftLdr - lastRightLdr;

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

// ================ TEMPERATURE READING ===============
void updateTemperature() {
  unsigned long now = millis();

  // Start non-blocking sensor conversion.
  if (!conversionPending && now - lastTempRequest >= TEMP_INTERVAL) {
    sensors.requestTemperatures();
    lastTempRequest = now;
    conversionPending = true;
  }

  // Read after the sensor conversion finishes.
  if (conversionPending && now - lastTempRequest >= TEMP_CONVERSION_TIME) {
    float reading = sensors.getTempCByIndex(0);
    conversionPending = false;

    if (reading != DEVICE_DISCONNECTED_C && reading >= -55.0 && reading <= 125.0) {
      temperature = reading;
      temperatureValid = true;
    } else {
      temperatureValid = false;
    }
  }
}

// ================ SERIAL COMMANDS ===================
void handlePumpCommands() {
  while (Serial.available() > 0) {
    char command = Serial.read();

    if (command == '1') {
      setPump(true);
      Serial.println("Manual command: Pump ON");
    } else if (command == '0') {
      setPump(false);
      Serial.println("Manual command: Pump OFF");
    }
  }
}

// ================ REST API & CORS ===================
void sendCORS() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "*");
}

void handleStatus() {
  sendCORS();
  String json = "{";
  json += "\"leftLdr\":" + String(lastLeftLdr) + ",";
  json += "\"rightLdr\":" + String(lastRightLdr) + ",";
  json += "\"servo\":" + String(currentAngle, 1) + ",";
  json += "\"temp\":" + (temperatureValid ? String(temperature, 2) : "0.0") + ",";
  json += "\"tempValid\":" + String(temperatureValid ? "true" : "false") + ",";
  json += "\"pump\":" + String(pumpOn ? "true" : "false");
  json += "}";
  server.send(200, "application/json", json);
}

void handlePump() {
  sendCORS();
  if (server.hasArg("state")) {
    String stateArg = server.arg("state");
    bool newState = (stateArg == "1" || stateArg == "true" || stateArg == "on");
    setPump(newState);
  }
  handleStatus();
}

void handlePumpOn() {
  sendCORS();
  setPump(true);
  handleStatus();
}

void handlePumpOff() {
  sendCORS();
  setPump(false);
  handleStatus();
}

// Built-in Web Browser GUI Dashboard
void handleRoot() {
  sendCORS();
  String html = "<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width, initial-scale=1'>";
  html += "<title>SolarFlow ESP32 Live Monitor</title>";
  html += "<style>body{font-family:system-ui,-apple-system,sans-serif;background:#0F172A;color:#F8FAFC;margin:0;padding:20px;text-align:center;}";
  html += ".card{background:#1E293B;border-radius:16px;max-width:440px;margin:20px auto;padding:24px;border:1px solid #334155;}";
  html += ".badge{display:inline-block;padding:6px 14px;border-radius:20px;font-weight:700;margin:10px 0;}";
  html += ".on{background:#16A34A;color:#FFF;}.off{background:#475569;color:#CBD5E1;}";
  html += ".btn{display:inline-block;width:100%;box-sizing:border-box;padding:14px;margin:8px 0;border-radius:12px;font-size:16px;font-weight:700;border:none;cursor:pointer;}";
  html += ".btn-on{background:#0E5C41;color:#FFF;}.btn-off{background:#DC2626;color:#FFF;}";
  html += ".metric-row{display:flex;justify-content:space-between;border-bottom:1px solid #334155;padding:10px 0;}";
  html += "</style></head><body>";
  html += "<div class='card'>";
  html += "<h2>☀️ SolarFlow ESP32</h2>";
  html += "<div class='badge " + String(pumpOn ? "on" : "off") + "'>PUMP: " + String(pumpOn ? "ACTIVE (ON)" : "STANDBY (OFF)") + "</div>";
  html += "<a href='/pump/on'><button class='btn btn-on'>Turn Pump ON (Relay 26)</button></a>";
  html += "<a href='/pump/off'><button class='btn btn-off'>Turn Pump OFF</button></a>";
  html += "<div style='margin-top:20px;text-align:left;'>";
  html += "<div class='metric-row'><span>Servo Tracking Angle</span><b>" + String(currentAngle, 1) + "&deg;</b></div>";
  html += "<div class='metric-row'><span>Left LDR (Pin 34)</span><b>" + String(lastLeftLdr) + "</b></div>";
  html += "<div class='metric-row'><span>Right LDR (Pin 35)</span><b>" + String(lastRightLdr) + "</b></div>";
  html += "<div class='metric-row'><span>DS18B20 Temp (Pin 4)</span><b>" + (temperatureValid ? String(temperature, 2) + " &deg;C" : "Sensor Error") + "</b></div>";
  html += "<div class='metric-row'><span>Relay Pin</span><b>GPIO 26</b></div>";
  html += "</div>";
  html += "<p style='color:#94A3B8;font-size:12px;margin-top:16px;'>Connected to SolarFlow Mobile App</p>";
  html += "</div></body></html>";
  server.send(200, "text/html", html);
}

// ================ SETUP WI-FI & WEB SERVER ==========
void setupWiFi() {
  // Use dual mode: both Station and Access Point simultaneously
  WiFi.mode(WIFI_AP_STA);

  // 1. Start SoftAP (Always guaranteed to exist for direct mobile connection)
  WiFi.softAP(AP_SSID, AP_PASSWORD);
  Serial.print("SoftAP Created: ");
  Serial.println(AP_SSID);
  Serial.print("SoftAP IP Address: ");
  Serial.println(WiFi.softAPIP()); // Usually 192.168.4.1

  // 2. Connect to home router if configured
  if (String(WIFI_SSID) != "YOUR_WIFI_SSID" && String(WIFI_SSID).length() > 0) {
    Serial.print("Connecting to Wi-Fi SSID: ");
    Serial.println(WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    unsigned long startAttempt = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 6000) {
      delay(400);
      Serial.print(".");
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
      Serial.print("Wi-Fi Connected! Local Station IP: ");
      Serial.println(WiFi.localIP());
    } else {
      Serial.println("Home Wi-Fi connection timed out. SoftAP is active.");
    }
  }

  // HTTP Routes
  server.on("/", HTTP_GET, handleRoot);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/pump", HTTP_GET, handlePump);
  server.on("/pump/on", HTTP_GET, handlePumpOn);
  server.on("/pump/off", HTTP_GET, handlePumpOff);

  server.onNotFound([]() {
    sendCORS();
    server.send(404, "text/plain", "Not Found");
  });

  server.begin();
  Serial.println("HTTP Server active on port 80.");
}

// ================ SETUP =============================
void setup() {
  Serial.begin(115200);
  analogReadResolution(12);

  pinMode(LEFT_LDR, INPUT);
  pinMode(RIGHT_LDR, INPUT);

  // Relay OFF at startup.
  digitalWrite(RELAY_PIN, RELAY_ACTIVE_LOW ? HIGH : LOW);
  pinMode(RELAY_PIN, OUTPUT);
  pumpOn = false;

  // Initialize servo.
  trackerServo.setPeriodHertz(50);
  trackerServo.attach(SERVO_PIN, 500, 2400);
  trackerServo.write(90);

  // Initialize DS18B20.
  sensors.begin();
  sensors.setResolution(12);
  sensors.setWaitForConversion(false);

  Serial.println();
  Serial.println("========================================");
  Serial.println("ESP32 Solar Tracker & Pump Controller");
  Serial.println("Dual AP+STA Wi-Fi & WebServer Started");
  Serial.println("========================================");

  setupWiFi();
}

// ================ MAIN LOOP =========================
void loop() {
  trackSunlight();
  updateTemperature();
  handlePumpCommands();
  server.handleClient(); // Handles requests from Mobile App & Web Dashboard

  unsigned long now = millis();

  // Print status every second.
  if (now - lastStatus >= 1000) {
    lastStatus = now;

    Serial.print("Left LDR: ");
    Serial.print(lastLeftLdr);

    Serial.print(" | Right LDR: ");
    Serial.print(lastRightLdr);

    Serial.print(" | Servo: ");
    Serial.print(currentAngle, 1);
    Serial.print(" deg");

    Serial.print(" | Temperature: ");
    if (temperatureValid) {
      Serial.print(temperature, 2);
      Serial.print(" C");
    } else {
      Serial.print("Sensor error");
    }

    Serial.print(" | Pump: ");
    Serial.println(pumpOn ? "ON" : "OFF");
  }
}
