'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,'src',p),'utf8');
const app=read('App.jsx'), topups=read('DriverPointTopupsPage.jsx'),main=read('main.jsx');
const checks=[
  ['Trang Quản lý điểm đã khai báo',app.includes("import DriverPointsManagementPage from './DriverPointsManagementPage.jsx' ".trim())],
  ['Menu Quản lý điểm',app.includes("'driver-points-center','Quản lý điểm tài xế'")],
  ['Route Quản lý điểm',app.includes("if(page==='driver-points-center')")],
  ['Nạp quỹ đổi tên',app.includes("'Nạp quỹ & biên lai'")],
  ['Không còn popup cộng trừ trong Nạp quỹ',!topups.includes('adjustOpen')&&!topups.includes('saveAdjustment')],
  ['Vẫn có duyệt nạp điểm',topups.includes('async function approve(')&&topups.includes('FundTransferSettingsPanel')],
  ['Đã thêm CSS sửa icon QR vào app',main.includes("import './driver-points-qr-fix.css';")],
  ['Có form cộng / trừ riêng',read('DriverPointsManagementPage.jsx').includes("mode === 'DEBIT'")],
  ['Giữ Idempotency-Key',read('DriverPointsManagementPage.jsx').includes("'Idempotency-Key'")],
  ['CSS QR phân biệt icon và QR',read('driver-points-qr-fix.css').includes('.fund-bank-title>img.admin-png-icon')],
];
let bad=0;
for(const [label,ok] of checks){ console.log(`${ok?'PASS':'FAIL'} ${label}`);if(!ok)bad++; }
if(bad)process.exitCode=1;
else console.log(`PASS ${checks.length}/${checks.length} kiểm tra cấu trúc.`);
