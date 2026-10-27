import React from 'react';
import {Store, RefreshCw, ClipboardCheck, CheckCircle2, XCircle, FileText, Eye, Search, ShieldCheck, X, Clock3, AlertTriangle, ExternalLink} from 'lucide-react';
import {coreApiRequest} from './coreApi.js';
import {adminAccessToken, hasPermission} from './adminApi.js';
import {coreUrl} from './apiRuntime.js';
import AdminOverlayPortal from './AdminOverlayPortal.jsx';
import './merchants-review.css';

const ROOT='/api/v16/admin/commerce/merchants';
const docNames={ID_FRONT:'Ảnh giấy tờ chủ cửa hàng',STOREFRONT:'Ảnh mặt tiền cửa hàng',BUSINESS_LICENSE:'Giấy phép kinh doanh (nếu có)'};
const states={PENDING:'Chờ duyệt',APPROVED:'Đã duyệt',REJECTED:'Từ chối'};
const operations={ACTIVE:'Đang mở',BUSY:'Đang bận',PAUSED:'Tạm nghỉ',SUSPENDED:'Đình chỉ',PENDING:'Chờ duyệt',REJECTED:'Từ chối'};
function reviewStatus(m){return String(m.approvalStatus||(['PENDING','REJECTED'].includes(m.status)?m.status:'APPROVED')).toUpperCase();}
function labelTime(value){if(!value)return '—';const d=new Date(value);return Number.isNaN(d.getTime())?'—':d.toLocaleString('vi-VN');}
function Badge({type}){return <span className={'mr-badge mr-'+String(type).toLowerCase()}>{states[type]||operations[type]||type}</span>}

