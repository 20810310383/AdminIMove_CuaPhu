import React from 'react';
import {
  Save,
  RefreshCw,
  ShieldCheck,
  FileText,
  MessageSquareLock,
  Eye,
  EyeOff,
  TriangleAlert,
} from 'lucide-react';
import { coreApiRequest } from './coreApi.js';

const empty = {
  termsTitle: 'Điều khoản sử dụng TH79 iMove',
  termsContent: '',
  privacyTitle: 'Chính sách bảo mật TH79 iMove',
  privacyContent: '',
  version: '1.0',
  effectiveDate: '',
};

const defaultFeatures = {
  otpVerificationEnabled: true,
  legalInformationEnabled: true,
};

function toDateInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function ToggleCard({ icon, title, description, checked, onChange, danger }) {
  return (
    <div
      style={{
        border: `1px solid ${danger && !checked ? '#fecaca' : '#e5e7eb'}`,
        borderRadius: 16,
        padding: 16,
        background: danger && !checked ? '#fff7f7' : '#fff',
        display: 'flex',
        gap: 14,
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 13,
          display: 'grid',
          placeItems: 'center',
          background: checked ? '#fff1f2' : '#f3f4f6',
          color: checked ? '#ef233c' : '#6b7280',
          flex: '0 0 auto',
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>
        <div style={{ color: '#6b7280', marginTop: 4, lineHeight: 1.45, fontSize: 13 }}>
          {description}
        </div>
      </div>
      <label
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          fontWeight: 800,
          color: checked ? '#15803d' : '#b91c1c',
          whiteSpace: 'nowrap',
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ width: 20, height: 20 }}
        />
        {checked ? 'Đang bật' : 'Đang tắt'}
      </label>
    </div>
  );
}

