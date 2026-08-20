@echo off
REM Preferir el selector gráfico (abre terminales DENTRO de Cursor).
cd /d "%~dp0.."
echo.
echo  Abra este repo en Cursor y luego:
echo    Ctrl+Shift+P  -^>  Tasks: Run Task  -^>  ARGO · Selector grafico
echo.
echo  O ejecute ahora el selector (Cursor debe estar abierto con ARGO):
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0argo-dev-picker.ps1"
