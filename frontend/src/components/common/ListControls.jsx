/**
 * Shared list/table controls — search box + 10-per-page pager.
 * Owner aur staff dono panels ke saare tables/lists inhi ka use karte hain.
 */

export function ListSearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative">
      <input
        type="search"
        className="input-field pr-10"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-slate-400 hover:text-slate-600"
          onClick={() => onChange('')}
        >
          &times;
        </button>
      )}
    </div>
  );
}

export function ListPager({
  page,
  totalPages,
  totalItems,
  pageStart,
  pageEnd,
  goToPage,
  label = 'entries',
}) {
  if (totalItems === 0) {
    return null;
  }

  const pagerButton =
    'inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Showing {pageStart}&ndash;{pageEnd} of {totalItems} {label}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={pagerButton}
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        <span className="min-w-20 text-center text-sm font-semibold text-slate-700">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          className={pagerButton}
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