export default function LegalSettingsPage() {
  const [form, setForm] = React.useState(empty);
  const [features, setFeatures] = React.useState(defaultFeatures);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [tab, setTab] = React.useState('terms');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [legalData, featureData] = await Promise.all([
        coreApiRequest('/api/v171/admin/legal'),
        coreApiRequest('/api/v180/admin/app-settings'),
      ]);

      const legal = legalData?.legal || {};
      const nextFeatures = featureData?.settings || {};

      setForm({
        termsTitle: legal.termsTitle || empty.termsTitle,
        termsContent: legal.termsContent || '',
        privacyTitle: legal.privacyTitle || empty.privacyTitle,
        privacyContent: legal.privacyContent || '',
        version: legal.version || '1.0',
        effectiveDate: toDateInput(legal.effectiveDate),
      });

      setFeatures({
        otpVerificationEnabled:
          typeof nextFeatures.otpVerificationEnabled === 'boolean'
            ? nextFeatures.otpVerificationEnabled
            : true,
        legalInformationEnabled:
          typeof nextFeatures.legalInformationEnabled === 'boolean'
            ? nextFeatures.legalInformationEnabled
            : true,
      });
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (
      features.legalInformationEnabled &&
      (form.termsContent.trim().length < 20 || form.privacyContent.trim().length < 20)
    ) {
      setError('Khi đang bật thông tin pháp lý, vui lòng nhập đầy đủ Điều khoản và Chính sách bảo mật.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await coreApiRequest('/api/v180/admin/app-settings', {
        method: 'PUT',
        body: JSON.stringify(features),
      });

      const hasLegalContent =
        form.termsContent.trim().length >= 20 && form.privacyContent.trim().length >= 20;

      if (features.legalInformationEnabled || hasLegalContent) {
        await coreApiRequest('/api/v171/admin/legal', {
          method: 'PUT',
          body: JSON.stringify({
            ...form,
            effectiveDate: form.effectiveDate || null,
          }),
        });
      }

      setMessage(
        'Đã lưu. User, Driver và Merchant sẽ áp dụng trạng thái mới trực tiếp từ Core Backend.',
      );
      await load();
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="page">
        <div className="card">
          <RefreshCw className="spin" size={20} /> Đang tải cài đặt...
        </div>
      </section>
    );
  }

  const activeContent = tab === 'terms' ? form.termsContent : form.privacyContent;
  const activeTitle = tab === 'terms' ? form.termsTitle : form.privacyTitle;

  return (
    <section className="page legal-settings-page">
      <div className="page-head">
        <div>
          <h1>Xác thực OTP & Chính sách ứng dụng</h1>
          <p>Tắt/bật trực tiếp cho User, Driver và Merchant mà không cần build lại Backend.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="button" type="button" onClick={load}>
            <RefreshCw size={16} /> Làm mới
          </button>
          <button className="button button-primary" type="button" disabled={saving} onClick={save}>
            <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu & áp dụng'}
          </button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 12 }}>Tính năng đăng ký & pháp lý</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 12 }}>
          <ToggleCard
            icon={<MessageSquareLock size={23} />}
            title="Xác thực OTP khi đăng ký"
            description="Bật: User/Driver/Merchant phải nhận và nhập OTP. Tắt: các app bỏ qua bước SMS OTP và đăng ký trực tiếp."
            checked={features.otpVerificationEnabled}
            onChange={(value) =>
              setFeatures((old) => ({ ...old, otpVerificationEnabled: value }))
            }
            danger
          />

          <ToggleCard
            icon={features.legalInformationEnabled ? <Eye size={23} /> : <EyeOff size={23} />}
            title="Hiển thị Điều khoản & Chính sách bảo mật"
            description="Tắt: ứng dụng ẩn phần thông tin pháp lý trong luồng đăng ký và trang pháp lý không hiển thị nội dung. Nội dung vẫn được giữ lại để bật lại sau."
            checked={features.legalInformationEnabled}
            onChange={(value) =>
              setFeatures((old) => ({ ...old, legalInformationEnabled: value }))
            }
          />
        </div>

        {!features.otpVerificationEnabled && (
          <div
            style={{
              marginTop: 14,
              padding: 13,
              borderRadius: 13,
              background: '#fff7ed',
              color: '#9a3412',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <TriangleAlert size={20} style={{ marginTop: 1, flex: '0 0 auto' }} />
            <div>
              <strong>OTP đang tắt.</strong> Số điện thoại mới sẽ không được xác minh bằng SMS khi đăng ký.
              Chỉ nên tắt trong giai đoạn test hoặc khi bạn chủ động chấp nhận rủi ro này.
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16, opacity: features.legalInformationEnabled ? 1 : 0.72 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(120px,180px) minmax(180px,1fr) minmax(180px,1fr)',
            gap: 12,
          }}
        >
          <label>
            <span>Phiên bản</span>
            <input
              value={form.version}
              onChange={(e) => setForm((v) => ({ ...v, version: e.target.value }))}
              placeholder="1.0"
            />
          </label>
          <label>
            <span>Ngày hiệu lực</span>
            <input
              type="date"
              value={form.effectiveDate}
              onChange={(e) => setForm((v) => ({ ...v, effectiveDate: e.target.value }))}
            />
          </label>
          <div>
            <span style={{ display: 'block', marginBottom: 6 }}>API công khai</span>
            <code>/api/v171/legal</code>
            <br />
            <code>/api/v180/app-settings</code>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1.25fr) minmax(320px,.75fr)',
          gap: 16,
          alignItems: 'start',
        }}
      >
        <div className="card">
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button
              type="button"
              className={`button ${tab === 'terms' ? 'button-primary' : ''}`}
              onClick={() => setTab('terms')}
            >
              <FileText size={16} /> Điều khoản
            </button>
            <button
              type="button"
              className={`button ${tab === 'privacy' ? 'button-primary' : ''}`}
              onClick={() => setTab('privacy')}
            >
              <ShieldCheck size={16} /> Bảo mật
            </button>
          </div>

          {tab === 'terms' ? (
            <>
              <label>
                <span>Tiêu đề Điều khoản</span>
                <input
                  value={form.termsTitle}
                  onChange={(e) => setForm((v) => ({ ...v, termsTitle: e.target.value }))}
                />
              </label>
              <label style={{ display: 'block', marginTop: 12 }}>
                <span>Nội dung Điều khoản sử dụng</span>
                <textarea
                  rows={22}
                  value={form.termsContent}
                  onChange={(e) => setForm((v) => ({ ...v, termsContent: e.target.value }))}
                  placeholder="Nhập toàn bộ Điều khoản sử dụng..."
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </label>
            </>
          ) : (
            <>
              <label>
                <span>Tiêu đề Chính sách bảo mật</span>
                <input
                  value={form.privacyTitle}
                  onChange={(e) => setForm((v) => ({ ...v, privacyTitle: e.target.value }))}
                />
              </label>
              <label style={{ display: 'block', marginTop: 12 }}>
                <span>Nội dung Chính sách bảo mật</span>
                <textarea
                  rows={22}
                  value={form.privacyContent}
                  onChange={(e) => setForm((v) => ({ ...v, privacyContent: e.target.value }))}
                  placeholder="Nhập toàn bộ Chính sách bảo mật..."
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </label>
            </>
          )}
        </div>

        <aside className="card" style={{ position: 'sticky', top: 84 }}>
          <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>Xem trước trên ứng dụng</div>
          <div style={{ color: '#7b7f8b', fontSize: 13, marginBottom: 16 }}>
            Phiên bản {form.version || '1.0'}
            {form.effectiveDate ? ` · Hiệu lực ${form.effectiveDate}` : ''}
          </div>
          {!features.legalInformationEnabled ? (
            <div style={{ padding: 18, borderRadius: 14, background: '#f3f4f6', color: '#6b7280' }}>
              Phần Điều khoản & Chính sách bảo mật hiện đang <strong>TẮT</strong> trên ứng dụng.
            </div>
          ) : (
            <>
              <div style={{ fontWeight: 900, fontSize: 22, lineHeight: 1.25, marginBottom: 14 }}>
                {activeTitle}
              </div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65, maxHeight: 560, overflow: 'auto', fontSize: 14 }}>
                {activeContent || 'Chưa có nội dung.'}
              </div>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
