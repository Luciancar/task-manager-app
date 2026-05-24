@echo off
cd /d "%~dp0"
"C:\Program Files\Git\bin\git.exe" init
"C:\Program Files\Git\bin\git.exe" config user.email "deploy@taskmanager.app"
"C:\Program Files\Git\bin\git.exe" config user.name "Task Manager"
"C:\Program Files\Git\bin\git.exe" add .
"C:\Program Files\Git\bin\git.exe" commit -m "feat: task manager v3"
"C:\Program Files\Git\bin\git.exe" branch -M main
"C:\Program Files\Git\bin\git.exe" remote remove origin 2>nul
"C:\Program Files\Git\bin\git.exe" remote add origin https://github.com/Luciancar/task-manager-app.git
"C:\Program Files\Git\bin\git.exe" push -u origin main --force
echo Done!
pause
