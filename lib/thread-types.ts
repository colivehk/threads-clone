export type AuthUser = {
  id?: string | null;
  email?: string | null;
};

export type ThreadRecord = {
  id: number;
  content: string;
  likes: number;
  replies: number;
  created_at: string;
  parent_id: number | null;
  image_url?: string | null;
  author_name: string;
  author_avatar?: string | null;
};

export type ThreadCardData = {
  id: number;
  content: string;
  likes: number;
  replies: number;
  imageUrl?: string;
  timestamp: string;
  authorName: string;
  authorAvatar?: string;
};

export type ReplyDraft = {
  id: number;
  content: string;
};

export type NotificationRecord = {
  id: number;
  receiver: string;
  actor: string;
  type: 'follow' | 'like' | 'reply';
  thread_id?: number | null;
  content?: string | null;
  is_read?: boolean;
  created_at: string;
};
