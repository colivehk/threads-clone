import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export function normalizeUsername(value: string | null | undefined): string {
  const name = decodeURIComponent(String(value ?? '')).trim().toLowerCase();
  if (!name || name === 'undefined' || name === 'null') return '';
  return name;
}

export function getUsernameFromUser(user: User | null | undefined): string {
  return normalizeUsername(user?.email?.split('@')[0]);
}

export function getAvatarForName(name: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'user')}`;
}

export async function getFollowerCount(username: string): Promise<number> {
  const target = normalizeUsername(username);
  if (!target) return 0;

  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following', target);

  if (error || count === null) return 0;
  return count;
}

export async function getFollowingCount(username: string): Promise<number> {
  const target = normalizeUsername(username);
  if (!target) return 0;

  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower', target);

  if (error || count === null) return 0;
  return count;
}

export async function checkIsFollowing(follower: string, following: string): Promise<boolean> {
  const followerName = normalizeUsername(follower);
  const followingName = normalizeUsername(following);

  if (!followerName || !followingName || followerName === followingName) return false;

  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower', followerName)
    .eq('following', followingName);

  if (error) {
    console.error('checkIsFollowing error:', error);
    return false;
  }

  return (count ?? 0) > 0;
}

export async function followUser(follower: string, following: string): Promise<{ ok: boolean; error?: string }> {
  const followerName = normalizeUsername(follower);
  const followingName = normalizeUsername(following);

  if (!followerName || !followingName || followerName === followingName) {
    return { ok: false, error: 'invalid-follow-target' };
  }

  const alreadyFollowing = await checkIsFollowing(followerName, followingName);
  if (alreadyFollowing) return { ok: true };

  const { error } = await supabase.from('follows').insert([{ follower: followerName, following: followingName }]);

  if (error) {
    console.error('followUser error:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function unfollowUser(follower: string, following: string): Promise<{ ok: boolean; error?: string }> {
  const followerName = normalizeUsername(follower);
  const followingName = normalizeUsername(following);

  if (!followerName || !followingName || followerName === followingName) {
    return { ok: false, error: 'invalid-follow-target' };
  }

  const { error } = await supabase
    .from('follows')
    .delete()
    .match({ follower: followerName, following: followingName });

  if (error) {
    console.error('unfollowUser error:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
