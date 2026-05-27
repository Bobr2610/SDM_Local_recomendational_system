@echo off
cd /d %~dp0
echo SDM: sborka debug APK (Expo / React Native)
echo.
node scripts\build-apk.mjs %*
