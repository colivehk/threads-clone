import { supabase } from '@/lib/supabase';
import type { AuthUser } from '@/lib/thread-types';
import type { UserProfile, UserProfileRecord } from '@/lib/profile-types';
import { createFallbackProfile, deriveUsernameFromEmail, getFallbackAvatar, mapUserProfile, normalizeProfileUsername } from '@/lib/profile-utils';

async function findAvailableUsername(baseUsername: string, userId: string): Promise<string> {
  const initial = normalizeProfileUsername(baseUsername) || `user_${userId.slice(0, 6)}`;

  const { data: existing } = await supabase
    .from('user_profiles')
    .select('id, username')
    .eq('username', initial)
    .maybeSingle();

  if (!existing || existing.id === userId) return initial;

  for (let i = 1; i <= 50; i += 1) {
    const candidate = `${initial}_${i}`.slice(0, 24);
    const { data: candidateExisting } = await supabase
      .from('user_profiles')
      .select('id, username')
      .eq('username', candidate)
      .maybeSingle();

    if (!candidateExisting || candidateExisting.id === userId) return candidate;
  }

  return `${initial.slice(0, 17)}_${userId.slice(0, 6)}`;
}

export async function ensureUserProfile(user: AuthUser | null | undefined): Promise<{ profile: UserProfile | null; error: Error | null }> {
  const userId = user?.id?.trim();
  if (!userId) {
    return { profile: null, error: null };
  }

  const { data: existing, error: existingError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (existingError) {
    return { profile: null, error: existingError };
  }

  if (existing) {
    return { profile: mapUserProfile(existing as UserProfileRecord), error: null };
  }

  const username = await findAvailableUsername(deriveUsernameFromEmail(user?.email), userId);
  const displayName = user?.email?.split('@')[0] || username;
  const avatarUrl = getFallbackAvatar(username);

  const { data: inserted, error: insertError } = await supabase
    .from('user_profiles')
    .upsert(
      {
        id: userId,
        username,
        display_name: displayName,
        bio: '',
        avatar_url: avatarUrl,
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single();

  if (insertError) {
    return { profile: null, error: insertError };
  }

  return { profile: mapUserProfile(inserted as UserProfileRecord), error: null };
}

export async function getProfileByUsername(username: string): Promise<{ profile: UserProfile | null; error: Error | null }> {
  const normalized = normalizeProfileUsername(username);
  if (!normalized) {
    return { profile: null, error: null };
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('username', normalized)
    .maybeSingle();

  if (error) {
    return { profile: null, error };
  }

  if (!data) {
    return { profile: null, error: null };
  }

  return { profile: mapUserProfile(data as UserProfileRecord), error: null };
}

export async function getOrCreateProfileByUsername(username: string): Promise<{ profile: UserProfile | null; error: Error | null }> {
  const normalized = normalizeProfileUsername(username);
  if (!normalized) return { profile: null, error: null };

  const profileResult = await getProfileByUsername(normalized);
  if (profileResult.profile || profileResult.error) {
    return profileResult;
  }

  const { data: threadAuthor, error: threadError } = await supabase
    .from('threads')
    .select('author_name')
    .eq('author_name', normalized)
    .limit(1)
    .maybeSingle();

  if (threadError) {
    return { profile: null, error: threadError };
  }

  if (!threadAuthor?.author_name) {
    return { profile: null, error: null };
  }

  return {
    profile: createFallbackProfile(normalized),
    error: null,
  };
}

export async function getFollowState(viewerId: string | null | undefined, targetProfileId: string | null | undefined) {
  if (!viewerId || !targetProfileId || viewerId === targetProfileId) {
    return { isFollowing: false, canFollow: false };
  }

  const { data, error } = await supabase
    .from('user_follows')
    .select('follower_user_id, following_user_id')
    .eq('follower_user_id', viewerId)
    .eq('following_user_id', targetProfileId)
    .maybeSingle();

  if (error) {
    return { isFollowing: false, canFollow: true, error };
  }

  return {
    isFollowing: Boolean(data),
    canFollow: true,
    error: null,
  };
}

export async function followProfile(viewerId: string, targetProfileId: string) {
  if (!viewerId || !targetProfileId || viewerId === targetProfileId) {
    return { error: new Error('无效的关注目标') };
  }

  const { error } = await supabase.from('user_follows').insert({
    follower_user_id: viewerId,
    following_user_id: targetProfileId,
  });

  return { error };
}

export async function unfollowProfile(viewerId: string, targetProfileId: string) {
  if (!viewerId || !targetProfileId || viewerId === targetProfileId) {
    return { error: new Error('无效的取消关注目标') };
  }

  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('follower_user_id', viewerId)
    .eq('following_user_id', targetProfileId);

  return { error };
}

export async function updateMyProfile(options: {
  userId: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
}) {
  const { userId, displayName, bio, avatarUrl } = options;

  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      display_name: displayName.trim(),
      bio: bio.trim(),
      avatar_url: avatarUrl.trim(),
    })
    .eq('id', userId)
    .select('*')
    .single();

  if (error) {
    return { profile: null, error };
  }

  return {
    profile: mapUserProfile(data as UserProfileRecord),
    error: null,
  };
}

export async function searchProfiles(query: string) {
  const keyword = normalizeProfileUsername(query);
  if (!keyword) {
    return { profiles: [], error: null };
  }

  const { data: profileRows, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .or(`username.ilike.%${keyword}%,display_name.ilike.%${query.trim()}%`)
    .order('follower_count', { ascending: false })
    .limit(20);

  if (profileError) {
    return { profiles: [], error: profileError };
  }

  const profiles = (profileRows as UserProfileRecord[] | null | undefined)?.map(mapUserProfile) ?? [];

  if (profiles.length > 0) {
    return { profiles, error: null };
  }

  const { data: threadAuthors, error: fallbackError } = await supabase
    .from('threads')
    .select('author_name')
    .ilike('author_name', `%${keyword}%`)
    .limit(20);

  if (fallbackError) {
    return { profiles: [], error: fallbackError };
  }

  const uniqueProfiles = Array.from(
    new Map(
      (threadAuthors ?? [])
        .map((item) => item.author_name)
        .filter(Boolean)
        .map((name) => [name, createFallbackProfile(name)]),
    ).values(),
  );

  return { profiles: uniqueProfiles, error: null };
}
