import React from 'react';
import {
  Activity, AlertCircle, CheckCircle2, ChevronDown, Clock3, Copy,
  Database, Globe2, LockKeyhole, MapPinned, Power,
  RefreshCw, Server, ShieldCheck, Terminal, WifiOff,
} from 'lucide-react';
import { adminApiRequest } from './adminApi.js';
import { CORE_BACKEND_URL } from './apiRuntime.js';
import { trackAsiaConfig, usesTrackAsiaPublicTestKey } from './trackAsiaConfig.js';
import './settings-redesign.css';

const WEB_TEST_PATH = '/v188/admin/web-test-cors';
const WEB_TEST_COMMAND = 'flutter run -d chrome --web-port 53549';

function formatExpiry(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function webTestErrorMessage(error) {
  const message = String(error?.message || error || 'Không thể kết nối Backend.');
  if (/\b404\b/.test(message)) {
    return {
      title: 'Backend chưa có API bật/tắt kiểm thử Web',
      message: 'API /api/v188/admin/web-test-cors trả về 404. Bạn cần triển khai phần Backend của bản vá Kiểm thử Flutter Web lên VPS một lần rồi tải lại. Thay đổi giao diện Admin không tự tạo API trên VPS.',
      kind: 'missing-api',
    };
  }
  if (/\b403\b|không đủ quyền|permission/i.test(message)) {
    return {
      title: 'Tài khoản chưa có quyền truy cập',
      message: 'Cần quyền settings.view để xem và settings.manage để bật/tắt. Hãy kiểm tra phân quyền tài khoản Admin.',
      kind: 'permission',
    };
  }
  if (/\b401\b|chưa đăng nhập|phiên/i.test(message)) {
    return {
      title: 'Phiên đăng nhập không hợp lệ',
      message: 'Đăng nhập lại Admin và thử kiểm tra trạng thái kiểm thử Web.',
      kind: 'auth',
    };
  }
  return {
    title: 'Không tải được cấu hình kiểm thử',
    message,
    kind: 'connection',
  };
}

function HealthTile({ icon: Icon, label, value, sub, mode = 'neutral' }) {
  return (
    <article className={`imove-health-tile imove-health-tile--${mode}`}>
      <div className="imove-health-tile__top">
        <span className="imove-health-tile__icon"><Icon size={19} strokeWidth={2} /></span>
        <span className={`imove-health-dot imove-health-dot--${mode}`} />
      </div>
      <p className="imove-health-tile__label">{label}</p>
      <strong className="imove-health-tile__value">{value}</strong>
      <p className="imove-health-tile__sub" title={sub}>{sub}</p>
    </article>
  );
}

function WebTestAccessPanel() {
  const [config, setConfig] = React.useState(null);
  const [canManage, setCanManage] = React.useState(false);
  const [duration, setDuration] = React.useState(60);
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [issue, setIssue] = React.useState(null);
  const [notice, setNotice] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const load = React.useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const result = await adminApiRequest(WEB_TEST_PATH);
      setConfig(result?.config || { enabled: false });
      setCanManage(result?.canManage === true);
      setIssue(null);
    } catch (error) {
      setIssue(webTestErrorMessage(error));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    // Refresh status while mounted. Errors are displayed, not hidden.
    const interval = window.setInterval(() => load({ silent: true }), 60000);
    return () => window.clearInterval(interval);
  }, [load]);

  const enabled = config?.enabled === true;
  const deadline = enabled ? formatExpiry(config?.expiresAt) : null;
  const canToggle = Boolean(config) && !issue && canManage && !loading && !busy;

  async function toggle() {
    if (!canToggle) return;
    const nextEnabled = !enabled;
    if (nextEnabled && !window.confirm(`Cho phép Chrome localhost truy cập Backend trong ${duration} phút? JWT và quyền API vẫn được giữ nguyên.`)) return;
    setBusy(true);
    setNotice('');
    try {
      const result = await adminApiRequest(WEB_TEST_PATH, {
        method: 'PUT',
        body: JSON.stringify({ enabled: nextEnabled, minutes: duration }),
      });
      setConfig(result?.config || { enabled: nextEnabled });
      setIssue(null);
      setNotice(nextEnabled ? 'Đã bật kiểm thử Web. Chế độ sẽ tự tắt khi hết thời hạn.' : 'Đã tắt kiểm thử Flutter Web.');
    } catch (error) {
      setIssue(webTestErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(WEB_TEST_COMMAND);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      setCopied(false);
    }
  }

  return (
    <section className="imove-settings-card imove-webtest-card" aria-labelledby="imove-webtest-title">
      <header className="imove-section-header">
        <div className="imove-section-header__main">
          <span className="imove-section-icon imove-section-icon--red"><Globe2 size={20} /></span>
          <div>
            <h2 id="imove-webtest-title">Kiểm thử Flutter Web</h2>
            <p>Cho phép truy cập từ Chrome localhost, không cần sửa cấu hình VPS mỗi lần.</p>
          </div>
        </div>
        <div className="imove-section-header__actions">
          <span className={`imove-status-pill imove-status-pill--${issue ? 'error' : enabled ? 'on' : 'off'}`}>
            <span className="imove-status-pill__dot" />
            {issue ? 'Cần kiểm tra' : loading && !config ? 'Đang tải' : enabled ? 'Đang bật' : 'Đang tắt'}
          </span>
          <button type="button" className="imove-icon-action" disabled={busy || loading} onClick={() => load()} title="Tải lại trạng thái" aria-label="Kiểm tra lại trạng thái kiểm thử Web">
            <RefreshCw size={17} className={loading ? 'imove-spin' : ''}/>
          </button>
        </div>
      </header>

      {issue && (
        <div className="imove-api-alert" role="alert">
          <AlertCircle size={20}/>
          <div>
            <strong>{issue.title}</strong>
            <p>{issue.message}</p>
          </div>
          <button type="button" className="imove-subtle-btn" onClick={() => load()}>Thử lại</button>
        </div>
      )}

      <div className="imove-webtest-grid">
        <div className="imove-webtest-settings">
          <div className="imove-webtest-toggle-row">
            <span className={`imove-power-circle${enabled ? ' is-on' : ''}`}><Power size={22}/></span>
            <div className="imove-webtest-toggle-text">
              <strong>Cho phép kiểm thử trên trình duyệt</strong>
              <span>{enabled ? 'CORS localhost đang được cho phép tạm thời' : 'Bật khi cần chạy User / Driver / Merchant trên Web'}</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-label="Cho phép kiểm thử Flutter Web"
              aria-checked={enabled}
              disabled={!canToggle}
              onClick={toggle}
              className={`imove-switch${enabled ? ' is-on' : ''}`}
              title={issue ? 'Backend chưa sẵn sàng' : !canManage ? 'Cần quyền settings.manage' : enabled ? 'Tắt kiểm thử' : 'Bật kiểm thử'}
            ><span /></button>
          </div>

          <div className="imove-webtest-rule" />

          <div className="imove-webtest-controls">
            <label htmlFor="imove-webtest-duration">
              <span>Thời gian tự tắt</span>
              <select
                id="imove-webtest-duration"
                value={duration}
                onChange={event => setDuration(Number(event.target.value))}
                disabled={loading || busy || !canManage || enabled || Boolean(issue)}
              >
                <option value={30}>30 phút</option>
                <option value={60}>60 phút</option>
                <option value={120}>120 phút</option>
              </select>
            </label>
            <div className="imove-webtest-expiry">
              <Clock3 size={17}/>
              <span>{deadline ? <>Tự tắt: <b>{deadline}</b></> : 'Tự động tắt sau thời gian đã chọn'}</span>
            </div>
          </div>

          {config && !canManage && !issue && (
            <p className="imove-permission-note"><LockKeyhole size={15}/> Bạn có quyền xem. Cần <code>settings.manage</code> để thay đổi.</p>
          )}
          {notice && <p className="imove-success-note" role="status"><CheckCircle2 size={16}/>{notice}</p>}

          <div className="imove-webtest-note">
            <ShieldCheck size={18}/>
            <span>Chỉ mở cho <code>localhost</code> hoặc <code>127.0.0.1</code> trong thời gian giới hạn. Không vô hiệu hóa JWT, OTP hay phân quyền.</span>
          </div>
        </div>

        <aside className="imove-webtest-guide" aria-label="Hướng dẫn thử nhanh">
          <div className="imove-webtest-guide__heading"><Terminal size={19}/><strong>Chạy thử nhanh</strong></div>
          <div className="imove-guide-step"><span>1</span><p>Bật công tắc và chọn thời hạn.</p></div>
          <div className="imove-guide-step"><span>2</span><p>Mở PowerShell trong thư mục app Flutter:</p></div>
          <div className="imove-command">
            <code>{WEB_TEST_COMMAND}</code>
            <button type="button" onClick={copyCommand} aria-label="Sao chép lệnh Flutter Web" title="Sao chép lệnh"><Copy size={15}/></button>
          </div>
          {copied && <span className="imove-copy-notice" role="status">Đã sao chép lệnh</span>}
          <div className="imove-guide-step"><span>3</span><p>Đăng nhập và kiểm tra chức năng; tắt chế độ khi hoàn tất.</p></div>
        </aside>
      </div>
    </section>
  );
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

  const backend = state?.backend || {};
  const connected = backend.success === true;
  const mongoConnected = backend.state === 'CONNECTED';

  return (
    <section className="enterprise-page imove-settings-page">
      <header className="enterprise-page-head imove-settings-page-head">
        <div>
          <span className="enterprise-eyebrow">SYSTEM CONFIGURATION</span>
          <h1>Cài đặt hệ thống</h1>
          <p>Theo dõi kết nối và quản lý quyền kiểm thử trực tiếp trên Admin.</p>
        </div>
        <button className="button imove-settings-refresh" type="button" onClick={load} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'imove-spin' : ''}/>
          {loading ? 'Đang kiểm tra' : 'Kiểm tra hệ thống'}
        </button>
      </header>

      {error && <div className="imove-health-error" role="alert"><AlertCircle size={17}/><span>Không tải được trạng thái hệ thống: {error}</span></div>}

      <div className="settings-health-grid imove-settings-health">
        <HealthTile icon={connected ? Server : WifiOff} label="Core Backend" value={loading && !state ? 'Đang kiểm tra…' : connected ? 'Đã kết nối' : 'Chưa xác nhận'} sub={CORE_BACKEND_URL} mode={connected ? 'success' : 'warning'}/>
        <HealthTile icon={Activity} label="Admin Console" value={backend.mergedIntoCore ? 'Đã hợp nhất' : 'Đang kiểm tra'} sub="Chạy cùng Core Backend" mode={backend.mergedIntoCore ? 'success' : 'neutral'}/>
        <HealthTile icon={Database} label="MongoDB Atlas" value={mongoConnected ? 'Connected' : 'Chưa xác nhận'} sub={backend.database || 'th79_imove'} mode={mongoConnected ? 'success' : 'warning'}/>
        <HealthTile icon={MapPinned} label="TrackAsia" value={usesTrackAsiaPublicTestKey() ? 'Test key' : 'Đã cấu hình'} sub={`${trackAsiaConfig.detailLevel || 'enhanced'} · ${trackAsiaConfig.styleUrl ? 'Custom style' : 'Streets v2'}`} mode={usesTrackAsiaPublicTestKey() ? 'warning' : 'neutral'}/>
      </div>

      <WebTestAccessPanel />

      <details className="imove-settings-card imove-contract-details">
        <summary><span className="imove-section-icon"><ShieldCheck size={19}/></span><span><strong>Thông tin cấu hình phát triển</strong><small>Các API và biến cấu hình liên quan tới Admin Web</small></span><ChevronDown size={18}/></summary>
        <div className="imove-contract-tags"><code>Core Backend API</code><code>Vite 5173</code><code>VITE_CORE_BACKEND_URL</code><code>VITE_TRACKASIA_API_KEY</code></div>
      </details>
    </section>
  );
}
