'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import Login from '@/components/Login';
import { supabase } from '@/lib/supabase';
import { getUsernameFromUser } from '@/lib/follows';

function ProfileRedirectSkeleton() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#101010] flex justify-center relative">
      <div className="w-full max-w-[620px] border-x border-gray-200 dark:border-[#333638] min-h-screen relative pb-20 animate-pulse">
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#101010]/80 backdrop-blur-md px-4 h-[60px] flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1C1C1C]" />
        </div>
        <div className="px-4 sm:px-6 pt-2 pb-6">
          <div className="flex justify-between items-center">
            <div className="space-y-3">
              <div className="h-7 w-36 rounded bg-gray-100 dark:bg-[#1C1C1C]" />
              <div className="h-4 w-24 rounded bg-gray-100 dark:bg-[#1C1C1C]" />
            </div>
            <div className="w-[72px] h-[72px] rounded-full bg-gray-100 dark:bg-[#1C1C1C]" />
          </div>
          <div className="mt-4 h-4 w-64 rounded bg-gray-100 dark:bg-[#1C1C1C]" />
          <div className="mt-3 h-4 w-24 rounded bg-gray-100 dark:bg-[#1C1C1C]" />
        </div>
      </div>
    </main>
  );
}

export default function ProfileEntryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthChecking || !user) return;
    const username = getUsernameFromUser(user);
    if (username) router.replace(`/profile/${encodeURIComponent(username)}`);
  }, [isAuthChecking, router, user]);

  if (isAuthChecking) return <ProfileRedirectSkeleton />;

  if (!user) {
    return (
      <main className="min-h-screen bg-white dark:bg-[#101010] flex justify-center relative">
        <Login />
        <ProfileRedirectSkeleton />
      </main>
    );
  }

  return <ProfileRedirectSkeleton />;
}
