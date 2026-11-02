@echo off
rem Guestora Invoice - install on Windows without the .hta launcher.
rem
rem McAfee's Real Protect blocks any .hta that starts PowerShell
rem ("RealProtect.SuspectMSHTA"), so the launcher's Install button does
rem nothing on PCs with McAfee. This runs the same installer directly. It is
rem safe to run again: it repairs the install and opens the app.
title Guestora Invoice - Install
if not exist "%~dp0_system\install-windows.ps1" (
  echo.
  echo   The _system folder is missing. Extract the whole ZIP first
  echo   ^(right-click the ZIP, Extract All^), then run this file from
  echo   the extracted folder.
  echo.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0_system\install-windows.ps1"
