import { checkIsFollowing, normalizeUsername } from '@/lib/follows';
import type { ReplyAudience } from '@/lib/thread-types';

export type ReplyPermissionInput = {
  viewerName?: string | null;
  authorName: string;
  content?: string | null;
  replyAudience?: ReplyAudience | null;
};

export type ReplyPermissionResult = {
  allowed: boolean;
  reason?: string;
};

const audienceLabels: Record<ReplyAudience, string> = {
  everyone: '任何人',
  followers: '作者的粉丝',
  following: '作者关注的人',
  mentioned: '作者提及的主页',
};

export function extractMentionedUsernames(content?: string | null): string[] {
  if (!content) return [];

  const matches = content.match(/(^|[^\w])@([a-zA-Z0-9_]{1,24})/g) ?? [];
  const usernames = matches
    .map((token) => token.replace(/^.*@/, ''))
    .map((name) => normalizeUsername(name))
    .filter(Boolean);

  return Array.from(new Set(usernames));
}

export function getReplyAudienceLabel(replyAudience?: ReplyAudience | null): string {
  const normalized = replyAudience ?? 'everyone';
  return audienceLabels[normalized] ?? audienceLabels.everyone;
}

export async function checkReplyPermission(input: ReplyPermissionInput): Promise<ReplyPermissionResult> {
  const viewerName = normalizeUsername(input.viewerName);
  const authorName = normalizeUsername(input.authorName);
  const replyAudience = input.replyAudience ?? 'everyone';

  if (!authorName) {
    return { allowed: true };
  }

  if (!viewerName) {
    return { allowed: false, reason: '请先登录后再回复。' };
  }

  if (viewerName === authorName) {
    return { allowed: true };
  }

  if (replyAudience === 'everyone') {
    return { allowed: true };
  }

  if (replyAudience === 'followers') {
    const isFollowingAuthor = await checkIsFollowing(viewerName, authorName);
    return isFollowingAuthor
      ? { allowed: true }
      : { allowed: false, reason: '只有作者的粉丝可以回复这条帖子。' };
  }

  if (replyAudience === 'following') {
    const isFollowedByAuthor = await checkIsFollowing(authorName, viewerName);
    return isFollowedByAuthor
      ? { allowed: true }
      : { allowed: false, reason: '只有作者关注的人可以回复这条帖子。' };
  }

  if (replyAudience === 'mentioned') {
    const mentioned = extractMentionedUsernames(input.content);
    return mentioned.includes(viewerName)
      ? { allowed: true }
      : { allowed: false, reason: '只有作者提及的主页可以回复这条帖子。' };
  }

  return {
    allowed: false,
    reason: `这条帖子当前只允许${getReplyAudienceLabel(replyAudience)}回复。`,
  };
}
