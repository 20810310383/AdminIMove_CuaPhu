const fs=require('fs');const path=require('path');const file=path.resolve(__dirname,'../src/App.jsx');
const dry=process.argv.includes('--check');let s=fs.readFileSync(file,'utf8');
const importAnchor="import DriverPointTopupsPage from './DriverPointTopupsPage.jsx';";
if(!s.includes(importAnchor)||!s.includes('const navGroups=[')||!s.includes("if(page==='reports')"))throw Error('App.jsx cấu trúc khác; dừng để tránh chèn hỏng.');
if(!s.includes("import ReferralAdminPage from './ReferralAdminPage.jsx'"))s=s.replace(importAnchor,importAnchor+"\nimport ReferralAdminPage from './ReferralAdminPage.jsx';\nimport DriverPointLedgerPage from './DriverPointLedgerPage.jsx';");
const n="  ['referrals-admin','Mã giới thiệu & CTV',Megaphone,'promotions.view'],\n  ['driver-point-ledger','Đối soát điểm theo chuyến',BadgeDollarSign,'drivers.view'],\n";
if(!s.includes("['referrals-admin'")){
  const needle="  ['reports','Báo cáo',";
  if(!s.includes(needle))throw Error('Thiếu anchor menu Reports');
  s=s.replace(needle,n+needle);
}
if(!s.includes("'referrals-admin','driver-point-ledger'")){
  const re=/(\{label:'KINH DOANH',items:\[)([^\]]+)(\]\})/;
  if(!re.test(s))throw Error('Thiếu nhóm menu Kinh doanh');
  s=s.replace(re,(_,a,b,c)=>a+ b.replace(/'reports'/,"'referrals-admin','driver-point-ledger','reports'")+c);
}
const routeAnchor="  if(page==='reports')view=can('reports.view')?<AnalyticsReportsPage/>:<PermissionDenied/>;";
if(!s.includes("if(page==='referrals-admin')"))s=s.replace(routeAnchor, "  if(page==='referrals-admin')view=can('promotions.view')?<ReferralAdminPage/>:<PermissionDenied/>;\n  if(page==='driver-point-ledger')view=can('drivers.view')?<DriverPointLedgerPage/>:<PermissionDenied/>;\n"+routeAnchor);
if(dry){console.log('[CHECK] Có thể ghép hai trang Admin mà không sửa trang điều phối.');process.exit(0)}
const backup=file+'.referrals-backup-'+Date.now();fs.copyFileSync(file,backup);fs.writeFileSync(file,s);console.log('Đã ghép trang Referral + Ledger. Backup:',backup);
