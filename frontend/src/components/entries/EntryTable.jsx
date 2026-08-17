import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { formatCurrency, formatShortDate } from '../../utils/formatters';
import StatusBadge from './StatusBadge';
import EntryOwnerActions from './EntryOwnerActions';
import EntryViewModal from './EntryViewModal';

export default function EntryTable({
  entries,
  showOwnerColumns = false,
  detailBasePath = '',
  showSettleAction = false,
  showOwnerActions = false,
  compactLayout = true,
  onSettleClick,
  onUndoClick,
  onDeleteClick,
  settlingId = null,
  undoingId = null,
  deletingId = null,
}) {
  const location = useLocation();
  const [viewEntry, setViewEntry] = useState(null);

  const hasActions = detailBasePath || showSettleAction || showOwnerActions;

  if (!entries?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        No entries found.
      </div>
    );
  }

  const handleView = (entry) => setViewEntry(entry);

  const renderSameerActions = (entry) => (
    <button
      type="button"
      onClick={() => handleView(entry)}
      className="inline-flex min-h-10 items-center rounded-lg bg-brand-50 px-3 text-sm font-semibold text-brand-700"
    >
      View
    </button>
  );

  if (compactLayout) {
    return (
      <>
        <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white md:block">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Amount</th>
                {hasActions && <th className="px-4 py-3">Action</th>}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 whitespace-nowrap">{formatShortDate(entry.entry_date)}</td>
                  <td className="px-4 py-3">{entry.item_name}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{entry.customer_name}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-semibold">{formatCurrency(entry.customer_amount)}</td>
                  {hasActions && (
                    <td className="px-4 py-3">
                      {showOwnerActions ? (
                        <EntryOwnerActions
                          entry={entry}
                          fromPath={location.pathname}
                          onView={handleView}
                          onSettle={onSettleClick}
                          onUndo={onUndoClick}
                          onDelete={onDeleteClick}
                          settling={settlingId === entry.id}
                          undoing={undoingId === entry.id}
                          deleting={deletingId === entry.id}
                        />
                      ) : (
                        renderSameerActions(entry)
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{entry.item_name}</p>
                  <p className="mt-1 text-base font-bold text-slate-800">{entry.customer_name}</p>
                  <p className="mt-2 text-sm text-slate-500">{formatShortDate(entry.entry_date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-brand-800">{formatCurrency(entry.customer_amount)}</p>
                  <div className="mt-2">
                    <StatusBadge status={entry.settlement_status} />
                  </div>
                </div>
              </div>
              {hasActions && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  {showOwnerActions ? (
                    <EntryOwnerActions
                      entry={entry}
                      fromPath={location.pathname}
                      onView={handleView}
                      onSettle={onSettleClick}
                      onUndo={onUndoClick}
                      onDelete={onDeleteClick}
                      settling={settlingId === entry.id}
                      undoing={undoingId === entry.id}
                      deleting={deletingId === entry.id}
                      compact
                    />
                  ) : (
                    renderSameerActions(entry)
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <EntryViewModal
          entry={viewEntry}
          showOwnerDetails={showOwnerColumns}
          onClose={() => setViewEntry(null)}
        />
      </>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Customer</th>
              {showOwnerColumns && <th className="px-4 py-3">Cost</th>}
              <th className="px-4 py-3">Customer Amount</th>
              {showOwnerColumns && <th className="px-4 py-3">Profit</th>}
              {showOwnerColumns && <th className="px-4 py-3">Source</th>}
              <th className="px-4 py-3">Status</th>
              {hasActions && <th className="px-4 py-3">Action</th>}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t border-slate-100">
                <td className="px-4 py-3 whitespace-nowrap">{formatShortDate(entry.entry_date)}</td>
                <td className="px-4 py-3">{entry.item_name}</td>
                <td className="px-4 py-3">{entry.customer_name}</td>
                {showOwnerColumns && (
                  <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(entry.purchase_cost)}</td>
                )}
                <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(entry.customer_amount)}</td>
                {showOwnerColumns && (
                  <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(entry.profit)}</td>
                )}
                {showOwnerColumns && <td className="px-4 py-3">{entry.source_shop}</td>}
                <td className="px-4 py-3">
                  <StatusBadge status={entry.settlement_status} />
                </td>
                {hasActions && (
                  <td className="px-4 py-3">
                    {showOwnerActions ? (
                      <EntryOwnerActions
                        entry={entry}
                        fromPath={location.pathname}
                        onView={handleView}
                        onSettle={onSettleClick}
                        onUndo={onUndoClick}
                        onDelete={onDeleteClick}
                        settling={settlingId === entry.id}
                        undoing={undoingId === entry.id}
                        deleting={deletingId === entry.id}
                      />
                    ) : (
                      renderSameerActions(entry)
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{entry.item_name}</p>
                <p className="mt-1 text-base font-bold text-slate-800">{entry.customer_name}</p>
              </div>
              <StatusBadge status={entry.settlement_status} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Date</p>
                <p className="font-medium text-slate-800">{formatShortDate(entry.entry_date)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Amount</p>
                <p className="font-semibold text-brand-800">{formatCurrency(entry.customer_amount)}</p>
              </div>
              {showOwnerColumns && (
                <>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Cost</p>
                    <p className="font-medium text-slate-800">{formatCurrency(entry.purchase_cost)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Profit</p>
                    <p className="font-medium text-emerald-700">{formatCurrency(entry.profit)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Source</p>
                    <p className="font-medium text-slate-800">{entry.source_shop}</p>
                  </div>
                </>
              )}
            </div>
            {hasActions && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                {showOwnerActions ? (
                  <EntryOwnerActions
                    entry={entry}
                    fromPath={location.pathname}
                    onView={handleView}
                    onSettle={onSettleClick}
                    onUndo={onUndoClick}
                    onDelete={onDeleteClick}
                    settling={settlingId === entry.id}
                    undoing={undoingId === entry.id}
                    deleting={deletingId === entry.id}
                    compact
                  />
                ) : (
                  renderSameerActions(entry)
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <EntryViewModal
        entry={viewEntry}
        showOwnerDetails={showOwnerColumns}
        onClose={() => setViewEntry(null)}
      />
    </>
  );
}
