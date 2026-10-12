import { useId, useState } from 'react';

// Pagination covers the records returned by the API, not an assumed server total.
// A query made only of digits and phone punctuation also matches on digits, so
// "639-384-0942" finds a card whose text carries 6393840942 (and the reverse).
export function useAdminList(items, getText) {
  const [search, changeSearch] = useState('');
  const [page, setPage] = useState(1);
  const query = search.trim().toLowerCase();
  const queryDigits = /^[\d\s()+.-]+$/.test(query) ? query.replace(/\D/g, '') : '';
  const matches = item => {
    const text = String(getText(item) || '').toLowerCase();
    return text.includes(query) || (queryDigits.length >= 3 && text.replace(/[\s()+.-]/g, '').includes(queryDigits));
  };
  const filtered = query ? items.filter(matches) : items;
  const totalPages = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, totalPages);
  const setSearch = value => { changeSearch(value); setPage(1); };
  return { visibleItems: filtered.slice((currentPage - 1) * 10, currentPage * 10), search, setSearch, page: currentPage, setPage, totalPages, filteredCount: filtered.length };
}

export function AdminListControls({ list, label = 'Search records' }) {
  const id = useId();
  return <div className="mb-4 flex flex-wrap items-end gap-3">
    <div className="min-w-0 flex-1"><label htmlFor={id} className="mb-1 block text-sm text-gray-600">{label}</label><input id={id} type="search" value={list.search} onChange={event => list.setSearch(event.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-brand" /></div>
    <div className="flex items-center gap-2 text-xs">
      <button type="button" aria-label="Previous page" disabled={list.page <= 1} onClick={() => list.setPage(list.page - 1)} className="rounded border px-3 py-2 disabled:opacity-40">Previous</button>
      <span aria-live="polite">{list.filteredCount} loaded records · {list.page} / {list.totalPages}</span>
      <button type="button" aria-label="Next page" disabled={list.page >= list.totalPages} onClick={() => list.setPage(list.page + 1)} className="rounded border px-3 py-2 disabled:opacity-40">Next</button>
    </div>
  </div>;
}

/** The empty state when a search, not the list, is the reason nothing shows. */
export function AdminNoMatches({ list, noun = 'records' }) {
  return <p className="text-sm text-gray-500">
    No {noun} match “{list.search.trim()}”.{' '}
    <button type="button" onClick={() => list.setSearch('')} className="font-semibold text-brand underline">Clear search</button>
  </p>;
}
