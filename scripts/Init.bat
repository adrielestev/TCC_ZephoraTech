@echo off
set "PROJETO=C:\Users\adrie\TCC_ZephoraTech"

start "Zephora Backend" cmd /k "cd /d %PROJETO%\backend && npm run dev"
start "Zephora Mobile" cmd /k "cd /d %PROJETO%\mobile && npm start"