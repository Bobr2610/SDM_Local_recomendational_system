@echo off
cd /d %~dp0
echo SDM live mode: API + Vite on LAN, then run Capacitor from Android Studio
start "SDM API+UI" cmd /k node scripts\phone.mjs --live
