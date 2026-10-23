import React from 'react';
import { Activity, Database, MapPinned, RefreshCw, Server, ShieldCheck, Globe2, Clock3, Power, AlertTriangle } from 'lucide-react';
import { adminApiRequest } from './adminApi.js';
import { CORE_BACKEND_URL } from './apiRuntime.js';
import { trackAsiaConfig, usesTrackAsiaPublicTestKey } from './trackAsiaConfig.js';
import { PageError, PageLoading } from './AdminPageState.jsx';

const WEB_TEST_PATH = '/v188/admin/web-test-cors';
const activeStyle = { color: '#047857', fontWeight: 800 };
const inactiveStyle = { color: '#9a3412', fontWeight: 800 };

function WebTestAccessPanel() {
  const [config, setConfig] = React.useState(null);
  const [canManage, setCanManage] = React.useState(false);
  const [duration, setDuration] = React.useState(60);
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminApiRequest(WEB_TEST_PATH);
      setConfig(result.config || { enabled: false });
      setCanManage(result.canManage === true);
    } catch (e) {
      setError(e.message || String(e));
    } finally { setLoading(false); }
  }, []);

  React.useEffect(() => {
    load();
    const timer = window.setInterval(load, 30000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function toggle(enabled) {
    if (!canManage || busy) return;
    if (enabled && !window.confirm('Bật kiểm thử Flutter Web từ localhost trong thời gian giới hạn? Đây là quyền truy cập trình duyệt để phát triển, không thay đổi quyền đăng nhập.')) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await adminApiRequest(WEB_TEST_PATH, {
        method: 'PUT',
        body: JSON.stringify({ enabled, minutes: duration }),
      });
      setConfig(result.config);
      setNotice(enabled ? 'Đã bật kiểm thử Web. Cấu hình sẽ tự hết hạn; có thể mất khoảng 2 giây để đồng bộ các tiến trình Backend.' : 'Đã tắt kiểm thử Web.');
    } catch (e) { setError(e.message || String(e)); }
    finally { setBusy(false); }
  }

  const enabled = config?.enabled === true;
  const deadline = config?.expiresAt && enabled
    ? new Date(config.expiresAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
    : null;

  return <section className="card enterprise-panel" style={{ marginTop: 16 }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <div>
        <h2 style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Globe2 size={20} color="#e11d48" /> Kiểm thử Flutter Web</h2>
        <p>Bật/tắt quyền truy cập Backend từ Chrome localhost ngay trên Admin, không sửa .env hay khởi động lại VPS mỗi lần.</p>
      </div>
      <button type="button" className="button" onClick={load} disabled={loading || busy}>
        <RefreshCw size={15} /> Làm mới
      </button>
    </header>

    <div style={{ padding: 16, border: '1px solid #e4e7ec', borderRadius: 14, background: '#fafbfc', marginTop: 12 }}>
      {loading && !config ? <p>Đang tải cấu hình từ MongoDB...</p> : <>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, fontWeight: 700, cursor: canManage ? 'pointer' : 'not-allowed' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Power size={18} color={enabled ? '#059669' : '#9ca3af'} /> Cho phép kiểm thử Flutter Web
          </span>
          <input
            aria-label="Bật hoặc tắt kiểm thử Flutter Web"
            type="checkbox"
            checked={enabled}
            disabled={!canManage || busy || loading || Boolean(error && !config)}
            onChange={(event) => toggle(event.target.checked)}
            style={{ height: 21, width: 21, accentColor: '#e11d48', cursor: 'pointer' }}
          />
        </label>
        <p style={enabled ? activeStyle : inactiveStyle}>{enabled ? 'ĐANG BẬT – chỉ localhost được phép truy cập' : 'ĐANG TẮT – localhost không được cấp CORS'}</p>
        {deadline && <p style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '8px 0' }}><Clock3 size={16} /> Tự tắt lúc: <b>{deadline}</b> (giờ thiết bị của bạn)</p>}
        {!canManage && <p style={{ color: '#64748b', fontSize: 13 }}>Bạn cần quyền <code>settings.manage</code> để thay đổi chế độ này.</p>}
        <label style={{ display: 'block', marginTop: 12, fontWeight: 600, maxWidth: 280 }}>
          Thời gian tự tắt
          <select
            aria-label="Thời gian mở kiểm thử Web"
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
            disabled={busy || !canManage || enabled}
            style={{ display: 'block', marginTop: 6, border: '1px solid #d0d5dd', borderRadius: 9, padding: '9px 12px', background: '#fff', width: '100%' }}>
            <option value={30}>30 phút</option>
            <option value={60}>60 phút</option>
            <option value={120}>120 phút</option>
          </select>
        </label>
        <p style={{ fontSize: 13, color: '#667085', marginTop: 12 }}>
          Chỉ áp dụng <code>http://localhost:PORT</code> và <code>http://127.0.0.1:PORT</code> (cổng 1024–65535).
          Website ngoài máy tính của bạn không được mở thêm quyền CORS.
        </p>
        <p style={{ fontSize: 13, color: '#667085' }}>Sau khi bật, thử chạy <code>flutter run -d chrome --web-port 53549</code> rồi đăng nhập trên Chrome. Các kiểm tra JWT, phân quyền và HTTPS production vẫn giữ nguyên.</p>
      </>}
    </div>
    {notice && <p role="status" style={{ color: '#047857', marginTop: 10 }}>{notice}</p>}
    {error && <p role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b42318', marginTop: 10 }}><AlertTriangle size={16} /> {error}</p>}
    <p style={{ fontSize: 12, color: '#667085', marginTop: 10 }}>Bảo mật: Tắt ngay sau khi thử; chỉ bật khi bạn kiểm soát các dịch vụ localhost trên máy. Mỗi lần bật/tắt được ghi nhật ký Admin và chế độ sẽ hết hạn tự động.</p>
  </section>;
}

export default function SettingsPage() {
  const [state, setState] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const backend = await adminApiRequest('/health');
      setState({ backend });
    } catch (caught) {
      setError(caught.message || String(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  if (loading && !state) return <PageLoading text="Đang kiểm tra hệ thống..." />;
  if (error && !state) return <PageError message={error} onRetry={load} />;

  const backend = state?.backend || {};
  const connected = backend.success === true;

  return <section className="enterprise-page">
    <header className="enterprise-page-head">
      <div>
        <span className="enterprise-eyebrow">SYSTEM CONFIGURATION</span>
        <h1>Cài đặt hệ thống</h1>
        <p>Admin Web gọi trực tiếp Core Backend; không có Admin Gateway riêng.</p>
      </div>
      <button className="button" onClick={load}><RefreshCw size={15} />Kiểm tra lại</button>
    </header>
    {error && <div className="v73-alert">{error}</div>}
    <div className="settings-health-grid">
      <article><Server /><span>Core Backend</span><b>{connected ? 'Đã kết nối' : 'Mất kết nối'}</b><small>{CORE_BACKEND_URL}</small></article>
      <article><Activity /><span>Admin Console</span><b>{backend.mergedIntoCore ? 'Đã hợp nhất' : 'Chưa xác nhận'}</b><small>Chạy trong Core Backend</small></article>
      <article><Database /><span>MongoDB Atlas</span><b>{backend.state === 'CONNECTED' ? 'Connected' : 'Kiểm tra Backend'}</b><small>{backend.database || 'th79_imove'}</small></article>
      <article><MapPinned /><span>TrackAsia</span><b>{usesTrackAsiaPublicTestKey() ? 'Test key' : 'Configured'}</b><small>{trackAsiaConfig.detailLevel || 'enhanced'} · {trackAsiaConfig.styleUrl ? 'Custom style' : 'Streets v2'}</small></article>
    </div>
    <WebTestAccessPanel />
    <section className="card enterprise-panel">
      <header><div><h2>Contract phát triển</h2><p>Admin Web chỉ dùng API công khai của Backend.</p></div><ShieldCheck size={18} /></header>
      <div className="settings-contract"><code>Core Backend API</code><code>Vite 5173</code><code>VITE_CORE_BACKEND_URL</code><code>VITE_TRACKASIA_API_KEY</code></div>
    </section>
  </section>;
}
