@echo off
title SolarFlow ESP32 Hardware Bridge
color 0A
echo.
echo  =====================================================
echo   SolarFlow ESP32 Hardware Bridge - Port 5005
echo  =====================================================
echo.
echo  - Make sure ESP32 is connected via USB (COM9)
echo  - Make sure Arduino Serial Monitor is CLOSED
echo  - Your phone must be on the SAME Wi-Fi as this PC
echo.
echo  PC Wi-Fi IP: Run "ipconfig" and look for "WiFi"
echo.
cd /d "%~dp0"
:loop
node hardware_bridge.js
echo.
echo  Bridge stopped. Restarting in 3 seconds...
timeout /t 3 /nobreak
goto loop
