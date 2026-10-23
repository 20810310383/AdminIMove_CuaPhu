@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo =============================================================
echo   TH79 iMove Admin - Cai trang Quan ly diem tai xe
 echo =============================================================
if not exist "package.json" (
  echo [LOI] Khong tim thay package.json.
  echo Hay giai nen TOAN BO noi dung ZIP truc tiep vao thu muc AdminIMove_CuaPhu.
  pause
  exit /b 2
)
where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] Khong tim thay Node.js trong PATH.
  pause
  exit /b 2
)
node scripts\INSTALL_DRIVER_POINTS_CENTER.cjs --check
if errorlevel 1 goto FAILED
node scripts\INSTALL_DRIVER_POINTS_CENTER.cjs
if errorlevel 1 goto FAILED
node scripts\VERIFY_DRIVER_POINTS_CENTER.cjs
if errorlevel 1 goto FAILED
node scripts\DIAGNOSE_DRIVER_POINTS_CENTER.cjs
if errorlevel 1 goto FAILED
call npm run build
if errorlevel 1 (
  echo.
  echo [CANH BAO] Source da cai nhung BUILD VITE CHUA THANH CONG.
  echo Kiem tra npm ci va npm run build. Khong deploy neu build loi.
  pause
  exit /b 1
)
echo.
echo [OK] Source da cai, kiem tra va BUILD THANH CONG.
echo Ban phai deploy lai Admin len Vercel/hosting dang su dung.
echo Neu dung Git, commit va push cac file src da duoc script sua.
echo Sau deploy bam Ctrl + Shift + R tren trinh duyet.
pause
exit /b 0
:FAILED
echo [LOI] Dung cai dat, chua xac nhan thanh cong. Xem thong bao phia tren.
pause
exit /b 1
