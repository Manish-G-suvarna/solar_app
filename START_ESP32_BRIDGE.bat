@echo off
title SolarFlow ESP32 Hardware Bridge (Port 5005)
color 0A
echo ======================================================
echo    SolarFlow ESP32 Hardware Bridge for Mobile App
echo ======================================================
echo.
cd /d "%~dp0"
node hardware_bridge.js
pause

