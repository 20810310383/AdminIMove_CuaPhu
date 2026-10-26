import React from 'react';
import { coreApiRequest } from './coreApi.js';

const fmt=(v)=>Number(v||0).toLocaleString('vi-VN');
export default function ReferralAdminPage(){
 const [codes,setCodes]=React.useState([]),[redemptions,setRedemptions]=React.useState([]),[loading,setLoading]=React.useState(false),[error,setError]=React.useState(''),[message,setMessage]=React.useState('');
 const [form,setForm]=React.useState({code:'',ownerUserId:'',sourceType:'COLLAB',partnerName:''});
 const [reward,setReward]=React.useState({});
 async function load(){setLoading(true);setError('');try{
  const [a,b]=await Promise.all([coreApiRequest('/api/v189/admin/referrals/codes'),coreApiRequest('/api/v189/admin/referrals/redemptions')]);
  setCodes(a.codes||[]);setRedemptions(b.redemptions||[]);
 }catch(e){setError(e.message)}finally{setLoading(false)}}
 React.useEffect(()=>{load()},[]);
 async function create(e){e.preventDefault();setError('');setMessage('');try{
  await coreApiRequest('/api/v189/admin/referrals/codes',{method:'POST',body:JSON.stringify({...form,code:form.code.trim().toUpperCase()})});
  setForm({code:'',ownerUserId:'',sourceType:'COLLAB',partnerName:''});setMessage('Đã tạo mã giới thiệu.');await load();
 }catch(e){setError(e.message)}}
 async function changeStatus(row){try{
  await coreApiRequest(`/api/v189/admin/referrals/codes/${encodeURIComponent(row.code)}`,{method:'PATCH',body:JSON.stringify({status:row.status==='ACTIVE'?'DISABLED':'ACTIVE'})});await load();
 }catch(e){setError(e.message)}}
 async function issue(row){const data=reward[row.id]||{kind:'POINTS',points:20,discountVnd:50000};
  if(!window.confirm(`Chỉ thưởng khi tài khoản ${row.usedByName||row.usedByUserId} đã hoàn tất chuyến/đơn hợp lệ.\n\nChủ mã: ${row.ownerName||row.ownerUserId}\nLoại: ${data.kind}\nGiá trị: ${data.kind==='POINTS'?fmt(data.points)+' điểm':fmt(data.discountVnd)+' đồng'}\nXác nhận cấp một lần?`))return;
  try{setError('');const res=await coreApiRequest(`/api/v189/admin/referrals/redemptions/${row.id}/reward`,{method:'POST',body:JSON.stringify(data)});
   setMessage(`Đã cấp thưởng thành công.${res.coupon?' Voucher riêng: '+res.coupon:''}`);await load();
  }catch(e){setError(e.message)}
 }
 const field=(key,value)=>(e)=>setForm(x=>({...x,[key]:e.target.value}));
 return <div className="v14-page" style={{display:'grid',gap:17}}>
  <header className="v14-page-head"><div><span className="v14-eyebrow">REFERRALS · AFFILIATE COLLAB</span><h1>Mã giới thiệu & Cộng tác viên</h1><p>Quản lý chủ mã, quán karaoke/nhậu và nhân viên hợp tác; phân loại theo ứng dụng thực tế nhập mã.</p></div><button className="button" onClick={load} disabled={loading}>Làm mới</button></header>
  {error&&<div className="v73-alert" role="alert">{error}</div>}{message&&<div className="v73-alert" style={{color:'#147d4b'}}>{message}</div>}
  <section className="card" style={{padding:20}}><h2 style={{margin:'0 0 12px'}}>Tạo mã giới thiệu / CTV</h2>
   <form onSubmit={create} className="form-grid" style={{gap:14}}>
    <label>Mã (5–20 chữ/số)<input required minLength={5} maxLength={20} value={form.code} onChange={field('code')}/></label>
    <label>MongoDB User ID chủ mã<input required value={form.ownerUserId} onChange={field('ownerUserId')} placeholder="ID tài khoản User chủ mã"/></label>
    <label>Loại chủ mã<select value={form.sourceType} onChange={field('sourceType')}><option value="USER">User cá nhân</option><option value="COLLAB">Cộng tác viên / đối tác</option></select></label>
    <label>Đối tác / cơ sở hợp tác<input value={form.partnerName} onChange={field('partnerName')} placeholder="VD: Karaoke ABC – Nhân viên A" disabled={form.sourceType!=='COLLAB'}/></label>
    <div className="span-2"><button className="button button-primary" type="submit">Tạo mã</button></div>
   </form>
  </section>
  <section className="card" style={{padding:16,overflowX:'auto'}}><h2>Danh sách mã ({codes.length})</h2><table><thead><tr><th>Mã</th><th>Phân loại</th><th>Chủ mã</th><th>Đối tác</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{codes.map(r=><tr key={r.code}><td><b>{r.code}</b></td><td>{r.sourceType==='COLLAB'?'CTV/Đối tác':'User'}</td><td>{r.ownerName||r.ownerPhone||r.ownerUserId}</td><td>{r.partnerName||'—'}</td><td>{r.status}</td><td><button type="button" className="button button-small" onClick={()=>changeStatus(r)}>{r.status==='ACTIVE'?'Ngừng mã':'Kích hoạt'}</button></td></tr>)}</tbody></table></section>
  <section className="card" style={{padding:16,overflowX:'auto'}}><h2>Lượt nhập mã & phát thưởng ({redemptions.length})</h2><p style={{color:'#77808c'}}>Nguồn ứng dụng được xác định bằng tài khoản đăng nhập trên Backend, không do trình duyệt tự khai.</p>
   <table><thead><tr><th>Mã / đối tác</th><th>Người dùng mã</th><th>Nhập từ</th><th>Chủ mã</th><th>Trạng thái</th><th>Thưởng chủ mã</th></tr></thead>
   <tbody>{redemptions.map(r=>{const v=reward[r.id]||{kind:'POINTS',points:20,discountVnd:50000};const change=(key,value)=>setReward(x=>({...x,[r.id]:{...v,[key]:value}}));return <tr key={r.id}>
    <td><b>{r.code}</b><small style={{display:'block'}}>{r.partnerName||r.sourceType}</small></td>
    <td>{r.usedByName||'—'}<small style={{display:'block'}}>{r.usedByPhone||r.usedByUserId}</small></td>
    <td><b>{r.sourceApp}</b></td><td>{r.ownerName||r.ownerUserId}</td><td>{r.status==='REWARDED'?'Đã thưởng':'Chờ đủ điều kiện'}</td>
    <td>{r.status==='REWARDED'?'Hoàn tất':<div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
      <select aria-label="Loại thưởng" value={v.kind} onChange={e=>change('kind',e.target.value)}><option value="POINTS">Điểm User</option><option value="COUPON">Voucher riêng</option></select>
      <input aria-label="Giá trị thưởng" type="number" min="1" style={{width:105}} value={v.kind==='POINTS'?v.points:v.discountVnd} onChange={e=>change(v.kind==='POINTS'?'points':'discountVnd',Number(e.target.value))}/>
      <button type="button" className="button button-primary button-small" onClick={()=>issue(r)}>Duyệt thưởng</button>
    </div>}</td>
   </tr>})}</tbody></table>
  </section>
 </div>;
}
