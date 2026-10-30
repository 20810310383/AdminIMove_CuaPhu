import React from 'react';
import { Plus, Save, RefreshCw, Trash2, CircleDollarSign } from 'lucide-react';
import { coreApiRequest } from './coreApi.js';
import { hasPermission } from './adminApi.js';

const API='/api/v16/admin/commerce/merchant-fees';
const money = value => new Intl.NumberFormat('vi-VN').format(Number(value || 0))+' đ';
const css = {input:{width:'100%',padding:'10px 12px',borderRadius:10,border:'1px solid #dedfe4',fontSize:14,boxSizing:'border-box'},row:{display:'grid',gridTemplateColumns:'minmax(160px,2fr) minmax(135px,1.2fr) minmax(125px,1fr) minmax(135px,1.2fr) 95px 42px',gap:12,alignItems:'center',padding:'12px 0',borderBottom:'1px solid #eceef1'}};
const blank = () => ({id:'fee_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,5),name:'',method:'PERCENT',value:0,merchantId:'',enabled:true});

export default function MerchantFeesPage({access}){
  const canEdit=hasPermission(access,'merchants.manage');
  const [rules,setRules]=React.useState([]);
  const [revision,setRevision]=React.useState(0);
  const [state,setState]=React.useState('loading');
  const [message,setMessage]=React.useState('');
  const load=React.useCallback(async()=>{
    setState('loading');setMessage('');
    try{const data=await coreApiRequest(API);setRules(data.rules||[]);setRevision(data.revision||0);setState('ready');}
    catch(error){setMessage(error.message);setState('error');}
  },[]);
  React.useEffect(()=>{load();},[load]);
  function edit(idx,key,value){setRules(rows=>rows.map((row,i)=>i===idx?{...row,[key]:value}:row));}
  async function save(){
    setState('saving');setMessage('');
    try{
      const payload=rules.map(r=>({...r,value:Number(r.value),merchantId:String(r.merchantId||'').trim()||null}));
      const data=await coreApiRequest(API,{method:'PUT',body:JSON.stringify({revision,rules:payload})});
      setRevision(data.revision);setRules(data.rules);setState('ready');setMessage('Đã lưu biểu phí. Đơn hàng tạo sau thời điểm này sử dụng biểu phí mới.');
    }catch(error){setState('error');setMessage(error.message);}
  }
  return <section className="v14-page" style={{maxWidth:1250,margin:'0 auto',padding:'20px 12px'}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
      <div><span className="v14-eyebrow">COMMERCE / MERCHANT FEES</span><h1 style={{margin:'5px 0'}}>Cấu hình phí Merchant</h1><p>Admin tự đặt tên và mức phí. Phí % tính trên tổng tiền món; phí cố định tính một lần mỗi đơn.</p></div>
      <button className="button" onClick={load} disabled={state==='loading'||state==='saving'}><RefreshCw size={16}/> Làm mới</button>
    </div>
    <div className="card" style={{padding:20,borderRadius:18,marginTop:20}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
        <div><h2 style={{margin:0}}>Danh mục các khoản phí</h2><small>Phiên bản biểu phí #{revision} • Không có phí nào mặc định</small></div>
        {canEdit&&<button className="button" onClick={()=>setRules(rows=>[...rows,blank()])} disabled={rules.length>=30}><Plus size={16}/> Thêm loại phí</button>}
      </div>
      {rules.length===0&&<p style={{padding:'20px 0',color:'#626b7a'}}>Chưa cấu hình khoản phí nào. Nhà hàng tạm nhận toàn bộ tiền món trước các điều chỉnh khác.</p>}
      <div style={{overflowX:'auto'}}>
        <div style={{minWidth:780}}>
        {rules.map((rule,i)=><div key={rule.id} style={css.row}>
          <label><small>Tên khoản phí</small><input style={css.input} value={rule.name} maxLength={90} disabled={!canEdit} onChange={e=>edit(i,'name',e.target.value)} placeholder="Ví dụ: Phí nền tảng"/></label>
          <label><small>Kiểu tính phí</small><select style={css.input} value={rule.method} disabled={!canEdit} onChange={e=>edit(i,'method',e.target.value)}><option value="PERCENT">% tiền món</option><option value="FIXED">VND / đơn</option></select></label>
          <label><small>{rule.method==='PERCENT'?'Tỷ lệ (%)':'Số tiền (VND)'}</small><input style={css.input} type="number" step={rule.method==='PERCENT'?'0.01':'1'} min="0" max={rule.method==='PERCENT'?'100':'100000000'} disabled={!canEdit} value={rule.value} onChange={e=>edit(i,'value',e.target.value)}/></label>
          <label><small>Merchant ID (để trống = tất cả)</small><input style={css.input} value={rule.merchantId||''} maxLength={24} disabled={!canEdit} onChange={e=>edit(i,'merchantId',e.target.value)} placeholder="Toàn hệ thống"/></label>
          <label><small>Áp dụng</small><select style={css.input} value={rule.enabled?'yes':'no'} disabled={!canEdit} onChange={e=>edit(i,'enabled',e.target.value==='yes')}><option value="yes">Bật</option><option value="no">Tắt</option></select></label>
          <button className="button" title="Xóa khoản phí" style={{alignSelf:'end'}} disabled={!canEdit} onClick={()=>setRules(rows=>rows.filter((_,index)=>index!==i))}><Trash2 size={16}/></button>
        </div>)}
        </div>
      </div>
      {message&&<div role="status" style={{background:'#f5f7fa',padding:14,marginTop:14,borderRadius:10,color:state==='error'?'#c62037':'#14764a'}}>{message}</div>}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginTop:20,flexWrap:'wrap'}}>
        <p style={{maxWidth:700,color:'#646b77',fontSize:13}}>Các giá trị được lưu trong MongoDB, có nhật ký Admin. Đơn đã tạo sẽ giữ snapshot phí cũ; việc hoàn tiền và thuế cần đối soát riêng.</p>
        {canEdit&&<button className="button button-primary" onClick={save} disabled={state==='saving'||state==='loading'}><Save size={16}/>{state==='saving'?'Đang lưu...':'Lưu biểu phí'}</button>}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,color:'#6b7280'}}><CircleDollarSign size={16}/> Ví dụ giá bán 20.000 đ, phí nền tảng 15% và phí cố định 500 đ → thực thu 16.500 đ. Đây chỉ là ví dụ, không phải mức phí mặc định.</div>
    </div>
  </section>;
}
