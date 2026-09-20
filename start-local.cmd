@echo off
cd /d "%~dp0"
set PORT=3001
title Tuorong Ops Platform - localhost:%PORT%
echo Starting Tuorong Ops Platform from:
echo %CD%
echo.
echo URL: http://localhost:%PORT%/?v=20260920-3
echo.
start "" "http://localhost:%PORT%/?v=20260920-3"
"C:\Program Files\nodejs\node.exe" backend\src\server.js
echo.
echo Server stopped or failed to start. Press any key to close.
pause >nul
