import AdminOverlayPortal from './AdminOverlayPortal.jsx';
import React from 'react';
import {
  BadgeDollarSign,
  CheckCircle2,
  Clock3,
  RefreshCw,
  XCircle,
  Banknote,
  Users,
  Search,
  Copy,
  Zap,
  Plus,
  Minus,
  X,
  Save,
  History,
} from './adminPngLucide.jsx';
import { coreApiRequest } from './coreApi.js';
import FundTransferSettingsPanel from './FundTransferSettingsPanel.jsx';

const money=(v)=>new Intl.NumberFormat('vi-VN').format(Number(v||0))+' ₫';
const num=(v)=>new Intl.NumberFormat('vi-VN').format(Number(v||0));
const date=(v)=>v?new Date(v).toLocaleString('vi-VN'):'—';
const uuid=()=>globalThis.crypto?.randomUUID?.()||`admin-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function DriverPointTopupsPage(){
  const [status,setStatus]=React.useState('PENDING_REVIEW');
  const [keyword,setKeyword]=React.useState('');
  const [rows,setRows]=React.useState([]);
  const [loading,setLoading]=React.useState(true);
  const [error,setError]=React.useState('');
  const [busy,setBusy]=React.useState('');

  const load=React.useCallback(async()=>{
    setLoading(true);setError('');
    try{
      const params=new URLSearchParams();
      if(status&&status!=='ALL')params.set('status',status);
      if(keyword.trim())params.set('q',keyword.trim());
      const q=params.toString()?`?${params.toString()}`:'';
      const data=await coreApiRequest(`/api/v72/admin/driver-experience/point-topups${q}`);
      setRows(Array.isArray(data?.topups)?data.topups:[]);
    }catch(e){setError(e.message||String(e))}
    finally{setLoading(false)}
  },[status,keyword]);

  React.useEffect(()=>{
    const t=setTimeout(load,keyword.trim()?280:0);
    return()=>clearTimeout(t);
  },[load,keyword]);

  async function approve(row){
    const content=row.transferContent||row.transferCode;
    if(!window.confirm(`Đã kiểm tra tài khoản công ty và xác nhận nhận ${money(row.amountVnd)}?\n\nNội dung CK: ${content}`))return;
    setBusy(row.id);setError('');
    try{
      await coreApiRequest(`/api/v72/admin/driver-experience/point-topups/${row.id}/approve`,{method:'POST',body:'{}'});
      await load();
    }catch(e){setError(e.message||String(e))}
    finally{setBusy('')}
  }

  async function reject(row){
    const reason=window.prompt('Lý do từ chối yêu cầu nạp điểm:','Không tìm thấy giao dịch chuyển khoản phù hợp.');
    if(reason===null)return;
    setBusy(row.id);setError('');
    try{
      await coreApiRequest(`/api/v72/admin/driver-experience/point-topups/${row.id}/reject`,{method:'POST',body:JSON.stringify({reason})});
      await load();
    }catch(e){setError(e.message||String(e))}
    finally{setBusy('')}
  }

  async function copy(text){
    try{await navigator.clipboard.writeText(String(text||''))}catch(_){/* no-op */}
  }

  const all=rows.length;
  const pending=rows.filter(x=>x.status==='PENDING_REVIEW').length;
  const approved=rows.filter(x=>x.status==='APPROVED');
  const points=approved.reduce((s,x)=>s+Number(x.points||0),0);

  return <section className="v14-page">
    <header className="v14-page-head">
      <div>
        <span className="v14-eyebrow">DRIVER POINTS · COMPANY FUND</span>
        <h1>Nạp quỹ & duyệt biên lai</h1>
        <p>Đối chiếu chuyển khoản, duyệt biên lai và cấu hình QR nhận quỹ. Cộng/trừ điểm thủ công được thực hiện tại trang Quản lý điểm tài xế.</p>
      </div>
      <div className="page-actions">
        <label className="enterprise-search" style={{minWidth:280}}><Search size={15}/><input value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="Tên, SĐT, mã CK..."/></label>
        <select value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="PENDING_REVIEW">Chờ duyệt</option><option value="APPROVED">Đã duyệt</option><option value="AMOUNT_MISMATCH">Sai số tiền</option><option value="REJECTED">Đã từ chối</option><option value="ALL">Tất cả</option>
        </select>
        <button className="button" onClick={load}><RefreshCw size={15}/>Làm mới</button>
      </div>
    </header>

    {error&&<div className="v73-alert">{error}</div>}

    <FundTransferSettingsPanel/>

    <div className="v14-kpis">
      <article><Clock3/><span>Đang chờ</span><b>{pending}</b><small>Cần đối chiếu ngân hàng</small></article>
      <article><CheckCircle2/><span>Đã duyệt</span><b>{approved.length}</b><small>Đã cộng điểm</small></article>
      <article><BadgeDollarSign/><span>Điểm đã cộng</span><b>{num(points)}</b><small>Qua chuyển khoản</small></article>
      <article><Users/><span>Bản ghi đang xem</span><b>{all}</b><small>{status==='ALL'?'Tất cả trạng thái':status}</small></article>
    </div>

    <div className="v14-pricing-policy">
      <Banknote size={17}/><div><b>Tiền mặt không tạo ví rút tiền</b><span>Khách trả tiền mặt trực tiếp cho tài xế. Admin chỉ cộng/trừ quỹ điểm tài xế; phí nền tảng tiếp tục trừ từ điểm.</span></div>
    </div>

    <section className="card v14-panel"><div className="v14-table-wrap"><table>
      <thead><tr><th>Tài xế</th><th>Mã / Nội dung chuyển khoản</th><th>Số tiền</th><th>Điểm</th><th>Đối chiếu</th><th>Trạng thái</th><th>Thời gian</th><th>Thao tác</th></tr></thead>
      <tbody>{rows.map(row=>{const content=row.transferContent||row.transferCode||'';const automatic=row.confirmedVia==='BANK_WEBHOOK';return <tr key={row.id}>
        <td><b>{row.driver?.fullName||'Tài xế'}</b><small className="v14-subline">{row.driver?.phone||row.driverId}</small></td>
        <td><div style={{display:'grid',gap:5,minWidth:260}}><code>{row.transferCode}</code><span style={{fontSize:12,fontWeight:700}}>{content}</span><button className="button button-small" style={{justifySelf:'start'}} onClick={()=>copy(content)}><Copy size={12}/>Sao chép</button></div></td>
        <td><b>{money(row.amountVnd)}</b>{row.receivedAmountVnd!=null&&Number(row.receivedAmountVnd)!==Number(row.amountVnd)?<small className="v14-subline">Nhận: {money(row.receivedAmountVnd)}</small>:null}</td>
        <td>{num(row.points)} điểm</td>
        <td>{automatic?<span className="v14-status success"><Zap size={12}/>Tự động</span>:row.bankTransactionId?<code>{row.bankTransactionId}</code>:<span className="v14-subline">Thủ công</span>}</td>
        <td><span className={`v14-status ${row.status==='APPROVED'?'success':row.status==='REJECTED'||row.status==='AMOUNT_MISMATCH'?'failed':'pending'}`}>{row.status}</span></td>
        <td>{date(row.createdAt)}</td>
        <td>{row.status==='PENDING_REVIEW'||row.status==='AMOUNT_MISMATCH'?<div className="page-actions"><button className="button button-small" disabled={busy===row.id} onClick={()=>reject(row)}><XCircle size={13}/>Từ chối</button><button className="button button-small button-primary" disabled={busy===row.id} onClick={()=>approve(row)}><CheckCircle2 size={13}/>Duyệt</button></div>:'—'}</td>
      </tr>})}</tbody>
    </table>{!loading&&!rows.length&&<div className="v14-empty">Chưa có yêu cầu nạp điểm phù hợp.</div>}{loading&&<div className="v14-empty">Đang tải yêu cầu...</div>}</div></section>


  </section>;
}
