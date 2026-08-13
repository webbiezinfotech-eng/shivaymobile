export default function LoadingSpinner({ message = 'Loading...', fullScreen = false }) {
  const wrapperClass = fullScreen
    ? 'flex min-h-screen items-center justify-center'
    : 'flex items-center justify-center py-10';

  return (
    <div className={wrapperClass}>
      <div className="text-center">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-700" />
        <p className="text-sm text-slate-600">{message}</p>
      </div>
    </div>
  );
}
