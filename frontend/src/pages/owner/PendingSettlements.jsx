import { useCallback, useEffect, useState } from 'react';
import AppLayout, { ownerBottomNav } from '../../components/Layout/AppLayout';
import { ownerNavItems } from '../../config/ownerNav';
import EntryTable from '../../components/entries/EntryTable';
import SettlementConfirmModal from '../../components/entries/SettlementConfirmModal';
import UndoSettleConfirmModal from '../../components/entries/UndoSettleConfirmModal';
import DeleteConfirmModal from '../../components/entries/DeleteConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { getEntries, settleEntry, undoSettleEntry, deleteEntry } from '../../services/entryService';
import { useRefreshOnResume } from '../../utils/useAutoRefresh';
import { ApiError } from '../../services/api';
import usePagedList from '../../utils/usePagedList';
import { ListPager } from '../../components/common/ListControls';


export default function PendingSettlements() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmEntry, setConfirmEntry] = useState(null);
  const [undoEntry, setUndoEntry] = useState(null);
  const [deleteEntryTarget, setDeleteEntryTarget] = useState(null);
  const [settling, setSettling] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 10-per-page pager — data refresh hone par page 1 se shuru
  const {
    page,
    totalPages,
    totalItems,
    pageStart,
    pageEnd,
    pageItems,
    goToPage,
  } = usePagedList(entries, { resetKey: entries });

  const loadPending = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (!silent) setError('');

    try {
      const data = await getEntries({ status: 'pending', limit: 100 });
      setEntries(data.entries);
    } catch (err) {
      if (!silent) {
        setError(err instanceof ApiError ? err.message : 'Unable to connect to server.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  useRefreshOnResume(loadPending);

  const handleConfirmSettle = async () => {
    if (!confirmEntry) return;
    setSettling(true);
    setError('');
    setSuccess('');

    try {
      await settleEntry(confirmEntry.id);
      setSuccess('Entry marked as settled.');
      setConfirmEntry(null);
      await loadPending({ silent: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to connect to server.');
    } finally {
      setSettling(false);
    }
  };

  const handleConfirmUndo = async () => {
    if (!undoEntry) return;
    setUndoing(true);
    setError('');
    setSuccess('');

    try {
      await undoSettleEntry(undoEntry.id);
      setSuccess('Settlement undone.');
      setUndoEntry(null);
      await loadPending({ silent: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to connect to server.');
    } finally {
      setUndoing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteEntryTarget) return;
    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      await deleteEntry(deleteEntryTarget.id);
      setSuccess('Entry deleted.');
      setDeleteEntryTarget(null);
      await loadPending({ silent: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to connect to server.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout title="Pending Settlements" navItems={ownerNavItems} bottomNavItems={ownerBottomNav}>
      {success && <div className="mb-4"><AlertMessage type="success" message={success} /></div>}
      {error && <div className="mb-4"><AlertMessage message={error} /></div>}
      {loading && <LoadingSpinner />}

      {!loading && (
        <>
          <ListPager
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageStart={pageStart}
            pageEnd={pageEnd}
            goToPage={goToPage}
          />
          <EntryTable
            entries={pageItems}
          showOwnerColumns
          showOwnerActions
          onSettleClick={setConfirmEntry}
          onUndoClick={setUndoEntry}
          onDeleteClick={setDeleteEntryTarget}
          settlingId={settling ? confirmEntry?.id : null}
          undoingId={undoing ? undoEntry?.id : null}
          deletingId={deleting ? deleteEntryTarget?.id : null}
          />
        </>
      )}

      <SettlementConfirmModal
        entry={confirmEntry}
        onConfirm={handleConfirmSettle}
        onCancel={() => setConfirmEntry(null)}
        loading={settling}
      />
      <UndoSettleConfirmModal
        entry={undoEntry}
        onConfirm={handleConfirmUndo}
        onCancel={() => setUndoEntry(null)}
        loading={undoing}
      />
      <DeleteConfirmModal
        entry={deleteEntryTarget}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteEntryTarget(null)}
        loading={deleting}
      />
    </AppLayout>
  );
}
