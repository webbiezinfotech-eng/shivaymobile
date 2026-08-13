export default function StatusBadge({ status }) {
  const normalized = (status || '').toLowerCase();
  const isSettled = normalized === 'settled';

  return (
    <span className={isSettled ? 'status-settled' : 'status-pending'}>
      {isSettled ? 'Settled' : 'Pending'}
    </span>
  );
}
