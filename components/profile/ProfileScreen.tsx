'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Login from '@/components/Login';
import ProfileScreenSkeleton from '@/components/loading/ProfileScreenSkeleton';
import ThreadCard from '@/components/ThreadCard';
import AuthModal from '@/components/feed/AuthModal';
import EditProfileModal from '@/components/profile/EditProfileModal';
import ReplyComposerModal from '@/components/reply/ReplyComposerModal';
import { useReplyComposer } from '@/hooks/useReplyComposer';
import { followProfile, getFollowState, getOrCreateProfileByUsername, unfollowProfile, updateMyProfile } from '@/lib/profile-actions';
import type { UserProfile, UserProfileRecord } from '@/lib/profile-types';
import { mapUserProfile } from '@/lib/profile-utils';
import { supabase } from '@/lib/supabase';
import { mapThreadRecordsToCardData } from '@/lib/thread-utils';
import type { ThreadCardData, ThreadRecord } from '@/lib/thread-types';

function formatProfileMeta(profile: UserProfile | null) {
  if (!profile) return '0 个粉丝 · 0 个关注中';
  return `${profile.followerCount} 个粉丝 · ${profile.followingCount} 个关注中`;
}

type ProfileScreenProps = {
  profileUsername: string;
  viewerId: string;
  viewerName: string;
  viewerAvatar: string;
  isLoggedIn: boolean;
  isAuthChecking: boolean;
  requireViewerLogin?: boolean;
  isOwner: boolean;
  initialProfile?: UserProfile | null;
  onViewerProfileUpdated?: (nextProfile: UserProfile) => void;
};

