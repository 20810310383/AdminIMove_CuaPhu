import React from 'react';
import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';

export const PAGE_LIMIT = 20;

export function pageResult(value, key = 'items') {
  if (Array.isArray(value)) {
    return { items: value, pagination: { page: 1, limit: value.length || PAGE_LIMIT, total: value.length, totalPages: 1 } };
  }
  const items = Array.isArray(value?.[key]) ? value[key] : [];
  const pagination = value?.pagination || {};
  return {
    items,
    pagination: {
      page: Math.max(1, Number(pagination.page || 1)),
      limit: Math.max(1, Number(pagination.limit || PAGE_LIMIT)),
      total: Math.max(0, Number(pagination.total ?? items.length)),
      totalPages: Math.max(1, Number(pagination.totalPages || 1)),
    },
  };
}

export default function Pagination({ pagination, loading = false, onPageChange, label = 'bản ghi' }) {
  const [pendingPage, setPendingPage] = React.useState(null);
  const page = Math.max(1, Number(pagination?.page || 1));
  const totalPages = Math.max(1, Number(pagination?.totalPages || 1));
  const total = Math.max(0, Number(pagination?.total || 0));
  const isLoading = loading || pendingPage !== null;

  React.useEffect(() => {
    // Some legacy pages do not expose a loading state. A response that changes
    // the active page is still enough to dismiss the local transition state.
    if (!loading && pendingPage !== null && page === pendingPage) setPendingPage(null);
  }, [loading, page, pendingPage]);

  function changePage(nextPage) {
    if (isLoading || nextPage < 1 || nextPage > totalPages) return;
    setPendingPage(nextPage);
    Promise.resolve(onPageChange(nextPage))
      .catch(() => {})
      .finally(() => setPendingPage((current) => current === nextPage ? null : current));
  }

  if (totalPages <= 1 && total <= PAGE_LIMIT) return null;

  return <nav className="data-pagination" aria-label={`Phân trang ${label}`}>
    <span>{total.toLocaleString('vi-VN')} {label} · Trang {page}/{totalPages}</span>
    <div>
      {isLoading && <span className="data-pagination-loading" role="status"><LoaderCircle size={15}/> Đang tải trang {pendingPage || page}…</span>}
      <button type="button" className="button button-small" disabled={isLoading || page <= 1} onClick={() => changePage(page - 1)}>{pendingPage === page - 1 ? <LoaderCircle className="spin" size={15}/> : <ChevronLeft size={15}/>}Trước</button>
      <button type="button" className="button button-small" disabled={isLoading || page >= totalPages} onClick={() => changePage(page + 1)}>Sau{pendingPage === page + 1 ? <LoaderCircle className="spin" size={15}/> : <ChevronRight size={15}/>}</button>
    </div>
  </nav>;
}
