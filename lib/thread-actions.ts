import { supabase } from '@/lib/supabase';
import type { ReplyDraft } from '@/lib/thread-types';

export async function createThreadPost(params: {
  authorName: string;
  authorAvatar: string;
  content: string;
  imageUrl?: string;
}) {
  return supabase.from('threads').insert([
    {
      author_name: params.authorName,
      author_avatar: params.authorAvatar,
      content: params.content,
      image_url: params.imageUrl || null,
      likes: 0,
      replies: 0,
    },
  ]);
}

export async function createThreadReplies(params: {
  threadId: number;
  authorName: string;
  authorAvatar: string;
  replyList: ReplyDraft[];
}) {
  const validReplies = params.replyList.filter((reply) => reply.content.trim());
  if (validReplies.length === 0) {
    return { error: null, insertedCount: 0 };
  }

  const insertResults = await Promise.all(
    validReplies.map((reply) =>
      supabase.from('threads').insert([
        {
          content: reply.content.trim(),
          author_name: params.authorName,
          author_avatar: params.authorAvatar,
          parent_id: params.threadId,
        },
      ]),
    ),
  );

  const insertError = insertResults.find((result) => result.error)?.error ?? null;
  if (insertError) {
    return { error: insertError, insertedCount: 0 };
  }

  const { data: latestThread, error: latestError } = await supabase
    .from('threads')
    .select('replies')
    .eq('id', params.threadId)
    .single();

  if (latestError) {
    return { error: latestError, insertedCount: 0 };
  }

  const nextReplyCount = (latestThread?.replies || 0) + validReplies.length;
  const { error: updateError } = await supabase
    .from('threads')
    .update({ replies: nextReplyCount })
    .eq('id', params.threadId);

  return {
    error: updateError,
    insertedCount: validReplies.length,
  };
}
