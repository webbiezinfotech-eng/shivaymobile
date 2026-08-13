import { NavLink } from 'react-router-dom';

function bottomNavClass({ isActive }) {
  return isActive
    ? 'flex flex-1 flex-col items-center gap-1 py-2 text-xs font-semibold text-brand-700'
    : 'flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium text-slate-500';
}

export default function BottomNav({ items }) {
  if (!items?.length) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-6xl">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} className={bottomNavClass} end={item.end}>
            <span className="text-lg leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
