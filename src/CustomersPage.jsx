import AdminOverlayPortal from './AdminOverlayPortal.jsx';
import React from 'react';
import { RefreshCw, Search, Star, Route, UserRound, ShieldAlert } from './adminPngLucide.jsx';
import { adminApiRequest } from './adminApi.js';
import { safeDisplay, numberValue } from './uiModel.js';
import { PageEmpty, PageError, PageLoading } from './AdminPageState.jsx';

function idOf(row){return String(row?._id?.$oid||row?._id||row?.id||'')}
export default function CustomersPage(){
  const [customers,setCustomers]=React.useState([]);const [trips,setTrips]=React.useState([]);const [query,setQuery]=React.useState('');const [selected,setSelected]=React.useState(null);const [deleting,setDeleting]=React.useState(false);const [loading,setLoading]=React.useState(true);const [error,setError]=React.useState('');
  const load=React.useCallback(async()=>{setLoading(true);setError('');try{const [c,t]=await Promise.all([adminApiRequest('/data/customers'),adminApiRequest('/data/trips')]);setCustomers(Array.isArray(c)?c:[]);setTrips(Array.isArray(t)?t:[])}catch(e){setError(e.message||String(e))}finally{setLoading(false)}},[]);React.useEffect(()=>{load()},[load]);
  const visible=customers.filter(c=>`${c.fullName||c.name||''} ${c.phone||''} ${c.email||''}`.toLowerCase().includes(query.toLowerCase()));
  function customerTrips(c){const id=idOf(c);return trips.filter(t=>String(t.customerId||t.customer?.id||'')===id)}
  async function deleteCustomer() {
    if(!selected || deleting)return;
    const reason = window.prompt('Nhập lý do xóa mềm tài khoản (ít nhất 10 ký tự):','Khách hàng yêu cầu xóa tài khoản');
    if(reason === null)return;
    if(reason.trim().length < 10){setError('Vui lòng nêu lý do xóa ít nhất 10 ký tự.');return;}
    if(!window.confirm('Đóng tài khoản này? Lịch sử chuyến sẽ được giữ riêng và số điện thoại có thể đăng ký tài khoản mới. Không khôi phục tài khoản cũ.'))return;
    setDeleting(true);setError('');
    try {
      await adminApiRequest(`/users/${idOf(selected)}`,{method:'DELETE',body:JSON.stringify({reason:reason.trim()})});
      setSelected(null);
      await load();
    } catch(e) { setError(e.message||String(e)); }
    finally { setDeleting(false); }
  }
  if(loading&&!customers.length)return <PageLoading text="Đang tải khách hàng..."/>;if(error&&!customers.length)return <PageError message={error} onRetry={load}/>;
  return <section className="enterprise-page"><header className="enterprise-page-head"><div><span className="enterprise-eyebrow">CUSTOMER MANAGEMENT</span><h1>Khách hàng</h1><p>Thông tin tài khoản, điểm, lịch sử chuyến và cờ rủi ro từ dữ liệu MongoDB.</p></div><button className="button" onClick={load}><RefreshCw size={15}/>Làm mới</button></header>{error&&<div className="v73-alert">{error}</div>}
    <section className="card enterprise-panel"><div className="enterprise-toolbar"><label className="enterprise-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm tên, SĐT, email..."/></label><span>{visible.length} khách hàng</span></div><div className="enterprise-table-wrap"><table><thead><tr><th>Khách hàng</th><th>Liên hệ</th><th>Điểm hiện tại</th><th>Tổng chuyến</th><th>Trạng thái</th><th></th></tr></thead><tbody>{visible.map(c=>{const rows=customerTrips(c);return <tr key={idOf(c)||c.phone}><td><b>{safeDisplay(c.fullName||c.name)}</b><small className="v14-subline"><UserRound size={12}/>{idOf(c).slice(-8)||'—'}</small></td><td>{safeDisplay(c.phone)}<small className="v14-subline">{safeDisplay(c.email)}</small></td><td><b>{numberValue(c.points??c.loyaltyPoints??c.pointBalance,0)}</b></td><td>{rows.length}</td><td><span className={`v14-status ${String(c.status||'ACTIVE').toUpperCase()==='ACTIVE'?'success':'pending'}`}>{safeDisplay(c.status,'ACTIVE')}</span></td><td><button className="button button-small" onClick={()=>setSelected(c)}>Chi tiết</button></td></tr>})}</tbody></table></div>{!visible.length&&<PageEmpty title="Không tìm thấy khách hàng"/>}</section>
    {selected&&<AdminOverlayPortal><div className="enterprise-drawer-backdrop" onMouseDown={()=>setSelected(null)}><aside className="enterprise-drawer" role="dialog" aria-modal="true" onMouseDown={e=>e.stopPropagation()}><header><div><span className="enterprise-eyebrow">CUSTOMER DETAIL</span><h2>{safeDisplay(selected.fullName||selected.name)}</h2></div><button className="icon-button" onClick={()=>setSelected(null)}>×</button></header><div className="enterprise-detail-grid"><div><span>Điểm hiện tại</span><b><Star size={15}/>{numberValue(selected.points??selected.loyaltyPoints??selected.pointBalance,0)}</b></div><div><span>Tổng chuyến</span><b><Route size={15}/>{customerTrips(selected).length}</b></div><div><span>Risk flags</span><b><ShieldAlert size={15}/>{Array.isArray(selected.riskFlags)?selected.riskFlags.length:0}</b></div></div><section className="enterprise-subsection"><h3>Lịch sử chuyến</h3>{customerTrips(selected).slice(0,30).map(t=><div className="enterprise-list-row" key={String(t._id||t.id)}><span><b>{safeDisplay(t.bookingCode||t.code||t._id)}</b><small>{safeDisplay(t.serviceCode||t.service)}</small></span><strong>{safeDisplay(t.status)}</strong></div>)}{!customerTrips(selected).length&&<PageEmpty/>}</section><section className="enterprise-subsection"><h3>Quản lý tài khoản</h3><p>Xóa mềm sẽ thu hồi phiên đăng nhập, giải phóng SĐT và giữ lịch sử giao dịch theo mã tài khoản cũ.</p><button className="button" disabled={deleting} onClick={deleteCustomer} style={{color:'#b91c1c',borderColor:'#b91c1c'}}>{deleting?'Đang xử lý…':'Xóa mềm tài khoản'}</button>{error&&<p role="alert" style={{color:'#b91c1c'}}>{error}</p>}</section></aside></div></AdminOverlayPortal>}
  </section>;
}
