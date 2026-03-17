export type UserProfileRecord = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  follower_count: number | null;
  following_count: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type UserFollowRecord = {
  follower_user_id: string;
  following_user_id: string;
  created_at?: string | null;
};

export type UserProfile = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  followerCount: number;
  followingCount: number;
};

export type FollowState = {
  isFollowing: boolean;
  canFollow: boolean;
};
