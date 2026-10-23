import AdminOverlayPortal from './AdminOverlayPortal.jsx';
import React from 'react';
import { BellRing, Megaphone, ShieldAlert, Send, Users, Smartphone, RefreshCw, CheckCircle2, Eye, AlertTriangle, Clock3, RadioTower, Trash2 } from 'lucide-react';
import { coreApiRequest } from './coreApi.js';

const AUDIENCES=[['CUSTOMERS','Tất cả User'],['DRIVERS','Tất cả Driver'],['MERCHANTS','Tất cả Merchant'],['BOTH','User + Driver'],['ALL','User + Driver + Merchant'],['ONLINE_DRIVERS','Driver đang Online'],['SPECIFIC','Người nhận cụ thể']];
const LEVELS=[
  {level:1,title:'Cấp 1 · Khẩn cấp',short:'Cấp 1',expiryHours:24,icon:ShieldAlert,className:'critical',description:'Modal đè toàn màn hình, bắt buộc xác nhận đã đọc.',behavior:'MODAL'},
  {level:2,title:'Cấp 2 · Ưu tiên cao',short:'Cấp 2',expiryHours:48,icon:AlertTriangle,className:'high',description:'Banner/overlay ưu tiên cao khi app đang mở.',behavior:'BANNER'},
  {level:3,title:'Cấp 3 · Quan trọng',short:'Cấp 3',expiryHours:72,icon:RadioTower,className:'important',description:'Push ưu tiên và lưu trong Trung tâm thông báo.',behavior:'CENTER'},
  {level:4,title:'Thông báo thường',short:'Thường',expiryHours:168,icon:BellRing,className:'normal',description:'Push/in-app thông thường, không làm gián đoạn thao tác.',behavior:'CENTER'},
];
const fmtDate=(v)=>{if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleString('vi-VN')};
const statValue=(s,k)=>Number(s?.[k]||0).toLocaleString('vi-VN');
const levelInfo=(level)=>LEVELS.find(x=>x.level===Number(level))||LEVELS[3];

