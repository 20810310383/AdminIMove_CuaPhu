import AdminOverlayPortal from './AdminOverlayPortal.jsx';
import React from 'react';
import { RefreshCw, Search, Route, WalletCards, Tag, Clock3, Eye, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { coreApiRequest } from './coreApi.js';
import { safeDisplay, numberValue } from './uiModel.js';
import { money, normalizeServiceCode } from './analyticsModel.js';
import { PageEmpty, PageError, PageLoading } from './AdminPageState.jsx';
import TripOperationsMap from './TripOperationsMap.jsx';

const ARCHIVABLE = new Set(['NO_DRIVER','EXPIRED','CANCELLED','CANCELLED_BY_DRIVER','CANCELLED_BY_USER','FAILED']);
function time(v) { if (!v) return '—'; const d = new Date(v); return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('vi-VN'); }
function serviceLabel(v) { const s=normalizeServiceCode(v); return s==='UNKNOWN'?'Không xác định':s; }

export default function TripsPage() {
  const [rows,setRows]=React.useState([]);
  const [query,setQuery]=React.useState('');
  const [status,setStatus]=React.useState('ALL');
  const [service,setService]=React.useState('ALL');
  const [archived,setArchived]=React.useState(false);
  const [selected,setSelected]=React.useState(null);
  const [loading,setLoading]=React.useState(true);
  const [error,setError]=React.useState('');
  const [reason,setReason]=React.useState('');
  const [confirmCode,setConfirmCode]=React.useState('');
  const [working,setWorking]=React.useState(false);
  const [actionError,setActionError]=React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({limit:'200',archived:String(archived)});
      if (query.trim()) params.set('q',query.trim());
      if (status!=='ALL') params.set('status',status);
      const data = await coreApiRequest(`/api/v7/admin/bookings?${params}`);
      setRows(Array.isArray(data)?data:[]);
    } catch(e) { setError(e.message||String(e)); }
    finally { setLoading(false); }
  },[query,status,archived]);
  React.useEffect(()=>{load();},[load]);

  const visible=rows.filter(r=>service==='ALL'||normalizeServiceCode(r)===service);
  const services=[...new Set(rows.map(normalizeServiceCode).filter(x=>x!=='UNKNOWN'))];

  async function open(row) {
    setSelected({row,loading:true});setReason('');setConfirmCode('');setActionError('');
    try {
      const data=await coreApiRequest(`/api/v7/admin/bookings/${encodeURIComponent(row.id)}`);
      setSelected({row,data,loading:false});
    } catch(e) { setSelected({row,error:e.message,loading:false}); }
  }

  async function archiveOrRestore() {
    if(!selected?.row||working)return;
    const trip=selected.row;
    if(!archived && (reason.trim().length<10 || confirmCode!==String(trip.code||trip.id))) {
      setActionError('Nhập lý do ít nhất 10 ký tự và nhập lại chính xác mã chuyến để xác nhận.');return;
    }
    setWorking(true);setActionError('');
    try {
      await coreApiRequest(`/api/v7/admin/bookings/${encodeURIComponent(trip.id)}/${archived?'restore':'archive'}`,{
        method:'POST',body:JSON.stringify(archived?{}:{reason:reason.trim()}),
      });
      setSelected(null);setReason('');setConfirmCode('');await load();
    } catch(e) { setActionError(e.message||String(e)); }
    finally { setWorking(false); }
  }

  if(loading&&!rows.length)return <PageLoading text="Đang tải chuyến xe..."/>;
  if(error&&!rows.length)return <PageError message={error} onRetry={load}/>;

  const trip = selected?.data?.booking || {};
  const canArchive = selected && !archived && ARCHIVABLE.has(String(trip.status||selected.row.status).toUpperCase()) &&
    !trip.driverId && !trip.assignedAt && !trip.startedAt && !trip.completedAt;

  return <section className="enterprise-page">
    <header className="enterprise-page-head"><div><span className="enterprise-eyebrow">TRIP OPERATIONS</span><h1>Chuyến xe</h1><p>Tra cứu chuyến xe, lịch sử, công nợ và lưu trữ chuyến lỗi an toàn.</p></div><button className="button" onClick={load}><RefreshCw size={15}/>Làm mới</button></header>
    <section className="card enterprise-panel">
      <div className="enterprise-toolbar">
        <label className="enterprise-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()} placeholder="Mã chuyến, điểm đón, điểm đến..."/></label>
        <select value={status} onChange={e=>setStatus(e.target.value)}><option value="ALL">Tất cả trạng thái</option>{['SEARCHING','OFFERED','NO_DRIVER','EXPIRED','DRIVER_ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED','FAILED'].map(s=><option key={s}>{s}</option>)}</select>
        <select value={service} onChange={e=>setService(e.target.value)}><option value="ALL">Tất cả dịch vụ</option>{services.map(s=><option key={s}>{s}</option>)}</select>
        <label style={{display:'inline-flex',alignItems:'center',gap:7,whiteSpace:'nowrap',fontSize:12}}><input type="checkbox" checked={archived} onChange={e=>setArchived(e.target.checked)}/> Đã lưu trữ</label>
        <button className="button" onClick={load}>Tìm</button>
      </div>
      {error&&<p role="alert" style={{color:'#b91c1c',padding:10}}>{error}</p>}
      <div className="enterprise-table-wrap"><table><thead><tr><th>Mã chuyến</th><th>Dịch vụ</th><th>Trạng thái</th><th>Điểm đón → điểm đến</th><th>Thanh toán</th><th>Đối soát</th><th>Thời gian</th><th>Chi tiết</th></tr></thead><tbody>
      {visible.map(r=><tr key={r.id} className="clickable-row" onClick={()=>open(r)}>
        <td><b>{safeDisplay(r.code||r.id)}</b></td><td>{serviceLabel(r)}</td><td><span className={`v14-status ${String(r.status).toUpperCase()==='COMPLETED'?'success':'pending'}`}>{safeDisplay(r.status)}</span></td>
        <td><b>{safeDisplay(r.pickup)}</b><small className="v14-subline">→ {safeDisplay(r.destination)}</small></td>
        <td>{safeDisplay(r.paymentStatus)}</td><td>{safeDisplay(r.settlementStatus||r.settlementV140?.status||r.settlementV133?.status,'PENDING')}</td><td>{time(r.createdAt)}</td>
        <td><button className="button" onClick={e=>{e.stopPropagation();open(r);}}><Eye size={14}/> Xem</button></td>
      </tr>)}</tbody></table></div>{!visible.length&&<PageEmpty/>}
    </section>
    {selected&&<AdminOverlayPortal><div className="enterprise-drawer-backdrop" onMouseDown={()=>!working&&setSelected(null)}>
      <aside className="enterprise-drawer wide" role="dialog" aria-modal="true" onMouseDown={e=>e.stopPropagation()}>
        <header><div><span className="enterprise-eyebrow">TRIP DETAIL</span><h2>{safeDisplay(selected.row.code||selected.row.id)}</h2></div><button className="icon-button" onClick={()=>setSelected(null)} aria-label="Đóng">×</button></header>
        {selected.loading?<PageLoading/>:selected.error?<PageError message={selected.error}/>:<>
          <TripOperationsMap trips={[{...trip,id:selected.row.code||selected.row.id,pickup:selected.row.pickup,destination:selected.row.destination}]}/>
          <div className="enterprise-detail-grid">
            <div><span>Dịch vụ</span><b><Route size={15}/>{serviceLabel(trip)}</b></div>
            <div><span>Trạng thái</span><b>{safeDisplay(trip.status)}</b></div>
            <div><span>Thanh toán</span><b><WalletCards size={15}/>{safeDisplay(trip.paymentStatus)}</b></div>
            <div><span>Đối soát</span><b><Tag size={15}/>{safeDisplay(trip.settlementStatus||trip.settlementV140?.status||trip.settlementV133?.status,'PENDING')}</b></div>
            <div><span>Tổng cước</span><b>{money(numberValue(trip.pricing?.customerTotal??selected.row.customerTotal,0))}</b></div>
            <div><span>Thời gian tạo</span><b>{time(trip.createdAt)}</b></div>
          </div>
          <section className="enterprise-subsection"><h3>Người tham gia</h3><div>Khách: {safeDisplay(selected.data?.customer?.fullName)} · {safeDisplay(selected.data?.customer?.phone)}</div><div>Tài xế: {safeDisplay(selected.data?.driver?.fullName)} · {safeDisplay(selected.data?.driver?.phone)}</div><div>Phương tiện: {safeDisplay(selected.data?.vehicle?.plateNumber)}</div></section>
          <section className="enterprise-subsection"><h3>Dòng tiền liên quan</h3>{(selected.data?.financials||[]).map(t=><div className="enterprise-list-row" key={t.id}><b>{safeDisplay(t.type||t.title)}</b><span>{money(t.amount||0)} · {safeDisplay(t.status)}</span></div>)}{!(selected.data?.financials||[]).length&&<p>Không tìm thấy giao dịch ví trong dữ liệu chi tiết.</p>}</section>
          <section className="enterprise-subsection"><h3>Timeline</h3>{(selected.data?.events||[]).map(e=><div className="enterprise-list-row" key={e.id}><span><b>{safeDisplay(e.type)}</b><small><Clock3 size={11}/>{time(e.createdAt)}</small></span></div>)}{!(selected.data?.events||[]).length&&<PageEmpty/>}</section>
          <section className="enterprise-subsection" style={{borderTop:'1px solid #e5e7eb',paddingTop:14}}>
            <h3>{archived?'Khôi phục chuyến đã lưu trữ':'Xử lý chuyến lỗi'}</h3>
            {archived?<><p>Lý do lưu trữ: {safeDisplay(trip.adminArchiveReason)}</p><button className="button" disabled={working} onClick={archiveOrRestore}><RotateCcw size={15}/> Khôi phục hiển thị</button></>
            :canArchive?<>
              <p><AlertTriangle size={15} style={{verticalAlign:'middle'}}/> Xóa khỏi danh sách chỉ là <b>lưu trữ mềm</b>. Không xóa lịch sử, ví, payment, sự kiện hoặc bản ghi tài chính.</p>
              <label>Lý do lưu trữ (ít nhất 10 ký tự)<textarea rows="3" style={{display:'block',width:'100%',padding:10,border:'1px solid #d1d5db',borderRadius:8}} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Ví dụ: chuyến thử nghiệm lỗi tọa độ, không có tài xế..."/></label>
              <label style={{display:'block',marginTop:10}}>Nhập lại mã chuyến để xác nhận<input style={{display:'block',width:'100%',padding:10,border:'1px solid #d1d5db',borderRadius:8}} value={confirmCode} onChange={e=>setConfirmCode(e.target.value)} placeholder={String(selected.row.code||selected.row.id)}/></label>
              <button className="button" style={{marginTop:12,color:'#b91c1c'}} disabled={working||reason.trim().length<10||confirmCode!==String(selected.row.code||selected.row.id)} onClick={archiveOrRestore}><Trash2 size={15}/> Xóa khỏi danh sách (lưu trữ)</button>
            </>:<p>Không thể xóa nhanh chuyến đang xử lý, đã nhận tài xế hoặc đã hoàn thành. Đối soát dữ liệu công nợ trước khi xử lý.</p>}
            {actionError&&<p role="alert" style={{color:'#b91c1c'}}>{actionError}</p>}
          </section>
        </>}
      </aside>
    </div></AdminOverlayPortal>}
  </section>;
}
