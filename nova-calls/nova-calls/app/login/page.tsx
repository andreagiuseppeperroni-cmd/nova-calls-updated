import { Suspense } from 'react';
import { Navbar } from '@/components/ui';
import { AuthForm } from '@/components/auth-form';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div>
      <Navbar />

      <main className="mx-auto w-[min(920px,calc(100%-28px))] py-12 sm:py-16">
        <Suspense fallback={<div className="text-center font-black text-slate-300">Caricamento login…</div>}>
          <AuthForm />
        </Suspense>
      </main>
    </div>
  );
}
