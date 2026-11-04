@echo off
:: Run this script as Administrator to open port 5005 for the ESP32 Bridge
title SolarFlow Firewall Setup (Run as Admin)
echo.
echo Adding Windows Firewall rule for SolarFlow ESP32 Bridge (port 5005)...
echo.

netsh advfirewall firewall add rule name="SolarFlow ESP32 Bridge Port 5005" dir=in action=allow protocol=TCP localport=5005

if %errorlevel% == 0 (
    echo.
    echo SUCCESS! Port 5005 is now open.
    echo Your phone can now connect to the bridge.
    echo.
    echo Also changing WiFi profile to Private for local network discovery...
    powershell -command "Set-NetConnectionProfile -InterfaceAlias 'WiFi' -NetworkCategory Private" 2>nul
    echo Done! Restart the bridge and try again.
) else (
    echo.
    echo FAILED - Please right-click this file and choose "Run as administrator"
)

echo.
pause

