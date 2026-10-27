#!/usr/bin/env node
// Integration of the merchant review page into the existing Admin App.jsx.
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const file = path.join(root,'src','App.jsx');
const check = process.argv.includes('--check');
if(!fs.existsSync(file)) throw Error('Không tìm thấy src/App.jsx trong thư mục Admin.');
const source=fs.readFileSync(file,'utf8');
if(!source.includes("import MerchantsPage from './MerchantsPage.jsx'"))throw Error('Không tìm thấy import MerchantsPage, dừng để tránh ghi đè sai phiên bản.');
if(source.includes('<MerchantsPage access={adminAccess}/>')){console.log('OK: Đã truyền quyền Admin vào trang Merchant.');process.exit(0)}
if(!source.includes('<MerchantsPage/>'))throw Error('Không nhận diện được điểm tích hợp Merchant. Không thay đổi App.jsx.');
if(!/\badminAccess\b/.test(source))throw Error('Không thấy biến adminAccess để truyền quyền.');
if(check){console.log('CHECK OK: Có thể nối quyền MerchantsPage. Chạy không có --check để cài.');process.exit(0)}
const target=source.replaceAll('<MerchantsPage/>','<MerchantsPage access={adminAccess}/>');
const backup=file+'.bak-merchant-review-20261027';
if(!fs.existsSync(backup))fs.copyFileSync(file,backup);
fs.writeFileSync(file,target);console.log('Đã cập nhật App.jsx. Sao lưu:',backup);
