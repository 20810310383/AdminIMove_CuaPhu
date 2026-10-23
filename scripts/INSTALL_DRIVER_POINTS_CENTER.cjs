'use strict';
// Safe, idempotent installer for TH79 iMove Admin. Does not change API or server files.
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const check = process.argv.includes('--check');
const p = name => path.join(root, 'src', name);
const files = ['App.jsx','DriverPointTopupsPage.jsx','main.jsx','DriverManagement.jsx'];
const backups = [];

function replaceRequired(src, before, after, label) {
  if (src.includes(after)) return src;
  const count = src.split(before).length - 1;
  if (count !== 1) throw new Error(`Sai cấu trúc ${label}: tìm thấy ${count} điểm chèn; không thay đổi file.`);
  return src.replace(before, after);
}
function transformApp(input) {
  let s = input;
  const imp = "import DriverPointsManagementPage from './DriverPointsManagementPage.jsx';";
  if (!s.includes(imp)) s = replaceRequired(s, "import AdminOverlayPortal from './AdminOverlayPortal.jsx';", "import AdminOverlayPortal from './AdminOverlayPortal.jsx';\n" + imp, 'App import');
  const nav = "  ['driver-point-topups','Điểm & nạp quỹ',BadgeDollarSign,'drivers.view'],";
  const navNew = "  ['driver-points-center','Quản lý điểm tài xế',BadgeDollarSign,'drivers.view'],\n  ['driver-point-topups','Nạp quỹ & biên lai',BadgeDollarSign,'drivers.view'],";
  if (!s.includes("'driver-points-center','Quản lý điểm tài xế'")) {
    if (s.includes(nav)) s = replaceRequired(s, nav, navNew, 'App sidebar nav');
    else s = replaceRequired(s, "  ['driver-point-topups','Nạp quỹ & biên lai',BadgeDollarSign,'drivers.view'],", navNew, 'App sidebar nav');
  }
  const groupOld = "'payments','driver-point-topups','settlement'";
  const groupNew = "'payments','driver-points-center','driver-point-topups','settlement'";
  if (!s.includes(groupNew)) s = replaceRequired(s, groupOld, groupNew, 'App navGroups');
  const routeOld = "  if(page==='driver-point-topups')view=can('drivers.view')?<DriverPointTopupsPage/>:<PermissionDenied/>;";
  const routeNew = "  if(page==='driver-points-center')view=can('drivers.view')?<DriverPointsManagementPage/>:<PermissionDenied/>;\n" + routeOld;
  if (!s.includes("if(page==='driver-points-center')")) s = replaceRequired(s, routeOld, routeNew, 'App route');
  // Remove old row actions if previous driver-point patch has already been installed.
  if (s.includes('DriverPointsModal')) {
    s = s.replace("import DriverPointsModal from './DriverPointsModal.jsx';\n", '');
    s = s.replace(/\n  const \[pointDialog,setPointDialog\]=React\.useState\(null\);/g, '');
    s = s.replace(/\n  const driverId=r=>mongoId\(r\._id\|\|r\.driverId\|\|r\.id\);\n  const hasValidDriverId=r=>\/\^\[0-9a-f\]\{24\}\$\/i\.test\(driverId\(r\)\);\n  const openPoints=\(r,tabName\)=>setPointDialog\(\{driver:\{driverId:driverId\(r\),fullName:driverName\(r\),phone:driverPhone\(r\)\},tab:tabName\}\);/g, '');
    s = s.replace('<th scope="col">Online</th><th scope="col">Điểm tài xế</th>', '<th scope="col">Online</th>');
    s = s.replace(/<td><div className="dm-row-points-actions">.*?<\/div><\/td>/g, '');
    s = s.replace(/\n    \{pointDialog && <DriverPointsModal[^\n]*\/>\}/g, '');
    // If a user altered row actions, fail to prevent dangling state.
    if (s.includes('pointDialog') || s.includes('openPoints(')) throw new Error('App.jsx chứa chức năng điểm cũ đã sửa thủ công. Cần ghép lại có kiểm soát.');
  }
  return s;
}
function transformTopups(input) {
  let s = input;
  const a = s.indexOf('  async function openAdjustment(');
  const b = s.indexOf('  const all=rows.length;', a);
  if (a !== -1) {
    if (b === -1) throw new Error('Không tìm thấy điểm kết thúc khối giao dịch điểm cũ.');
    s = s.slice(0,a) + s.slice(b);
  }
  // Existing data list and QR remain untouched.
  s = s.replace(/\n  const \[adjustOpen,setAdjustOpen\]=React\.useState\(false\);/, '');
  s = s.replace(/\n  const \[drivers,setDrivers\]=React\.useState\(\[\]\);/, '');
  s = s.replace(/\n  const \[adjustments,setAdjustments\]=React\.useState\(\[\]\);/, '');
  s = s.replace(/\n  const \[driverQuery,setDriverQuery\]=React\.useState\(''\);/, '');
  s = s.replace(/\n  const \[adjustBusy,setAdjustBusy\]=React\.useState\(false\);/, '');
  s = s.replace(/\n  const \[adjustForm,setAdjustForm\]=React\.useState\(\{driverId:''[\s\S]*?\}\);/, '');
  s = s.replace(/\n        <button className="button button-primary" onClick=\{openAdjustment\}><Plus size=\{15\}\/>Tạo giao dịch điểm<\/button>/, '');
  s = s.replace(/\n        <div className="driver-point-action-shortcuts">[\s\S]*?<\/div>(?=\n        <label className="enterprise-search")/, '');
  const opening='    {adjustOpen&&<AdminOverlayPortal>';
  const i=s.indexOf(opening);
  if (i!==-1) {
    const end=s.indexOf('\n  </section>;',i);
    if (end===-1) throw new Error('Không tìm thấy cuối khối modal cộng trừ điểm.');
    s = s.slice(0,i)+s.slice(end);
  }
  s = s.replace('Nạp & điều chỉnh điểm tài xế','Nạp quỹ & duyệt biên lai');
  s = s.replace('Đối chiếu chuyển khoản và tạo giao dịch cộng/trừ điểm có kiểm soát, ghi audit log đầy đủ.','Đối chiếu chuyển khoản, duyệt biên lai và cấu hình QR nhận quỹ. Cộng/trừ điểm thủ công được thực hiện tại trang Quản lý điểm tài xế.');
  if (s.includes('adjustOpen') || s.includes('openAdjustment') || s.includes('adjustForm') || s.includes('saveAdjustment')) throw new Error('Còn đoạn điều chỉnh điểm cũ trong DriverPointTopupsPage; dừng để tránh xóa nhầm.');
  return s;
}
function transformKyc(input) {
  let s = input;
  if (!s.includes('DriverPointsModal')) return s;
  s = s.replace("import DriverPointsModal from './DriverPointsModal.jsx';\n", '');
  s = s.replace("  const [pointDialog, setPointDialog] = React.useState(null);\n", '');
  const before = `                    <td>
                      <div className="dm-row-points-actions">`;
  const index = s.indexOf(before);
  if (index !== -1) {
    const end = s.indexOf('                    </td>', index);
    if (end === -1) throw new Error('KYC row action không có tag đóng.');
    const replacement = `                    <td>
                      <button type="button" className="dm-view-btn" onClick={() => loadDetail(row.driverId)}>
                        Quản lý <ChevronRight size={15} />
                      </button>
                    </td>`;
    s = s.slice(0,index)+replacement+s.slice(end+'                    </td>'.length);
  }
  const popup = s.indexOf('      {pointDialog && (');
  if (popup !== -1) {
    const after = s.indexOf('      <DriverDrawer', popup);
    if (after === -1) throw new Error('KYC modal không tìm thấy DriverDrawer.');
    s = s.slice(0,popup)+s.slice(after);
  }
  if (s.includes('pointDialog') || s.includes('DriverPointsModal')) throw new Error('KYC có các tham chiếu popup điểm cũ chưa xử lý.');
  return s;
}
function transformMain(input) {
  const name="import './driver-points-qr-fix.css';";
  if (input.includes(name)) return input;
  return replaceRequired(input,"import './styles.css';", "import './styles.css';\n" + name, 'main CSS import');
}

