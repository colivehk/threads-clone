import type { AuthUser, ReplyDraft, ThreadCardData, ThreadRecord } from '@/lib/thread-types';
import type { UserProfile } from '@/lib/profile-types';
import { deriveUsernameFromEmail, getFallbackAvatar } from '@/lib/profile-utils';

export function getUserName(user: AuthUser | null | undefined): string {
  return deriveUsernameFromEmail(user?.email);
}

export function getAvatarUrl(seed: string): string {
  return getFallbackAvatar(seed);
}

export function getProfileAvatar(profile: UserProfile | null | undefined, fallbackName: string): string {
  return profile?.avatarUrl || getFallbackAvatar(fallbackName);
}

export function getProfileDisplayName(profile: UserProfile | null | undefined, fallbackName: string): string {
  return profile?.displayName || fallbackName;
}

export function formatThreadTimestamp(createdAt: string): string {
  return new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function mapThreadRecordToCardData(record: ThreadRecord): ThreadCardData {
  return {
    id: record.id,
    content: record.content,
    likes: record.likes,
    replies: record.replies,
    imageUrl: record.image_url ?? undefined,
    timestamp: formatThreadTimestamp(record.created_at),
    authorName: record.author_name,
    authorAvatar: record.author_avatar ?? undefined,
    replyAudience: record.reply_audience ?? 'everyone',
    reviewReplies: record.review_replies ?? false,
  };
}

export function mapThreadRecordsToCardData(records: ThreadRecord[] | null | undefined): ThreadCardData[] {
  return (records ?? []).map(mapThreadRecordToCardData);
}

export function createReplyDraft(): ReplyDraft {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    content: '',
  };
}

export function parseImageUrls(imageUrl?: string | null): string[] {
  if (!imageUrl) return [];

  return imageUrl
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
