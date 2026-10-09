import React from 'react';
import { Save, RefreshCw, ShieldCheck, FileText } from 'lucide-react';
import { coreApiRequest } from './coreApi.js';

const empty = {
  termsTitle: 'Điều khoản sử dụng TH79 iMove',
  termsContent: '',
  privacyTitle: 'Chính sách bảo mật TH79 iMove',
  privacyContent: '',
  version: '1.0',
  effectiveDate: '',
};

function toDateInput(value){
  if(!value) return '';
  const d=new Date(value);
  if(Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0,10);
}

export default function LegalSettingsPage(){
  const [form,setForm]=React.useState(empty);
  const [loading,setLoading]=React.useState(true);
  const [saving,setSaving]=React.useState(false);
  const [message,setMessage]=React.useState('');
  const [error,setError]=React.useState('');
  const [tab,setTab]=React.useState('terms');

  const load=React.useCallback(async()=>{
    setLoading(true);setError('');
    try{
      const data=await coreApiRequest('/api/v171/admin/legal');
      const legal=data?.legal||{};
      setForm({
        termsTitle:legal.termsTitle||empty.termsTitle,
        termsContent:legal.termsContent||'',
        privacyTitle:legal.privacyTitle||empty.privacyTitle,
        privacyContent:legal.privacyContent||'',
        version:legal.version||'1.0',
        effectiveDate:toDateInput(legal.effectiveDate),
      });
    }catch(e){setError(e.message||String(e));}
    finally{setLoading(false);}
  },[]);

  React.useEffect(()=>{load();},[load]);

  async function save(){
    if(form.termsContent.trim().length<20||form.privacyContent.trim().length<20){
      setError('Vui lòng nhập đầy đủ cả Điều khoản sử dụng và Chính sách bảo mật.');return;
    }
    setSaving(true);setError('');setMessage('');
    try{
      await coreApiRequest('/api/v171/admin/legal',{
        method:'PUT',
        body:JSON.stringify({...form,effectiveDate:form.effectiveDate||null}),
      });
      setMessage('Đã lưu. User, Driver và Merchant sẽ đọc nội dung mới trực tiếp từ Backend.');
      await load();
    }catch(e){setError(e.message||String(e));}
    finally{setSaving(false);}
  }

  if(loading)return <section className="page"><div className="card"><RefreshCw className="spin" size={20}/> Đang tải chính sách...</div></section>;

  const activeContent=tab==='terms'?form.termsContent:form.privacyContent;
  const activeTitle=tab==='terms'?form.termsTitle:form.privacyTitle;

  return <section className="page legal-settings-page">
    <div className="page-head">
      <div>
        <h1>Điều khoản & Chính sách bảo mật</h1>
        <p>Admin nhập nội dung một lần; cả 3 ứng dụng lấy trực tiếp từ Core Backend.</p>
      </div>
      <div style={{display:'flex',gap:8}}>
        <button className="button" type="button" onClick={load}><RefreshCw size={16}/> Làm mới</button>
        <button className="button button-primary" type="button" disabled={saving} onClick={save}><Save size={16}/> {saving?'Đang lưu...':'Lưu & công bố'}</button>
      </div>
    </div>

    {error&&<div className="alert error">{error}</div>}
    {message&&<div className="alert success">{message}</div>}

    <div className="card" style={{marginBottom:16}}>
      <div style={{display:'grid',gridTemplateColumns:'minmax(120px,180px) minmax(180px,1fr) minmax(180px,1fr)',gap:12}}>
        <label><span>Phiên bản</span><input value={form.version} onChange={e=>setForm(v=>({...v,version:e.target.value}))} placeholder="1.0"/></label>
        <label><span>Ngày hiệu lực</span><input type="date" value={form.effectiveDate} onChange={e=>setForm(v=>({...v,effectiveDate:e.target.value}))}/></label>
        <div><span style={{display:'block',marginBottom:6}}>API công khai</span><code>/api/v171/legal</code></div>
      </div>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.25fr) minmax(320px,.75fr)',gap:16,alignItems:'start'}}>
      <div className="card">
        <div style={{display:'flex',gap:8,marginBottom:14}}>
          <button type="button" className={`button ${tab==='terms'?'button-primary':''}`} onClick={()=>setTab('terms')}><FileText size={16}/> Điều khoản</button>
          <button type="button" className={`button ${tab==='privacy'?'button-primary':''}`} onClick={()=>setTab('privacy')}><ShieldCheck size={16}/> Bảo mật</button>
        </div>

        {tab==='terms'?<>
          <label><span>Tiêu đề Điều khoản</span><input value={form.termsTitle} onChange={e=>setForm(v=>({...v,termsTitle:e.target.value}))}/></label>
          <label style={{display:'block',marginTop:12}}><span>Nội dung Điều khoản sử dụng</span><textarea rows={22} value={form.termsContent} onChange={e=>setForm(v=>({...v,termsContent:e.target.value}))} placeholder="Nhập toàn bộ Điều khoản sử dụng..." style={{width:'100%',resize:'vertical'}}/></label>
        </>:<>
          <label><span>Tiêu đề Chính sách bảo mật</span><input value={form.privacyTitle} onChange={e=>setForm(v=>({...v,privacyTitle:e.target.value}))}/></label>
          <label style={{display:'block',marginTop:12}}><span>Nội dung Chính sách bảo mật</span><textarea rows={22} value={form.privacyContent} onChange={e=>setForm(v=>({...v,privacyContent:e.target.value}))} placeholder="Nhập toàn bộ Chính sách bảo mật..." style={{width:'100%',resize:'vertical'}}/></label>
        </>}
      </div>

      <aside className="card" style={{position:'sticky',top:84}}>
        <div style={{fontWeight:900,fontSize:18,marginBottom:4}}>Xem trước trên ứng dụng</div>
        <div style={{color:'#7b7f8b',fontSize:13,marginBottom:16}}>Phiên bản {form.version||'1.0'}{form.effectiveDate?` · Hiệu lực ${form.effectiveDate}`:''}</div>
        <div style={{fontWeight:900,fontSize:22,lineHeight:1.25,marginBottom:14}}>{activeTitle}</div>
        <div style={{whiteSpace:'pre-wrap',lineHeight:1.65,maxHeight:560,overflow:'auto',fontSize:14}}>{activeContent||'Chưa có nội dung.'}</div>
      </aside>
    </div>
  </section>;
}
