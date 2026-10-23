import React from 'react';
import { createPortal } from 'react-dom';
import { ImagePlus, Plus, RefreshCw, Pencil, Trash2, Save, Upload, Eye, EyeOff, CalendarDays, Images } from './adminPngLucide.jsx';
import { coreApiRequest } from './coreApi.js';
import { coreUrl } from './apiRuntime.js';
import './ad-banners-admin.css';
import './imove-modal-fix-v21.css';

const empty = { title:'',subtitle:'',description:'',promotionCode:'',enabled:false,sortOrder:0,startAt:'',endAt:'' };
const localDate=v=>{
  if(!v)return '';
  const date=new Date(v);if(!Number.isFinite(date.getTime()))return '';
  const local=new Date(date.getTime()-date.getTimezoneOffset()*60000);
  return local.toISOString().slice(0,16);
};
const toForm=b=>({...empty,...b,startAt:localDate(b.startAt),endAt:localDate(b.endAt)});
const dateFmt=v=>v?new Date(v).toLocaleString('vi-VN'):'—';

export default function AdBannersAdminPage(){
  const [rows,setRows]=React.useState([]);
  const [form,setForm]=React.useState(empty);
  const [editing,setEditing]=React.useState(null);
  const [open,setOpen]=React.useState(false);
  const [file,setFile]=React.useState(null);
  const [preview,setPreview]=React.useState('');
  const [busy,setBusy]=React.useState(false);
  const [loading,setLoading]=React.useState(true);
  const [error,setError]=React.useState('');
  const [success,setSuccess]=React.useState('');
  const [backendMissing,setBackendMissing]=React.useState(false);

  const apiError=(error)=>{
    const message=error?.message||String(error);
    return /(?:\b404\b|Cannot GET|Not Found)/i.test(message)
      ? 'Backend chưa có API Banner (/api/v181/admin/banners). Hãy triển khai Backend v21, khởi động lại service rồi mới tạo banner trên Admin.'
      : message;
  };
  const load=React.useCallback(async()=>{
    setLoading(true);setError('');
    try{const data=await coreApiRequest('/api/v181/admin/banners');setRows(data.banners||[]);setBackendMissing(false);}
    catch(e){setError(apiError(e));setBackendMissing(/(?:\b404\b|Cannot GET|Not Found)/i.test(e.message||String(e)));}
    finally{setLoading(false);}
  },[]);
  React.useEffect(()=>{load()},[load]);
  React.useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview)},[preview]);

  const begin=(item)=>{
    setEditing(item?.id||null);setForm(item?toForm(item):empty);
    setFile(null);setPreview('');setError('');setSuccess('');setOpen(true);
  };
  const chooseFile=e=>{
    const next=e.target.files?.[0];if(!next)return;
    if(!['image/png','image/jpeg','image/webp'].includes(next.type)){setError('Chỉ hỗ trợ PNG, JPG hoặc WebP.');return;}
    if(next.size>5*1024*1024){setError('Dung lượng ảnh tối đa 5 MB.');return;}
    setFile(next);setPreview(URL.createObjectURL(next));setError('');
  };
  const save=async e=>{
    e.preventDefault();setBusy(true);setError('');setSuccess('');
    try{
      if(!editing&&!file){throw new Error('Vui lòng chọn ảnh banner trước khi lưu.');}
      const payload={...form,promotionCode:(form.promotionCode||'').toUpperCase().trim(),startAt:form.startAt||null,endAt:form.endAt||null};
      // Upload image before enabling so customers never see incomplete banners.
      const path=editing?`/api/v181/admin/banners/${editing}`:'/api/v181/admin/banners';
      const result=await coreApiRequest(path,{method:editing?'PUT':'POST',body:JSON.stringify({...payload,enabled:file?false:payload.enabled})});
      const id=result?.banner?.id||editing;
      if(!id)throw new Error('Backend chưa trả ID banner vừa tạo.');
      // Keep the draft ID on errors so retry updates the same banner, never duplicates it.
      setEditing(id);
      if(file){
        const fd=new FormData();fd.append('banner',file);
        await coreApiRequest(`/api/v181/admin/banners/${id}/image`,{method:'POST',body:fd,timeoutMs:120000});
        if(payload.enabled){
          await coreApiRequest(`/api/v181/admin/banners/${id}`,{method:'PUT',body:JSON.stringify({...payload,enabled:true})});
        }
      }
      setSuccess('Đã lưu banner trên Backend.');setOpen(false);setFile(null);setPreview('');await load();
    }catch(e){setError(apiError(e));if(/(?:\b404\b|Cannot GET|Not Found)/i.test(e.message||String(e)))setBackendMissing(true);}
    finally{setBusy(false);}
  };
  const toggle=async row=>{
    setBusy(true);setError('');setSuccess('');
    try{
      if(!row.imageUrl&&!row.enabled)throw new Error('Bạn cần tải ảnh trước khi bật banner.');
      await coreApiRequest(`/api/v181/admin/banners/${row.id}`,{method:'PUT',body:JSON.stringify({...row,enabled:!row.enabled})});
      setSuccess(row.enabled?'Đã tắt banner.':'Đã bật banner.');await load();
    }catch(e){setError(apiError(e));}
    finally{setBusy(false);}
  };
  const remove=async row=>{
    if(!window.confirm(`Xóa banner “${row.title}” và ảnh liên quan?`))return;
    setBusy(true);setError('');
    try{await coreApiRequest(`/api/v181/admin/banners/${row.id}`,{method:'DELETE'});setSuccess('Đã xóa banner.');await load();}
    catch(e){setError(apiError(e));}
    finally{setBusy(false);}
  };
  return <section className="im-banners">
    <header className="im-banners-head">
      <div><span className="v14-eyebrow">IMOVE · MARKETING CENTER</span><h1>Banner quảng cáo</h1><p>Quản lý độc lập ảnh, nội dung, thời gian hiển thị và thứ tự carousel trên trang chủ app User.</p></div>
      <div className="im-banners-actions"><button className="button" onClick={load} disabled={loading}><RefreshCw size={16}/>Làm mới</button><button className="button button-primary" disabled={backendMissing} title={backendMissing?"Backend chưa có API Banner":"Tạo banner mới"} onClick={()=>begin(null)}><Plus size={16}/>Thêm banner</button></div>
    </header>
    {error&&!open&&<p role="alert" className="im-banner-error">{error}</p>}
    {success&&<p role="status" className="im-banner-success">{success}</p>}
    <div className="im-banner-stats">
      <div><Images size={22}/><span>Tổng banner</span><strong>{rows.length}</strong></div>
      <div><Eye size={22}/><span>Đang bật</span><strong>{rows.filter(x=>x.enabled).length}</strong></div>
      <div><CalendarDays size={22}/><span>Đang có lịch</span><strong>{rows.filter(x=>x.startAt||x.endAt).length}</strong></div>
    </div>
    {loading?<div className="im-banner-empty">Đang tải banner từ Backend...</div>:rows.length===0?<div className="im-banner-empty"><ImagePlus size={36}/><h2>Chưa có banner quảng cáo</h2><p>Tải banner đầu tiên để hiển thị ở trang chủ ứng dụng.</p><button className="button button-primary" disabled={backendMissing} title={backendMissing?"Backend chưa có API Banner":"Tạo banner mới"} onClick={()=>begin(null)}>Tạo banner</button></div>:<div className="im-banner-grid">
      {rows.map((item)=><article className="im-banner-card" key={item.id}>
        <div className="im-banner-image">{item.imageUrl?<img src={coreUrl(item.imageUrl)} alt={item.title}/>:<ImagePlus size={38}/>}</div>
        <div className="im-banner-card-body">
          <div className="im-banner-card-title"><b>{item.title}</b><span className={item.enabled?'enabled':'disabled'}>{item.enabled?'Đang bật':'Đang tắt'}</span></div>
          <p>{item.subtitle||item.description||'Chưa có mô tả'}</p>
          <div className="im-banner-meta"><span>Thứ tự: <b>{item.sortOrder}</b></span><span>Mã: <b>{item.promotionCode||'Không có'}</b></span></div>
          <div className="im-banner-meta"><span>Từ: {dateFmt(item.startAt)}</span><span>Đến: {dateFmt(item.endAt)}</span></div>
          <div className="im-banner-buttons"><button disabled={busy} onClick={()=>begin(item)}><Pencil size={15}/>Sửa</button><button disabled={busy} onClick={()=>toggle(item)}>{item.enabled?<EyeOff size={15}/>:<Eye size={15}/>} {item.enabled?'Ẩn':'Hiển thị'}</button><button className="delete" disabled={busy} onClick={()=>remove(item)}><Trash2 size={15}/>Xóa</button></div>
        </div>
      </article>)}
    </div>}
    {open&&createPortal(<div className="imove-overlay-v21" onMouseDown={()=>!busy&&setOpen(false)}><form role="dialog" aria-modal="true" aria-label="Quản lý banner quảng cáo" className="im-banner-dialog" onMouseDown={e=>e.stopPropagation()} onSubmit={save}>
      <header><div><span className="v14-eyebrow">QUẢN LÝ NỘI DUNG</span><h2>{editing?'Chỉnh sửa banner':'Thêm banner mới'}</h2><p>Hình ảnh được upload vào MongoDB; người dùng sẽ thấy đúng nội dung bạn nhập.</p></div><button type="button" onClick={()=>setOpen(false)} disabled={busy} aria-label="Đóng">×</button></header>
      <div className="im-banner-editor">
        <div className="im-banner-fields">
          <label>Tiêu đề *<input required maxLength={120} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="VD: Ưu đãi tháng 10"/></label>
          <label>Phụ đề<input maxLength={200} value={form.subtitle||''} onChange={e=>setForm({...form,subtitle:e.target.value})} placeholder="VD: Tặng mã giảm giá cho chuyến đầu"/></label>
          <label>Nội dung quảng cáo<textarea rows={5} maxLength={6000} value={form.description||''} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Chi tiết, điều kiện và thời hạn ưu đãi..."/></label>
          <div className="im-banner-half"><label>Mã ưu đãi liên kết (không bắt buộc)<input maxLength={50} value={form.promotionCode||''} onChange={e=>setForm({...form,promotionCode:e.target.value.toUpperCase()})} placeholder="WELCOME20"/></label><label>Thứ tự hiển thị<input type="number" min="0" max="9999" value={form.sortOrder??0} onChange={e=>setForm({...form,sortOrder:Number(e.target.value)})}/></label></div>
          <div className="im-banner-half"><label>Ngày bắt đầu<input type="datetime-local" value={form.startAt||''} onChange={e=>setForm({...form,startAt:e.target.value})}/></label><label>Ngày kết thúc<input type="datetime-local" value={form.endAt||''} onChange={e=>setForm({...form,endAt:e.target.value})}/></label></div>
          <label className="im-banner-check"><input type="checkbox" checked={Boolean(form.enabled)} onChange={e=>setForm({...form,enabled:e.target.checked})}/>Cho phép hiển thị trên app User</label>
        </div>
        <div className="im-banner-preview">
          <label className="im-banner-upload"><Upload size={20}/><strong>{file?file.name:'Chọn ảnh PNG/JPG/WebP'}</strong><span>Tối đa 5MB · đề xuất 1200 × 500px</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseFile}/></label>
          <div className="im-banner-phone-preview"><div className="im-banner-visual">{preview||form.imageUrl?<img src={preview||coreUrl(form.imageUrl)} alt="Xem trước banner"/>:<ImagePlus size={40}/>}</div><b>{form.title||'Tiêu đề banner của bạn'}</b><p>{form.subtitle||form.description||'Nội dung xuất hiện trong trang chủ User'}</p></div>
        </div>
      </div>
      {error&&<p role="alert" className="im-banner-error">{error}</p>}
      <footer><button type="button" className="button" onClick={()=>setOpen(false)} disabled={busy}>Hủy</button><button className="button button-primary" disabled={busy} type="submit"><Save size={16}/>{busy?'Đang lưu...':'Lưu banner'}</button></footer>
    </form></div>, document.body)}
  </section>;
}
