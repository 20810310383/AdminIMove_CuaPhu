import React from 'react';
import { FileText, ShieldCheck, Save, RefreshCw, Eye, EyeOff, CalendarDays, TriangleAlert, CheckCircle2, Smartphone, Truck, Store, MonitorSmartphone } from './adminPngLucide.jsx';
import { coreApiRequest } from './coreApi.js';
import { hasPermission } from './adminApi.js';
import LegalRichEditor, { plainDocument } from './LegalRichEditor.jsx';
import './legal-v23.css';

const APPS = [
  { id: 'USER', name: 'iMOVE User', description: 'Khách hàng sử dụng dịch vụ', icon: Smartphone },
  { id: 'DRIVER', name: 'iMOVE Driver', description: 'Tài xế và cộng tác viên vận chuyển', icon: Truck },
  { id: 'MERCHANT', name: 'iMOVE Merchant', description: 'Đối tác nhà hàng và cửa hàng', icon: Store },
];
function dateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}
function normalize(raw = {}, app = 'USER') {
  return {
    termsTitle: raw.termsTitle || `Điều khoản sử dụng iMOVE ${app}`,
    termsRich: Array.isArray(raw.termsRich) ? raw.termsRich : [],
    privacyTitle: raw.privacyTitle || `Chính sách bảo mật iMOVE ${app}`,
    privacyRich: Array.isArray(raw.privacyRich) ? raw.privacyRich : [],
    version: raw.version || '1.0', effectiveDate: dateInput(raw.effectiveDate),
    enabled: raw.enabled !== false,
  };
}
const empty = (app) => normalize({}, app);

function Preview({ title, rich, version, effectiveDate, app, kind }) {
  return <div className="legal23-preview-sheet">
    <div className="legal23-preview-brand">i<span>MOVE</span> <small>{app}</small></div>
    <div className="legal23-preview-category">{kind === 'terms' ? 'ĐIỀU KHOẢN SỬ DỤNG' : 'CHÍNH SÁCH BẢO MẬT'}</div>
    <h2>{title}</h2>
    <p className="legal23-preview-date">Phiên bản {version || '1.0'}{effectiveDate ? ` · Hiệu lực ${effectiveDate}` : ''}</p>
    <div className="legal23-preview-contents">
      {(rich || []).map((block, i) => {
        const child = (block.runs || []).map((run, j) => {
          const style = { fontWeight: run.bold ? 800 : undefined, fontStyle: run.italic ? 'italic' : undefined, textDecoration: run.underline ? 'underline' : undefined, color: run.color || undefined };
          return run.href ? <a key={j} href={run.href} target="_blank" rel="noreferrer" style={style}>{run.text}</a> : <span key={j} style={style}>{run.text}</span>;
        });
        const key = `${i}-${block.type}`;
        const blockStyle = { textAlign: block.align || 'left' };
        if (block.type === 'h2') return <h3 key={key} style={blockStyle}>{child}</h3>;
        if (block.type === 'h3') return <h4 key={key} style={blockStyle}>{child}</h4>;
        if (block.type === 'bullet') return <div className="legal23-list-bullet" key={key} style={blockStyle}>• {child}</div>;
        if (block.type === 'number') return <div className="legal23-list-bullet" key={key} style={blockStyle}>{i + 1}. {child}</div>;
        if (block.type === 'quote') return <blockquote key={key} style={blockStyle}>{child}</blockquote>;
        return <p key={key} style={blockStyle}>{child}</p>;
      })}
      {(!rich || !rich.length) && <p>Chưa có nội dung. Hãy soạn thảo tài liệu ở bên trái.</p>}
    </div>
  </div>;
}