export default function BroadcastCenterPage(){
  const [form,setForm]=React.useState({title:'',body:'',level:4,audience:'BOTH',specificType:'BOTH',identifiers:'',expiryHours:168,deliveryMode:'PUSH_AND_IN_APP'});
  const [pushStatus,setPushStatus]=React.useState(null);
  const [rows,setRows]=React.useState([]),[selected,setSelected]=React.useState(null),[detail,setDetail]=React.useState(null),[loading,setLoading]=React.useState(true),[sending,setSending]=React.useState(false),[error,setError]=React.useState(''),[success,setSuccess]=React.useState('');
  const load=React.useCallback(async()=>{setError('');try{const d=await coreApiRequest('/api/v71/admin/broadcasts?limit=60');setRows(Array.isArray(d)?d:[])}catch(e){setError(e.message)}finally{setLoading(false)}},[]);
  React.useEffect(()=>{load();const t=window.setInterval(load,10000);return()=>window.clearInterval(t)},[load]);
  const loadPushStatus=React.useCallback(async()=>{
    try { setPushStatus(await coreApiRequest('/api/v71/admin/broadcasts/push-status')); }
    catch { setPushStatus({fcmConfigured:false,fcmEnabled:false,activeTokens:{customers:0,drivers:0,merchants:0},error:'Không đọc được trạng thái FCM từ Backend'}); }
  },[]);
  React.useEffect(()=>{loadPushStatus();const handle=window.setInterval(loadPushStatus,30000);return()=>window.clearInterval(handle)},[loadPushStatus]);
  async function openDetail(id){setSelected(id);try{setDetail(await coreApiRequest(`/api/v71/admin/broadcasts/${id}`))}catch(e){setError(e.message)}}
  async function removeBroadcast(id,title=''){
    if(!id)return;
    if(!window.confirm(`Xóa thông báo${title?` “${title}”`:''}? Thao tác này xóa cả bản ghi phân phối MongoDB liên quan.`))return;
    setError('');setSuccess('');
    try{
      await coreApiRequest(`/api/v71/admin/broadcasts/${id}`,{method:'DELETE'});
      if(selected===id){setSelected(null);setDetail(null)}
      setSuccess('Đã xóa thông báo và dữ liệu phân phối liên quan.');
      await load();
    }catch(e){setError(e.message)}
  }
  function chooseLevel(item){setForm(f=>({...f,level:item.level,expiryHours:item.expiryHours}))}
  async function send(e){
    e.preventDefault();setError('');setSuccess('');
    if(sending)return;
    if(form.title.trim().length<2)return setError('Vui lòng nhập tiêu đề (ít nhất 2 ký tự).');
    if(form.body.trim().length<2)return setError('Vui lòng nhập nội dung (ít nhất 2 ký tự).');
    if(form.audience==='SPECIFIC'&&!form.identifiers.trim())return setError('Vui lòng nhập SĐT, email hoặc ID người nhận.');
    setSending(true);
    try{
      const payload={...form,level:Number(form.level),expiryHours:Number(form.expiryHours)||24};
      const preview=await coreApiRequest('/api/v71/admin/broadcasts/preview',{method:'POST',body:JSON.stringify(payload)});
      if(!preview.canSubmit){
        return setError(!preview.fcmConfigured?'FCM chưa sẵn sàng trên Backend. Cấu hình FCM hoặc chọn Chỉ trong ứng dụng.':'Không có thiết bị đăng ký token push cho nhóm nhận.');
      }
      const summary=payload.deliveryMode==='PUSH_AND_IN_APP'
        ?`Nhắm tới ${preview.totalTargets} tài khoản; ${preview.pushEligible} tài khoản có token push; ${preview.withoutPushToken} tài khoản chỉ nhận trong ứng dụng.`
        :`Nhắm tới ${preview.totalTargets} tài khoản, chỉ lưu thông báo MongoDB/In-app.`;
      if(!window.confirm(`Bạn chắc chắn muốn phát thông báo?\n\n${summary}\n\nTiêu đề: ${payload.title.trim()}\nNội dung: ${payload.body.trim().slice(0,120)}\n\nThông báo sẽ được xếp vào hàng đợi; thiết bị nhận có thể trễ.`))return;
      const result=await coreApiRequest('/api/v71/admin/broadcasts',{method:'POST',body:JSON.stringify(payload)});
      setSuccess(`Đã xếp hàng đợi cho ${result.totalTargets} tài khoản. ${payload.deliveryMode==='PUSH_AND_IN_APP'?`${result.pushEligible} tài khoản có token push. `:''}Theo dõi kết quả FCM thực tế ở lịch sử bên dưới.`);
      setForm(f=>({...f,title:'',body:'',identifiers:''}));
      await load();if(result.id)await openDetail(result.id);
    }catch(e){setError(e.message)}finally{setSending(false)}
  }
  const current=levelInfo(form.level);const CurrentIcon=current.icon;
  return <div className="broadcast-page">
    <header className="broadcast-page-head"><div><span className="broadcast-eyebrow"><Megaphone size={15}/> V1.4 NOTIFICATION CENTER</span><h1>Thông báo hệ thống</h1><p>Bốn cấp độ thông báo cho User, Driver và Merchant.</p></div><button className="button" onClick={load}><RefreshCw size={16}/>Tải lại</button></header>
    {error&&<div className="broadcast-alert error">{error}</div>}{success&&<div className="broadcast-alert success">{success}</div>}
    <div className="broadcast-kpis">{LEVELS.map(item=><article key={item.level}><span className={item.className}><item.icon size={18}/></span><div><b>{rows.filter(x=>Number(x.level)===item.level).length}</b><small>{item.title}</small></div></article>)}</div>
    <div className="broadcast-layout">
      <form className="broadcast-compose" onSubmit={send}><header><div className="broadcast-icon"><Send size={20}/></div><div><h2>Soạn thông báo</h2><p>Chọn cấp độ, phạm vi người nhận và thời gian hiệu lực.</p></div></header>
        <div className="broadcast-level-grid v14-four-levels">{LEVELS.map(item=>{const Icon=item.icon;return <button type="button" key={item.level} className={`level-card ${item.className} ${Number(form.level)===item.level?'active':''}`} onClick={()=>chooseLevel(item)}><Icon size={22}/><b>{item.title}</b><span>{item.description}</span></button>})}</div>
        <label className="broadcast-field"><span>Tiêu đề</span><input value={form.title} maxLength={120} onChange={e=>setForm({...form,title:e.target.value})} placeholder="VD: Cập nhật chính sách hoạt động"/><small>{form.title.length}/120</small></label>
        <label className="broadcast-field"><span>Nội dung</span><textarea value={form.body} maxLength={1500} rows={7} onChange={e=>setForm({...form,body:e.target.value})} placeholder="Nhập nội dung thông báo..."/><small>{form.body.length}/1500</small></label>
        <div className="broadcast-form-grid"><label className="broadcast-field"><span>Kênh gửi</span><select value={form.deliveryMode} onChange={e=>setForm({...form,deliveryMode:e.target.value})}><option value="PUSH_AND_IN_APP">Push (FCM) + lưu trong ứng dụng</option><option value="IN_APP_ONLY">Chỉ lưu trong ứng dụng</option></select></label><div className="broadcast-field"><span>Trạng thái hệ thống push</span><div style={{padding:'10px 12px',border:'1px solid #e6eaf0',borderRadius:9,minHeight:40,fontSize:12,fontWeight:700,color:pushStatus?.fcmConfigured?'#168354':'#a65a08',background:pushStatus?.fcmConfigured?'#f0fbf6':'#fff9ed'}}>{pushStatus?.fcmConfigured?'FCM SDK đã khởi tạo (chưa xác nhận gửi thực tế)':pushStatus?.fcmEnabled?'FCM bật nhưng SDK chưa sẵn sàng':'FCM chưa bật / chưa được xác nhận'} · {pushStatus?.activeTokens?.customers ?? '—'} token User · {pushStatus?.activeTokens?.drivers ?? '—'} token Driver · {pushStatus?.activeTokens?.merchants ?? '—'} token Merchant</div><button type="button" className="button" onClick={loadPushStatus} style={{alignSelf:'flex-start',padding:'6px 10px',fontSize:11}}><RefreshCw size={13}/> Kiểm tra lại FCM</button>{pushStatus?.error&&<small style={{color:'#b45309'}}>{pushStatus.error}</small>}</div></div>
        <div style={{marginBottom:12,fontSize:12,color:'#64748b'}}>Push tới thiết bị Android kể cả khi màn hình tắt nếu FCM, quyền thông báo và token thiết bị đã được cấu hình. Token không đồng nghĩa với thiết bị đã nhận.</div>
        <div className="broadcast-form-grid"><label className="broadcast-field"><span>Người nhận</span><select value={form.audience} onChange={e=>setForm({...form,audience:e.target.value})}>{AUDIENCES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label className="broadcast-field"><span>Hiệu lực</span><select value={form.expiryHours} onChange={e=>setForm({...form,expiryHours:Number(e.target.value)})}><option value={6}>6 giờ</option><option value={12}>12 giờ</option><option value={24}>24 giờ</option><option value={48}>48 giờ</option><option value={72}>72 giờ</option><option value={168}>7 ngày</option></select></label></div>
        {form.audience==='SPECIFIC'&&<><div className="broadcast-form-grid"><label className="broadcast-field"><span>Loại tài khoản</span><select value={form.specificType} onChange={e=>setForm({...form,specificType:e.target.value})}><option value="CUSTOMER">User</option><option value="DRIVER">Driver</option><option value="BOTH">Tự tìm User + Driver</option><option value="MERCHANT">Merchant</option><option value="ALL">Tự tìm User + Driver + Merchant</option></select></label><div className="broadcast-specific-help"><Smartphone size={17}/><span>Nhập SĐT, email hoặc MongoDB ID, cách nhau bằng dấu phẩy hoặc xuống dòng.</span></div></div><label className="broadcast-field"><span>Danh sách người nhận</span><textarea rows={4} value={form.identifiers} onChange={e=>setForm({...form,identifiers:e.target.value})}/></label></>}
        <div className={`broadcast-warning ${current.className}`}><CurrentIcon size={18}/><div><b>{current.title}</b><span>{current.description} · Presentation: {current.behavior}</span></div></div>
        <footer className="broadcast-send-row"><div><Users size={16}/><span>{AUDIENCES.find(x=>x[0]===form.audience)?.[1]}</span></div><button className="button button-primary" disabled={sending}><Send size={16}/>{sending?'Đang kiểm tra...':form.deliveryMode==='PUSH_AND_IN_APP'?'Kiểm tra & phát Push':'Kiểm tra & phát In-app'}</button></footer>
      </form>
      <aside className="broadcast-preview"><header><Eye size={18}/><div><h2>Xem trước</h2><p>Minh họa trên User/Driver App</p></div></header><div className="phone-preview"><div className="phone-top"><span>9:41</span><span>iMOVE</span></div><div className="phone-content"><div className="preview-appbar">TH79 iMove</div><div className="preview-map"></div>{Number(form.level)===1?<div className="preview-modal"><div className="preview-alert-icon"><ShieldAlert size={22}/></div><small>THÔNG BÁO CẤP 1</small><b>{form.title||'Thông báo khẩn cấp'}</b><p>{form.body||'Nội dung yêu cầu người dùng xác nhận đã đọc.'}</p><button type="button">Tôi đã đọc</button></div>:<div className={`preview-banner level-${form.level}`}><CurrentIcon size={18}/><div><b>{form.title||current.title}</b><span>{form.body||current.description}</span></div></div>}</div></div></aside>
    </div>
    <section className="broadcast-history-card"><header><div><h2>Lịch sử phát thông báo</h2><p>Theo dõi trạng thái thông báo trong MongoDB và FCM. Xếp hàng đợi không đồng nghĩa đã nhận trên điện thoại.</p></div><Clock3 size={18}/></header>{loading?<div className="broadcast-empty">Đang tải...</div>:rows.length===0?<div className="broadcast-empty">Chưa có broadcast.</div>:<div className="broadcast-table-wrap"><table className="broadcast-table"><thead><tr><th>Cấp</th><th>Nội dung</th><th>Nhóm nhận</th><th>Đích</th><th>FCM đã gửi</th><th>In-app</th><th>Xác nhận</th><th>Thời gian</th><th></th></tr></thead><tbody>{rows.map(row=>{const info=levelInfo(row.level);return <tr key={row._id}><td><span className={`broadcast-level ${info.className}`}>{info.title}</span></td><td><b>{row.title}</b><small>{row.body}</small></td><td>{row.audience}</td><td>{statValue(row.stats,'total')}</td><td>{statValue(row.stats,'fcmSent')}</td><td>{statValue(row.stats,'inApp')}</td><td>{Number(row.level)===1?`${statValue(row.stats,'acknowledged')}/${statValue(row.stats,'total')}`:'—'}</td><td>{fmtDate(row.sentAt||row.createdAt)}</td><td><div className="driver-point-action-row"><button className="text-button" onClick={()=>openDetail(row._id)}>Chi tiết</button><button className="text-button" title="Xóa thông báo" onClick={()=>removeBroadcast(row._id,row.title)}><Trash2 size={14}/> Xóa</button></div></td></tr>})}</tbody></table></div>}</section>
    {selected&&detail&&<AdminOverlayPortal><div className="broadcast-detail-backdrop" onMouseDown={()=>{setSelected(null);setDetail(null)}}><section className="broadcast-detail" onMouseDown={e=>e.stopPropagation()}><header><div><span className={`broadcast-level ${levelInfo(detail.broadcast?.level).className}`}>{levelInfo(detail.broadcast?.level).title}</span><h2>{detail.broadcast?.title}</h2></div><div className="driver-point-action-row"><button className="icon-button" title="Xóa thông báo" onClick={()=>removeBroadcast(detail.broadcast?._id,detail.broadcast?.title)}><Trash2 size={16}/></button><button className="icon-button" onClick={()=>{setSelected(null);setDetail(null)}}>×</button></div></header><p>{detail.broadcast?.body}</p><div className="broadcast-detail-stats"><div><b>{statValue(detail.stats,'total')}</b><span>Tổng</span></div><div><b>{statValue(detail.stats,'sent')}</b><span>FCM + In-app</span></div><div><b>{statValue(detail.stats,'inApp')}</b><span>Chỉ in-app</span></div><div><b>{statValue(detail.stats,'acknowledged')}</b><span>Xác nhận</span></div></div><small>Phát lúc: {fmtDate(detail.broadcast?.sentAt||detail.broadcast?.createdAt)}</small></section></div></AdminOverlayPortal>}
  </div>
}
