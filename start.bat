@echo off
cd /d "%~dp0"
echo Lancement du site TEAM RDM...
echo Ouvre ce lien dans ton navigateur : http://localhost:8000
python -m http.server 8000
pause
