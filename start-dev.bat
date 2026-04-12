@echo off
echo Cleaning up old processes...
taskkill /F /IM node.exe 2>nul
timeout /t 1 /nobreak >nul

echo.
echo Starting Medicare Portal...
echo.
echo Frontend will start on: http://localhost:5173
echo Backend API will start on: http://localhost:3000
echo.
npm run dev
pause
