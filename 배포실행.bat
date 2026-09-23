@echo off
REM 이 파일을 더블클릭하면 새 창에서 deploy.bat을 실행하고, 완료 후에도 창이 유지됩니다.
start cmd /k "cd /d %~dp0 && call deploy.bat"
