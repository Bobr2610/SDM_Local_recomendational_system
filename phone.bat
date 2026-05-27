@echo off
cd /d %~dp0
echo SDM: server + Android APK + install
echo Phone and PC must use the same Wi-Fi.
node scripts\phone.mjs %*