function ProfileTabContentSkeleton() {
  return (
    <div className="px-4 py-3 space-y-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="border-b border-gray-100 dark:border-[#222] pb-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#2A2A2A] shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div className="h-4 w-24 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
                <div className="h-3 w-10 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-4 w-full rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
                <div className="h-4 w-3/4 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
              </div>
              <div className="mt-4 flex gap-4">
                <div className="h-4 w-12 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
                <div className="h-4 w-12 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
                <div className="h-4 w-12 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProfileScreen(props: ProfileScreenProps) {
  const {
    profileUsername,
    viewerId,
    viewerName,
    viewerAvatar,
    isLoggedIn,
    isAuthChecking,
    requireViewerLogin = false,
    isOwner,
    initialProfile = null,
    onViewerProfileUpdated,
  } = props;

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'threads' | 'replies'>('threads');
  const [threads, setThreads] = useState<ThreadCardData[]>([]);
  const [repliesData, setRepliesData] = useState<ThreadCardData[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(isOwner ? initialProfile : null);
  const [loading, setLoading] = useState(!initialProfile);
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchProfileData = useCallback(
    async (silent = false) => {
      if (!profileUsername) {
        setThreads([]);
        setRepliesData([]);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (!silent) {
        setLoading(true);
      }

      const [{ profile: nextProfile }, { data: profileThreads }, { data: profileReplies }] = await Promise.all([
        getOrCreateProfileByUsername(profileUsername),
        supabase.from('threads').select('*').eq('author_name', profileUsername).is('parent_id', null).order('created_at', { ascending: false }),
        supabase.from('threads').select('*').eq('author_name', profileUsername).not('parent_id', 'is', null).order('created_at', { ascending: false }),
      ]);

      setProfile(nextProfile ?? (silent ? profile : null));
      setThreads(mapThreadRecordsToCardData((profileThreads as ThreadRecord[]) ?? []));
      setRepliesData(mapThreadRecordsToCardData((profileReplies as ThreadRecord[]) ?? []));
      setLoading(false);
    },
    [profile, profileUsername],
  );

  useEffect(() => {
    if (isOwner && initialProfile) {
      setProfile(initialProfile);
    }
  }, [initialProfile, isOwner]);

  useEffect(() => {
    void fetchProfileData(Boolean(isOwner && initialProfile));
  }, [fetchProfileData, initialProfile, isOwner]);

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`realtime:profile_counts:${profile.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_profiles', filter: `id=eq.${profile.id}` }, (payload) => {
        const nextProfile = mapUserProfile(payload.new as UserProfileRecord);
        setProfile(nextProfile);
        if (isOwner) {
          onViewerProfileUpdated?.(nextProfile);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOwner, onViewerProfileUpdated, profile?.id]);

  useEffect(() => {
    const syncFollowState = async () => {
      if (!viewerId || !profile?.id || viewerId === profile.id) {
        setIsFollowing(false);
        return;
      }

      const result = await getFollowState(viewerId, profile.id);
      setIsFollowing(result.isFollowing);
    };

    void syncFollowState();
  }, [profile?.id, viewerId]);

  const handleDeletePost = useCallback((idToDelete: number) => {
    setThreads((prev) => prev.filter((item) => item.id !== idToDelete));
    setRepliesData((prev) => prev.filter((item) => item.id !== idToDelete));
  }, []);

  const composer = useReplyComposer({
    currentUserName: viewerName,
    currentUserAvatar: viewerAvatar,
    isLoggedIn,
    onRequireLogin: () => setShowLoginModal(true),
    onPosted: async () => {
      await fetchProfileData(true);
    },
  });

  const handleToggleFollow = useCallback(async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    if (!viewerId || !profile?.id || viewerId === profile.id || followLoading) return;

    const nextFollowing = !isFollowing;
    setFollowLoading(true);
    setIsFollowing(nextFollowing);
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            followerCount: Math.max(0, prev.followerCount + (nextFollowing ? 1 : -1)),
          }
        : prev,
    );

    const result = nextFollowing ? await followProfile(viewerId, profile.id) : await unfollowProfile(viewerId, profile.id);

    if (result.error) {
      setIsFollowing(!nextFollowing);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              followerCount: Math.max(0, prev.followerCount + (nextFollowing ? -1 : 1)),
            }
          : prev,
      );
      setFollowLoading(false);
      return;
    }

    setFollowLoading(false);
    await fetchProfileData(true);
  }, [fetchProfileData, followLoading, isFollowing, isLoggedIn, profile?.id, viewerId]);

  const handleSaveProfile = useCallback(
    async (values: { displayName: string; bio: string; avatarUrl: string }) => {
      if (!viewerId) return;
      const { profile: updatedProfile, error } = await updateMyProfile({
        userId: viewerId,
        displayName: values.displayName || viewerName,
        bio: values.bio,
        avatarUrl: values.avatarUrl,
      });

      if (error || !updatedProfile) {
        console.error('更新个人资料失败', error);
        return;
      }

      setProfile(updatedProfile);
      onViewerProfileUpdated?.(updatedProfile);
      setShowEditModal(false);
    },
    [onViewerProfileUpdated, viewerId, viewerName],
  );

  const handleShareProfile = useCallback(async () => {
    const profileUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (!profileUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.displayName || profileUsername} 的个人主页`,
          url: profileUrl,
        });
        return;
      } catch {
        // ignore manual cancel
      }
    }

    await navigator.clipboard.writeText(profileUrl);
  }, [profile?.displayName, profileUsername]);

  const profileHeader = useMemo(() => {
    if (!profile) return null;

    return {
      displayName: profile.displayName,
      username: profile.username,
      bio: profile.bio || (isOwner ? '这是我的个人主页。第六轮已经补了更顺滑的加载和关注数同步。' : `这里是 @${profile.username} 的个人主页。`),
      avatarUrl: profile.avatarUrl,
      meta: formatProfileMeta(profile),
    };
  }, [isOwner, profile]);

  const showInitialSkeleton = (isAuthChecking || loading) && !profileHeader && threads.length === 0 && repliesData.length === 0;

  if (showInitialSkeleton) {
    return <ProfileScreenSkeleton />;
  }

  if (!isAuthChecking && requireViewerLogin && !isLoggedIn) {
    return <Login />;
  }

  return (
    <main className="min-h-screen bg-white dark:bg-[#101010] flex justify-center relative">
      <div className="w-full max-w-[620px] border-x border-gray-200 dark:border-[#333638] min-h-screen relative pb-20">
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#101010]/80 backdrop-blur-md px-4 h-[60px] flex items-center justify-between border-b border-gray-100 dark:border-[#222]">
          <button onClick={() => router.push('/')} className="text-black dark:text-white hover:opacity-70 transition-opacity" type="button">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="font-bold text-[16px] text-black dark:text-white">个人主页</div>
          <button onClick={handleShareProfile} className="text-black dark:text-white hover:opacity-70" type="button">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C9.886 12.511 11.35 12 12.934 12c2.726 0 5.103 1.51 6.326 3.742M6.26 15.1A9 9 0 103.06 9.36" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5l4 0m0 0v4m0-4l-6 6" />
            </svg>
          </button>
        </header>

        <div className="px-4 sm:px-6 pt-4 pb-6">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <h1 className="text-[24px] font-bold text-black dark:text-[#F3F5F7] leading-tight truncate">
                {profileHeader?.displayName || profileUsername}
              </h1>
              <p className="text-[15px] text-[#666666] dark:text-[#A0A0A0] mt-1">@{profileHeader?.username || profileUsername}</p>
            </div>
            <div className="w-[72px] h-[72px] rounded-full overflow-hidden border border-gray-100 dark:border-[#333] shrink-0 bg-gray-100 dark:bg-[#1A1A1A]">
              <img src={profileHeader?.avatarUrl || viewerAvatar} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>

          <p className="mt-4 text-[15px] text-black dark:text-[#F3F5F7] whitespace-pre-wrap break-words">
            {profileHeader?.bio || '这个主页还没有简介。'}
          </p>

          <div className="mt-4 text-[#999999] dark:text-[#777777] text-[15px] flex items-center gap-2">
            <div className="flex -space-x-1">
              <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600" />
              <div className="w-4 h-4 rounded-full bg-gray-400 dark:bg-gray-500" />
            </div>
            <span className="transition-all duration-200">{profileHeader?.meta || '0 个粉丝 · 0 个关注中'}</span>
          </div>

          <div className="flex gap-3 mt-5">
            {isOwner ? (
              <>
                <button
                  onClick={() => profile && setShowEditModal(true)}
                  className="flex-1 py-2 border border-gray-300 dark:border-[#444] rounded-lg font-bold text-[15px] text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#1C1C1C] transition-colors"
                  type="button"
                >
                  编辑个人主页
                </button>
                <button
                  onClick={handleShareProfile}
                  className="flex-1 py-2 border border-gray-300 dark:border-[#444] rounded-lg font-bold text-[15px] text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#1C1C1C] transition-colors"
                  type="button"
                >
                  分享个人主页
                </button>
              </>
            ) : (
              <button
                onClick={handleToggleFollow}
                className={`flex-1 py-2 rounded-lg font-bold text-[15px] transition-colors ${isFollowing ? 'border border-gray-300 dark:border-[#444] text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#1C1C1C]' : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90'}`}
                disabled={followLoading}
                type="button"
              >
                {followLoading ? '处理中...' : isFollowing ? '已关注' : '关注'}
              </button>
            )}
          </div>
        </div>

        <div className="flex w-full border-b border-gray-200 dark:border-[#333]">
          <button
            onClick={() => setActiveTab('threads')}
            className={`flex-1 pb-3 text-[15px] font-bold transition-colors relative ${activeTab === 'threads' ? 'text-black dark:text-white' : 'text-[#999999] dark:text-[#777777] hover:text-[#666] dark:hover:text-[#aaa]'}`}
            type="button"
          >
            串文
            {activeTab === 'threads' && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-black dark:bg-white rounded-t-full" />}
          </button>
          <button
            onClick={() => setActiveTab('replies')}
            className={`flex-1 pb-3 text-[15px] font-bold transition-colors relative ${activeTab === 'replies' ? 'text-black dark:text-white' : 'text-[#999999] dark:text-[#777777] hover:text-[#666] dark:hover:text-[#aaa]'}`}
            type="button"
          >
            回复
            {activeTab === 'replies' && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-black dark:bg-white rounded-t-full" />}
          </button>
        </div>

        <div className="mt-2">
          {loading ? (
            <ProfileTabContentSkeleton />
          ) : activeTab === 'threads' ? (
            threads.length > 0 ? (
              threads.map((thread) => (
                <ThreadCard
                  key={thread.id}
                  {...thread}
                  currentUserName={viewerName || undefined}
                  isLoggedIn={isLoggedIn}
                  onDelete={handleDeletePost}
                  onReplyClick={composer.openReplyComposer}
                  onRequireLogin={() => setShowLoginModal(true)}
                />
              ))
            ) : (
              <div className="p-10 text-center text-[#999999]">
                <div className="text-[16px] font-bold text-black dark:text-[#F3F5F7] mb-1">还没有公开串文</div>
                <div className="text-[14px]">发布第一条内容后，它会出现在这里。</div>
              </div>
            )
          ) : repliesData.length > 0 ? (
            repliesData.map((reply) => (
              <ThreadCard
                key={reply.id}
                {...reply}
                currentUserName={viewerName || undefined}
                isLoggedIn={isLoggedIn}
                onDelete={handleDeletePost}
                onReplyClick={composer.openReplyComposer}
                onRequireLogin={() => setShowLoginModal(true)}
                isReplyNode
              />
            ))
          ) : (
            <div className="p-10 text-center text-[#999999]">
              <div className="text-[16px] font-bold text-black dark:text-[#F3F5F7] mb-1">还没有回复记录</div>
              <div className="text-[14px]">当你参与别人的讨论后，这里会自动更新。</div>
            </div>
          )}
        </div>
      </div>

      {showLoginModal && <AuthModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />}
      {profile && showEditModal && isOwner && <EditProfileModal profile={profile} onClose={() => setShowEditModal(false)} onSave={handleSaveProfile} />}
      <ReplyComposerModal composer={composer} currentUserName={viewerName} currentUserAvatar={viewerAvatar} />
    </main>
  );
}
