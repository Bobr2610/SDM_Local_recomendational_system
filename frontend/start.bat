@echo off
cd /d %~dp0
echo Starting SDM Frontend...
echo Open http://localhost:5173 in your browser
echo Mobile: use network URL shown below
call npm run dev -- --host
