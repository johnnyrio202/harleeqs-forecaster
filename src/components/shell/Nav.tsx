'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/scenarios', label: 'Scenarios' },
  { href: '/actuals', label: 'Actuals' },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center gap-8 px-6">
        <span className="font-semibold text-slate-900 tracking-tight">HarleeQs Forecaster</span>
        <nav className="flex gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                pathname.startsWith(l.href)
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
