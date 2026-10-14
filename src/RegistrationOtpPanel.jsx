import React from 'react';
import {
  CheckCircle2, LockKeyhole, MessageSquareLock, RefreshCw, Save,
  ShieldAlert, ShieldCheck, Smartphone, Store, TriangleAlert, UserRound, CarFront,
} from 'lucide-react';
import { coreApiRequest } from './coreApi.js';
import { coreUrl, fetchWithTimeout } from './apiRuntime.js';
import { hasPermission } from './adminApi.js';

// Cấu hình OTP đăng ký nằm trong MongoDB app_feature_settings.
// Không trộn với securityMode / production config (app_settings) hay cấu hình pháp lý.
async function getPublicRegistrationSettings() {
  let response;
  try {
    response = await fetchWithTimeout(coreUrl('/api/v180/app-settings'), {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    }, 15000);
  } catch (error) {
    throw new Error(`Không truy cập được API OTP công khai: ${error.message || error}`);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok || typeof body?.settings?.otpVerificationEnabled !== 'boolean') {
    throw new Error(`API /api/v180/app-settings chưa sẵn sàng (HTTP ${response.status}). Hãy triển khai Backend v15 trước Admin.`);
  }
  return body.settings.otpVerificationEnabled;
}

export default function RegistrationOtpPanel({ access }) {
  const canManage = !access || hasPermission(access, 'settings.manage');
  const [enabled, setEnabled] = React.useState(true);
  const [savedEnabled, setSavedEnabled] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [publicState, setPublicState] = React.useState(null);
  const [lastChecked, setLastChecked] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await coreApiRequest('/api/v180/admin/app-settings');
      if (typeof result?.settings?.otpVerificationEnabled !== 'boolean') {
        throw new Error('Backend không trả otpVerificationEnabled. Kiểm tra đã cập nhật route v180.');
      }
      const saved = result.settings.otpVerificationEnabled;
      setEnabled(saved);
      setSavedEnabled(saved);
      const publicValue = await getPublicRegistrationSettings();
      setPublicState(publicValue);
      setLastChecked(new Date().toLocaleTimeString('vi-VN'));
      if (publicValue !== saved) {
        setError('Cấu hình Admin và API công khai không trùng nhau. Kiểm tra Admin và các app có cùng kết nối đến một Backend/MongoDB.');
      }
    } catch (err) {
      setPublicState(null);
      setSavedEnabled(null);
      setError(err?.message || 'Không tải được cấu hình OTP từ Backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function save() {
    if (!canManage || loading || saving || savedEnabled === null || enabled === savedEnabled) return;
    if (!enabled && !window.confirm('Tắt OTP cho phép User, Driver và Merchant đăng ký không xác minh số điện thoại. Bạn có chắc chắn muốn tiếp tục?')) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const result = await coreApiRequest('/api/v180/admin/app-settings', {
        method: 'PUT',
        body: JSON.stringify({ otpVerificationEnabled: enabled }),
      });
      if (result?.settings?.otpVerificationEnabled !== enabled) {
        throw new Error('Backend không xác nhận trạng thái OTP được yêu cầu.');
      }
      // Xác minh từ đúng API mà 3 app đọc, không chỉ tin phản hồi PUT.
      const publicValue = await getPublicRegistrationSettings();
      setSavedEnabled(result.settings.otpVerificationEnabled);
      setPublicState(publicValue);
      setLastChecked(new Date().toLocaleTimeString('vi-VN'));
      if (publicValue !== enabled) {
        throw new Error('Đã lưu Admin nhưng API công khai chưa đồng bộ. Kiểm tra Backend/MongoDB trước khi thử đăng ký.');
      }
      setSuccess(`Đã xác nhận trên Backend: OTP ${enabled ? 'BẬT' : 'TẮT'} cho đăng ký mới của User / Driver / Merchant.`);
    } catch (err) {
      setError(err?.message || 'Không lưu được cài đặt OTP.');
    } finally {
      setSaving(false);
    }
  }

  const synchronized = savedEnabled !== null && publicState === savedEnabled;
  return (
    <section className="otp-v15" aria-labelledby="registration-otp-title">
      <div className="otp-v15-head">
        <span className="otp-v15-head-icon"><MessageSquareLock size={25} /></span>
        <div>
          <div className="otp-v15-caption">CÀI ĐẶT ĐĂNG KÝ · TÁC ĐỘNG CẢ 3 APP</div>
          <h2 id="registration-otp-title">Bật / tắt xác thực OTP</h2>
          <p>Tách riêng khỏi Production / Test Mode. Bật/tắt tại đây có hiệu lực trong cả hai chế độ.</p>
        </div>
        <div className={`otp-v15-sync ${synchronized ? 'ok' : 'warn'}`}>
          {synchronized ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
          {loading ? 'Đang kiểm tra...' : synchronized ? `Đã đồng bộ ${lastChecked}` : 'Chưa xác nhận đồng bộ'}
        </div>
      </div>
      <div className="otp-v15-control-row">
        <div className="otp-v15-copy">
          <strong>Yêu cầu SMS OTP khi tạo tài khoản</strong>
          <span>{enabled ? 'BẬT: đăng ký phải xác minh số điện thoại trước khi tạo tài khoản.' : 'TẮT: đăng ký trực tiếp không cần gửi hoặc nhập OTP.'}</span>
        </div>
        <label className="otp-v15-toggle">
          <input type="checkbox" checked={enabled} disabled={loading || saving || !canManage || savedEnabled === null} onChange={(event) => { setEnabled(event.target.checked); setSuccess(''); }} aria-label="Bật hoặc tắt OTP cho cả ba ứng dụng" />
          <span className="otp-v15-toggle-track" aria-hidden="true" />
          <b>{loading ? '...' : enabled ? 'ĐANG BẬT' : 'ĐANG TẮT'}</b>
        </label>
      </div>
      <div className="otp-v15-apps">
        <div><UserRound size={20} /><strong>User</strong><small>Khách hàng</small></div>
        <div><CarFront size={21} /><strong>Driver</strong><small>Tài xế</small></div>
        <div><Store size={20} /><strong>Merchant</strong><small>Nhà hàng</small></div>
      </div>
      {!enabled && <div className="otp-v15-warning"><TriangleAlert size={18} /> Tắt OTP làm giảm mức độ xác minh số điện thoại. Chỉ bật chế độ này khi bạn chấp nhận rủi ro.</div>}
      {savedEnabled !== null && enabled !== savedEnabled && <div className="otp-v15-pending">Bạn đã thay đổi công tắc nhưng chưa lưu lên Backend.</div>}
      {error && <div className="otp-v15-error" role="alert"><ShieldAlert size={18} /><span>{error}</span></div>}
      {success && <div className="otp-v15-success" role="status"><CheckCircle2 size={18} /><span>{success}</span></div>}
      <div className="otp-v15-actions">
        <span><ShieldCheck size={16} /> API chung: <code>/api/v180/app-settings</code></span>
        <div>
          <button type="button" className="button" disabled={loading || saving} onClick={load}><RefreshCw size={16} /> Làm mới</button>
          <button type="button" className="button button-primary" disabled={loading || saving || !canManage || savedEnabled === null || enabled === savedEnabled} onClick={save}><Save size={16} /> {saving ? 'Đang xác minh...' : 'Lưu OTP'}</button>
        </div>
      </div>
      {!canManage && <div className="otp-v15-readonly"><LockKeyhole size={16} /> Cần quyền settings.manage để bật/tắt OTP.</div>}
    </section>
  );
}
