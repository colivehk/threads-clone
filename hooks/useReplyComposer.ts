'use client';

import { useCallback, useMemo, useState } from 'react';
import { createThreadReplies } from '@/lib/thread-actions';
import type { ReplyDraft, ThreadCardData } from '@/lib/thread-types';
import { createReplyDraft } from '@/lib/thread-utils';

type UseReplyComposerOptions = {
  isLoggedIn: boolean;
  currentUserName: string;
  currentUserAvatar: string;
  onRequireLogin?: () => void;
  onPosted?: () => Promise<void> | void;
};

export function useReplyComposer(options: UseReplyComposerOptions) {
  const [replyTarget, setReplyTarget] = useState<ThreadCardData | null>(null);
  const [replyList, setReplyList] = useState<ReplyDraft[]>([createReplyDraft()]);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showReplyOptions, setShowReplyOptions] = useState(false);
  const [replyAudience, setReplyAudience] = useState('任何人');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetComposer = useCallback(() => {
    setReplyTarget(null);
    setReplyList([createReplyDraft()]);
    setShowDiscardConfirm(false);
    setShowReplyOptions(false);
    setReplyAudience('任何人');
    setIsSubmitting(false);
  }, []);

  const openReplyComposer = useCallback(
    (thread: ThreadCardData) => {
      if (!options.isLoggedIn) {
        options.onRequireLogin?.();
        return;
      }

      setReplyTarget(thread);
      setReplyList([createReplyDraft()]);
      setShowDiscardConfirm(false);
      setShowReplyOptions(false);
    },
    [options],
  );

  const handleAttemptClose = useCallback(() => {
    const hasContent = replyList.some((reply) => reply.content.trim() !== '');
    if (hasContent) {
      setShowDiscardConfirm(true);
      return;
    }

    resetComposer();
  }, [replyList, resetComposer]);

  const updateReplyContent = useCallback((replyId: number, nextContent: string) => {
    setReplyList((prev) =>
      prev.map((reply) => (reply.id === replyId ? { ...reply, content: nextContent } : reply)),
    );
  }, []);

  const removeReply = useCallback((replyId: number) => {
    setReplyList((prev) => prev.filter((reply) => reply.id !== replyId));
  }, []);

  const appendReplyDraft = useCallback(() => {
    setReplyList((prev) => {
      const lastReply = prev[prev.length - 1];
      if (!lastReply || !lastReply.content.trim()) {
        return prev;
      }

      return [...prev, createReplyDraft()];
    });
  }, []);

  const hasReplyContent = useMemo(
    () => replyList.some((reply) => reply.content.trim() !== ''),
    [replyList],
  );

  const submitReplies = useCallback(async () => {
    if (!replyTarget || !options.currentUserName || isSubmitting) {
      return false;
    }

    setIsSubmitting(true);

    const result = await createThreadReplies({
      threadId: replyTarget.id,
      authorName: options.currentUserName,
      authorAvatar: options.currentUserAvatar,
      replyList,
    });

    if (result.error) {
      console.error('回复发布失败', result.error);
      setIsSubmitting(false);
      return false;
    }

    resetComposer();
    await options.onPosted?.();
    return true;
  }, [isSubmitting, options, replyList, replyTarget, resetComposer]);

  return {
    replyTarget,
    replyList,
    showDiscardConfirm,
    showReplyOptions,
    replyAudience,
    isSubmitting,
    hasReplyContent,
    openReplyComposer,
    handleAttemptClose,
    resetComposer,
    setShowDiscardConfirm,
    setShowReplyOptions,
    setReplyAudience,
    updateReplyContent,
    removeReply,
    appendReplyDraft,
    submitReplies,
  };
}

export type ReplyComposerController = ReturnType<typeof useReplyComposer>;
