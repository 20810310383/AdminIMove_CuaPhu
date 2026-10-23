import React from 'react';
import AdminOverlayPortal from './AdminOverlayPortal.jsx';
import { coreApiRequest } from './coreApi.js';
import { History, Minus, RefreshCw, X, Save } from './adminPngLucide.jsx';
import './driver-points-modal.css';

const formatPoints = (value) => new Intl.NumberFormat('vi-VN').format(Number(value) || 0);
const dateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN');
};
const isDebit = (row) => Number(row?.points) < 0 || row?.direction === 'DEBIT';
const validId = (value) => /^[0-9a-f]{24}$/i.test(String(value || ''));
const uniqueKey = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  if (globalThis.crypto?.getRandomValues) {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  throw new Error('Trình duyệt không hỗ trợ tạo khóa giao dịch an toàn. Hãy dùng HTTPS.');
};

/** Transactions shown here are ADMIN_ADJUSTMENT entries only, not automatic trip fees. */
export default function DriverPointsModal({ driver, initialTab = 'history', onClose }) {
  const driverId = String(driver?.driverId || '');
  const [tab, setTab] = React.useState(initialTab);
  const [account, setAccount] = React.useState(null);
  const [transactions, setTransactions] = React.useState([]);
  const [points, setPoints] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [reference, setReference] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const busyRef = React.useRef(false);
  const retryRef = React.useRef(null);

  const load = React.useCallback(async () => {
    if (!validId(driverId)) {
      setError('Driver ID không hợp lệ.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const [accounts, history] = await Promise.allSettled([
      coreApiRequest(`/api/v72/admin/driver-experience/point-accounts?limit=1000&q=${encodeURIComponent(driverId)}`),
      coreApiRequest(`/api/v72/admin/driver-experience/point-adjustments?driverId=${encodeURIComponent(driverId)}&limit=100`),
    ]);
    if (accounts.status === 'fulfilled') {
      const exact = (Array.isArray(accounts.value?.drivers) ? accounts.value.drivers : [])
        .find((item) => String(item.driverId) === driverId);
      setAccount(exact || null);
    } else {
      setAccount(null);
    }
    if (history.status === 'fulfilled') {
      const rows = Array.isArray(history.value?.adjustments) ? history.value.adjustments : [];
      setTransactions(rows.filter((entry) => String(entry.driverId) === driverId));
    } else {
      setTransactions([]);
    }
    if (accounts.status === 'rejected' || history.status === 'rejected') {
      setError('Chưa tải được đầy đủ số dư/lịch sử. Kiểm tra API Backend v72 và quyền Admin.');
    }
    setLoading(false);
  }, [driverId]);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape' && !busyRef.current) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const balance = Number(account?.balance || 0);
  const amount = Number(points);
  const validAmount = /^\d+$/.test(points.trim()) && Number.isSafeInteger(amount) && amount > 0 && amount <= 1000000;
  const enough = account && validAmount && balance >= amount;
  const canSave = Boolean(account && validAmount && enough && reason.trim().length >= 3 && !saving && !loading);

  async function submit(event) {
    event.preventDefault();
    if (busyRef.current) return;
    if (!canSave) {
      setError(!account ? 'Không tìm thấy ví điểm của tài xế đã được duyệt.' :
        !validAmount ? 'Nhập số điểm nguyên từ 1 đến 1.000.000.' :
        !enough ? 'Không được trừ quá số điểm hiện có.' : 'Lý do phải có tối thiểu 3 ký tự.');
      return;
    }
    if (!window.confirm(`XÁC NHẬN TRỪ ĐIỂM\n\nTài xế: ${driver?.fullName || ''} (${driver?.phone || ''})\nDriver ID: ${driverId}\nSố dư hiện tại: ${formatPoints(balance)}\nTrừ: ${formatPoints(amount)}\nDự kiến còn: ${formatPoints(balance - amount)}\nLý do: ${reason.trim()}\n\nThao tác sẽ ghi giao dịch và không thể xóa trực tiếp.`)) return;
    busyRef.current = true;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // Re-read balance immediately before submit to reduce stale deductions.
      const current = await coreApiRequest(`/api/v72/admin/driver-experience/point-accounts?limit=1000&q=${encodeURIComponent(driverId)}`);
      const latest = (Array.isArray(current?.drivers) ? current.drivers : [])
        .find((item) => String(item.driverId) === driverId);
      if (!latest) throw new Error('Không còn tìm thấy ví điểm tài xế.');
      if (Number(latest.balance || 0) < amount) throw new Error('Số dư đã thay đổi. Không thể trừ quá số dư mới.');
      // Reuse the same idempotency key when a network error follows a successful server commit.
      const fingerprint = [driverId, amount, reason.trim(), reference.trim()].join('|');
      const key = retryRef.current?.fingerprint === fingerprint ? retryRef.current.key : uniqueKey();
      retryRef.current = { fingerprint, key };
      const result = await coreApiRequest('/api/v72/admin/driver-experience/point-adjustments', {
        method: 'POST',
        headers: { 'Idempotency-Key': key },
        body: JSON.stringify({
          driverId, direction: 'DEBIT', points: amount,
          reason: reason.trim(), reference: reference.trim(), idempotencyKey: key,
        }),
      });
      retryRef.current = null;
      setPoints('');
      setReason('');
      setReference('');
      setTab('history');
      setSuccess(`Đã trừ ${formatPoints(amount)} điểm. Số dư Backend trả về: ${formatPoints(result.balance)} điểm.`);
      await load();
    } catch (cause) {
      setError(cause?.message || 'Không thể trừ điểm.');
    } finally {
      busyRef.current = false;
      setSaving(false);
    }
  }

  return (
    <AdminOverlayPortal>
      <div className="dpm-backdrop" onMouseDown={() => { if (!saving) onClose(); }}>
        <section className="dpm-panel" role="dialog" aria-modal="true" aria-label="Điểm và lịch sử tài xế" onMouseDown={(event) => event.stopPropagation()}>
          <header className="dpm-header">
            <div>
              <small>TH79 IMOVE · DRIVER POINTS</small>
              <h2>Điểm tài xế</h2>
              <p>{driver?.fullName || 'Tài xế'} · {driver?.phone || '—'}</p>
              <code>{driverId}</code>
            </div>
            <button type="button" aria-label="Đóng" onClick={onClose} disabled={saving}><X size={19} /></button>
          </header>
          <div className="dpm-balance-row">
            <div><span>Số dư hiện tại</span><b>{loading ? 'Đang tải...' : account ? `${formatPoints(balance)} điểm` : 'Chưa có dữ liệu'}</b></div>
            <button type="button" className="dpm-reload" disabled={loading || saving} onClick={load}><RefreshCw size={16} /> Làm mới</button>
          </div>
          <nav className="dpm-tabs" aria-label="Chức năng điểm tài xế">
            <button className={tab === 'history' ? 'active' : ''} type="button" onClick={() => setTab('history')}><History size={19} /> Lịch sử cộng/trừ</button>
            <button className={tab === 'debit' ? 'active' : ''} type="button" onClick={() => setTab('debit')}><Minus size={19} /> Trừ điểm</button>
          </nav>
          {error && <p className="dpm-error" role="alert">{error}</p>}
          {success && <p className="dpm-success" role="status">{success}</p>}
          {tab === 'history' ? (
            <div className="dpm-history">
              <p className="dpm-note">Lịch sử giao dịch <b>Admin cộng/trừ thủ công</b> của tài xế này. Không bao gồm phí nền tảng tự động hoặc nạp tiền chưa duyệt.</p>
              <div className="dpm-table-scroll">
                <table><thead><tr><th>Thời gian</th><th>Loại</th><th>Điểm</th><th>Lý do / tham chiếu</th></tr></thead>
                  <tbody>{transactions.map((item) => (
                    <tr key={item.id || item.sourceTransactionId}>
                      <td>{dateTime(item.createdAt)}</td>
                      <td><span className={isDebit(item) ? 'dpm-tag debit' : 'dpm-tag credit'}>{isDebit(item) ? 'Trừ điểm' : 'Cộng điểm'}</span></td>
                      <td className={isDebit(item) ? 'dpm-negative' : 'dpm-positive'}>{Number(item.points) > 0 ? '+' : ''}{formatPoints(item.points)}</td>
                      <td><b>{item.reason || item.title || '—'}</b>{item.reference && <small>{item.reference}</small>}</td>
                    </tr>
                  ))}{!loading && !transactions.length && <tr><td colSpan="4" className="dpm-empty">Chưa có lịch sử điều chỉnh điểm thủ công.</td></tr>}</tbody>
                </table>
              </div>
            </div>
          ) : (
            <form className="dpm-form" onSubmit={submit}>
              <p className="dpm-note">Trừ điểm trực tiếp từ số dư của tài xế. Backend sẽ ghi giao dịch và audit log. Không sử dụng để thanh toán hoặc rút tiền.</p>
              <label>Số điểm cần trừ<input value={points} onChange={event => setPoints(event.target.value)} type="number" min="1" max="1000000" step="1" required placeholder="Ví dụ: 100" /></label>
              <label>Lý do trừ điểm <span>(bắt buộc)</span><textarea rows="3" value={reason} onChange={event => setReason(event.target.value)} required minLength="3" maxLength="500" placeholder="Nhập lý do cụ thể để lưu nhật ký" /></label>
              <label>Mã tham chiếu <span>(tùy chọn)</span><input value={reference} onChange={event => setReference(event.target.value)} maxLength="160" placeholder="Mã biên bản hoặc chứng từ" /></label>
              <div className="dpm-preview"><span>Số dư dự kiến còn lại</span><b className={!enough && validAmount ? 'dpm-negative' : ''}>{validAmount ? formatPoints(balance - amount) : formatPoints(balance)} điểm</b></div>
              <div className="dpm-actions"><button type="button" onClick={() => setTab('history')} disabled={saving}>Xem lịch sử</button><button className="dpm-submit" type="submit" disabled={!canSave}><Save size={17} /> {saving ? 'Đang xử lý...' : 'Xác nhận trừ điểm'}</button></div>
              {!account && !loading && <p className="dpm-note">Tài xế cần được duyệt và có ví điểm trên Backend mới có thể trừ điểm.</p>}
            </form>
          )}
        </section>
      </div>
    </AdminOverlayPortal>
  );
}
