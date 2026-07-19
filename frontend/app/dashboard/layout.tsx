'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
      } else {
        setChecking(false);
      }
    });

    // Listen for auth state changes (e.g. session expiry)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[var(--accent)] animate-spin" />
          <p className="text-[13px] text-[var(--text-muted)]">Loading workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-shell flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
