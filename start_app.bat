@echo off
echo Killing process on port 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do taskkill /f /pid %%a
echo Starting Khalil App...
cd /d "%~dp0"
call npm run dev -- --host
pause
