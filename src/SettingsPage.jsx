import React from 'react';
import { Activity, Database, MapPinned, RefreshCw, Server, ShieldCheck } from 'lucide-react';
import { adminApiRequest } from './adminApi.js';
import { CORE_BACKEND_URL } from './apiRuntime.js';
import { trackAsiaConfig, usesTrackAsiaPublicTestKey } from './trackAsiaConfig.js';
import { PageError, PageLoading } from './AdminPageState.jsx';

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
    <section className="card enterprise-panel">
      <header><div><h2>Contract phát triển</h2><p>Admin Web chỉ dùng API công khai của Backend.</p></div><ShieldCheck size={18} /></header>
      <div className="settings-contract"><code>Core Backend API</code><code>Vite 5173</code><code>VITE_CORE_BACKEND_URL</code><code>VITE_TRACKASIA_API_KEY</code></div>
    </section>
  </section>;
}
