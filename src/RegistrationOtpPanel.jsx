import React from 'react';
import { Check, CheckCircle2, LockKeyhole, MessageSquareLock, RefreshCw, Save, ShieldAlert, ShieldCheck, Smartphone, Store, TriangleAlert, UserRound, CarFront } from 'lucide-react';
import { coreApiRequest } from './coreApi.js';
import { hasPermission } from './adminApi.js';

/**
 * Cấu hình OTP đăng ký cho cả ba app.
 * Độc lập với /api/v73/admin/config để không ghi đè Security Test Mode.
 */
export default function RegistrationOtpPanel({ access }) {
  const canManage = !access || hasPermission(access, 'settings.manage');
  const [enabled, setEnabled] = React.useState(true);
  const [savedEnabled, setSavedEnabled] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await coreApiRequest('/api/v180/admin/app-settings');
      const next = result?.settings?.otpVerificationEnabled !== false;
      setEnabled(next);
      setSavedEnabled(next);
    } catch (err) {
      setError(err?.message || 'Không tải được cấu hình OTP từ Backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function save() {
    if (!canManage || loading || saving || enabled === savedEnabled) return;
    if (!enabled && !window.confirm('Tắt OTP sẽ cho phép User, Driver và Merchant đăng ký mà không xác minh số điện thoại. Bạn có chắc chắn?')) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // Chỉ cập nhật OTP; backend giữ nguyên legalInformationEnabled.
      const result = await coreApiRequest('/api/v180/admin/app-settings', {
        method: 'PUT',
        body: JSON.stringify({ otpVerificationEnabled: enabled }),
      });
      const next = result?.settings?.otpVerificationEnabled !== false;
      setEnabled(next);
      setSavedEnabled(next);
      setSuccess('Đã lưu lên Backend. Các lần đăng ký mới trên cả ba app sẽ áp dụng cài đặt này.');
    } catch (err) {
      setError(err?.message || 'Không lưu được cài đặt OTP.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="otp-v4" aria-labelledby="security-otp-title">
      <header className="otp-v4-header">
        <div className="otp-v4-heading">
          <span className="otp-v4-main-icon"><MessageSquareLock size={23} /></span>
          <div>
            <span className="otp-v4-eyebrow">BẢO MẬT TÀI KHOẢN · ĐĂNG KÝ</span>
            <h3 id="security-otp-title">Xác thực OTP khi đăng ký</h3>
            <p>Kiểm soát bước xác minh số điện thoại cho cả 3 ứng dụng từ một công tắc.</p>
          </div>
        </div>
        <span className={`otp-v4-state ${savedEnabled ? 'active' : 'inactive'}`}><i />{loading ? 'Đang tải...' : savedEnabled ? 'Đang hoạt động' : 'Đã tạm tắt'}</span>
      </header>

      <div className="otp-v4-body">
        <div className="otp-v4-setting">
          <div className="otp-v4-setting-copy">
            <span className="otp-v4-setting-icon"><Smartphone size={21} /></span>
            <div><strong>Yêu cầu xác minh số điện thoại</strong><p>{enabled ? 'Tài khoản mới phải nhập mã OTP hợp lệ trước khi đăng ký thành công.' : 'Bỏ qua bước OTP, người dùng có thể tiếp tục đăng ký trực tiếp.'}</p></div>
          </div>
          <label className="otp-v4-control">
            <input type="checkbox" checked={enabled} disabled={loading || saving || !canManage} onChange={(event) => { setEnabled(event.target.checked); setSuccess(''); }} aria-label="Bật hoặc tắt xác thực OTP khi đăng ký" />
            <span className="otp-v4-track" aria-hidden="true" />
            <b>{enabled ? 'BẬT' : 'TẮT'}</b>
          </label>
        </div>
        <div className="otp-v4-apps-head">ỨNG DỤNG ĐƯỢC ÁP DỤNG</div>
        <div className="otp-v4-apps">
          <div><span className="otp-v4-app-icon user"><UserRound size={17} /></span><b>User</b><small>Khách hàng</small><Check size={16} /></div>
          <div><span className="otp-v4-app-icon driver"><CarFront size={18} /></span><b>Driver</b><small>Tài xế</small><Check size={16} /></div>
          <div><span className="otp-v4-app-icon merchant"><Store size={18} /></span><b>Merchant</b><small>Đối tác</small><Check size={16} /></div>
        </div>

        {!enabled && <div className="otp-v4-warning" role="note"><TriangleAlert size={19} /><div><strong>Cảnh báo bảo mật</strong><p>Số điện thoại của tài khoản mới sẽ không được kiểm chứng bằng SMS. Chỉ tắt OTP khi kiểm thử hoặc đã chấp nhận rủi ro.</p></div></div>}
        {enabled !== savedEnabled && !loading && <div className="otp-v4-pending"><ShieldAlert size={17} />Trạng thái mới chưa được lưu lên Backend.</div>}
        {error && <div className="otp-v4-error" role="alert"><TriangleAlert size={17} />{error}</div>}
        {success && <div className="otp-v4-success" role="status"><CheckCircle2 size={17} />{success}</div>}
      </div>

      <footer className="otp-v4-footer">
        <div className="otp-v4-footer-note"><ShieldCheck size={18} /><span>Lưu độc lập với cấu hình Security Test Mode và Điều khoản & Bảo mật.</span></div>
        <div className="otp-v4-actions">
          <button type="button" className="otp-v4-btn secondary" onClick={load} disabled={loading || saving}><RefreshCw size={16} /> Làm mới</button>
          <button type="button" className="otp-v4-btn primary" onClick={save} disabled={loading || saving || !canManage || enabled === savedEnabled}><Save size={16} />{saving ? 'Đang lưu...' : 'Lưu trạng thái OTP'}</button>
        </div>
      </footer>
      {!canManage && <div className="otp-v4-readonly"><LockKeyhole size={15} /> Tài khoản cần quyền settings.manage để chỉnh sửa OTP.</div>}
    </section>
  );
}
