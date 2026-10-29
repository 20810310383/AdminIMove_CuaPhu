import AdminOverlayPortal from './AdminOverlayPortal.jsx';
import React from 'react';
import { RefreshCw, Search, Star, Route, UserRound, ShieldAlert } from './adminPngLucide.jsx';
import { adminApiRequest } from './adminApi.js';
import { safeDisplay, numberValue } from './uiModel.js';
import { PageEmpty, PageError, PageLoading } from './AdminPageState.jsx';

function idOf(row){return String(row?._id?.$oid||row?._id||row?.id||'')}
export default function CustomersPage(){
  const [customers,setCustomers]=React.useState([]);const [trips,setTrips]=React.useState([]);const [saving,setSaving]=React.useState(false);const [actionError,setActionError]=React.useState('');const [query,setQuery]=React.useState('');const [selected,setSelected]=React.useState(null);const [loading,setLoading]=React.useState(true);const [error,setError]=React.useState('');
  const load=React.useCallback(async()=>{setLoading(true);setError('');try{const [c,t]=await Promise.all([adminApiRequest('/data/customers'),adminApiRequest('/data/trips')]);setCustomers(Array.isArray(c)?c:[]);setTrips(Array.isArray(t)?t:[])}catch(e){setError(e.message||String(e))}finally{setLoading(false)}},[]);React.useEffect(()=>{load()},[load]);
  const visible=customers.filter(c=>`${c.fullName||c.name||''} ${c.phone||''} ${c.email||''}`.toLowerCase().includes(query.toLowerCase()));
  function customerTrips(c){const id=idOf(c);return trips.filter(t=>String(t.customerId||t.customer?.id||'')===id||String(t.customerPhone||t.customerSnapshot?.phone||'')===String(c.phone||''))}
  async function setLock(locked){
    if(!selected||saving)return;
    const id=idOf(selected);if(!id)return;
    const reason=locked?window.prompt('Lý do khóa tài khoản (ít nhất 10 ký tự):',''):'';
    if(locked&&(reason===null||reason.trim().length<10)){if(reason!==null)setActionError('Cần nhập lý do tối thiểu 10 ký tự.');return;}
    if(!window.confirm(locked?'Khóa tài khoản và thu hồi phiên đăng nhập?':'Mở khóa tài khoản?'))return;
    setSaving(true);setActionError('');
    try{const result=await adminApiRequest(`/users/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify({status:locked?'BLOCKED':'ACTIVE',reason:reason?.trim()||''})});
      setSelected(result);await load();
    }catch(e){setActionError(e.message||String(e));}finally{setSaving(false);}
  }
  async function deleteCustomer(){
    if(!selected||saving)return;const id=idOf(selected);
    const confirmation=window.prompt(`Chỉ xóa khi chưa có lịch sử giao dịch. Nhập số điện thoại ${selected.phone||''} để xác nhận:`,'');
    if(confirmation===null||confirmation!==String(selected.phone||''))return;
    setSaving(true);setActionError('');
    try{await adminApiRequest(`/users/${encodeURIComponent(id)}`,{method:'DELETE'});setSelected(null);await load();}
    catch(e){setActionError(e.message||String(e));}finally{setSaving(false);}
  }
  if(loading&&!customers.length)return <PageLoading text="Đang tải khách hàng..."/>;if(error&&!customers.length)return <PageError message={error} onRetry={load}/>;
  return <section className="enterprise-page"><header className="enterprise-page-head"><div><span className="enterprise-eyebrow">CUSTOMER MANAGEMENT</span><h1>Khách hàng</h1><p>Thông tin tài khoản, điểm, lịch sử chuyến và cờ rủi ro từ dữ liệu MongoDB.</p></div><button className="button" onClick={load}><RefreshCw size={15}/>Làm mới</button></header>{error&&<div className="v73-alert">{error}</div>}
    <section className="card enterprise-panel"><div className="enterprise-toolbar"><label className="enterprise-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm tên, SĐT, email..."/></label><span>{visible.length} khách hàng</span></div><div className="enterprise-table-wrap"><table><thead><tr><th>Khách hàng</th><th>Liên hệ</th><th>Điểm hiện tại</th><th>Tổng chuyến</th><th>Trạng thái</th><th></th></tr></thead><tbody>{visible.map(c=>{const rows=customerTrips(c);return <tr key={idOf(c)||c.phone}><td><b>{safeDisplay(c.fullName||c.name)}</b><small className="v14-subline"><UserRound size={12}/>{idOf(c).slice(-8)||'—'}</small></td><td>{safeDisplay(c.phone)}<small className="v14-subline">{safeDisplay(c.email)}</small></td><td><b>{numberValue(c.points??c.loyaltyPoints??c.pointBalance,0)}</b></td><td>{rows.length}</td><td><span className={`v14-status ${String(c.status||'ACTIVE').toUpperCase()==='ACTIVE'?'success':'pending'}`}>{safeDisplay(c.status,'ACTIVE')}</span></td><td><button className="button button-small" onClick={()=>{setActionError('');setSelected(c)}}>Chi tiết</button></td></tr>})}</tbody></table></div>{!visible.length&&<PageEmpty title="Không tìm thấy khách hàng"/>}</section>
    {selected&&<AdminOverlayPortal><div className="enterprise-drawer-backdrop" onMouseDown={()=>setSelected(null)}><aside className="enterprise-drawer" role="dialog" aria-modal="true" onMouseDown={e=>e.stopPropagation()}><header><div><span className="enterprise-eyebrow">CUSTOMER DETAIL</span><h2>{safeDisplay(selected.fullName||selected.name)}</h2></div><button className="icon-button" onClick={()=>setSelected(null)}>×</button></header><div className="enterprise-detail-grid"><div><span>Điểm hiện tại</span><b><Star size={15}/>{numberValue(selected.points??selected.loyaltyPoints??selected.pointBalance,0)}</b></div><div><span>Tổng chuyến</span><b><Route size={15}/>{customerTrips(selected).length}</b></div><div><span>Risk flags</span><b><ShieldAlert size={15}/>{Array.isArray(selected.riskFlags)?selected.riskFlags.length:0}</b></div></div><section className="enterprise-subsection"><h3>Thông tin tài khoản</h3>
      <p><b>Điện thoại:</b> {safeDisplay(selected.phone)} · <b>Email:</b> {safeDisplay(selected.email)}</p>
      <p><b>Mã giới thiệu:</b> {safeDisplay(selected.phone)} (SĐT đăng ký)</p>
      <p><b>Trạng thái:</b> {safeDisplay(selected.status,'ACTIVE')}{selected.lockReason&&<span style={{color:'#b91c1c'}}> · Lý do: {selected.lockReason}</span>}</p>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
       <button className="button" disabled={saving} onClick={()=>setLock(String(selected.status).toUpperCase()!=='BLOCKED')}>{String(selected.status).toUpperCase()==='BLOCKED'?'Mở khóa':'Khóa tài khoản'}</button>
       <button className="button" style={{color:'#b91c1c'}} disabled={saving} onClick={deleteCustomer}>Xóa tài khoản (nếu chưa phát sinh giao dịch)</button>
      </div>
      {actionError&&<p role="alert" style={{color:'#b91c1c'}}>{actionError}</p>}
      </section><section className="enterprise-subsection"><h3>Lịch sử chuyến</h3>{customerTrips(selected).slice(0,30).map(t=><div className="enterprise-list-row" key={String(t._id||t.id)}><span><b>{safeDisplay(t.bookingCode||t.code||t._id)}</b><small>{safeDisplay(t.serviceCode||t.service)}</small></span><strong>{safeDisplay(t.status)}</strong></div>)}{!customerTrips(selected).length&&<PageEmpty/>}</section></aside></div></AdminOverlayPortal>}
  </section>;
}
