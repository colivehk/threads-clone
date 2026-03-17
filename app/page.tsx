'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ThreadCard from '@/components/ThreadCard';
import Login from '@/components/Login';
import { supabase } from '@/lib/supabase';
import type { ThreadRecord } from '@/lib/thread-types';
import { mapThreadRecordsToCardData } from '@/lib/thread-utils';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useReplyComposer } from '@/hooks/useReplyComposer';
import ReplyComposerModal from '@/components/reply/ReplyComposerModal';

function AuthModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-0">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative pointer-events-auto bg-white dark:bg-[#181818] w-full max-w-[400px] rounded-[16px] sm:rounded-[24px] shadow-2xl flex flex-col border border-gray-100 dark:border-[#333] overflow-hidden transform transition-all">
        <div className="px-5 py-4 flex justify-between items-center border-b border-gray-100 dark:border-[#222]">
          <button
            onClick={onClose}
            className="text-[#999999] hover:text-black dark:hover:text-white transition-colors p-1 -ml-1"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="font-bold text-[16px] text-black dark:text-white">登录</span>
          <div className="w-8" />
        </div>
        <div className="p-6">
          <Login onClose={onClose} />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, isAuthChecking, isLoggedIn, currentUserName, currentUserAvatar } = useAuthUser();
  const [threads, setThreads] = useState<ThreadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const fetchThreads = useCallback(async () => {
    const { data, error } = await supabase
      .from('threads')
      .select('*')
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (!error) {
      setThreads((data as ThreadRecord[]) || []);
    }
  }, []);

  const replyComposer = useReplyComposer({
    isLoggedIn,
    currentUserName,
    currentUserAvatar,
    onRequireLogin: () => setShowLoginModal(true),
    onPosted: fetchThreads,
  });

  const handleDeletePost = useCallback((idToDelete: number) => {
    setThreads((prev) => prev.filter((thread) => thread.id !== idToDelete));
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      setShowLoginModal(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const handleTriggerRefresh = async () => {
      setIsRefreshing(true);

      const feedContainer = document.getElementById('feed-scroll-container');
      if (feedContainer) {
        feedContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      await fetchThreads();
      setIsRefreshing(false);
    };

    window.addEventListener('trigger-refresh', handleTriggerRefresh);
    return () => window.removeEventListener('trigger-refresh', handleTriggerRefresh);
  }, [fetchThreads]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchThreads();
      setLoading(false);
    };

    init();

    const channel = supabase
      .channel('realtime:threads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'threads' }, (payload) => {
        const next = payload.new as Partial<ThreadRecord>;
        const previous = payload.old as Partial<ThreadRecord>;

        if (payload.eventType === 'INSERT' && next.parent_id === null) {
          setThreads((prev) =>
            prev.some((thread) => thread.id === next.id) ? prev : [next as ThreadRecord, ...prev],
          );
        }

        if (payload.eventType === 'UPDATE' && next.id) {
          setThreads((prev) =>
            prev.map((thread) =>
              thread.id === next.id ? ({ ...thread, ...next } as ThreadRecord) : thread,
            ),
          );
        }

        if (payload.eventType === 'DELETE' && previous.id) {
          setThreads((prev) => prev.filter((thread) => thread.id !== previous.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchThreads]);

  const feedCards = useMemo(() => mapThreadRecordsToCardData(threads), [threads]);

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#101010] flex items-center justify-center text-white italic">
        识别中...
      </div>
    );
  }

  return (
    <main className="h-[100dvh] overflow-hidden bg-white dark:bg-[#101010] flex justify-center relative w-full px-5">
      {showLoginModal && !isLoggedIn && <AuthModal onClose={() => setShowLoginModal(false)} />}

      <div className="flex w-full max-w-[1077px] justify-between h-full pt-4 md:pt-6 pb-4">
        <div className="hidden md:block w-[76px] shrink-0" />

        <div className="w-full max-w-[640px] md:min-w-[640px] flex flex-col relative h-full pb-6">
          <header
            onClick={() => window.dispatchEvent(new Event('trigger-refresh'))}
            className="h-[60px] bg-transparent flex justify-center items-center shrink-0 cursor-pointer select-none"
          >
            <h1 className="text-[16px] font-bold text-black dark:text-white transition-opacity hover:opacity-70">
              首页
            </h1>
          </header>

          <div className="flex-1 flex flex-col bg-white dark:bg-[#181818] rounded-[24px] border border-gray-100 dark:border-[#222] shadow-sm overflow-hidden relative">
            <div
              id="feed-scroll-container"
              className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#d4d4d4] dark:[&::-webkit-scrollbar-thumb]:bg-[#333333] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#a3a3a3] dark:hover:[&::-webkit-scrollbar-thumb]:bg-[#444444] pr-[1px] [&>div>article:last-child]:border-b-0"
            >
              <div className="min-h-full flex flex-col">
                {(loading || isRefreshing) && (
                  <div className="flex justify-center items-center py-6 shrink-0 transition-all duration-300">
                    <svg
                      aria-label="正在加载..."
                      role="img"
                      viewBox="0 0 100 100"
                      className="w-6 h-6 text-[#999999] animate-spin"
                    >
                      <rect fill="currentColor" height="10" opacity="0" rx="5" ry="5" transform="rotate(-90 50 50)" width="28" x="67" y="45" />
                      <rect fill="currentColor" height="10" opacity="0.125" rx="5" ry="5" transform="rotate(-45 50 50)" width="28" x="67" y="45" />
                      <rect fill="currentColor" height="10" opacity="0.25" rx="5" ry="5" transform="rotate(0 50 50)" width="28" x="67" y="45" />
                      <rect fill="currentColor" height="10" opacity="0.375" rx="5" ry="5" transform="rotate(45 50 50)" width="28" x="67" y="45" />
                      <rect fill="currentColor" height="10" opacity="0.5" rx="5" ry="5" transform="rotate(90 50 50)" width="28" x="67" y="45" />
                      <rect fill="currentColor" height="10" opacity="0.625" rx="5" ry="5" transform="rotate(135 50 50)" width="28" x="67" y="45" />
                      <rect fill="currentColor" height="10" opacity="0.75" rx="5" ry="5" transform="rotate(180 50 50)" width="28" x="67" y="45" />
                      <rect fill="currentColor" height="10" opacity="0.875" rx="5" ry="5" transform="rotate(225 50 50)" width="28" x="67" y="45" />
                    </svg>
                  </div>
                )}

                {!loading &&
                  feedCards.map((thread) => (
                    <ThreadCard
                      key={thread.id}
                      {...thread}
                      isLoggedIn={isLoggedIn}
                      currentUserName={currentUserName || undefined}
                      onDelete={handleDeletePost}
                      onReplyClick={replyComposer.openReplyComposer}
                      onRequireLogin={() => setShowLoginModal(true)}
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block w-[337px] min-w-[337px] ml-[12px] pt-[60px] relative shrink-0">
          {!isLoggedIn && (
            <div className="bg-white dark:bg-[#181818] rounded-[24px] p-6 border border-gray-100 dark:border-[#222]">
              <h2 className="text-[16px] font-bold text-black dark:text-white mb-2">登录或注册 Threads</h2>
              <p className="text-[#999] dark:text-[#777] text-[14px] mb-6">
                看看大家都在聊什么，加入他们的对话吧。
              </p>
              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full bg-black text-white dark:bg-white dark:text-black font-bold rounded-[12px] py-3.5 hover:opacity-80 transition-opacity"
                type="button"
              >
                使用账号登录
              </button>
              <div className="mt-6 text-[12px] text-[#999] dark:text-[#777] flex flex-wrap gap-x-4 gap-y-2 justify-center">
                <span>© 2026 Threads 克隆版</span>
                <span className="cursor-pointer hover:underline">隐私政策</span>
                <span className="cursor-pointer hover:underline">服务条款</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <ReplyComposerModal
        composer={replyComposer}
        currentUserName={currentUserName}
        currentUserAvatar={currentUserAvatar}
      />
    </main>
  );
}
