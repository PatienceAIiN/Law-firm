@echo off
set PATH=%~dp0node-v20.12.2-win-x64;%PATH%
cd /d %~dp0
node node_modules\next\dist\bin\next dev
