export default function AppFooter({ className = '' }) {
  return (
    <footer className={`border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 ${className}`}>
      <p>
        © Copyright 2026{' '}
        <a
          href="https://webbiezinfotech.in"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-slate-600 hover:text-brand-800"
        >
          webbiezinfotech.in
        </a>{' '}
        All Rights Reserved
      </p>
    </footer>
  );
}
