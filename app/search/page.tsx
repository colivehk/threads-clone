'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import Avatar from '@/components/Avatar';
import Login from '@/components/Login';
import { checkIsFollowing, followUser, getAvatarForName, getUsernameFromUser, normalizeUsername, unfollowUser } from '@/lib/follows';

interface SearchUserRow {
  author_name: string;
  author_avatar: string | null;
}

interface SearchUser extends SearchUserRow {
  normalized_name: string;
}

export default function Search() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [processingMap, setProcessingMap] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      setFollowingMap({});
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      setHasSearched(true);

      const { data, error } = await supabase
        .from('threads')
        .select('author_name, author_avatar')
        .ilike('author_name', `%${searchQuery}%`)
        .limit(100);

      if (!error && data) {
        const mapped = (data as SearchUserRow[])
          .map((item) => ({
            ...item,
            normalized_name: normalizeUsername(item.author_name),
          }))
          .filter((item) => item.normalized_name);

        const uniqueUsers = Array.from(new Map(mapped.map((item) => [item.normalized_name, item])).values());
        setSearchResults(uniqueUsers);
      } else {
        setSearchResults([]);
      }

      setLoading(false);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    if (!currentUserName || searchResults.length === 0) {
      setFollowingMap({});
      return;
    }

    let cancelled = false;

    const loadFollowStates = async () => {
      const names = searchResults
        .map((item) => item.normalized_name)
        .filter((name) => name && name !== currentUserName);

      if (names.length === 0) {
        if (!cancelled) setFollowingMap({});
        return;
      }

      const { data } = await supabase.from('follows').select('following').eq('follower', currentUserName).in('following', names);
      if (cancelled) return;

      const nextMap: Record<string, boolean> = {};
      names.forEach((name) => {
        nextMap[name] = false;
      });
      (data as Array<{ following: string }> | null)?.forEach((row) => {
        const following = normalizeUsername(row.following);
        if (following) nextMap[following] = true;
      });
      setFollowingMap(nextMap);
    };

    void loadFollowStates();

    return () => {
      cancelled = true;
    };
  }, [currentUserName, searchResults]);

  const visibleResults = useMemo(
    () => searchResults.filter((result) => result.normalized_name && result.normalized_name !== currentUserName),
    [currentUserName, searchResults],
  );

  const handleToggleFollow = async (targetName: string) => {
    const normalizedTargetName = normalizeUsername(targetName);

    if (!currentUserName) {
      alert('请先登录后再关注。');
      return;
    }
    if (!normalizedTargetName || normalizedTargetName === currentUserName || processingMap[normalizedTargetName]) return;

    setProcessingMap((prev) => ({ ...prev, [normalizedTargetName]: true }));
    const prevFollowing = Boolean(followingMap[normalizedTargetName]);
    setFollowingMap((prev) => ({ ...prev, [normalizedTargetName]: !prevFollowing }));

    const result = prevFollowing
      ? await unfollowUser(currentUserName, normalizedTargetName)
      : await followUser(currentUserName, normalizedTargetName);

    if (!result.ok) {
      setFollowingMap((prev) => ({ ...prev, [normalizedTargetName]: prevFollowing }));
      const confirmed = await checkIsFollowing(currentUserName, normalizedTargetName);
      setFollowingMap((prev) => ({ ...prev, [normalizedTargetName]: confirmed }));
      alert(result.error || (prevFollowing ? '取消关注失败' : '关注失败'));
    }

    setProcessingMap((prev) => ({ ...prev, [normalizedTargetName]: false }));
  };

  if (isAuthChecking) {
    return (
      <main className="min-h-screen bg-white dark:bg-[#101010] flex justify-center relative">
        <div className="w-full max-w-[620px] border-x border-gray-200 dark:border-[#333638] min-h-screen relative pb-24 animate-pulse">
          <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#101010]/80 backdrop-blur-md px-4 pt-4 pb-3">
            <div className="h-8 w-20 rounded bg-gray-100 dark:bg-[#1C1C1C] mb-3 ml-2" />
            <div className="h-11 w-full rounded-[12px] bg-gray-100 dark:bg-[#1C1C1C]" />
          </header>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-[#101010] flex justify-center relative">
      {!user && <Login />}
      <div className="w-full max-w-[620px] border-x border-gray-200 dark:border-[#333638] min-h-screen relative pb-24">
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#101010]/80 backdrop-blur-md px-4 pt-4 pb-3">
          <div className="text-[24px] font-bold text-black dark:text-[#F3F5F7] mb-3 ml-2">搜索</div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-[#999999] dark:text-[#777777]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="搜索用户..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 dark:bg-[#1C1C1C] text-black dark:text-[#F3F5F7] border border-transparent focus:border-gray-300 dark:focus:border-[#444] rounded-[12px] py-2.5 pl-10 pr-4 outline-none transition-all placeholder-[#999999] dark:placeholder-[#777777] text-[15px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#999999] hover:text-black dark:hover:text-white transition-colors"
                type="button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </header>

        <div className="mt-2">
          {loading ? (
            <div className="px-6 py-8 text-center text-[#999999] flex justify-center items-center gap-2">
              <svg className="animate-spin w-5 h-5 text-[#999999]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              雷达扫描中...
            </div>
          ) : visibleResults.length > 0 ? (
            visibleResults.map((result) => {
              const targetName = result.normalized_name;
              const avatarSrc = result.author_avatar || getAvatarForName(targetName);
              const isFollowing = Boolean(followingMap[targetName]);
              const isProcessing = Boolean(processingMap[targetName]);

              return (
                <div
                  key={targetName}
                  onClick={() => router.push(`/profile/${encodeURIComponent(targetName)}`)}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors cursor-pointer border-b border-gray-100 dark:border-[#222]"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <Avatar name={targetName} src={avatarSrc} size="md" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-[15px] text-black dark:text-[#F3F5F7] truncate">{result.author_name || targetName}</span>
                      <span className="text-[14px] text-[#999999] dark:text-[#777777] truncate">{targetName} 的主页</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!currentUserName) {
                        router.push(`/profile/${encodeURIComponent(targetName)}`);
                        return;
                      }
                      void handleToggleFollow(targetName);
                    }}
                    type="button"
                    disabled={isProcessing}
                    className={`px-4 py-1.5 rounded-lg font-bold text-[14px] transition-colors ${
                      currentUserName
                        ? isFollowing
                          ? 'border border-gray-300 dark:border-[#444] text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#2A2A2A]'
                          : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-80'
                        : 'border border-gray-300 dark:border-[#444] text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#2A2A2A]'
                    } ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {currentUserName ? (isProcessing ? '处理中...' : isFollowing ? '正在关注' : '关注') : '查看'}
                  </button>
                </div>
              );
            })
          ) : hasSearched && !loading ? (
            <div className="px-6 py-10 text-center text-[#999999]">
              <div className="text-[16px] font-bold text-black dark:text-[#F3F5F7] mb-1">未找到用户</div>
              <div className="text-[14px]">尝试搜索其他指挥官的代号。</div>
            </div>
          ) : (
            <div className="px-6 py-10 text-center text-[#999999]">输入名称以搜索全站用户</div>
          )}
        </div>
      </div>
    </main>
  );
}
