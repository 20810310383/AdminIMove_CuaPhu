'use strict';
/**
 * TH79 iMove patch installer. Safely merge row actions into an existing Admin.
 * Run once from AdminIMove_CuaPhu: node scripts/APPLY_DRIVER_POINT_ROW_ACTIONS.cjs
 * Fail closed when the target source does not match expected anchors.
 */
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const targetApp = path.join(root, 'src', 'App.jsx');
const targetKyc = path.join(root, 'src', 'DriverManagement.jsx');
const check = process.argv.includes('--check');

function assertExists(file) {
  if (!fs.existsSync(file)) throw new Error(`File không tồn tại: ${file}`);
}
function changeOne(source, needle, updated, where) {
  if (source.includes(updated)) return source;
  if (!source.includes(needle)) throw new Error(`Cấu trúc đã thay đổi tại ${where}. Không thể vá tự động; giữ nguyên file hiện tại.`);
  if (source.split(needle).length !== 2) throw new Error(`Điểm vá bị trùng tại ${where}.`);
  return source.replace(needle, updated);
}
function applyApp(source) {
  let out = source;
  if (!out.includes("import DriverPointsModal from './DriverPointsModal.jsx';")) {
    const needle="import AdminOverlayPortal from './AdminOverlayPortal.jsx';";
    out=changeOne(out,needle,needle+"\nimport DriverPointsModal from './DriverPointsModal.jsx';", 'App import');
  }
  const start=out.indexOf('function Drivers(){');
  const end=out.indexOf('\nfunction Trips(){',start);
  if (start<0 || end<0) throw new Error('Không tìm thấy component Drivers() của Admin.');
  let block=out.slice(start,end);
  block=changeOne(block,
    "const [rows,setRows]=React.useState(read('drivers'));const [q,setQ]=React.useState('');const [showExport,setShowExport]=React.useState(false);",
    "const [rows,setRows]=React.useState(read('drivers'));const [q,setQ]=React.useState('');const [showExport,setShowExport]=React.useState(false);\n  const [pointDialog,setPointDialog]=React.useState(null);",
    'Drivers state');
  const email="  const driverEmail=r=>linkedUser(r)?.email||r?.email||'';";
  block=changeOne(block,email,
    email+"\n  const driverId=r=>mongoId(r._id||r.driverId||r.id);\n  const hasValidDriverId=r=>/^[0-9a-f]{24}$/i.test(driverId(r));\n  const openPoints=(r,tabName)=>setPointDialog({driver:{driverId:driverId(r),fullName:driverName(r),phone:driverPhone(r)},tab:tabName});",
    'Drivers identity');
  block=changeOne(block,
    '<th scope="col">Online</th></tr></thead>',
    '<th scope="col">Online</th><th scope="col">Điểm tài xế</th></tr></thead>',
    'Drivers table header');
  block=changeOne(block,
    '<td><DriverOnlineIndicator row={r}/></td></tr>',
    '<td><DriverOnlineIndicator row={r}/></td><td><div className="dm-row-points-actions"><button type="button" className="dm-debit-action" disabled={!hasValidDriverId(r)} onClick={()=>openPoints(r,\'debit\')}>Trừ điểm</button><button type="button" disabled={!hasValidDriverId(r)} onClick={()=>openPoints(r,\'history\')}><History size={16}/> Lịch sử điểm</button></div></td></tr>',
    'Drivers table actions');
  const anchor='    <ExportFieldModal open={showExport} onClose={()=>setShowExport(false)} title="Xuất danh sách tài xế"';
  block=changeOne(block,anchor,
    "    {pointDialog && <DriverPointsModal key={pointDialog.driver.driverId} driver={pointDialog.driver} initialTab={pointDialog.tab} onClose={()=>setPointDialog(null)}/>}\n"+anchor,
    'Drivers dialog');
  return out.slice(0,start)+block+out.slice(end);
}
function applyKyc(source) {
  let out=source;
  const imp="import { coreApiRequest, openCorePrivateFile } from './coreApi.js';";
  out=changeOne(out,imp,imp+"\nimport DriverPointsModal from './DriverPointsModal.jsx';",'KYC import');
  const state='  const [reviewing, setReviewing] = React.useState(false);';
  out=changeOne(out,state,state+'\n  const [pointDialog, setPointDialog] = React.useState(null);','KYC state');
  const action=`                    <td>
                      <button
                        type="button"
                        className="dm-view-btn"
                        onClick={() => loadDetail(row.driverId)}
                      >
                        Quản lý <ChevronRight size={15} />
                      </button>
                    </td>`;
  const actionNew=`                    <td>
                      <div className="dm-row-points-actions">
                        <button type="button" className="dm-view-btn" onClick={() => loadDetail(row.driverId)}>
                          Quản lý <ChevronRight size={15} />
                        </button>
                        <button type="button" className="dm-debit-action"
                          disabled={s(row.approvalStatus) !== 'APPROVED'}
                          title={s(row.approvalStatus) !== 'APPROVED' ? 'Chỉ tài xế đã duyệt mới có thể trừ điểm' : 'Trừ điểm tài xế'}
                          onClick={() => setPointDialog({ driver: { ...row.user, driverId: row.driverId }, tab: 'debit' })}>
                          Trừ điểm
                        </button>
                        <button type="button" onClick={() => setPointDialog({ driver: { ...row.user, driverId: row.driverId }, tab: 'history' })}>
                          <History size={16} /> Lịch sử điểm
                        </button>
                      </div>
                    </td>`;
  out=changeOne(out,action,actionNew,'KYC row actions');
  const drawer='      <DriverDrawer\n        driverId={selectedId}';
  out=changeOne(out,drawer,
    "      {pointDialog && (\n        <DriverPointsModal key={pointDialog.driver.driverId} driver={pointDialog.driver} initialTab={pointDialog.tab} onClose={() => setPointDialog(null)} />\n      )}\n"+drawer,
    'KYC dialog');
  return out;
}
function main(){
  [targetApp,targetKyc,path.join(root,'src','DriverPointsModal.jsx'),path.join(root,'src','driver-points-modal.css')].forEach(assertExists);
  const patches=[
    {file:targetApp, apply:applyApp},
    {file:targetKyc, apply:applyKyc},
  ];
  const edits=patches.map(({file,apply})=>{
    const old=fs.readFileSync(file,'utf8');
    return {file,old,newContent:apply(old)};
  });
  if(check){console.log('PASS: tất cả điểm vá đều phù hợp, chưa ghi file.');return;}
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  for(const item of edits){
    if(item.newContent===item.old) {console.log(`Không thay đổi: ${path.relative(root,item.file)}`);continue;}
    const backup=`${item.file}.backup-${stamp}`;
    fs.copyFileSync(item.file,backup);
    fs.writeFileSync(item.file,item.newContent);
    console.log(`Đã vá ${path.relative(root,item.file)} (sao lưu: ${path.basename(backup)})`);
  }
  console.log('Hoàn tất. Chạy: npm run build');
}
try { main(); } catch (error) {console.error(`KHÔNG ÁP DỤNG BẢN VÁ: ${error.message}`);process.exitCode=1;}
