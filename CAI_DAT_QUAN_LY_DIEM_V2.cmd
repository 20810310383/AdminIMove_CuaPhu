@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo =========================================================
echo   TH79 IMOVE ADMIN - CAI DAT TRANG QUAN LY DIEM V2
 echo =========================================================
echo THU MUC: %CD%
if not exist "package.json" (
 echo [LOI] Hay giai nen ZIP vao thu muc AdminIMove_CuaPhu co package.json
 pause
 exit /b 2
)
where node >nul 2>nul
if errorlevel 1 (echo [LOI] Node.js chua duoc cai & pause & exit /b 2)
node scripts\INSTALL_DRIVER_POINTS_CENTER_V2.cjs --check
if errorlevel 1 goto FAIL
node scripts\INSTALL_DRIVER_POINTS_CENTER_V2.cjs
if errorlevel 1 goto FAIL
node scripts\VERIFY_POINTS_CENTER_V2.cjs
if errorlevel 1 goto FAIL
if not exist "node_modules\.bin\vite.cmd" (
 echo [THONG BAO] Chua co node_modules. Dang cai dependencies...
 call npm ci
 if errorlevel 1 goto FAIL
)
call npm run build
if errorlevel 1 goto FAIL
echo.
echo [OK] DA SUA CODE VA BUILD THANH CONG.
echo [BAT BUOC] Push Git / redeploy Vercel dung branch, Root Directory.
echo [BAT BUOC] Chrome Ctrl+Shift+R. Menu moi nam trong KINH DOANH.
pause
exit /b 0
:FAIL
echo [LOI] CHUA THE XAC NHAN CAI DAT/BUILD. KHONG DEPLOY.
pause
exit /b 1
