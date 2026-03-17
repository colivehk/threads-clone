'use client';

import ThreadCard from '@/components/ThreadCard';
import { ThreadCardData } from '@/lib/thread-types';

export default function FeedList({
  threads,
  isLoggedIn,
  currentUserName,
  onDelete,
  onReplyClick,
  onRequireLogin,
}: {
  threads: ThreadCardData[];
  isLoggedIn?: boolean;
  currentUserName?: string;
  onDelete?: (id: number) => void;
  onReplyClick?: (thread: ThreadCardData) => void;
  onRequireLogin?: () => void;
}) {
  return (
    <>
      {threads.map((thread) => (
        <ThreadCard
          key={thread.id}
          {...thread}
          isLoggedIn={isLoggedIn}
          currentUserName={currentUserName}
          onDelete={onDelete}
          onReplyClick={onReplyClick}
          onRequireLogin={onRequireLogin}
        />
      ))}
    </>
  );
}
