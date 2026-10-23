'use strict';
const fs = require('fs');
const path = require('path');
const root = process.cwd();
function contains(file, needle) { return fs.existsSync(file) && fs.readFileSync(file,'utf8').includes(needle); }
const src = path.join(root, 'src');
const checks = [
 ['App.jsx: import trang', contains(path.join(src,'App.jsx'),"import DriverPointsManagementPage from './DriverPointsManagementPage.jsx'" )],
 ['App.jsx: menu Quản lý điểm', contains(path.join(src,'App.jsx'),"'driver-points-center','Quản lý điểm tài xế'")],
 ['App.jsx: nhóm KINH DOANH', contains(path.join(src,'App.jsx'),"'payments','driver-points-center','driver-point-topups','settlement'")],
 ['App.jsx: route component', contains(path.join(src,'App.jsx'),"if(page==='driver-points-center')")],
 ['App.jsx: đổi tên Nạp quỹ', contains(path.join(src,'App.jsx'),"'driver-point-topups','Nạp quỹ & biên lai'")],
 ['src/DriverPointsManagementPage.jsx', fs.existsSync(path.join(src,'DriverPointsManagementPage.jsx'))],
 ['src/driver-points-management.css', fs.existsSync(path.join(src,'driver-points-management.css'))],
 ['src/main.jsx: sửa icon QR', contains(path.join(src,'main.jsx'),"import './driver-points-qr-fix.css';")],
];
let failed=0;
for (const [label,ok] of checks) { console.log(`${ok?'[OK]':'[FAIL]'} ${label}`); if(!ok)failed++; }
console.log('\nSource:',path.resolve(root));
if (fs.existsSync(path.join(root,'dist'))) {
  let found=false;
  const walk = dir => {
    for (const ent of fs.readdirSync(dir,{withFileTypes:true})) {
      const full=path.join(dir,ent.name);
      if(ent.isDirectory()) walk(full);
      else if(/\.(js|html)$/.test(ent.name) && fs.readFileSync(full,'utf8').includes('Quản lý điểm tài xế')) found=true;
    }
  };
  walk(path.join(root,'dist'));
  console.log(`[${found?'OK':'WARN'}] dist/ ${found?'có':'chưa tìm thấy'} trang Quản lý điểm; hãy chạy npm run build.`);
} else console.log('[INFO] Chưa có dist/, cần npm run build.');
if (failed) { console.error(`\n[FAIL] ${failed} kiểm tra thất bại. Đừng triển khai trước khi sửa.`); process.exitCode=1; }
else console.log('\n[OK] Các liên kết trang mới trong mã nguồn đầy đủ. Sau build phải triển khai lại Vercel và làm mới cache trình duyệt.');
