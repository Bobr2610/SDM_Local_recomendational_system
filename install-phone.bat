@echo off
cd /d %~dp0
echo.
echo === SDM: sborka APK + ustanovka na telefon ===
echo USB-otladka dolzhna byt vklyuchena.
echo.
node scripts\phone.mjs %*
