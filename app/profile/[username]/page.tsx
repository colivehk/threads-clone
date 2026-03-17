'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { RealtimePostgresChangesPayload, User } from '@supabase/supabase-js';
import ThreadCard from '@/components/ThreadCard';
import { supabase } from '@/lib/supabase';
import Login from '@/components/Login';
import Avatar from '@/components/Avatar';
import {
  checkIsFollowing,
  followUser,
  getAvatarForName,
  getFollowerCount,
  getFollowingCount,
  getUsernameFromUser,
  normalizeUsername,
  unfollowUser,
} from '@/lib/follows';

interface ThreadRow {
  id: number;
  author_name: string;
  author_avatar: string | null;
  content: string;
  created_at: string;
  likes: number;
  replies: number;
  image_url: string | null;
  parent_id: number | null;
}

interface ReplyDraft {
  id: number;
  content: string;
}

function formatThreadTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ProfileSkeleton() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#101010] flex justify-center relative">
      <div className="w-full max-w-[620px] border-x border-gray-200 dark:border-[#333638] min-h-screen relative pb-20 animate-pulse">
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#101010]/80 backdrop-blur-md px-4 h-[60px] flex items-center justify-between border-b border-transparent dark:border-transparent">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1C1C1C]" />
          <div className="h-4 w-24 rounded bg-gray-100 dark:bg-[#1C1C1C]" />
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1C1C1C]" />
        </header>
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
          <div className="flex gap-3 mt-5">
            <div className="flex-1 h-10 rounded-lg bg-gray-100 dark:bg-[#1C1C1C]" />
            <div className="flex-1 h-10 rounded-lg bg-gray-100 dark:bg-[#1C1C1C]" />
          </div>
        </div>
        <div className="px-4 sm:px-6 py-4 space-y-5">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1C1C1C]" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-24 rounded bg-gray-100 dark:bg-[#1C1C1C]" />
                <div className="h-4 w-full rounded bg-gray-100 dark:bg-[#1C1C1C]" />
                <div className="h-4 w-2/3 rounded bg-gray-100 dark:bg-[#1C1C1C]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const rawUsername = Array.isArray(params.username) ? params.username[0] : params.username;
  const profileRouteName = decodeURIComponent(String(rawUsername ?? '')).trim();
  const profileUserName = normalizeUsername(profileRouteName);
  const authorQueryNames = Array.from(new Set([profileRouteName, profileUserName].filter(Boolean)));

  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<'threads' | 'replies'>('threads');
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [repliesData, setRepliesData] = useState<ThreadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowProcessing, setIsFollowProcessing] = useState(false);

  const [replyTarget, setReplyTarget] = useState<any>(null);
  const [replyList, setReplyList] = useState<ReplyDraft[]>([{ id: Date.now(), content: '' }]);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showReplyOptions, setShowReplyOptions] = useState(false);
  const [replyAudience, setReplyAudience] = useState('任何人');

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

  const currentUserName = getUsernameFromUser(user);
  const currentUserAvatar = currentUserName ? getAvatarForName(currentUserName) : '';
  const isMyProfile = Boolean(currentUserName) && currentUserName === profileUserName;
  const profileAvatar = getAvatarForName(profileUserName || profileRouteName);

  const fetchUserData = useCallback(async () => {
    if (authorQueryNames.length === 0) return;
    setLoading(true);

    const baseThreadsQuery = supabase.from('threads').select('*');
    const threadsQuery = authorQueryNames.length === 1
      ? baseThreadsQuery.eq('author_name', authorQueryNames[0]).is('parent_id', null)
      : baseThreadsQuery.in('author_name', authorQueryNames).is('parent_id', null);

    const baseRepliesQuery = supabase.from('threads').select('*');
    const repliesQuery = authorQueryNames.length === 1
      ? baseRepliesQuery.eq('author_name', authorQueryNames[0]).not('parent_id', 'is', null)
      : baseRepliesQuery.in('author_name', authorQueryNames).not('parent_id', 'is', null);

    const [{ data: threadRows }, { data: replyRows }] = await Promise.all([
      threadsQuery.order('created_at', { ascending: false }),
      repliesQuery.order('created_at', { ascending: false }),
    ]);

    setThreads((threadRows as ThreadRow[] | null) ?? []);
    setRepliesData((replyRows as ThreadRow[] | null) ?? []);
    setLoading(false);
  }, [authorQueryNames]);

  const fetchFollowData = useCallback(async () => {
    if (!profileUserName) return;

    const [nextFollowerCount, nextFollowingCount, nextIsFollowing] = await Promise.all([
      getFollowerCount(profileUserName),
      getFollowingCount(profileUserName),
      currentUserName && !isMyProfile ? checkIsFollowing(currentUserName, profileUserName) : Promise.resolve(false),
    ]);

    setFollowerCount(nextFollowerCount);
    setFollowingCount(nextFollowingCount);
    setIsFollowing(Boolean(nextIsFollowing));
  }, [currentUserName, isMyProfile, profileUserName]);

  useEffect(() => {
    void fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    void fetchFollowData();
  }, [fetchFollowData]);

  useEffect(() => {
    if (!profileUserName) return;

    const channel = supabase
      .channel(`follows:${profileUserName}:${currentUserName || 'guest'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'follows' },
        (payload: RealtimePostgresChangesPayload<{ follower: string; following: string }>) => {
          const nextRow = payload.new as { follower?: string; following?: string };
          const prevRow = payload.old as { follower?: string; following?: string };
          const nextFollowing = normalizeUsername(nextRow?.following);
          const prevFollowing = normalizeUsername(prevRow?.following);
          const nextFollower = normalizeUsername(nextRow?.follower);
          const prevFollower = normalizeUsername(prevRow?.follower);

          const touchesProfile = nextFollowing === profileUserName || prevFollowing === profileUserName;
          const touchesViewerRelation =
            Boolean(currentUserName) &&
            ((nextFollower === currentUserName && nextFollowing === profileUserName) ||
              (prevFollower === currentUserName && prevFollowing === profileUserName));

          if (touchesProfile || touchesViewerRelation) {
            void fetchFollowData();
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUserName, fetchFollowData, profileUserName]);

  const handleToggleFollow = async () => {
    if (!currentUserName) {
      alert('请先登录后再关注。');
      return;
    }
    if (!profileUserName || isMyProfile || isFollowProcessing) return;

    setIsFollowProcessing(true);
    const prevFollowing = isFollowing;
    const prevFollowerCount = followerCount;

    if (prevFollowing) {
      setIsFollowing(false);
      setFollowerCount((prev) => Math.max(0, prev - 1));
      const result = await unfollowUser(currentUserName, profileUserName);
      if (!result.ok) {
        setIsFollowing(prevFollowing);
        setFollowerCount(prevFollowerCount);
        alert(result.error || '取消关注失败');
      }
    } else {
      setIsFollowing(true);
      setFollowerCount((prev) => prev + 1);
      const result = await followUser(currentUserName, profileUserName);
      if (!result.ok) {
        setIsFollowing(prevFollowing);
        setFollowerCount(prevFollowerCount);
        alert(result.error || '关注失败');
      }
    }

    setIsFollowProcessing(false);
    void fetchFollowData();
  };

  const handlePostMultiReply = async () => {
    if (!user || !replyTarget) return;

    const validReplies = replyList.filter((reply) => reply.content.trim());
    if (validReplies.length === 0) return;

    const insertPromises = validReplies.map((reply) =>
      supabase.from('threads').insert([
        {
          content: reply.content,
          author_name: currentUserName,
          author_avatar: currentUserAvatar,
          parent_id: replyTarget.id,
        },
      ]),
    );

    await Promise.all(insertPromises);
    await supabase
      .from('threads')
      .update({ replies: (replyTarget.replies || 0) + validReplies.length })
      .eq('id', replyTarget.id);

    forceCloseReplyModal();
    void fetchUserData();
  };

  const closeReplyWithGuard = () => {
    const hasContent = replyList.some((reply) => reply.content.trim());
    if (hasContent) {
      setShowDiscardConfirm(true);
    } else {
      forceCloseReplyModal();
    }
  };

  const forceCloseReplyModal = () => {
    setReplyTarget(null);
    setReplyList([{ id: Date.now(), content: '' }]);
    setShowDiscardConfirm(false);
    setShowReplyOptions(false);
    setReplyAudience('任何人');
  };

  const tabThreads = activeTab === 'threads' ? threads : repliesData;
  const headerTitle = profileRouteName || profileUserName || '个人主页';

  if (isAuthChecking || (loading && threads.length === 0 && repliesData.length === 0)) {
    return <ProfileSkeleton />;
  }

  return (
    <main className="min-h-screen bg-white dark:bg-[#101010] flex justify-center relative">
      {!user && <Login />}
      <div className="w-full max-w-[620px] border-x border-gray-200 dark:border-[#333638] min-h-screen relative pb-20">
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#101010]/80 backdrop-blur-md px-4 h-[60px] flex items-center justify-between border-b border-gray-200 dark:border-[#222]">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#1C1C1C] transition-colors"
          >
            <svg className="w-5 h-5 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="font-bold text-[17px] text-black dark:text-[#F3F5F7]">{headerTitle}</div>
          <div className="w-10" />
        </header>

        <div className="px-4 sm:px-6 pt-2 pb-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-[28px] leading-[1.1] font-bold text-black dark:text-[#F3F5F7]">{headerTitle}</div>
              <div className="text-[15px] text-[#777] dark:text-[#A1A1AA] mt-1">@{profileUserName || 'unknown'}</div>
            </div>
            <Avatar name={profileUserName || headerTitle || 'user'} src={profileAvatar} size="lg" />
          </div>

          <div className="mt-4 text-[15px] leading-6 text-black dark:text-[#F3F5F7]">
            {isMyProfile ? '这里是你的主页。继续发布内容，让更多人看到你。' : `${headerTitle} 的 Threads 主页`}
          </div>
          <div className="mt-3 text-[14px] text-[#777] dark:text-[#A1A1AA]">
            <span>{followerCount}</span> 个关注者 · <span>{followingCount}</span> 个正在关注
          </div>

          <div className="flex gap-3 mt-5">
            {isMyProfile ? (
              <button className="flex-1 h-10 rounded-[10px] border border-gray-300 dark:border-[#333638] text-[15px] font-semibold text-black dark:text-[#F3F5F7] hover:bg-gray-50 dark:hover:bg-[#181818] transition-colors">
                编辑个人主页
              </button>
            ) : (
              <button
                onClick={handleToggleFollow}
                type="button"
                disabled={isFollowProcessing}
                className={`flex-1 h-10 rounded-[10px] text-[15px] font-semibold transition-colors ${
                  isFollowing
                    ? 'border border-gray-300 dark:border-[#333638] text-black dark:text-[#F3F5F7] hover:bg-gray-50 dark:hover:bg-[#181818]'
                    : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90'
                } ${isFollowProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isFollowProcessing ? '处理中...' : isFollowing ? '正在关注' : '关注'}
              </button>
            )}
            <button className="flex-1 h-10 rounded-[10px] border border-gray-300 dark:border-[#333638] text-[15px] font-semibold text-black dark:text-[#F3F5F7] hover:bg-gray-50 dark:hover:bg-[#181818] transition-colors">
              分享个人主页
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-[#222] flex">
          <button
            onClick={() => setActiveTab('threads')}
            className={`flex-1 py-3 text-[15px] font-semibold transition-colors ${
              activeTab === 'threads'
                ? 'text-black dark:text-[#F3F5F7] border-b-2 border-black dark:border-white'
                : 'text-[#777] dark:text-[#777]'
            }`}
          >
            线程
          </button>
          <button
            onClick={() => setActiveTab('replies')}
            className={`flex-1 py-3 text-[15px] font-semibold transition-colors ${
              activeTab === 'replies'
                ? 'text-black dark:text-[#F3F5F7] border-b-2 border-black dark:border-white'
                : 'text-[#777] dark:text-[#777]'
            }`}
          >
            回复
          </button>
        </div>

        {tabThreads.length > 0 ? (
          tabThreads.map((thread) => (
            <ThreadCard
              key={thread.id}
              id={thread.id}
              authorName={thread.author_name}
              authorAvatar={thread.author_avatar || getAvatarForName(thread.author_name)}
              content={thread.content}
              timestamp={thread.created_at}
              likes={thread.likes}
              replies={thread.replies}
              imageUrl={thread.image_url ?? undefined}
              currentUserName={currentUserName}
              isReplyNode={Boolean(thread.parent_id)}
              onReplyClick={(target) => setReplyTarget(target)}
              onDelete={(_id) => void fetchUserData()}
            />
          ))
        ) : (
          <div className="px-6 py-12 text-center text-[#999999]">
            {activeTab === 'threads' ? '还没有发布任何线程。' : '还没有任何回复。'}
          </div>
        )}
      </div>

      {replyTarget && user && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="w-full sm:max-w-[620px] bg-white dark:bg-[#101010] sm:rounded-[22px] max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white/90 dark:bg-[#101010]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-[#222]">
              <button onClick={closeReplyWithGuard} className="text-[15px] text-black dark:text-[#F3F5F7]">取消</button>
              <div className="text-[16px] font-semibold text-black dark:text-[#F3F5F7]">回复</div>
              <div className="w-8" />
            </div>

            <div className="px-4 pt-3">
              <ThreadCard {...replyTarget} currentUserName={currentUserName} isReplyNode={true} />
            </div>

            {replyList.map((reply, idx) => (
              <div key={reply.id} className="flex gap-3 px-4 sm:px-5 py-2 relative">
                <div className="flex flex-col items-center flex-shrink-0">
                  <Avatar name={currentUserName} src={currentUserAvatar} size="md" />
                  <div className="w-[2px] flex-1 bg-gray-200 dark:bg-[#333] mt-2 mb-[-16px]" />
                </div>
                <div className="flex-1 pt-1 pb-2">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-bold text-[14px] text-black dark:text-[#F3F5F7]">{currentUserName}</div>
                    {idx > 0 && (
                      <button
                        onClick={() => {
                          const newList = [...replyList];
                          newList.splice(idx, 1);
                          setReplyList(newList);
                        }}
                        className="text-[#999999] hover:text-black dark:hover:text-white text-sm"
                      >
                        删除
                      </button>
                    )}
                  </div>
                  <textarea
                    autoFocus={idx === replyList.length - 1}
                    placeholder={idx === 0 ? '回复...' : '添加另一条回复...'}
                    value={reply.content}
                    onChange={(e) => {
                      const newList = [...replyList];
                      newList[idx].content = e.target.value;
                      setReplyList(newList);
                    }}
                    className="w-full text-[15px] bg-transparent text-black dark:text-[#F3F5F7] placeholder-[#999999] dark:placeholder-[#777777] resize-none min-h-[44px] outline-none"
                    rows={2}
                  />
                  <div className="flex items-center gap-4 mt-2 text-[#999999] dark:text-[#777777]">
                    <button type="button" className="hover:text-black dark:hover:text-white transition-colors">
                      GIF
                    </button>
                    <button type="button" className="hover:text-black dark:hover:text-white transition-colors">
                      图片
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className={`flex gap-3 px-4 sm:px-5 py-3 transition-opacity duration-200 ${showReplyOptions ? 'opacity-100' : 'opacity-100'}`}>
              <div className={`w-[40px] flex justify-center ${replyList[replyList.length - 1]?.content ? 'items-end' : 'items-center'}`}>
                <button
                  onClick={() => setReplyList([...replyList, { id: Date.now(), content: '' }])}
                  className="w-8 h-8 rounded-full border border-gray-300 dark:border-[#444] text-[#999999] dark:text-[#777777] hover:text-black hover:border-gray-400 dark:hover:text-white dark:hover:border-[#666] transition-colors text-[18px] flex items-center justify-center"
                  type="button"
                >
                  +
                </button>
              </div>
              <div className="text-[14px] pt-1 font-medium text-[#999999] dark:text-[#777777]">向串文添加帖子</div>
            </div>

            <div className="p-4 px-5 flex justify-between items-center bg-white dark:bg-[#181818] border-t border-gray-200 dark:border-[#222] sticky bottom-0">
              <button onClick={() => setShowReplyOptions(!showReplyOptions)} className="flex items-center text-[14px] font-medium text-[#999999] dark:text-[#777777]">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10a2 2 0 012-2h2m10-4H7m10 0a2 2 0 012 2v0a2 2 0 01-2 2H7a2 2 0 01-2-2v0a2 2 0 012-2m10 0V2a2 2 0 00-2-2H9a2 2 0 00-2 2v2" />
                </svg>
                任何人都能回复和引用
              </button>
              <button
                onClick={handlePostMultiReply}
                disabled={!replyList.some((r) => r.content.trim())}
                className={`font-bold text-[15px] ${replyList.some((r) => r.content.trim()) ? 'text-black dark:text-white' : 'text-[#CCCCCC] dark:text-[#555555]'}`}
              >
                发布
              </button>
            </div>
          </div>
        </div>
      )}

      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-[360px] rounded-[20px] bg-white dark:bg-[#181818] p-6 shadow-2xl">
            <div className="text-[18px] font-bold text-black dark:text-white mb-2">放弃串文？</div>
            <p className="text-[14px] leading-6 text-[#666] dark:text-[#A1A1AA] mb-5">
              你已经开始撰写回复，离开后将不会保存。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 h-10 rounded-[12px] border border-gray-300 dark:border-[#333638] text-[15px] font-semibold text-black dark:text-white"
              >
                继续编辑
              </button>
              <button
                onClick={forceCloseReplyModal}
                className="flex-1 h-10 rounded-[12px] bg-black dark:bg-white text-[15px] font-semibold text-white dark:text-black"
              >
                放弃
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
