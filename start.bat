@echo off
title Medicare Portal - Development Server
echo Cleaning up old processes...
taskkill /F /IM node.exe 2>nul
timeout /t 1 /nobreak >nul
npm run dev