export default function MerchantsPage({access}){
  const [rows,setRows]=React.useState([]),[search,setSearch]=React.useState(''),[tab,setTab]=React.useState('ALL');
  const [selected,setSelected]=React.useState(null),[reason,setReason]=React.useState('');
  const [busy,setBusy]=React.useState(false),[loading,setLoading]=React.useState(false),[error,setError]=React.useState(''),[modalError,setModalError]=React.useState('');
  const canApprove=hasPermission(access,'merchants.approve');
  const canManage=hasPermission(access,'merchants.manage');
  const load=React.useCallback(async()=>{setLoading(true);try{const x=await coreApiRequest(ROOT);setRows(x.merchants||[]);setError('')}catch(e){setError(e.message)}finally{setLoading(false)}},[]);
  React.useEffect(()=>{load()},[load]);
  const currentRows=rows.filter(r=>(tab==='ALL'||reviewStatus(r)===tab)&&`${r.name||''} ${r.phone||''} ${r.address||''}`.toLowerCase().includes(search.trim().toLowerCase()));
  const counts=React.useMemo(()=>({ALL:rows.length,PENDING:rows.filter(r=>reviewStatus(r)==='PENDING').length,APPROVED:rows.filter(r=>reviewStatus(r)==='APPROVED').length,REJECTED:rows.filter(r=>reviewStatus(r)==='REJECTED').length}),[rows]);
  async function openRecord(row){setModalError('');setReason('');try{const x=await coreApiRequest(`${ROOT}/${row._id}`);setSelected(x.merchant)}catch(e){setError(e.message)}}
  async function changeInfo(row,patch){if(!canManage)return;setBusy(true);setError('');try{await coreApiRequest(`${ROOT}/${row._id}`,{method:'PUT',body:JSON.stringify(patch)});await load()}catch(e){setError(e.message)}finally{setBusy(false)}}
  async function decide(decision){if(!selected||!canApprove||busy)return;if(decision==='REJECT'&&reason.trim().length<8){setModalError('Cần nhập lý do từ chối ít nhất 8 ký tự.');return}
    setBusy(true);setModalError('');try{await coreApiRequest(`${ROOT}/${selected._id}/review`,{method:'POST',body:JSON.stringify({decision,reason:reason.trim()})});setSelected(null);await load()}catch(e){setModalError(e.message)}finally{setBusy(false)}}
  async function openDoc(kind){
    if(!selected)return;
    setModalError('');
    try{
      const token=adminAccessToken();if(!token)throw new Error('Phiên Admin đã hết hạn.');
      const res=await fetch(coreUrl(`${ROOT}/${selected._id}/documents/${kind}`),{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
      if(!res.ok){const x=await res.json().catch(()=>({}));throw new Error(x.message||`HTTP ${res.status}`)}
      const blob=await res.blob(),url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download=`ho-so-${kind.toLowerCase()}.${blob.type==='image/png'?'png':blob.type==='image/webp'?'webp':'jpg'}`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
    }catch(e){setModalError(e.message)}
  }
  return <section className="v14-page mr-page">
    <header className="v14-page-head mr-title"><div><span className="v14-eyebrow">MERCHANT PLATFORM / KIỂM DUYỆT</span><h1>Hồ sơ nhà hàng & cửa hàng</h1><p>Kiểm tra giấy tờ, duyệt hoặc từ chối hồ sơ trước khi cho phép cửa hàng hoạt động trên iMove.</p></div><button className="button" disabled={loading} onClick={load}><RefreshCw size={15}/> {loading?'Đang tải...':'Làm mới'}</button></header>
    {error&&<div className="mr-alert"><AlertTriangle size={16}/>{error}</div>}
    <div className="mr-stats"><article><Clock3/><span>Chờ xử lý</span><strong>{counts.PENDING}</strong></article><article><CheckCircle2/><span>Đã duyệt</span><strong>{counts.APPROVED}</strong></article><article><XCircle/><span>Đã từ chối</span><strong>{counts.REJECTED}</strong></article><article><Store/><span>Tổng đối tác</span><strong>{counts.ALL}</strong></article></div>
    <div className="mr-toolbar"><div className="mr-tabs">{[['PENDING','Chờ duyệt'],['APPROVED','Đã duyệt'],['REJECTED','Từ chối'],['ALL','Tất cả']].map(([value,title])=><button key={value} className={tab===value?'on':''} onClick={()=>setTab(value)}>{title}<span>{counts[value]}</span></button>)}</div><label className="mr-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm tên, số điện thoại, địa chỉ..."/></label></div>
    <div className="card mr-table-card"><div className="mr-table-scroll"><table className="mr-table"><thead><tr><th>Đối tác</th><th>Phân loại</th><th>Hồ sơ</th><th>Hoạt động</th><th>Ngày đăng ký</th><th>Thao tác</th></tr></thead><tbody>{currentRows.map(r=>{const review=reviewStatus(r);return <tr key={r._id}><td><div className="mr-identity"><span className="mr-avatar"><Store size={18}/></span><div><strong>{r.name||'Chưa đặt tên'}</strong><small>{r.phone||'—'}</small><small>{r.address||'Chưa cập nhật địa chỉ'}</small></div></div></td><td><b>{r.merchantType==='STORE'?'Cửa hàng · Đặt hộ':'Nhà hàng · Food'}</b><small>{r.categoryName||'—'}</small></td><td><Badge type={review}/></td><td>{review==='APPROVED'?<select className="mr-select" value={['ACTIVE','BUSY','PAUSED','SUSPENDED'].includes(r.status)?r.status:'ACTIVE'} disabled={!canManage||busy} onChange={e=>changeInfo(r,{status:e.target.value})}>{Object.entries(operations).filter(([k])=>['ACTIVE','BUSY','PAUSED','SUSPENDED'].includes(k)).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>:<span className="mr-muted">Chưa thể nhận đơn</span>}</td><td>{labelTime(r.createdAt)}</td><td><button className="button mr-review-button" onClick={()=>openRecord(r)}><Eye size={15}/>{review==='PENDING'?'Xét duyệt hồ sơ':'Xem chi tiết'}</button></td></tr>})}</tbody></table></div>{!currentRows.length&&<div className="mr-empty"><ClipboardCheck size={30}/><b>Không có hồ sơ phù hợp</b><p>{loading?'Đang tải danh sách...':'Hãy thử bộ lọc khác hoặc chờ đối tác đăng ký mới.'}</p></div>}</div>
    {selected&&<AdminOverlayPortal><div className="mr-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setSelected(null)}}><section role="dialog" aria-modal="true" aria-label="Chi tiết xét duyệt cửa hàng" className="mr-modal"><header className="mr-modal-head"><div><span className="v14-eyebrow">KIỂM DUYỆT HỒ SƠ</span><h2>{selected.name}</h2><Badge type={reviewStatus(selected)}/></div><button className="mr-close" onClick={()=>setSelected(null)} disabled={busy} aria-label="Đóng"><X size={22}/></button></header><div className="mr-modal-body"><div className="mr-details"><div><span>Chủ sở hữu / Điện thoại</span><strong>{selected.ownerName?`${selected.ownerName} · `:''}{selected.phone||'—'}</strong></div><div><span>Phân loại</span><strong>{selected.merchantType==='STORE'?'Cửa hàng · Đặt hộ':'Nhà hàng · Food'}</strong></div><div className="wide"><span>Địa chỉ kinh doanh</span><strong>{selected.address||'Chưa cập nhật'}</strong></div><div><span>Ngày đăng ký</span><strong>{labelTime(selected.createdAt)}</strong></div><div><span>Lần xét duyệt gần nhất</span><strong>{labelTime(selected.reviewedAt)}</strong></div></div><h3><FileText size={17}/>Ảnh giấy tờ xác minh</h3><div className="mr-document-list">{Object.entries(docNames).map(([kind,name])=>{const d=selected.reviewDocuments?.[kind];return <div key={kind} className="mr-doc"><span className={d?'mr-doc-icon uploaded':'mr-doc-icon'}><FileText size={20}/></span><div><b>{name}</b><small>{d?`${d.originalName||'Ảnh'} · ${labelTime(d.uploadedAt)}`:'Chưa tải lên'}</small></div>{d&&canApprove&&<button className="button" onClick={()=>openDoc(kind)}><ExternalLink size={14}/>Tải xem</button>}</div>})}</div>
      {Array.isArray(selected.missingDocuments)&&selected.missingDocuments.length>0&&<div className="mr-alert"><AlertTriangle size={16}/><div><b>Hồ sơ chưa đầy đủ</b><span>{selected.missingDocuments.join(' · ')}</span></div></div>}
      {selected.reviewReason&&<div className="mr-rejection"><b>Lý do từ chối trước đó:</b> {selected.reviewReason}</div>}
      {reviewStatus(selected)==='PENDING'&&canApprove&&<><label className="mr-reason-label">Lý do từ chối (bắt buộc khi từ chối)<textarea rows={3} maxLength={500} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Ví dụ: Ảnh giấy tờ bị mờ, cần bổ sung địa chỉ kinh doanh..."/></label></>}
      {modalError&&<div className="mr-alert"><AlertTriangle size={15}/>{modalError}</div>}</div>
      <footer className="mr-modal-footer"><button className="button" onClick={()=>setSelected(null)} disabled={busy}>Đóng</button>{reviewStatus(selected)==='PENDING'&&canApprove&&<><button className="button mr-danger" disabled={busy} onClick={()=>decide('REJECT')}><XCircle size={16}/>Từ chối</button><button className="button mr-approve" disabled={busy||Boolean(selected.missingDocuments?.length)} onClick={()=>decide('APPROVE')}><ShieldCheck size={17}/>{busy?'Đang xử lý...':'Duyệt hồ sơ'}</button></>}</footer></section></div></AdminOverlayPortal>}
  </section>;
}