function main() {
  for (const f of files.concat(['DriverPointsManagementPage.jsx','driver-points-management.css','driver-points-qr-fix.css'])) {
    if (!fs.existsSync(p(f))) throw new Error(`Thiếu file ${f}. Giải nén ZIP vào đúng thư mục Admin trước.`);
  }
  const transforms = { 'App.jsx': transformApp, 'DriverPointTopupsPage.jsx': transformTopups, 'DriverManagement.jsx': transformKyc, 'main.jsx': transformMain };
  const edits = files.map(f => {
    const old = fs.readFileSync(p(f),'utf8');
    const next = transforms[f](old);
    return {f,old,next};
  });
  if (check) {console.log('PASS: Cấu trúc Admin hợp lệ, chưa ghi file.');return;}
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  for(const {f,old,next} of edits) {
    if(old===next) {console.log(`Không cần sửa: ${f}`);continue;}
    fs.copyFileSync(p(f),`${p(f)}.bak-${stamp}`);
    fs.writeFileSync(p(f),next);
    backups.push(f);
    console.log(`Đã cập nhật src/${f}, có bản sao lưu.`);
  }
  console.log('Hoàn tất. Chạy npm run build và kiểm tra hai trang Quản lý điểm / Nạp quỹ.');
}
try{main()}catch(e){console.error('HỦY CÀI BẢN VÁ:',e.message);process.exitCode=1;}
