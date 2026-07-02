@echo off
title Finanzas Mikygo
mode con: cols=60 lines=25

:menu
cls
echo ========================================
echo    Finanzas Mikygo - Panel de Control
echo ========================================
echo.
echo   [1] Iniciar todos
echo   [2] Reiniciar todos
echo   [3] Detener todos
echo   [4] Abrir navegador
echo   [5] Salir
echo ========================================
echo.
set /p "opt=Selecciona una opcion: "

if "%opt%"=="1" goto start_all
if "%opt%"=="2" goto restart_all
if "%opt%"=="3" goto stop_all
if "%opt%"=="4" goto open_browser
if "%opt%"=="5" goto exit_app
goto menu

:start_all
echo Iniciando Backend ^y Frontend...
cd /d "%~dp0backend"
start /b cmd /c "go run cmd/server/main.go" >nul 2>&1
cd /d "%~dp0web"
start /b cmd /c "npm run dev" >nul 2>&1
cd /d "%~dp0"
timeout /t 5 /nobreak >nul
echo Listo! Backend ^:8080 ^| Frontend ^:5173
echo.
start http://localhost:5173
pause
goto menu

:restart_all
echo Deteniendo servidores...
taskkill /f /im go.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo Reiniciando...
cd /d "%~dp0backend"
start /b cmd /c "go run cmd/server/main.go" >nul 2>&1
cd /d "%~dp0web"
start /b cmd /c "npm run dev" >nul 2>&1
cd /d "%~dp0"
timeout /t 5 /nobreak >nul
echo Listo! Backend ^:8080 ^| Frontend ^:5173
echo.
pause
goto menu

:stop_all
echo Deteniendo servidores...
taskkill /f /im go.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo Servidores detenidos.
echo.
pause
goto menu

:open_browser
start http://localhost:5173
start http://localhost:8080/swagger/index.html
goto menu

:exit_app
taskkill /f /im go.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
exit
