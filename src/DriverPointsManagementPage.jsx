import React from 'react';
import AdminOverlayPortal from './AdminOverlayPortal.jsx';
import { coreApiRequest } from './coreApi.js';
import { BadgeDollarSign, Plus, Minus, Search, RefreshCw, History, X, Save, Users, WalletCards } from './adminPngLucide.jsx';
import './driver-points-management.css';

const fmt = value => new Intl.NumberFormat('vi-VN').format(Number(value) || 0);
const validDriverId = value => /^[0-9a-f]{24}$/i.test(String(value || ''));
const parseAmount = raw => /^\d+$/.test(String(raw).trim()) && Number.isSafeInteger(Number(raw)) && Number(raw) >= 1 && Number(raw) <= 1_000_000;
const dt = raw => raw && !Number.isNaN(new Date(raw).getTime()) ? new Date(raw).toLocaleString('vi-VN') : '—';
const makeKey = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  if (globalThis.crypto?.getRandomValues) {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    return [...bytes].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  throw new Error('Không thể tạo mã chống gửi trùng an toàn. Vui lòng sử dụng HTTPS.');
};

export default function DriverPointsManagementPage() {
  const [accounts, setAccounts] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [selectedId, setSelectedId] = React.useState('');
  const [mode, setMode] = React.useState('HISTORY');
  const [history, setHistory] = React.useState([]);
  const [historyError, setHistoryError] = React.useState('');
  const [loadingHistory, setLoadingHistory] = React.useState(false);
  const [points, setPoints] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [reference, setReference] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [dialogError, setDialogError] = React.useState('');
  const submitting = React.useRef(false);
  const retry = React.useRef(null);
  const mounted = React.useRef(true);

  React.useEffect(() => () => { mounted.current = false; }, []);

  const load = React.useCallback(async () => {
    setLoading(true); setError('');
    try {
      const payload = await coreApiRequest('/api/v72/admin/driver-experience/point-accounts?limit=1000');
      if (mounted.current) setAccounts(Array.isArray(payload?.drivers) ? payload.drivers : []);
    } catch (err) {
      if (mounted.current) setError(err?.message || 'Không tải được danh sách điểm tài xế.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const filtered = React.useMemo(() => accounts.filter(a =>
    `${a.fullName || ''} ${a.phone || ''} ${a.driverId || ''}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [accounts, query]);
  const chosen = accounts.find(a => String(a.driverId) === selectedId) || null;
  const balance = Number(chosen?.balance || 0);
  const total = filtered.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  const amount = parseAmount(points) ? Number(points) : 0;
  const projected = balance + (mode === 'DEBIT' ? -amount : amount);
  const canSubmit = !!chosen && validDriverId(selectedId) && amount > 0 && reason.trim().length >= 3 && reason.trim().length <= 500 && reference.trim().length <= 160 && (mode !== 'DEBIT' || balance >= amount) && !saving && !loadingHistory;

  const loadHistory = React.useCallback(async (id) => {
    if (!validDriverId(id)) { setHistoryError('Driver ID không hợp lệ.'); return; }
    setLoadingHistory(true); setHistoryError('');
    try {
      const payload = await coreApiRequest(`/api/v72/admin/driver-experience/point-adjustments?driverId=${encodeURIComponent(id)}&limit=100`);
      if (mounted.current) setHistory((Array.isArray(payload?.adjustments) ? payload.adjustments : []).filter(item => String(item.driverId) === id));
    } catch (e) {
      if (mounted.current) setHistoryError(e?.message || 'Không tải được lịch sử điểm.');
    } finally {
      if (mounted.current) setLoadingHistory(false);
    }
  }, []);

  const open = (account, nextMode = 'HISTORY') => {
    if (!validDriverId(account?.driverId)) { setError('Mã tài xế không hợp lệ.'); return; }
    setSelectedId(String(account.driverId)); setMode(nextMode);
    setPoints(''); setReason(''); setReference(''); setHistory([]);
    setDialogError(''); setMessage(''); retry.current = null;
    loadHistory(String(account.driverId));
  };
  const close = () => { if (!submitting.current) { setSelectedId(''); setMessage(''); setDialogError(''); } };

  const save = async (event) => {
    event.preventDefault();
    if (submitting.current) return;
    if (!canSubmit) {
      setDialogError(!chosen ? 'Không tìm thấy tài xế.' : !amount ? 'Nhập số điểm nguyên từ 1 đến 1.000.000.' : mode === 'DEBIT' && balance < amount ? 'Số dư không đủ để trừ.' : 'Lý do phải có tối thiểu 3 ký tự.');
      return;
    }
    const label = mode === 'DEBIT' ? 'TRỪ' : 'CỘNG';
    if (!window.confirm(`XÁC NHẬN ${label} ĐIỂM\n\nTài xế: ${chosen.fullName || '—'}\nĐiện thoại: ${chosen.phone || '—'}\nDriver ID: ${chosen.driverId}\nĐiểm hiện tại: ${fmt(balance)}\n${label}: ${fmt(amount)}\nSố dư dự kiến: ${fmt(projected)}\nLý do: ${reason.trim()}\n\nGiao dịch được ghi vào lịch sử và audit log.`)) return;
    submitting.current = true; setSaving(true); setDialogError(''); setMessage('');
    try {
      // Recheck account immediately before committing; Backend must still enforce concurrency rules.
      const current = await coreApiRequest('/api/v72/admin/driver-experience/point-accounts?limit=1000');
      const list = Array.isArray(current?.drivers) ? current.drivers : [];
      const fresh = list.find(a => String(a.driverId) === selectedId);
      if (!fresh) throw new Error('Không tìm thấy tài khoản tài xế trên Backend.');
      if (mode === 'DEBIT' && Number(fresh.balance || 0) < amount) throw new Error('Số dư mới của tài xế không đủ để trừ.');
      const fingerprint = `${selectedId}|${mode}|${amount}|${reason.trim()}|${reference.trim()}`;
      const key = retry.current?.fingerprint === fingerprint ? retry.current.key : makeKey();
      retry.current = { fingerprint, key };
      const result = await coreApiRequest('/api/v72/admin/driver-experience/point-adjustments', {
        method: 'POST',
        headers: { 'Idempotency-Key': key },
        body: JSON.stringify({ driverId: selectedId, direction: mode, points: amount, reason: reason.trim(), reference: reference.trim(), idempotencyKey: key }),
      });
      retry.current = null;
      setMessage(`Đã ${mode === 'DEBIT' ? 'trừ' : 'cộng'} ${fmt(amount)} điểm. Số dư mới: ${fmt(result.balance)} điểm.`);
      setPoints(''); setReason(''); setReference(''); setMode('HISTORY');
      // The transaction has committed. A later refresh failure must not be reported as a failed adjustment.
      const [refreshedAccounts, refreshedHistory] = await Promise.allSettled([
        coreApiRequest('/api/v72/admin/driver-experience/point-accounts?limit=1000'),
        coreApiRequest(`/api/v72/admin/driver-experience/point-adjustments?driverId=${encodeURIComponent(selectedId)}&limit=100`),
      ]);
      if (mounted.current) {
        if (refreshedAccounts.status === 'fulfilled') {
          setAccounts(Array.isArray(refreshedAccounts.value?.drivers) ? refreshedAccounts.value.drivers : list);
        } else {
          setAccounts(prev => prev.map(row => String(row.driverId) === selectedId ? {...row,balance:Number(result.balance)} : row));
          setMessage(prev => `${prev} Không tải lại được toàn bộ số dư; hãy nhấn Làm mới.`);
        }
        if (refreshedHistory.status === 'fulfilled') {
          const rows = Array.isArray(refreshedHistory.value?.adjustments) ? refreshedHistory.value.adjustments : [];
          setHistory(rows.filter(row => String(row.driverId) === selectedId));
          setHistoryError('');
        } else {
          setHistoryError('Giao dịch đã ghi thành công, nhưng chưa tải lại được lịch sử. Hãy mở lại Lịch sử.');
        }
      }
    } catch (err) {
      if (mounted.current) setDialogError(err?.message || 'Giao dịch không thành công.');
    } finally {
      submitting.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  React.useEffect(() => {
    if (!selectedId) return undefined;
    const onKey = e => { if (e.key === 'Escape' && !submitting.current) close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedId]);

  return <main className="dpc-page">
    <header className="dpc-page-head">
      <div><span className="dpc-eyebrow">TH79 IMOVE · DRIVER POINTS</span><h1>Quản lý điểm tài xế</h1><p>Tra cứu số dư, cộng/trừ điểm thủ công và lịch sử theo từng tài xế. Nạp tiền/QR được quản lý ở trang Nạp quỹ.</p></div>
      <button type="button" className="button" onClick={load} disabled={loading}><RefreshCw size={17}/> Làm mới</button>
    </header>
    {error && <p className="dpc-alert" role="alert">{error}</p>}
    <section className="dpc-summary" aria-label="Tổng hợp điểm">
      <article><Users size={24}/><div><small>Tài xế đang hiển thị</small><b>{fmt(filtered.length)}</b></div></article>
      <article><WalletCards size={24}/><div><small>Tổng số dư hiển thị</small><b>{fmt(total)} điểm</b></div></article>
      <article><BadgeDollarSign size={24}/><div><small>Chức năng</small><b>Cộng / Trừ / Lịch sử</b></div></article>
    </section>
    <section className="dpc-card">
      <header className="dpc-card-head"><div><h2>Danh sách tài khoản điểm</h2><p>Chỉ tài xế đã được Backend duyệt; số dư lấy từ MongoDB qua API v72.</p></div>
        <label className="dpc-search"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm tên, số điện thoại, Driver ID" aria-label="Tìm tài xế"/></label>
      </header>
      <div className="dpc-table-wrap"><table><thead><tr><th>Tài xế</th><th>Trạng thái</th><th>Số dư điểm</th><th>Đã nhận</th><th>Đã sử dụng</th><th>Thao tác</th></tr></thead>
        <tbody>{filtered.map(a => <tr key={a.driverId}>
          <td><strong>{a.fullName || 'Tài xế'}</strong><small>{a.phone || '—'} · {a.driverId}</small></td>
          <td><span className={`dpc-status ${a.onlineStatus === 'ONLINE' ? 'on' : ''}`}>{a.onlineStatus === 'ONLINE' ? 'Online' : 'Offline'}</span></td>
          <td className="dpc-balance">{fmt(a.balance)} điểm</td><td>{fmt(a.lifetimeEarned)}</td><td>{fmt(a.lifetimeSpent)}</td>
          <td><div className="dpc-row-actions">
            <button type="button" onClick={() => open(a, 'CREDIT')}><Plus size={16}/> Cộng</button>
            <button type="button" className="debit" onClick={() => open(a, 'DEBIT')}><Minus size={16}/> Trừ</button>
            <button type="button" onClick={() => open(a, 'HISTORY')}><History size={16}/> Lịch sử</button>
          </div></td>
        </tr>)}{!loading && !filtered.length && <tr><td colSpan="6" className="dpc-empty">Không có tài xế phù hợp.</td></tr>}{loading && <tr><td colSpan="6" className="dpc-empty">Đang tải dữ liệu tài xế...</td></tr>}</tbody>
      </table></div>
    </section>
    {selectedId && <AdminOverlayPortal><div className="dpc-backdrop" onMouseDown={close}>
      <section className="dpc-dialog" role="dialog" aria-modal="true" aria-label={`Quản lý điểm của ${chosen?.fullName || 'tài xế'}`} onMouseDown={e => e.stopPropagation()}>
        <header className="dpc-dialog-head"><div><span className="dpc-eyebrow">TÀI KHOẢN ĐIỂM</span><h2>{chosen?.fullName || 'Tài xế'}</h2><p>{chosen?.phone || '—'} · {selectedId}</p></div><button type="button" aria-label="Đóng cửa sổ" onClick={close} disabled={saving}><X size={19}/></button></header>
        <div className="dpc-account"><span>Số dư hiện tại</span><strong>{fmt(balance)} điểm</strong><button type="button" onClick={() => {load();loadHistory(selectedId);}} disabled={saving}>Cập nhật</button></div>
        <nav className="dpc-tabs" aria-label="Thao tác điểm">
          <button type="button" className={mode === 'HISTORY' ? 'active' : ''} onClick={() => setMode('HISTORY')}><History size={17}/> Lịch sử</button>
          <button type="button" className={mode === 'CREDIT' ? 'active' : ''} onClick={() => setMode('CREDIT')}><Plus size={17}/> Cộng điểm</button>
          <button type="button" className={mode === 'DEBIT' ? 'active' : ''} onClick={() => setMode('DEBIT')}><Minus size={17}/> Trừ điểm</button>
        </nav>
        {message && <p className="dpc-success" role="status">{message}</p>}
        {dialogError && <p className="dpc-alert" role="alert">{dialogError}</p>}
        {mode === 'HISTORY' ? <div className="dpc-history"><p>Chỉ hiển thị các giao dịch Admin cộng/trừ thủ công của tài xế được chọn; không gồm khoản nạp chưa duyệt và phí nền tảng tự động.</p>{historyError && <p className="dpc-alert" role="alert">{historyError}</p>}
          <div className="dpc-table-wrap"><table><thead><tr><th>Thời gian</th><th>Loại</th><th>Điểm</th><th>Lý do / Mã tham chiếu</th></tr></thead><tbody>
            {history.map(h => <tr key={h.id || h.sourceTransactionId}><td>{dt(h.createdAt)}</td><td>{h.direction === 'DEBIT' || Number(h.points) < 0 ? 'Trừ' : 'Cộng'}</td><td className={Number(h.points) < 0 ? 'dpc-negative' : 'dpc-positive'}>{Number(h.points) > 0 ? '+' : ''}{fmt(h.points)}</td><td>{h.reason || '—'}{h.reference && <small>{h.reference}</small>}</td></tr>)}
            {!loadingHistory && !historyError && !history.length && <tr><td className="dpc-empty" colSpan="4">Chưa có giao dịch điều chỉnh thủ công.</td></tr>}
            {loadingHistory && <tr><td className="dpc-empty" colSpan="4">Đang tải lịch sử...</td></tr>}
          </tbody></table></div></div>
        : <form className="dpc-form" onSubmit={save}>
            <label>Số điểm {mode === 'DEBIT' ? 'cần trừ' : 'cần cộng'}<input type="number" step="1" min="1" max="1000000" required value={points} onChange={e => setPoints(e.target.value)} placeholder="Ví dụ: 100" disabled={saving}/></label>
            <label>Lý do điều chỉnh (bắt buộc)<textarea rows={3} minLength={3} maxLength={500} required value={reason} onChange={e => setReason(e.target.value)} disabled={saving} placeholder="Lý do cụ thể để lưu audit log"/></label>
            <label>Mã tham chiếu (tùy chọn)<input maxLength={160} value={reference} onChange={e => setReference(e.target.value)} disabled={saving} placeholder="Mã biên bản hoặc chứng từ"/></label>
            <div className="dpc-projection"><span>Số dư dự kiến</span><strong className={projected < 0 ? 'dpc-negative' : ''}>{fmt(projected)} điểm</strong></div>
            <footer><button type="button" onClick={() => setMode('HISTORY')} disabled={saving}>Xem lịch sử</button><button type="submit" className="dpc-primary" disabled={!canSubmit}><Save size={17}/>{saving ? 'Đang xử lý...' : mode === 'DEBIT' ? 'Xác nhận trừ điểm' : 'Xác nhận cộng điểm'}</button></footer>
            {mode === 'DEBIT' && projected < 0 && <p className="dpc-negative">Không thể trừ quá số dư hiện có.</p>}
          </form>}
      </section></div></AdminOverlayPortal>}
  </main>;
}
