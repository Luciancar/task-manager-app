@echo off
cd /d "%~dp0"
echo. >> src/App.jsx
"C:\Program Files\Git\bin\git.exe" add .
"C:\Program Files\Git\bin\git.exe" commit -m "trigger: redeploy from github"
"C:\Program Files\Git\bin\git.exe" push origin main
echo Done!
pause
