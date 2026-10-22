import React from 'react';
import { Store, RefreshCw, Search, ClipboardCheck, Eye, CheckCircle2, XCircle, Clock3, AlertTriangle, X, ShieldCheck } from 'lucide-react';
import { coreApiRequest } from './coreApi.js';
import AdminOverlayPortal from './AdminOverlayPortal.jsx';
import './merchant-approval-v24.css';

const BASE = '/api/v16/admin/commerce/merchants';
const statusText = {
  APPROVED: 'Đã duyệt', PENDING_REVIEW: 'Chờ duyệt', REJECTED: 'Từ chối',
  ACTIVE: 'Hoạt động', BUSY: 'Đang bận', PAUSED: 'Tạm nghỉ', SUSPENDED: 'Tạm khóa',
  PENDING: 'Chưa hoạt động', OPEN: 'Đang mở cửa',
};
function approvalOf(x) {
  const v = String(x?.approvalStatus || '').toUpperCase();
  if (v === 'APPROVED' || v === 'REJECTED') return v;
  if (v === 'PENDING' || v === 'PENDING_REVIEW') return 'PENDING_REVIEW';
  // Existing stores already ACTIVE prior to introducing approvalStatus remain operational.
  return ['ACTIVE', 'OPEN', 'BUSY', 'PAUSED'].includes(String(x?.status || '').toUpperCase()) ? 'APPROVED' : 'PENDING_REVIEW';
}
function dateText(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('vi-VN');
}
function Modal({ onClose, children }) {
  React.useEffect(() => {
    const onEscape = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [onClose]);
  return <AdminOverlayPortal><div className="merchant-review-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="v14-modal merchant-review-dialog" role="dialog" aria-modal="true" aria-labelledby="merchant-review-title">
      {children}
    </section>
  </div></AdminOverlayPortal>;
}
export default function MerchantsPage() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [filter, setFilter] = React.useState('ALL');
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState(null);
  const [detail, setDetail] = React.useState(null);
  const [detailError, setDetailError] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [decision, setDecision] = React.useState(null);
  const requestId = React.useRef(0);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const x = await coreApiRequest(BASE);
      setRows(Array.isArray(x.merchants) ? x.merchants : []);
      setError('');
    } catch (e) { setError(e.message || 'Không tải được danh sách đối tác.'); }
    finally { setLoading(false); }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const openReview = React.useCallback(async (row) => {
    const id = ++requestId.current;
    setSelected(row); setDetail(null); setReason(''); setDecision(null); setDetailError('');
    try {
      const info = await coreApiRequest(`${BASE}/${encodeURIComponent(row._id)}/review`);
      if (id === requestId.current) setDetail(info);
    } catch (e) {
      if (id === requestId.current) setDetailError(e.message || 'Không đọc được hồ sơ.');
    }
  }, []);
  const closeReview = React.useCallback(() => {
    if (saving) return;
    requestId.current += 1; setSelected(null); setDetail(null); setDecision(null);
  }, [saving]);

  async function patchMerchant(row, data) {
    setSaving(true); setError(''); setNotice('');
    try {
      await coreApiRequest(`${BASE}/${encodeURIComponent(row._id)}`, { method: 'PUT', body: JSON.stringify(data) });
      setNotice('Đã cập nhật thông tin cửa hàng.'); await load();
    } catch (e) { setError(e.message || 'Không thể cập nhật cửa hàng.'); }
    finally { setSaving(false); }
  }
  async function submitReview() {
    if (!selected || !decision || saving) return;
    if (decision === 'REJECT' && reason.trim().length < 10) {
      setDetailError('Lý do từ chối cần ít nhất 10 ký tự.'); return;
    }
    setSaving(true); setDetailError(''); setError(''); setNotice('');
    try {
      const result = await coreApiRequest(`${BASE}/${encodeURIComponent(selected._id)}/review`, { method: 'POST', body: JSON.stringify({ action: decision, reason: reason.trim() }) });
      setNotice(result.message || 'Đã cập nhật trạng thái hồ sơ.');
      requestId.current += 1; setSelected(null); setDetail(null); setDecision(null);
      await load();
    } catch (e) { setDetailError(e.message || 'Không thể duyệt hồ sơ.'); }
    finally { setSaving(false); }
  }

  const counts = React.useMemo(() => rows.reduce((acc, x) => {
    acc.ALL++;
    acc[approvalOf(x)]++;
    return acc;
  }, {ALL:0,APPROVED:0,PENDING_REVIEW:0,REJECTED:0}), [rows]);
  const visible = rows.filter(x => (filter === 'ALL' || approvalOf(x) === filter) &&
    `${x.name || ''} ${x.address || ''} ${x.phone || ''}`.toLowerCase().includes(query.trim().toLowerCase()));
  const current = detail?.merchant || selected;
  const currentApproval = approvalOf(current);
  const merchantType = x => x.merchantType === 'STORE' || x.categoryCode === 'ERRAND' ? 'STORE' : 'RESTAURANT';

  return <section className="v14-page merchant-approval-page">
    <header className="v14-page-head">
      <div><span className="v14-eyebrow">MERCHANT APPROVAL CENTER</span><h1>Nhà hàng & Cửa hàng</h1><p>Quản lý hồ sơ đăng ký đối tác, duyệt/từ chối độc lập với trạng thái kinh doanh.</p></div>
      <button className="button" onClick={load} disabled={loading}><RefreshCw size={15} /> Làm mới</button>
    </header>
    {error && <div className="v73-alert" role="alert">{error}</div>}
    {notice && <div className="merchant-approval-notice" role="status">{notice}</div>}
    <div className="merchant-approval-metrics">
      {[['ALL','Tổng đối tác'],['PENDING_REVIEW','Chờ duyệt'],['APPROVED','Đã duyệt'],['REJECTED','Từ chối']].map(([code,label]) => <button type="button" key={code} className={`merchant-approval-metric ${filter===code?'active':''}`} onClick={()=>setFilter(code)} aria-pressed={filter===code}>
        <span>{label}</span><strong>{counts[code]}</strong>
      </button>)}
    </div>
    <section className="card v14-panel merchant-approval-panel">
      <div className="merchant-approval-toolbar"><label><Search size={17} /><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm tên, số điện thoại, địa chỉ..." aria-label="Tìm cửa hàng" /></label><span>{visible.length} kết quả</span></div>
      <div className="v14-table-wrap"><table className="merchant-approval-table"><thead><tr><th>Đối tác</th><th>Phân loại</th><th>Nhóm</th><th>Duyệt hồ sơ</th><th>Hoạt động</th><th>Hoa hồng</th><th>Thao tác</th></tr></thead><tbody>
        {visible.map(x => {
          const approval=approvalOf(x);
          return <tr key={x._id}><td><div className="v163-merchant-cell">{x.logoUrl?<img src={x.logoUrl} alt="" />:<span><Store size={18}/></span>}<div><b>{x.name || 'Chưa đặt tên'}</b><small className="v14-subline">{x.address||'Chưa có địa chỉ'}</small><small className="v14-subline">{x.phone||''}</small></div></div></td>
            <td><select aria-label={`Phân loại ${x.name}`} disabled={saving} value={merchantType(x)} onChange={e=>patchMerchant(x,{merchantType:e.target.value,merchantTypeLabel:e.target.value==='RESTAURANT'?'Nhà hàng · Food':'Cửa hàng · Đặt hộ',categoryCode:e.target.value==='RESTAURANT'?'FOOD':'ERRAND'})}><option value="RESTAURANT">Nhà hàng · Food</option><option value="STORE">Cửa hàng · Mua hộ</option></select></td>
            <td>{x.categoryName||'—'}</td>
            <td><span className={`merchant-approval-pill ${approval.toLowerCase()}`}>{statusText[approval]}</span></td>
            <td><span className="merchant-trade-status">{statusText[x.status]||x.status||'—'}</span></td>
            <td>{Number(x.commissionRate||0)}%</td>
            <td><div className="merchant-review-actions"><button type="button" className="button" onClick={()=>openReview(x)}><Eye size={15}/> Xem hồ sơ</button>
              <select aria-label={`Trạng thái kinh doanh ${x.name}`} disabled={saving||approval!=='APPROVED'} value={['ACTIVE','OPEN','BUSY','PAUSED','SUSPENDED'].includes(x.status)?x.status:'PENDING'} onChange={e=>patchMerchant(x,{status:e.target.value})}>
                {approval!=='APPROVED'&&<option value="PENDING">Chưa duyệt</option>}
                {approval==='APPROVED'&&<><option value="ACTIVE">ACTIVE</option><option value="OPEN">OPEN</option><option value="BUSY">BUSY</option><option value="PAUSED">PAUSED</option><option value="SUSPENDED">SUSPENDED</option></>}
              </select>
            </div></td></tr>;
        })}
      </tbody></table></div>
      {!visible.length && <div className="merchant-approval-empty">{loading?'Đang tải danh sách...':'Không có hồ sơ phù hợp.'}</div>}
    </section>
    {selected && <Modal onClose={closeReview}>
      <header className="merchant-review-head"><div><span className="v14-eyebrow">THẨM ĐỊNH ĐỐI TÁC</span><h2 id="merchant-review-title">{current?.name||'Hồ sơ cửa hàng'}</h2><span className={`merchant-approval-pill ${currentApproval.toLowerCase()}`}>{statusText[currentApproval]}</span></div><button className="merchant-review-close" title="Đóng" onClick={closeReview} disabled={saving}><X size={20}/></button></header>
      <main className="merchant-review-content">
        {detailError && <div className="merchant-review-error" role="alert">{detailError}</div>}
        {!detail ? (detailError ? <p>Không tải được hồ sơ, vui lòng đóng và mở lại.</p> : <p>Đang lấy hồ sơ...</p>) : <>
          <div className="merchant-review-grid">
            {[['Tên cửa hàng',current.name],['Loại hình',merchantType(current)==='RESTAURANT'?'Nhà hàng / Food':'Cửa hàng / Mua hộ'],['Số điện thoại',current.phone],['Địa chỉ',current.address],['Người đăng ký',detail.owner?.fullName],['Điện thoại chủ sở hữu',detail.owner?.phone],['Email',detail.owner?.email],['Ngày đăng ký',dateText(current.createdAt)],['Ngày xét duyệt',dateText(current.approvalReviewedAt)]].map(([label,value])=><div key={label}><small>{label}</small><strong>{value||'Chưa cập nhật'}</strong></div>)}
          </div>
          <div className="merchant-review-media"><h3>Ảnh và tài liệu đã nộp</h3><div className="merchant-review-gallery">{[['Logo cửa hàng',current.logoUrl],['Ảnh bìa',current.coverUrl]].map(([label,url])=><div key={label}><b>{label}</b>{url?<a href={url} target="_blank" rel="noreferrer"><img src={url} alt={label} /><span>Xem ảnh</span></a>:<p>Chưa tải ảnh</p>}</div>)}</div>
          {!detail.documentsSubmissionSupported&&<p className="merchant-review-warning"><AlertTriangle size={17}/> App Merchant hiện chưa có luồng nộp giấy phép kinh doanh/giấy tờ pháp lý. Duyệt hồ sơ tại đây dựa trên thông tin đăng ký hiện có, không đồng nghĩa đã xác minh giấy tờ.</p>}
          </div>
          {!!current.approvalReason && <div className="merchant-review-reason"><strong>Lý do từ chối gần nhất</strong><p>{current.approvalReason}</p></div>}
          <div className="merchant-review-history"><h3>Lịch sử xét duyệt</h3>{(detail.history||[]).length ? <ul>{detail.history.map((h,i)=><li key={i}><strong>{statusText[h.status]||h.status}</strong> · {dateText(h.createdAt)} {h.reason?`· ${h.reason}`:''}</li>)}</ul> : <p>Chưa có lịch sử xét duyệt.</p>}</div>
          {decision==='REJECT' && <label className="merchant-review-reject-label">Lý do từ chối hồ sơ <span>*</span><textarea rows={4} maxLength={1000} placeholder="Ghi rõ thông tin cần bổ sung để đối tác biết cách hoàn thiện hồ sơ..." value={reason} onChange={e=>setReason(e.target.value)}/><small>Tối thiểu 10 ký tự</small></label>}
          {decision==='APPROVE' && <p className="merchant-review-warning"><ShieldCheck size={17}/> Xác nhận duyệt hồ sơ đăng ký và cho phép cửa hàng hoạt động. Kiểm tra thông tin trước khi xác nhận.</p>}
          {decision==='REOPEN' && <p className="merchant-review-warning"><Clock3 size={17}/> Hồ sơ sẽ trở lại trạng thái chờ duyệt, đồng thời tạm ngừng hoạt động cho đến khi được duyệt lại.</p>}
        </>}
      </main>
      <footer className="merchant-review-footer"><button className="button" onClick={closeReview} disabled={saving}>Đóng</button>
        {detail && (decision ? <><button className="button" onClick={()=>{setDecision(null);setDetailError('');}} disabled={saving}>Quay lại</button><button className="button merchant-review-primary" onClick={submitReview} disabled={saving||(decision==='REJECT'&&reason.trim().length<10)}>{saving?'Đang lưu...':'Xác nhận '+(decision==='APPROVE'?'duyệt':decision==='REJECT'?'từ chối':'xét duyệt lại')}</button></> : <>
          {currentApproval!=='APPROVED'&&<button className="button merchant-review-primary" onClick={()=>setDecision('APPROVE')} disabled={saving}><CheckCircle2 size={16}/> Duyệt hồ sơ</button>}
          {currentApproval!=='REJECTED'&&<button className="button merchant-review-reject-button" onClick={()=>setDecision('REJECT')} disabled={saving}><XCircle size={16}/> Từ chối</button>}
          {currentApproval!=='PENDING_REVIEW'&&<button className="button" onClick={()=>setDecision('REOPEN')} disabled={saving}><ClipboardCheck size={16}/> Xét duyệt lại</button>}
        </>)}
      </footer>
    </Modal>}
  </section>;
}
