import { Link, useLocation } from 'react-router-dom';

export default function EntryOwnerActions({
  entry,
  fromPath,
  onSettle,
  onDelete,
  settling = false,
  deleting = false,
  compact = false,
}) {
  const location = useLocation();
  const backPath = fromPath || location.pathname;
  const baseClass = compact
    ? 'inline-flex min-h-10 items-center rounded-lg px-4 text-sm font-semibold'
    : 'text-sm font-semibold';

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        to={`/owner/entries/${entry.id}`}
        state={{ from: backPath }}
        className={`${baseClass} ${compact ? 'bg-brand-50 text-brand-700' : 'text-brand-700'}`}
      >
        View
      </Link>
      <Link
        to={`/owner/entries/${entry.id}/edit`}
        state={{ from: backPath }}
        className={`${baseClass} ${compact ? 'bg-amber-50 text-amber-800' : 'text-amber-700'}`}
      >
        Edit
      </Link>
      {entry.settlement_status === 'pending' && onSettle && (
        <button
          type="button"
          onClick={() => onSettle(entry)}
          disabled={settling}
          className={`${baseClass} ${compact ? 'bg-emerald-50 text-emerald-700' : 'text-emerald-700'} disabled:opacity-50`}
        >
          {settling ? 'Settling...' : 'Settle'}
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(entry)}
          disabled={deleting}
          className={`${baseClass} ${compact ? 'bg-red-50 text-red-700' : 'text-red-600'} disabled:opacity-50`}
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      )}
    </div>
  );
}
