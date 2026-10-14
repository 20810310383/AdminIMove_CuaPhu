import React from 'react';
import { ArrowRight, CalendarDays, Check, CheckCircle2, Clock3, Cloud, Eye, EyeOff, FileText, Globe2, LockKeyhole, MonitorSmartphone, RefreshCw, Save, ShieldCheck, Smartphone, TriangleAlert } from 'lucide-react';
import { coreApiRequest } from './coreApi.js';
import { hasPermission } from './adminApi.js';

const initialLegal = {
  termsTitle: 'Điều khoản sử dụng TH79 iMove',
  termsContent: '',
  privacyTitle: 'Chính sách bảo mật TH79 iMove',
  privacyContent: '',
  version: '1.0',
  effectiveDate: '',
};

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function normalizeLegal(legal = {}) {
  return {
    termsTitle: legal.termsTitle || initialLegal.termsTitle,
    termsContent: legal.termsContent || '',
    privacyTitle: legal.privacyTitle || initialLegal.privacyTitle,
    privacyContent: legal.privacyContent || '',
    version: legal.version || '1.0',
    effectiveDate: toDateInput(legal.effectiveDate),
  };
}

export default function LegalSettingsPage({ access }) {
  const canManage = !access || hasPermission(access, 'settings.manage');
  const [form, setForm] = React.useState(initialLegal);
  const [savedForm, setSavedForm] = React.useState(initialLegal);
  const [visible, setVisible] = React.useState(true);
  const [savedVisible, setSavedVisible] = React.useState(true);
  const [tab, setTab] = React.useState('terms');
  const [updatedAt, setUpdatedAt] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [savingLegal, setSavingLegal] = React.useState(false);
  const [savingVisibility, setSavingVisibility] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const [legalResult, settingsResult] = await Promise.all([
        coreApiRequest('/api/v171/admin/legal'),
        coreApiRequest('/api/v180/admin/app-settings'),
      ]);
      const nextLegal = normalizeLegal(legalResult?.legal);
      const nextVisible = settingsResult?.settings?.legalInformationEnabled !== false;
      setForm(nextLegal);
      setSavedForm(nextLegal);
      setVisible(nextVisible);
      setSavedVisible(nextVisible);
      setUpdatedAt(legalResult?.legal?.updatedAt || null);
    } catch (err) {
      setError(err?.message || 'Không thể tải nội dung pháp lý từ Backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const dirtyLegal = JSON.stringify(form) !== JSON.stringify(savedForm);
  const dirtyVisibility = visible !== savedVisible;
  const activeTitleKey = tab === 'terms' ? 'termsTitle' : 'privacyTitle';
  const activeContentKey = tab === 'terms' ? 'termsContent' : 'privacyContent';
  const hasValidContent = form.termsContent.trim().length >= 20 && form.privacyContent.trim().length >= 20;

  function edit(key, value) {
    setForm((old) => ({ ...old, [key]: value }));
    setSuccess('');
  }

  async function saveDocument() {
    if (loading || savingLegal || !canManage) return;
    setError('');
    setSuccess('');
    if (!form.termsTitle.trim() || !form.privacyTitle.trim() || !form.version.trim()) {
      setError('Vui lòng nhập tiêu đề cho cả hai tài liệu và phiên bản.');
      return;
    }
    if (!hasValidContent) {
      setError('Điều khoản sử dụng và Chính sách bảo mật đều phải có ít nhất 20 ký tự trước khi lưu.');
      return;
    }
    setSavingLegal(true);
    try {
      const result = await coreApiRequest('/api/v171/admin/legal', {
        method: 'PUT',
        body: JSON.stringify({
          ...form,
          termsTitle: form.termsTitle.trim(),
          privacyTitle: form.privacyTitle.trim(),
          version: form.version.trim(),
          effectiveDate: form.effectiveDate || null,
        }),
      });
      const next = normalizeLegal(result?.legal || form);
      setForm(next);
      setSavedForm(next);
      setUpdatedAt(result?.legal?.updatedAt || new Date().toISOString());
      setSuccess('Đã cập nhật Điều khoản và Chính sách bảo mật. Các app sẽ tải nội dung mới khi mở trang.');
    } catch (err) {
      setError(err?.message || 'Không lưu được nội dung pháp lý.');
    } finally {
      setSavingLegal(false);
    }
  }

  async function saveVisibility() {
    if (loading || savingVisibility || !canManage || !dirtyVisibility) return;
    setError('');
    setSuccess('');
    setSavingVisibility(true);
    try {
      // Chỉ cập nhật hiển thị pháp lý, không thay đổi otpVerificationEnabled.
      const result = await coreApiRequest('/api/v180/admin/app-settings', {
        method: 'PUT',
        body: JSON.stringify({ legalInformationEnabled: visible }),
      });
      const next = result?.settings?.legalInformationEnabled !== false;
      setVisible(next);
      setSavedVisible(next);
      setSuccess(`Đã ${next ? 'bật' : 'tắt'} hiển thị pháp lý cho User, Driver và Merchant.`);
    } catch (err) {
      setError(err?.message || 'Không lưu được trạng thái hiển thị.');
    } finally {
      setSavingVisibility(false);
    }
  }

  function refresh() {
    if ((dirtyLegal || dirtyVisibility) && !window.confirm('Bạn có thay đổi chưa lưu. Tải lại sẽ bỏ các chỉnh sửa đó. Tiếp tục?')) return;
    load();
  }

  const documents = [
    { key: 'terms', title: 'Điều khoản sử dụng', subtitle: 'Quy định & trách nhiệm', icon: FileText, count: form.termsContent.length },
    { key: 'privacy', title: 'Chính sách bảo mật', subtitle: 'Thu thập & bảo vệ dữ liệu', icon: LockKeyhole, count: form.privacyContent.length },
  ];
  const completedCount = documents.filter((doc) => doc.count >= 20).length;
  const prettyDate = form.effectiveDate
    ? new Date(`${form.effectiveDate}T12:00:00`).toLocaleDateString('vi-VN')
    : 'Chưa thiết lập';

  return (
    <section className="page legal-v4" aria-label="Quản trị điều khoản và chính sách TH79 iMove">
      <header className="legal-v4-hero">
        <div className="legal-v4-head-copy">
          <div className="legal-v4-breadcrumb"><span>QUẢN TRỊ ỨNG DỤNG</span><ArrowRight size={13} /><span>NỘI DUNG PHÁP LÝ</span></div>
          <h1>Điều khoản & Bảo mật</h1>
          <p>Quản lý nội dung pháp lý tại một nơi. Mọi thay đổi được đồng bộ đến ứng dụng TH79 iMove.</p>
        </div>
        <div className="legal-v4-head-actions">
          <button type="button" className="legal-v4-btn secondary" disabled={loading || savingLegal || savingVisibility} onClick={refresh}>
            <RefreshCw size={17} /> Làm mới
          </button>
          <button type="button" className="legal-v4-btn primary" disabled={loading || savingLegal || !canManage || !dirtyLegal} onClick={saveDocument}>
            <Save size={17} /> {savingLegal ? 'Đang lưu...' : 'Lưu nội dung'}
          </button>
        </div>
      </header>

      {error && <div className="legal-v4-alert error" role="alert"><TriangleAlert size={19} />{error}</div>}
      {success && <div className="legal-v4-alert success" role="status"><CheckCircle2 size={19} />{success}</div>}
      {!canManage && <div className="legal-v4-alert info" role="status"><LockKeyhole size={18} /> Tài khoản chỉ có quyền xem. Cần quyền settings.manage để chỉnh sửa hoặc xuất bản.</div>}

      {loading ? (
        <div className="legal-v4-loading" role="status"><RefreshCw className="spin" size={20} /> Đang tải dữ liệu pháp lý từ Backend...</div>
      ) : (
        <>
          <div className="legal-v4-overview" aria-label="Tổng quan tài liệu">
            <div className="legal-v4-stat">
              <span className="legal-v4-stat-icon red"><FileText size={20} /></span>
              <div><small>TÀI LIỆU ĐÃ SOẠN</small><strong>{completedCount}<em> / 2</em></strong><span>{completedCount === 2 ? 'Đã đủ nội dung' : 'Còn tài liệu cần hoàn thiện'}</span></div>
            </div>
            <div className="legal-v4-stat">
              <span className="legal-v4-stat-icon blue"><Clock3 size={20} /></span>
              <div><small>PHIÊN BẢN HIỆN TẠI</small><strong>v{form.version || '1.0'}</strong><span>Hiệu lực: {prettyDate}</span></div>
            </div>
            <div className="legal-v4-stat">
              <span className="legal-v4-stat-icon green"><Cloud size={20} /></span>
              <div><small>ĐỒNG BỘ ỨNG DỤNG</small><strong className="legal-v4-stat-caption">User · Driver · Merchant</strong><span>Tự tải nội dung mới từ Backend</span></div>
            </div>
          </div>

          <div className="legal-v4-publish">
            <div className="legal-v4-publish-copy">
              <span className={`legal-v4-publish-icon ${visible ? 'active' : ''}`}>{visible ? <Eye size={21} /> : <EyeOff size={21} />}</span>
              <div>
                <div className="legal-v4-row-title"><h2>Hiển thị trên ứng dụng</h2><span className={`legal-v4-live ${savedVisible ? 'on' : 'off'}`}><i /> {savedVisible ? 'Đang hiển thị' : 'Đang ẩn'}</span></div>
                <p>Khi bật, khách hàng, tài xế và đối tác có thể truy cập nội dung pháp lý. Tắt hiển thị không xóa dữ liệu đã lưu.</p>
              </div>
            </div>
            <div className="legal-v4-publish-tools">
              <label className="legal-v4-switch">
                <input type="checkbox" checked={visible} disabled={!canManage || savingVisibility} onChange={(e) => { setVisible(e.target.checked); setSuccess(''); }} aria-label="Bật hoặc tắt hiển thị Điều khoản và Chính sách trên ứng dụng" />
                <span className="legal-v4-switch-track" aria-hidden="true" />
                <b>{visible ? 'Bật' : 'Tắt'}</b>
              </label>
              <button type="button" className="legal-v4-btn tertiary" disabled={!canManage || !dirtyVisibility || savingVisibility} onClick={saveVisibility}>
                <Save size={16} /> {savingVisibility ? 'Đang lưu...' : 'Lưu trạng thái'}
              </button>
              {dirtyVisibility && <small className="legal-v4-pending">Chưa lưu thay đổi</small>}
            </div>
          </div>

          <div className="legal-v4-workspace">
            <div className="legal-v4-main">
              <section className="legal-v4-card legal-v4-editor" aria-label="Trình soạn thảo tài liệu">
                <div className="legal-v4-card-heading">
                  <div><span className="legal-v4-section-index">01 / BIÊN TẬP</span><h2>Nội dung pháp lý</h2><p>Chọn tài liệu và chỉnh sửa trực tiếp bên dưới.</p></div>
                  {dirtyLegal ? <span className="legal-v4-dirty"><i /> Chưa lưu</span> : <span className="legal-v4-synced"><Check size={13} /> Đã đồng bộ</span>}
                </div>
                <div className="legal-v4-tabs" role="tablist" aria-label="Chọn tài liệu pháp lý">
                  {documents.map((doc) => {
                    const Icon = doc.icon;
                    return (
                      <button key={doc.key} type="button" role="tab" aria-selected={tab === doc.key} className={`legal-v4-tab ${tab === doc.key ? 'active' : ''}`} onClick={() => setTab(doc.key)}>
                        <span className="legal-v4-tab-icon"><Icon size={20} /></span>
                        <span className="legal-v4-tab-text"><b>{doc.title}</b><small>{doc.subtitle}</small></span>
                        <span className={`legal-v4-tab-tick ${doc.count >= 20 ? 'complete' : ''}`}>{doc.count >= 20 ? <Check size={15} /> : '!'}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="legal-v4-editor-inner">
                  <div className="legal-v4-editor-top"><div><strong>{tab === 'terms' ? 'Biên soạn điều khoản' : 'Biên soạn chính sách'}</strong><span>Nội dung được lưu an toàn trên Backend</span></div><span className="legal-v4-plaintext">VĂN BẢN THUẦN</span></div>
                  <label className="legal-v4-field">
                    <span>Tiêu đề tài liệu <b>*</b></span>
                    <input value={form[activeTitleKey]} onChange={(e) => edit(activeTitleKey, e.target.value)} maxLength={240} disabled={!canManage} placeholder="Nhập tiêu đề hiển thị trên ứng dụng" />
                  </label>
                  <label className="legal-v4-field legal-v4-content-field">
                    <span>Nội dung chi tiết <b>*</b></span>
                    <textarea value={form[activeContentKey]} onChange={(e) => edit(activeContentKey, e.target.value)} maxLength={30000} disabled={!canManage} placeholder={tab === 'terms' ? 'Ví dụ bố cục:\n\n1. Giới thiệu dịch vụ\n2. Quyền và nghĩa vụ người dùng\n3. Đặt và hủy chuyến\n4. Trách nhiệm các bên...' : 'Ví dụ bố cục:\n\n1. Dữ liệu được thu thập\n2. Mục đích và phạm vi sử dụng\n3. Bảo mật, lưu trữ dữ liệu\n4. Quyền của chủ thể dữ liệu...'} />
                  </label>
                  <div className="legal-v4-editor-counter"><span>{form[activeContentKey].length.toLocaleString('vi-VN')} / 30.000 ký tự</span><span>{form[activeContentKey].trim().length >= 20 ? <><Check size={14} /> Đã đủ độ dài</> : 'Tối thiểu 20 ký tự'}</span></div>
                </div>
                <div className="legal-v4-editor-foot">
                  <div className="legal-v4-foot-note"><ShieldCheck size={18} /><span>Cần có nội dung cho <b>cả hai tài liệu</b> để lưu phiên bản mới.</span></div>
                  <button type="button" className="legal-v4-btn primary" disabled={savingLegal || !canManage || !dirtyLegal} onClick={saveDocument}>
                    <Save size={16} /> {savingLegal ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </section>

              <section className="legal-v4-card legal-v4-version" aria-label="Thiết lập phiên bản">
                <div className="legal-v4-card-heading compact"><div><span className="legal-v4-section-index">02 / PHIÊN BẢN</span><h2>Thông tin phát hành</h2></div></div>
                <div className="legal-v4-version-fields">
                  <label className="legal-v4-field"><span>Phiên bản</span><input value={form.version} onChange={(e) => edit('version', e.target.value)} maxLength={40} disabled={!canManage} placeholder="Ví dụ: 1.0" /></label>
                  <label className="legal-v4-field"><span><CalendarDays size={15} /> Ngày hiệu lực</span><input type="date" value={form.effectiveDate} onChange={(e) => edit('effectiveDate', e.target.value)} disabled={!canManage} /></label>
                </div>
                <div className="legal-v4-last-update"><Clock3 size={16} /><span>Cập nhật lần cuối: <b>{updatedAt ? new Date(updatedAt).toLocaleString('vi-VN') : 'Chưa có bản cập nhật'}</b></span></div>
              </section>
            </div>

            <aside className="legal-v4-card legal-v4-preview" aria-label="Bản xem trước nội dung trên ứng dụng">
              <div className="legal-v4-card-heading preview-heading"><div><span className="legal-v4-section-index">03 / XEM TRƯỚC</span><h2>Giao diện trên điện thoại</h2><p>Xem thử nội dung khi người dùng mở trong app.</p></div><MonitorSmartphone size={23} /></div>
              <div className="legal-v4-device-area">
                <div className="legal-v4-device">
                  <div className="legal-v4-device-camera" />
                  <div className="legal-v4-device-screen">
                    <div className="legal-v4-device-status"><span>9:41</span><span>●●● <Smartphone size={12} /></span></div>
                    <div className="legal-v4-appbar"><span className="legal-v4-app-logo">i<span>MOVE</span></span><span className="legal-v4-appbar-label">Trung tâm hỗ trợ</span></div>
                    <div className="legal-v4-document-view">
                      <div className="legal-v4-view-icon">{tab === 'terms' ? <FileText size={22} /> : <ShieldCheck size={22} />}</div>
                      <div className="legal-v4-view-kind">TH79 iMove · {tab === 'terms' ? 'Điều khoản' : 'Quyền riêng tư'}</div>
                      <h3>{form[activeTitleKey] || 'Chưa có tiêu đề'}</h3>
                      <div className="legal-v4-view-meta">Phiên bản {form.version || '1.0'} {form.effectiveDate ? `· ${prettyDate}` : ''}</div>
                      <div className="legal-v4-document-text">{form[activeContentKey] || 'Bản xem trước sẽ tự động hiển thị khi bạn nhập nội dung ở khung soạn thảo.'}</div>
                    </div>
                    <div className="legal-v4-home-indicator" />
                  </div>
                </div>
              </div>
              <div className="legal-v4-preview-footer"><Globe2 size={18} /><p>Bản xem trước là mô phỏng nội dung, không phải ảnh chụp màn hình thật. Các app sẽ tải bản đã lưu khi mở trang pháp lý.</p></div>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