export default function LegalSettingsPage({ access }) {
  const canManage = !access || hasPermission(access, 'settings.manage');
  const [app, setApp] = React.useState('USER');
  const [kind, setKind] = React.useState('terms');
  const [form, setForm] = React.useState(empty('USER'));
  const [saved, setSaved] = React.useState(empty('USER'));
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState('');
  const [error, setError] = React.useState('');
  const [updatedAt, setUpdatedAt] = React.useState(null);
  const loadSequence = React.useRef(0);
  const pending = JSON.stringify(form) !== JSON.stringify(saved);
  const appMeta = APPS.find((x) => x.id === app);
  const currentRichKey = kind === 'terms' ? 'termsRich' : 'privacyRich';
  const currentTitleKey = kind === 'terms' ? 'termsTitle' : 'privacyTitle';
  const update = React.useCallback((key, value) => {
    setForm((old) => ({ ...old, [key]: value }));
    setNotice('');
  }, []);

  const load = React.useCallback(async (target) => {
    const requestId = ++loadSequence.current;
    setLoading(true); setError(''); setNotice('');
    try {
      const result = await coreApiRequest(`/api/v171/admin/legal?app=${target}`);
      if (requestId !== loadSequence.current) return;
      const next = normalize(result?.legal, target);
      setForm(next); setSaved(next); setUpdatedAt(result?.legal?.updatedAt || null);
    } catch (err) { if (requestId === loadSequence.current) setError(err?.message || 'Không đọc được nội dung pháp lý của ứng dụng.'); }
    finally { if (requestId === loadSequence.current) setLoading(false); }
  }, []);
  React.useEffect(() => { load(app); return () => { loadSequence.current += 1; }; }, [app, load]);

  function switchApp(next) {
    if (next === app) return;
    if (pending && !window.confirm('Bạn có thay đổi chưa lưu. Chuyển ứng dụng sẽ bỏ các chỉnh sửa đó. Tiếp tục?')) return;
    setKind('terms'); setApp(next);
  }
  async function save() {
    if (!canManage || saving || loading) return;
    setError(''); setNotice('');
    const termsLen = plainDocument(form.termsRich).trim().length;
    const privacyLen = plainDocument(form.privacyRich).trim().length;
    if ((termsLen > 0 && termsLen < 20) || (privacyLen > 0 && privacyLen < 20) || (!termsLen && !privacyLen)) return setError('Mỗi tài liệu đã nhập phải có ít nhất 20 ký tự. Bạn có thể lưu Điều khoản trước và soạn Bảo mật sau.');
    if (termsLen > 30000 || privacyLen > 30000) return setError('Mỗi tài liệu không được vượt quá 30.000 ký tự.');
    if (!form.termsTitle.trim() || !form.privacyTitle.trim() || !form.version.trim()) return setError('Vui lòng điền tiêu đề và phiên bản.');
    setSaving(true);
    try {
      const result = await coreApiRequest(`/api/v171/admin/legal?app=${app}`, {
        method: 'PUT', body: JSON.stringify({ ...form, app, effectiveDate: form.effectiveDate || null }),
      });
      const updated = normalize(result?.legal, app);
      setForm(updated); setSaved(updated);
      setUpdatedAt(result?.legal?.updatedAt || new Date().toISOString());
      setNotice(`Đã lưu riêng Điều khoản và Chính sách bảo mật cho ${appMeta.name}.`);
    } catch (err) { setError(err?.message || 'Không lưu được nội dung.'); }
    finally { setSaving(false); }
  }
  function refresh() {
    if (pending && !window.confirm('Tải lại sẽ bỏ nội dung chưa lưu. Tiếp tục?')) return;
    load(app);
  }
  const countTerms = plainDocument(form.termsRich).length;
  const countPrivacy = plainDocument(form.privacyRich).length;
  return <section className="page legal23" aria-label="Quản lý điều khoản và bảo mật riêng cho ba ứng dụng">
    <div className="legal23-hero">
      <div><small>TH79 iMOVE / QUẢN TRỊ NỘI DUNG</small><h1>Điều khoản & Bảo mật</h1>
        <p>Quản lý 6 tài liệu độc lập dành cho khách hàng, tài xế và đối tác. Soạn thảo có định dạng, xem trước và lưu trực tiếp vào MongoDB.</p></div>
      <div className="legal23-header-actions">
        <button type="button" onClick={refresh} disabled={loading || saving}><RefreshCw size={16} /> Làm mới</button>
        <button type="button" className="legal23-primary" onClick={save} disabled={!canManage || saving || loading || !pending}><Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
      </div>
    </div>
    {!!error && <div role="alert" className="legal23-alert error"><TriangleAlert size={18}/>{error}</div>}
    {!!notice && <div role="status" className="legal23-alert success"><CheckCircle2 size={18}/>{notice}</div>}
    {!canManage && <div className="legal23-alert">Chế độ chỉ xem · Yêu cầu quyền settings.manage để chỉnh sửa.</div>}
    <div className="legal23-app-tabs" role="tablist" aria-label="Chọn ứng dụng">
      {APPS.map((item) => {
        const Icon = item.icon;
        return <button key={item.id} type="button" role="tab" aria-selected={app === item.id}
          onClick={() => switchApp(item.id)} className={app === item.id ? 'active' : ''}>
          <span className="legal23-app-icon"><Icon size={21} /></span><span><strong>{item.name}</strong><small>{item.description}</small></span>
          {app === item.id && <CheckCircle2 size={17} className="legal23-active-check" />}
        </button>;
      })}
    </div>
    {loading ? <div className="legal23-loader">Đang tải nội dung {appMeta.name}...</div> : <>
      <div className="legal23-status">
        <div><b>{appMeta.name}</b><span>Điều khoản: {countTerms >= 20 ? 'Đã có nội dung' : 'Cần hoàn thiện'} · Bảo mật: {countPrivacy >= 20 ? 'Đã có nội dung' : 'Cần hoàn thiện'} {updatedAt ? `· Sửa lần cuối ${new Date(updatedAt).toLocaleString('vi-VN')}` : ''}</span></div>
        <label className="legal23-enable"><input type="checkbox" checked={form.enabled} disabled={!canManage} onChange={(e) => update('enabled', e.target.checked)}/>
          {form.enabled ? <Eye size={17}/> : <EyeOff size={17}/>} {form.enabled ? 'Hiển thị trên app' : 'Đang ẩn trên app'}</label>
      </div>
      <div className="legal23-document-tabs" role="tablist" aria-label="Loại tài liệu">
        <button type="button" role="tab" aria-selected={kind === 'terms'} onClick={() => setKind('terms')} className={kind === 'terms' ? 'active' : ''}><FileText size={19} /> Điều khoản sử dụng <span>{countTerms.toLocaleString('vi-VN')} ký tự</span></button>
        <button type="button" role="tab" aria-selected={kind === 'privacy'} onClick={() => setKind('privacy')} className={kind === 'privacy' ? 'active' : ''}><ShieldCheck size={19} /> Chính sách bảo mật <span>{countPrivacy.toLocaleString('vi-VN')} ký tự</span></button>
      </div>
      <div className="legal23-workspace">
        <div className="legal23-card legal23-edit">
          <div className="legal23-panel-heading"><h2>Soạn thảo {kind === 'terms' ? 'Điều khoản sử dụng' : 'Chính sách bảo mật'}</h2><p>Bôi đen đoạn văn để định dạng giống Word: đậm, nghiêng, gạch chân, tiêu đề, danh sách và liên kết.</p></div>
          <label className="legal23-field"><span>Tiêu đề tài liệu</span><input value={form[currentTitleKey]} onChange={(e) => update(currentTitleKey, e.target.value)} maxLength={240} disabled={!canManage}/></label>
          <div className="legal23-field"><span>Nội dung có định dạng</span><LegalRichEditor key={`${app}-${kind}`} value={form[currentRichKey]} onChange={(next) => update(currentRichKey, next)} disabled={!canManage}/>
            <small>{plainDocument(form[currentRichKey]).length.toLocaleString('vi-VN')} / 30.000 ký tự · Các đường dẫn chỉ chấp nhận HTTPS/HTTP</small></div>
          <div className="legal23-release-fields">
            <label className="legal23-field"><span>Phiên bản của {appMeta.name}</span><input value={form.version} onChange={(e) => update('version', e.target.value)} maxLength={40} disabled={!canManage} /></label>
            <label className="legal23-field"><span><CalendarDays size={15}/> Ngày hiệu lực</span><input type="date" value={form.effectiveDate} onChange={(e) => update('effectiveDate', e.target.value)} disabled={!canManage}/></label>
          </div>
          <div className="legal23-editor-foot"><small>{pending ? '● Có chỉnh sửa chưa lưu' : '✓ Đã đồng bộ với Backend'} · Lưu riêng cho {appMeta.name}</small><button type="button" className="legal23-primary" onClick={save} disabled={!canManage || saving || !pending}><Save size={16}/> {saving ? 'Đang lưu...' : 'Lưu tài liệu'}</button></div>
        </div>
        <aside className="legal23-card legal23-preview"><div className="legal23-panel-heading"><h2><MonitorSmartphone size={19}/> Xem trước trên app</h2><p>Hiển thị định dạng tương tự màn Điều khoản trong ứng dụng.</p></div>
          <Preview app={appMeta.name} kind={kind} title={form[currentTitleKey]} rich={form[currentRichKey]} version={form.version} effectiveDate={form.effectiveDate}/>
        </aside>
      </div>
    </>}
  </section>;
}
