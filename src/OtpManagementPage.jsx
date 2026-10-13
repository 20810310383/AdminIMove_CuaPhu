import React from 'react';
import { RefreshCw, Search, RotateCcw, Ban, ShieldCheck, MessageSquareText, CheckCircle2, XCircle, Clock3 } from 'lucide-react';
import { coreApiRequest } from './coreApi.js';
import { hasPermission } from './adminApi.js';

function fmtDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(d);
}

function statusMeta(status) {
  const s = String(status || '').toUpperCase();
  if (['SENT', 'ACTIVE', 'PENDING'].includes(s)) return { label: s === 'PENDING' ? 'Đang gửi' : 'Còn hiệu lực', bg: '#ecfdf3', fg: '#067647' };
  if (s === 'USED') return { label: 'Đã dùng', bg: '#eff8ff', fg: '#175cd3' };
  if (s === 'SUPERSEDED') return { label: 'Đã thay thế', bg: '#f2f4f7', fg: '#475467' };
  if (s === 'FAILED') return { label: 'Gửi lỗi', bg: '#fef3f2', fg: '#b42318' };
  if (s === 'EXPIRED') return { label: 'Hết hạn', bg: '#fff6ed', fg: '#b54708' };
  if (s === 'CANCELLED') return { label: 'Đã hủy', bg: '#f2f4f7', fg: '#344054' };
  return { label: s || 'Không rõ', bg: '#f2f4f7', fg: '#344054' };
}

