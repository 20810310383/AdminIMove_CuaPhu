'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function read(p){return fs.readFileSync(path.join(root,p),'utf8')}
const checks=[
  ['App.jsx có trang quản lý điểm', read('src/App.jsx').includes("import DriverPointsManagementPage from './DriverPointsManagementPage.jsx'")],
  ['Menu Quản lý điểm tài xế',read('src/App.jsx').includes("'driver-points-center','Quản lý điểm tài xế'")],
  ['Menu Nạp quỹ & biên lai',read('src/App.jsx').includes("'driver-point-topups','Nạp quỹ & biên lai'")],
  ['Route quản lý điểm',read('src/App.jsx').includes("if(page==='driver-points-center')")],
  ['Menu nằm trong nhóm KINH DOANH',read('src/App.jsx').includes("'payments','driver-points-center','driver-point-topups','settlement'")],
  ['Bỏ nút giao dịch điểm ở trang Nạp quỹ', !read('src/DriverPointTopupsPage.jsx').includes('Tạo giao dịch điểm')],
  ['Không còn modal cộng trừ ở trang Nạp quỹ', !read('src/DriverPointTopupsPage.jsx').includes('adjustOpen')],
  ['Còn chức năng duyệt biên lai',read('src/DriverPointTopupsPage.jsx').includes('point-topups')],
  ['Có trang Quản lý điểm V2',read('src/DriverPointsManagementPage.jsx').includes('driver-points-center-v2')],
  ['Có chức năng cộng và trừ',read('src/DriverPointsManagementPage.jsx').includes("mode === 'DEBIT'")],
  ['Có lịch sử lọc theo tài xế',read('src/DriverPointsManagementPage.jsx').includes('driverId=${encodeURIComponent(id)}')],
  ['Có Idempotency-Key',read('src/DriverPointsManagementPage.jsx').includes("'Idempotency-Key'")],
  ['CSS QR đã được import',read('src/main.jsx').includes('driver-points-qr-fix.css')],
];
const failed=checks.filter(([name,ok])=>!ok);
for(const [name,ok] of checks)console.log(`${ok?'PASS':'FAIL'} ${name}`);
console.log(`${checks.length-failed.length}/${checks.length} kiểm tra cấu trúc đạt.`);
if(failed.length){console.error('CHƯA THÀNH CÔNG: Source vẫn còn bố cục cũ.');process.exitCode=1}
else console.log('SOURCE READY: Sau khi npm run build thành công, deploy lên đúng Vercel project/branch đang dùng.');
