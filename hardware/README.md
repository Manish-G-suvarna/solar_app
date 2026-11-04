# SolarFlow ESP32 Solar Tracker & Pump Hardware Guide

This folder contains the complete, upgraded ESP32 firmware for the **SolarFlow** smart solar monitoring and cleaning system.

---

## 📌 Hardware Pinout Table

| ESP32 Pin | Component | Role | Notes |
| :--- | :--- | :--- | :--- |
| **GPIO 34** | Left LDR | Left Sunlight Intensity | Analog Input (ADC1) |
| **GPIO 35** | Right LDR | Right Sunlight Intensity | Analog Input (ADC1) |
| **GPIO 18** | Servo Motor | Horizontal Sun Tracker (0°–180°) | PWM Output (ESP32Servo) |
| **GPIO 26** | Relay Module | High-Pressure Water Pump | Digital Output (Active LOW / HIGH) |
| **GPIO 4** | DS18B20 Temp | Solar Panel Surface Temperature | OneWire Bus (Requires 4.7kΩ pull-up to 3.3V) |
| **VIN / 5V** | Power Supply | 5V 2A–3A Power Supply | External power for Servo & Pump |
| **GND** | Common Ground | Common Ground | Connect all GNDs together |

---

## ⚡ Key Features

1. **Dual Wi-Fi Mode (AP + STA Simultaneously)**:
   - **Standalone SoftAP Hotspot**: Broadcasts `SolarFlow-ESP32` on IP **`192.168.4.1`** (Password: `solarflow123`). You can connect your phone directly to this Wi-Fi in the field without any home router.
   - **Home Wi-Fi (Optional)**: Automatically connects to your home router if you put your SSID and Password in the code.
2. **Built-in Browser Dashboard**:
   - Open `http://192.168.4.1/` (or your local IP) in any browser (Chrome, Safari) on phone or PC to test the pump and see live sensor graphs.
3. **Full REST API with CORS**:
   - `GET /status`: Returns JSON with left LDR, right LDR, servo angle, DS18B20 temperature, and pump status.
   - `GET /pump?state=1` or `GET /pump/on`: Turns pump relay ON.
   - `GET /pump?state=0` or `GET /pump/off`: Turns pump relay OFF.
4. **Serial Fallback**:
   - You can still enter `'1'` (Pump ON) or `'0'` (Pump OFF) in the Arduino Serial Monitor at `115200` baud.

---

## 🚀 How to Flash the ESP32

1. Open **Arduino IDE**.
2. Go to **Sketch → Include Library → Manage Libraries...** and ensure these libraries are installed:
   - `ESP32Servo` by Kevin Harrington
   - `OneWire` by Paul Stoffregen
   - `DallasTemperature` by Miles Burton
3. Open [`esp32_solar_tracker.ino`](./esp32_solar_tracker.ino).
4. Select your board: **Tools → Board → ESP32 Arduino → ESP32 Dev Module**.
5. Connect your ESP32 via USB and click **Upload**.
6. Open **Serial Monitor** at `115200` baud to verify sensor readings and view the assigned IP address.

