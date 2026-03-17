'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ensureUserProfile } from '@/lib/profile-actions';
import type { UserProfile, UserProfileRecord } from '@/lib/profile-types';
import { mapUserProfile } from '@/lib/profile-utils';
import { getProfileAvatar, getProfileDisplayName, getUserName } from '@/lib/thread-utils';
import type { AuthUser } from '@/lib/thread-types';

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    let profileChannel: ReturnType<typeof supabase.channel> | null = null;

    const clearProfileChannel = () => {
      if (profileChannel) {
        supabase.removeChannel(profileChannel);
        profileChannel = null;
      }
    };

    const attachProfileChannel = (userId: string) => {
      clearProfileChannel();

      profileChannel = supabase
        .channel(`realtime:user_profile:${userId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_profiles', filter: `id=eq.${userId}` }, (payload) => {
          if (!mounted) return;
          setProfile(mapUserProfile(payload.new as UserProfileRecord));
        })
        .subscribe();
    };

    const syncUser = async (nextUser: AuthUser | null) => {
      if (!mounted) return;

      setUser(nextUser);
      clearProfileChannel();

      if (!nextUser?.id) {
        setProfile(null);
        setIsAuthChecking(false);
        return;
      }

      const { profile: ensuredProfile } = await ensureUserProfile(nextUser);
      if (!mounted) return;

      setProfile(ensuredProfile);
      attachProfileChannel(nextUser.id);
      setIsAuthChecking(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncUser((session?.user as AuthUser) ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser((session?.user as AuthUser) ?? null);
    });

    return () => {
      mounted = false;
      clearProfileChannel();
      subscription.unsubscribe();
    };
  }, []);

  const currentUserId = user?.id?.trim() ?? '';
  const currentUserName = useMemo(() => profile?.username || getUserName(user), [profile, user]);
  const currentUserAvatar = useMemo(() => getProfileAvatar(profile, currentUserName), [currentUserName, profile]);
  const currentDisplayName = useMemo(() => getProfileDisplayName(profile, currentUserName), [currentUserName, profile]);

  return {
    user,
    profile,
    currentUserId,
    isAuthChecking,
    isLoggedIn: Boolean(user),
    currentUserName,
    currentUserAvatar,
    currentDisplayName,
    refreshProfile: async () => {
      if (!user?.id) return null;
      const { profile: refreshed } = await ensureUserProfile(user);
      setProfile(refreshed);
      return refreshed;
    },
  };
}
