import React from 'react';
import {coreApiRequest} from './coreApi.js';
const n=v=>Number(v||0).toLocaleString('vi-VN');
export default function DriverPointLedgerPage(){
 const [accounts,setAccounts]=React.useState([]),[selected,setSelected]=React.useState(''),[ledger,setLedger]=React.useState(null),[q,setQ]=React.useState(''),[loading,setLoading]=React.useState(false),[error,setError]=React.useState('');
 async function load(){setLoading(true);setError('');try{const d=await coreApiRequest('/api/v72/admin/driver-experience/point-accounts?limit=500');setAccounts(d.drivers||[])}catch(e){setError(e.message)}finally{setLoading(false)}}
 React.useEffect(()=>{load()},[]);
 async function choose(id){setSelected(id);setLedger(null);if(!id)return;try{
  setError('');const d=await coreApiRequest(`/api/v189/admin/points/drivers/${id}/ledger?limit=200`);setLedger(d);
 }catch(e){setError(e.message)}}
 const filtered=accounts.filter(x=>`${x.fullName||''} ${x.phone||''} ${x.driverId||''}`.toLowerCase().includes(q.toLowerCase()));
 return <div className="v14-page" style={{display:'grid',gap:16}}>
  <header className="v14-page-head"><div><span className="v14-eyebrow">DRIVER POINTS · RECONCILIATION</span><h1>Đối soát điểm tài xế theo chuyến</h1><p>Xem điểm cộng/trừ, phí nền tảng quy đổi và booking cụ thể. Không ghi lại số dư từ giao diện.</p></div><button className="button" onClick={load}>Làm mới danh sách</button></header>
  {error&&<div className="v73-alert" role="alert">{error}</div>}
  <section className="card" style={{padding:18}}><label>Chọn tài xế<input placeholder="Tìm theo tên, SĐT hoặc Driver ID" value={q} onChange={e=>setQ(e.target.value)}/></label>
   <select aria-label="Tài xế" style={{width:'100%',marginTop:10}} value={selected} onChange={e=>choose(e.target.value)}><option value="">Chọn tài xế để xem sổ điểm</option>{filtered.map(x=><option key={x.driverId} value={x.driverId}>{x.fullName||x.phone||x.driverId} · {n(x.balance)} điểm</option>)}</select>
  </section>
  {ledger&&<>{ledger.missingFeeBookings?.length>0&&<div className="v73-alert" role="alert">
    Cảnh báo đối soát: {ledger.missingFeeBookings.length} chuyến hoàn thành có phí nền tảng nhưng chưa tìm thấy bút toán trừ điểm.
    Hãy kiểm tra luồng settlement/sync của Driver, không tự trừ lần hai.
    <div style={{fontSize:12,marginTop:7}}>{ledger.missingFeeBookings.slice(0,8).map(x=><span key={x.bookingId} style={{marginRight:12}}>{x.bookingCode||x.bookingId}: {n(x.expectedPlatformFeeVnd)} đ</span>)}</div>
   </div>}<div className="v14-kpis">
   <article><span>Số dư hiện tại</span><b>{n(ledger.balance)} điểm</b></article>
   <article><span>Tổng điểm được cộng</span><b>{n(ledger.lifetimeEarned)}</b></article>
   <article><span>Tổng điểm đã trừ</span><b>{n(ledger.lifetimeSpent)}</b></article>
   <article><span>Phí nền tảng trong 200 giao dịch gần nhất</span><b>{n(ledger.feeDebits.reduce((s,t)=>s-Math.min(0,t.points),0))} điểm</b></article>
  </div><section className="card" style={{padding:18,overflowX:'auto'}}><h2>Sổ chi tiết cộng/trừ điểm</h2>
    <table><thead><tr><th>Thời gian</th><th>Loại</th><th>Mã chuyến</th><th>Phí nền tảng</th><th>Điểm thay đổi</th><th>Lý do / mã tham chiếu</th></tr></thead><tbody>{ledger.transactions.map(t=><tr key={t.id}>
      <td>{t.createdAt?new Date(t.createdAt).toLocaleString('vi-VN'):'—'}</td><td>{t.type==='PLATFORM_FEE'?'Phí cuốc':t.type==='ADMIN_ADJUSTMENT'?'Admin điều chỉnh':t.type||'Khác'}</td>
      <td>{t.bookingCode||t.bookingId||'—'}</td><td>{t.type==='PLATFORM_FEE'?n(t.platformFeeVnd)+' đ':'—'}</td>
      <td style={{fontWeight:800,color:t.points<0?'#c62535':'#15803d'}}>{t.points>0?'+':''}{n(t.points)} điểm</td><td>{t.reason||'—'}<small style={{display:'block',color:'#9aa1ab'}}>{t.reference}</small></td>
    </tr>)}</tbody></table></section></>}
 </div>;
}
