'use client';

import Link from 'next/link';
import { AuthStatus } from '@/components/auth-status';
import { ProfileOrb } from '@/components/profile-store';

export function Button({
  children,
  href,
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  variant?: 'primary' | 'ghost' | 'dark' | 'lime';
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black transition active:scale-[.98] disabled:pointer-events-none disabled:opacity-50';

  const variants = {
    primary:
      'bg-gradient-to-r from-nova-cyan via-nova-blue to-nova-violet text-white shadow-nova hover:brightness-110',
    ghost:
      'border border-white/15 bg-white/10 text-white backdrop-blur-xl hover:bg-white/15',
    dark:
      'bg-slate-950 text-white shadow-lg shadow-slate-950/20 hover:bg-slate-900',
    lime:
      'bg-nova-lime text-slate-950 shadow-lg shadow-lime-300/10 hover:brightness-105',
  };

  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`nova-card rounded-[2rem] ${className}`}>{children}</div>;
}

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-200/20 bg-white/10 shadow-[0_0_30px_rgba(34,211,238,.22)] backdrop-blur-xl">
        <span className="h-5 w-5 rounded-full border-[5px] border-transparent bg-[linear-gradient(#020617,#020617)_padding-box,conic-gradient(from_0deg,#22d3ee,#8b5cf6,#ec4899,#22d3ee)_border-box]" />
      </span>
      <span className="text-xl font-black tracking-[.18em] text-white">NOVA</span>
    </Link>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#020617]/70 backdrop-blur-2xl">
      <div className="mx-auto flex h-[76px] w-[min(1240px,calc(100%-28px))] items-center justify-between gap-5">
        <Logo />

        <nav className="hidden items-center gap-7 text-sm font-black text-slate-300 md:flex">
          <Link href="/profile" className="hover:text-white">Profilo</Link>
          <Link href="/calls/new" className="hover:text-white">Apri Call</Link>
          <AuthStatus />
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button href="/calls/new" variant="lime">＋ Apri una Call</Button>
          <ProfileOrb className="h-11 w-11" />
        </div>
      </div>
    </header>
  );
}
