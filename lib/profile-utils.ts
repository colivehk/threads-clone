import type { UserProfile, UserProfileRecord } from '@/lib/profile-types';

export function sanitizeUsername(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
}

export function deriveUsernameFromEmail(email: string | null | undefined): string {
  const base = email?.split('@')[0] ?? '';
  const sanitized = sanitizeUsername(base);
  return sanitized || `user_${Math.random().toString(36).slice(2, 8)}`;
}

export function getFallbackAvatar(seed: string): string {
  return seed ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}` : '';
}

export function mapUserProfile(record: UserProfileRecord): UserProfile {
  const username = record.username;
  return {
    id: record.id,
    username,
    displayName: record.display_name?.trim() || username,
    bio: record.bio?.trim() || '',
    avatarUrl: record.avatar_url?.trim() || getFallbackAvatar(username),
    followerCount: record.follower_count ?? 0,
    followingCount: record.following_count ?? 0,
  };
}

export function createFallbackProfile(username: string): UserProfile {
  return {
    id: '',
    username,
    displayName: username,
    bio: '',
    avatarUrl: getFallbackAvatar(username),
    followerCount: 0,
    followingCount: 0,
  };
}

export function normalizeProfileUsername(value: string): string {
  return sanitizeUsername(value || '');
}
