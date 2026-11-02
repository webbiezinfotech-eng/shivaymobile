import { useEffect, useMemo, useRef, useState } from 'react';
import { filterEntries } from './searchEntries';

export const TABLE_PAGE_SIZE = 10;

/**
 * Reusable list/table helper — har page par same behaviour:
 * - upar search box (sab visible columns par filter)
 * - 10 entries per page, Previous/Next pager
 * - search change hote hi page 1 par reset
 */
export default function usePagedList(items = [], { filterFn = filterEntries, resetKey, externalSearch, onExternalSearchChange } = {}) {
  const [internalSearch, setInternalSearch] = useState('');
  const [page, setPage] = useState(1);

  const isExternal = externalSearch !== undefined;
  const search = isExternal ? String(externalSearch ?? '') : internalSearch;
  const onExternalSearchChangeRef = useRef(onExternalSearchChange);
  onExternalSearchChangeRef.current = onExternalSearchChange;

  const filtered = useMemo(
    () => (Array.isArray(items) ? filterFn(items, search) : []),
    [items, filterFn, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE_SIZE));

  // Search change → page 1
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Data/filters change → page 1 se shuru
  useEffect(() => {
    if (resetKey !== undefined) {
      setPage(1);
    }
  }, [resetKey]);

  // Items refresh hone par page range se bahar na chhute
  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * TABLE_PAGE_SIZE;
  const pageItems = useMemo(
    () => filtered.slice(start, start + TABLE_PAGE_SIZE),
    [filtered, start]
  );

  const handleSearchChange = (value) => {
    setPage(1);
    if (isExternal) {
      onExternalSearchChangeRef.current?.(value);
      return;
    }
    setInternalSearch(String(value ?? ''));
  };

  return {
    search,
    onSearchChange: handleSearchChange,
    page: safePage,
    totalPages,
    totalItems: filtered.length,
    pageStart: filtered.length === 0 ? 0 : start + 1,
    pageEnd: start + pageItems.length,
    pageItems,
    goToPage: setPage,
  };
}
