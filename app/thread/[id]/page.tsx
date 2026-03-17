'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ThreadCard from '@/components/ThreadCard';
import ReplyComposerModal from '@/components/reply/ReplyComposerModal';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useReplyComposer } from '@/hooks/useReplyComposer';
import { supabase } from '@/lib/supabase';
import type { ThreadRecord } from '@/lib/thread-types';
import { mapThreadRecordToCardData, mapThreadRecordsToCardData } from '@/lib/thread-utils';

export default function ThreadDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { isAuthChecking, isLoggedIn, currentUserName, currentUserAvatar } = useAuthUser();

  const [mainThread, setMainThread] = useState<ThreadRecord | null>(null);
  const [replies, setReplies] = useState<ThreadRecord[]>([]);

  const fetchData = useCallback(async () => {
    if (!id) return;

    const [{ data: threadData }, { data: repliesData }] = await Promise.all([
      supabase.from('threads').select('*').eq('id', id).single(),
      supabase.from('threads').select('*').eq('parent_id', id).order('created_at', { ascending: true }),
    ]);

    setMainThread((threadData as ThreadRecord | null) ?? null);
    setReplies((repliesData as ThreadRecord[]) || []);
  }, [id]);

  const replyComposer = useReplyComposer({
    isLoggedIn,
    currentUserName,
    currentUserAvatar,
    onRequireLogin: () => {},
    onPosted: fetchData,
  });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const replyCards = useMemo(() => mapThreadRecordsToCardData(replies), [replies]);
  const mainCard = useMemo(
    () => (mainThread ? mapThreadRecordToCardData(mainThread) : null),
    [mainThread],
  );

  if (isAuthChecking) {
    return <div className="min-h-screen bg-[#101010] flex items-center justify-center text-white">识别中...</div>;
  }

  return (
    <main className="min-h-screen bg-white dark:bg-[#101010] flex justify-center relative">
      <div className="w-full max-w-[620px] border-x border-gray-200 dark:border-[#333638] min-h-screen relative pb-20">
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#101010]/80 backdrop-blur-md px-4 h-[60px] flex items-center justify-between border-b border-gray-100 dark:border-[#222]">
          <button
            onClick={() => router.back()}
            className="text-[#999999] hover:text-black dark:text-[#777777] dark:hover:text-white p-2 -ml-2 rounded-full transition-colors flex items-center justify-center z-10"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="font-bold text-[16px] text-black dark:text-white absolute left-1/2 transform -translate-x-1/2">帖子</span>
          <div className="w-10"></div>
        </header>

        {mainCard ? (
          <ThreadCard
            {...mainCard}
            isLoggedIn={isLoggedIn}
            currentUserName={currentUserName}
            onDelete={() => router.push('/')}
            onReplyClick={replyComposer.openReplyComposer}
          />
        ) : (
          <div className="p-10 text-center text-[#999999]">载入中...</div>
        )}

        <div className="mt-2">
          {replyCards.map((reply) => (
            <ThreadCard
              key={reply.id}
              {...reply}
              isLoggedIn={isLoggedIn}
              currentUserName={currentUserName}
              onDelete={(deletedId) => setReplies((prev) => prev.filter((item) => item.id !== deletedId))}
              onReplyClick={replyComposer.openReplyComposer}
            />
          ))}
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
