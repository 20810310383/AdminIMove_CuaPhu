import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const appPath=path.resolve(__dirname,'../src/App.jsx');
let s=fs.readFileSync(appPath,'utf8');
let changed=false;

function insertAfter(anchor,text){
  if(s.includes(text.trim()))return;
  if(!s.includes(anchor))throw new Error(`Không tìm thấy mốc App.jsx: ${anchor}`);
  s=s.replace(anchor,`${anchor}\n${text}`);changed=true;
}

insertAfter(
  "import EnterpriseSettingsPage from './SettingsPage.jsx';",
  "import LegalSettingsPage from './LegalSettingsPage.jsx';",
);

if(!s.includes("['legal-settings','Điều khoản & bảo mật'")){
  const anchor="['settings','Cài đặt hệ thống',Settings,'settings.view']";
  if(!s.includes(anchor))throw new Error('Không tìm thấy nav settings trong App.jsx.');
  s=s.replace(anchor,"['legal-settings','Điều khoản & bảo mật',ShieldCheck,'settings.view'],\n  "+anchor);
  changed=true;
}

if(!s.includes("'legal-settings','settings'")){
  const old="items:['trust','production-health','admin-accounts','admin-roles','admin-audit','admin-profile','settings']";
  const neu="items:['trust','production-health','admin-accounts','admin-roles','admin-audit','admin-profile','legal-settings','settings']";
  if(!s.includes(old))throw new Error('Không tìm thấy nhóm AN TOÀN & HỆ THỐNG trong App.jsx.');
  s=s.replace(old,neu);changed=true;
}

if(!s.includes("page==='legal-settings'")){
  const anchor="if(page==='settings')view=can('settings.view')?<EnterpriseSettingsPage/>:<PermissionDenied/>;";
  if(!s.includes(anchor))throw new Error('Không tìm thấy route settings trong App.jsx.');
  s=s.replace(anchor,"if(page==='legal-settings')view=can('settings.view')?<LegalSettingsPage/>:<PermissionDenied/>;\n  "+anchor);
  changed=true;
}

if(changed){fs.writeFileSync(appPath,s,'utf8');console.log('[OK] Đã thêm trang Điều khoản & bảo mật vào Admin.');}
else console.log('[OK] App.jsx đã có trang Điều khoản & bảo mật.');
