import { NavLink } from 'react-router-dom';
import { Home, User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/app/routes';

const TABS = [
  { to: ROUTES.home, label: 'Beranda', icon: Home },
  { to: ROUTES.profile, label: 'Profil', icon: User },
] as const;

export function BottomNav() {
  return (
    <nav className="pb-safe fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-neutral-300 bg-white px-4 py-2 text-xs text-neutral-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex justify-between">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-2 py-1 transition-colors duration-200',
                isActive ? 'text-deep-blue-500' : 'text-neutral-600',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="size-6" strokeWidth={isActive ? 2.5 : 2} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