function StatCard({ icon: Icon, label, value, hint }) {
  return <div style={{background:'#fff',border:'1px solid #eaecf0',borderRadius:18,padding:18,minWidth:0}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
      <div>
        <div style={{color:'#667085',fontSize:13,fontWeight:700}}>{label}</div>
        <div style={{fontSize:28,fontWeight:900,marginTop:5,color:'#101828'}}>{value ?? 0}</div>
        {hint && <div style={{fontSize:12,color:'#98a2b3',marginTop:3}}>{hint}</div>}
      </div>
      <span style={{width:42,height:42,borderRadius:12,display:'grid',placeItems:'center',background:'#fff1f3',color:'#e91e3a'}}><Icon size={21}/></span>
    </div>
  </div>;
}

export default function OtpManagementPage({ access }) {
  const canManage = !access || hasPermission(access, 'settings.manage');
  const [rows, setRows] = React.useState([]);
  const [stats, setStats] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [purpose, setPurpose] = React.useState('ALL');
  const [status, setStatus] = React.useState('ALL');
  const [busyId, setBusyId] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '250' });
      if (phone.trim()) params.set('phone', phone.trim());
      if (purpose !== 'ALL') params.set('purpose', purpose);
      if (status !== 'ALL') params.set('status', status);
      const [list, summary] = await Promise.all([
        coreApiRequest(`/api/v171/admin/otp?${params.toString()}`),
        coreApiRequest('/api/v171/admin/otp/stats'),
      ]);
      setRows(Array.isArray(list?.rows) ? list.rows : []);
      setStats(summary || {});
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [phone, purpose, status]);

  React.useEffect(() => { load(); }, [load]);

  const resend = async (row) => {
    if (!window.confirm(`Gửi lại OTP tới ${row.phone || row.maskedPhone}? OTP cũ sẽ bị vô hiệu hóa.`)) return;
    setBusyId(row.id);
    try {
      await coreApiRequest(`/api/v171/admin/otp/${encodeURIComponent(row.id)}/resend`, { method:'POST', body: JSON.stringify({}) });
      await load();
      window.alert('Đã gửi lại OTP.');
    } catch (e) {
      window.alert(e?.message || String(e));
    } finally {
      setBusyId('');
    }
  };

  const cancel = async (row) => {
    if (!window.confirm(`Hủy OTP ${row.maskedPhone || row.phone}? Mã này sẽ không thể dùng nữa.`)) return;
    setBusyId(row.id);
    try {
      await coreApiRequest(`/api/v171/admin/otp/${encodeURIComponent(row.id)}/cancel`, { method:'POST', body: JSON.stringify({}) });
      await load();
    } catch (e) {
      window.alert(e?.message || String(e));
    } finally {
      setBusyId('');
    }
  };

  return <section>
    <header className="page-intro">
      <div className="page-intro-main">
        <span className="page-intro-icon"><ShieldCheck size={21}/></span>
        <div>
          <h1>Quản lý OTP</h1>
          <p>Theo dõi OTP tài xế/khách hàng/merchant, trạng thái gửi, hết hạn, gửi lại và vô hiệu hóa mã.</p>
        </div>
      </div>
      <div className="page-actions">
        <button type="button" className="button button-secondary" onClick={load} disabled={loading}><RefreshCw size={16}/> Làm mới</button>
      </div>
    </header>

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:16}}>
      <StatCard icon={MessageSquareText} label="OTP 24 giờ" value={stats.total24h}/>
      <StatCard icon={Clock3} label="Còn hiệu lực" value={stats.active}/>
      <StatCard icon={CheckCircle2} label="Đã sử dụng" value={stats.used}/>
      <StatCard icon={XCircle} label="Gửi lỗi" value={stats.failed}/>
    </div>

    <div style={{background:'#fff',border:'1px solid #eaecf0',borderRadius:20,padding:16,marginBottom:16}}>
      <div style={{display:'grid',gridTemplateColumns:'minmax(220px,1.4fr) minmax(180px,1fr) minmax(160px,1fr) auto',gap:10,alignItems:'end'}}>
        <label style={{display:'grid',gap:6}}>
          <span style={{fontSize:12,fontWeight:800,color:'#475467'}}>Số điện thoại</span>
          <div style={{position:'relative'}}><Search size={17} style={{position:'absolute',left:12,top:13,color:'#98a2b3'}}/><input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,''))} placeholder="VD: 0335555066" style={{width:'100%',height:42,border:'1px solid #d0d5dd',borderRadius:12,padding:'0 12px 0 38px'}}/></div>
        </label>
        <label style={{display:'grid',gap:6}}>
          <span style={{fontSize:12,fontWeight:800,color:'#475467'}}>Mục đích</span>
          <select value={purpose} onChange={e=>setPurpose(e.target.value)} style={{height:42,border:'1px solid #d0d5dd',borderRadius:12,padding:'0 10px',background:'#fff'}}>
            <option value="ALL">Tất cả</option>
            <option value="DRIVER_REGISTER">Đăng ký tài xế</option>
            <option value="CUSTOMER_PHONE_VERIFY">Xác thực khách hàng</option>
            <option value="MERCHANT_PHONE_VERIFY">Xác thực Merchant</option>
            <option value="PHONE_VERIFY">Xác thực số điện thoại</option>
            <option value="PASSWORD_RESET">Đặt lại mật khẩu</option>
          </select>
        </label>
        <label style={{display:'grid',gap:6}}>
          <span style={{fontSize:12,fontWeight:800,color:'#475467'}}>Trạng thái</span>
          <select value={status} onChange={e=>setStatus(e.target.value)} style={{height:42,border:'1px solid #d0d5dd',borderRadius:12,padding:'0 10px',background:'#fff'}}>
            <option value="ALL">Tất cả</option>
            <option value="SENT">Còn hiệu lực</option>
            <option value="USED">Đã dùng</option>
            <option value="FAILED">Gửi lỗi</option>
            <option value="EXPIRED">Hết hạn</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </label>
        <button type="button" className="button button-primary" onClick={load} style={{height:42}}>Lọc</button>
      </div>
    </div>

    {error && <div style={{padding:14,borderRadius:14,background:'#fef3f2',color:'#b42318',fontWeight:700,marginBottom:14}}>{error}</div>}

    <div style={{background:'#fff',border:'1px solid #eaecf0',borderRadius:20,overflow:'hidden'}}>
      <div style={{padding:'15px 18px',borderBottom:'1px solid #eaecf0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div><b>Danh sách OTP</b><div style={{fontSize:12,color:'#667085',marginTop:3}}>Không hiển thị mã OTP dạng rõ để đảm bảo an toàn.</div></div>
        <span style={{fontSize:13,color:'#667085'}}>{rows.length} bản ghi</span>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:980}}>
          <thead><tr style={{background:'#f9fafb',textAlign:'left'}}>
            {['Số điện thoại','Mục đích','Trạng thái','Nhà cung cấp','Tạo lúc','Hết hạn','Lỗi gửi','Thao tác'].map(h=><th key={h} style={{padding:'11px 14px',fontSize:12,color:'#475467',borderBottom:'1px solid #eaecf0'}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="8" style={{padding:28,textAlign:'center',color:'#667085'}}>Đang tải OTP...</td></tr> : rows.length === 0 ? <tr><td colSpan="8" style={{padding:28,textAlign:'center',color:'#667085'}}>Chưa có dữ liệu OTP phù hợp.</td></tr> : rows.map(row=>{
              const meta=statusMeta(row.status);
              const canAct=['SENT','ACTIVE','PENDING','FAILED','EXPIRED'].includes(String(row.status||'').toUpperCase());
              return <tr key={row.id}>
                <td style={{padding:'12px 14px',borderBottom:'1px solid #f2f4f7'}}><b>{row.phone || row.maskedPhone || '—'}</b><div style={{fontSize:11,color:'#98a2b3'}}>{row.maskedPhone}</div></td>
                <td style={{padding:'12px 14px',borderBottom:'1px solid #f2f4f7'}}>{row.purpose || '—'}</td>
                <td style={{padding:'12px 14px',borderBottom:'1px solid #f2f4f7'}}><span style={{display:'inline-flex',padding:'5px 9px',borderRadius:999,background:meta.bg,color:meta.fg,fontSize:12,fontWeight:800}}>{meta.label}</span></td>
                <td style={{padding:'12px 14px',borderBottom:'1px solid #f2f4f7'}}>{row.provider || '—'}{row.transactionId && <div style={{fontSize:11,color:'#98a2b3'}}>ID: {row.transactionId}</div>}</td>
                <td style={{padding:'12px 14px',borderBottom:'1px solid #f2f4f7'}}>{fmtDate(row.createdAt)}</td>
                <td style={{padding:'12px 14px',borderBottom:'1px solid #f2f4f7'}}>{fmtDate(row.expiresAt)}</td>
                <td style={{padding:'12px 14px',borderBottom:'1px solid #f2f4f7',maxWidth:260,color:row.deliveryError?'#b42318':'#667085'}}>{row.deliveryError || '—'}</td>
                <td style={{padding:'12px 14px',borderBottom:'1px solid #f2f4f7'}}>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    <button type="button" className="button button-secondary" disabled={!canManage||!canAct||busyId===row.id} onClick={()=>resend(row)}><RotateCcw size={14}/> Gửi lại</button>
                    <button type="button" className="button button-secondary" disabled={!canManage||!canAct||busyId===row.id} onClick={()=>cancel(row)} style={{color:'#b42318'}}><Ban size={14}/> Hủy</button>
                  </div>
                </td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
  </section>;
}
