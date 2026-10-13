import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appPath = path.resolve(__dirname, '../src/App.jsx');
if (!fs.existsSync(appPath)) throw new Error(`Không tìm thấy ${appPath}`);

let s = fs.readFileSync(appPath, 'utf8');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = `${appPath}.bak-legal-${stamp}`;
fs.copyFileSync(appPath, backupPath);
let changed = false;

function addImport() {
  if (s.includes("import LegalSettingsPage from './LegalSettingsPage.jsx';")) return;

  const preferred = "import ProductionHealthPage from './ProductionHealthPage.jsx';";
  if (s.includes(preferred)) {
    s = s.replace(preferred, `${preferred}\nimport LegalSettingsPage from './LegalSettingsPage.jsx';`);
    changed = true;
    return;
  }

  const apiImport = "import { adminApiRequest, adminAccessToken, hasPermission } from './adminApi.js';";
  if (s.includes(apiImport)) {
    s = s.replace(apiImport, `import LegalSettingsPage from './LegalSettingsPage.jsx';\n${apiImport}`);
    changed = true;
    return;
  }

  throw new Error('Không tìm được vị trí chèn import LegalSettingsPage trong App.jsx.');
}

function addNav() {
  if (s.includes("['legal-settings','Điều khoản & bảo mật'")) return;

  const anchors = [
    "['settings','Cài đặt',Settings,'settings.view','Cấu hình hệ thống và kết nối dữ liệu']",
    "['settings','Cài đặt hệ thống',Settings,'settings.view']",
    "['settings','Cài đặt',Settings,'settings.view']",
  ];

  for (const anchor of anchors) {
    if (s.includes(anchor)) {
      const item = "['legal-settings','Điều khoản & bảo mật',FileText,'settings.view','Cập nhật Điều khoản, Chính sách bảo mật và bật/tắt OTP']";
      s = s.replace(anchor, `${item},\n      ${anchor}`);
      changed = true;
      return;
    }
  }

  throw new Error('Không tìm thấy mục Cài đặt trong menu Hệ thống của App.jsx.');
}

function addRoute() {
  if (s.includes("page==='legal-settings'")) return;

  const anchors = [
    "if(page==='settings')view=can('settings.view')?<SettingsPage/>:<AccessDenied/>;",
    "if(page==='settings')view=can('settings.view')?<EnterpriseSettingsPage/>:<PermissionDenied/>;",
  ];

  for (const anchor of anchors) {
    if (s.includes(anchor)) {
      const denied = anchor.includes('PermissionDenied') ? 'PermissionDenied' : 'AccessDenied';
      const route = `if(page==='legal-settings')view=can('settings.view')?<LegalSettingsPage/>:<${denied}/>;`;
      s = s.replace(anchor, `${route}\n  ${anchor}`);
      changed = true;
      return;
    }
  }

  throw new Error('Không tìm thấy route settings trong App.jsx.');
}

addImport();
addNav();
addRoute();

if (changed) {
  fs.writeFileSync(appPath, s, 'utf8');
  console.log('[OK] Đã thêm menu + route Điều khoản & bảo mật vào Admin.');
} else {
  console.log('[OK] App.jsx đã có Điều khoản & bảo mật.');
}
console.log(`[BACKUP] ${backupPath}`);
