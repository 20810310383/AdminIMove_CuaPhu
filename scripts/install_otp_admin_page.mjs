import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appPath = path.resolve(__dirname, '../src/App.jsx');
let source = fs.readFileSync(appPath, 'utf8');
let changed = false;

if (!source.includes("import OtpManagementPage from './OtpManagementPage.jsx';")) {
  const anchor = "import ProductionHealthPage from './ProductionHealthPage.jsx';";
  if (!source.includes(anchor)) throw new Error('Không tìm thấy import ProductionHealthPage trong App.jsx');
  source = source.replace(anchor, `${anchor}\nimport OtpManagementPage from './OtpManagementPage.jsx';`);
  changed = true;
}

if (!source.includes("['otp-management','Quản lý OTP'")) {
  const anchor = "['broadcasts','Thông báo hệ thống',Megaphone,'broadcast.view'],";
  if (!source.includes(anchor)) throw new Error('Không tìm thấy mục broadcasts trong nav App.jsx');
  source = source.replace(anchor, `${anchor}\n  ['otp-management','Quản lý OTP',Fingerprint,'settings.view'],`);
  changed = true;
}

if (!source.includes("'otp-management'" ) || !/items:\[[^\]]*'otp-management'/.test(source)) {
  const anchor = "{label:'AN TOÀN & HỆ THỐNG',items:['trust','production-health','admin-accounts','admin-roles','admin-audit','admin-profile','settings']}";
  if (source.includes(anchor)) {
    source = source.replace(anchor, "{label:'AN TOÀN & HỆ THỐNG',items:['otp-management','trust','production-health','admin-accounts','admin-roles','admin-audit','admin-profile','settings']}");
    changed = true;
  } else if (!source.includes("items:['otp-management'")) {
    throw new Error('Không tìm thấy nhóm AN TOÀN & HỆ THỐNG trong App.jsx');
  }
}

if (!source.includes("if(page==='otp-management')")) {
  const anchor = "if(page==='production-health')view=can('settings.view')?<ProductionHealthPage/>:<PermissionDenied/>;";
  if (!source.includes(anchor)) throw new Error('Không tìm thấy block production-health trong App.jsx');
  source = source.replace(anchor, `if(page==='otp-management')view=can('settings.view')?<OtpManagementPage access={adminAccess}/>:<PermissionDenied/>;\n  ${anchor}`);
  changed = true;
}

if (changed) {
  fs.writeFileSync(appPath, source, 'utf8');
  console.log('[OK] Đã thêm trang Quản lý OTP vào Admin/src/App.jsx');
} else {
  console.log('[SKIP] App.jsx đã có Quản lý OTP.');
}
