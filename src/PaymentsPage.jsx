import React from 'react';
import { WalletCards, CheckCircle2, XCircle, Clock3, RefreshCw } from 'lucide-react';
import { coreApiRequest } from './coreApi.js';
import { money, paymentStatusGroup } from './analyticsModel.js';
import Pagination, { PAGE_LIMIT, pageResult } from './Pagination.jsx';

const EMPTY_SUMMARY = {
  total: 0,
  amount: 0,
  success: { count: 0, amount: 0 },
  pending: { count: 0, amount: 0 },
  failed: { count: 0, amount: 0 },
};

export default function PaymentsPage() {
  const [rows, setRows] = React.useState([]);
  const [summary, setSummary] = React.useState(EMPTY_SUMMARY);
  const [page, setPage] = React.useState(1);
  const [pagination, setPagination] = React.useState({ page: 1, limit: PAGE_LIMIT, total: 0, totalPages: 1 });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async (requestedPage = 1) => {
    setLoading(true);
    try {
      const payload = await coreApiRequest(`/api/v14/admin/analytics/payments?days=30&limit=${PAGE_LIMIT}&page=${requestedPage}`);
      const result = pageResult(payload);
      setRows(result.items);
      setPagination(result.pagination);
      setPage(result.pagination.page);
      setSummary(payload?.summary || EMPTY_SUMMARY);
      setError('');
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(1); }, [load]);

  return <section className="v14-page">
    <header className="v14-page-head">
      <div><span className="v14-eyebrow">FINANCE · PAYMENT STATUS</span><h1>Thanh toán</h1><p>PAID được tính là giao dịch thành công; số liệu tổng hợp từ toàn bộ giao dịch 30 ngày gần nhất.</p></div>
      <button className="button" onClick={() => load(page)} disabled={loading}><RefreshCw size={15}/>{loading ? 'Đang tải...' : 'Làm mới'}</button>
    </header>
    {error && <div className="v73-alert">{error}</div>}
    <div className="v14-kpis">
      <article><WalletCards/><span>Tổng giao dịch</span><b>{summary.total}</b><small>{money(summary.amount)}</small></article>
      <article><CheckCircle2/><span>Giao dịch thành công</span><b>{summary.success?.count || 0}</b><small>{money(summary.success?.amount)}</small></article>
      <article><Clock3/><span>Đang chờ</span><b>{summary.pending?.count || 0}</b><small>{money(summary.pending?.amount)}</small></article>
      <article><XCircle/><span>Thất bại</span><b>{summary.failed?.count || 0}</b><small>{money(summary.failed?.amount)}</small></article>
    </div>
    <section className="card v14-panel">
      <h2>Giao dịch gần đây</h2>
      <div className="v14-table-wrap"><table><thead><tr><th>Tham chiếu</th><th>Nguồn</th><th>Phương thức</th><th>Số tiền</th><th>Trạng thái</th><th>Thời gian</th></tr></thead><tbody>
        {rows.map((row) => <tr key={row.id}><td><code>{row.referenceCode || row.referenceId || row.id}</code></td><td>{row.source === 'ORDER' ? 'Đơn dịch vụ' : row.source === 'BOOKING' ? 'Chuyến xe' : 'Thanh toán'}</td><td>{row.method || '—'}</td><td><b>{money(row.amount)}</b></td><td><span className={`v14-status ${paymentStatusGroup(row.status)}`}>{row.status}</span></td><td>{row.createdAt ? new Date(row.createdAt).toLocaleString('vi-VN') : '—'}</td></tr>)}
        {!rows.length && !loading && <tr><td colSpan="6" className="v14-empty">Chưa có giao dịch trong 30 ngày gần nhất.</td></tr>}
      </tbody></table></div>
      <Pagination pagination={pagination} loading={loading} onPageChange={load} label="giao dịch"/>
    </section>
  </section>;
}
