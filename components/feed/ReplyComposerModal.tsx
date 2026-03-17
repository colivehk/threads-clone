'use client';

import Avatar from '@/components/Avatar';
import ThreadCard from '@/components/ThreadCard';
import { ReplyDraft, ThreadCardData } from '@/lib/thread-types';

function DiscardConfirmModal({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-[360px] rounded-[24px] bg-white dark:bg-[#181818] border border-gray-100 dark:border-[#333] shadow-2xl p-6">
        <h3 className="text-[18px] font-bold text-black dark:text-white text-center">放弃此次回复？</h3>
        <p className="text-[14px] text-[#999999] dark:text-[#777777] text-center mt-2 mb-6">
          你已经写了一部分内容，关闭后将不会保存。
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-3 rounded-[14px] bg-black text-white dark:bg-white dark:text-black font-bold hover:opacity-80 transition-opacity"
            type="button"
          >
            放弃
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-[14px] bg-gray-100 text-black dark:bg-[#242424] dark:text-white font-bold hover:opacity-80 transition-opacity"
            type="button"
          >
            继续编辑
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReplyComposerModal({
  thread,
  replyList,
  currentUserName,
  currentUserAvatar,
  showReplyOptions,
  showDiscardConfirm,
  isSubmitting = false,
  onRequestClose,
  onForceClose,
  onToggleReplyOptions,
  onSubmit,
  onChangeReply,
  onRemoveReply,
  onAddReply,
  onCancelDiscard,
}: {
  thread: ThreadCardData | null;
  replyList: ReplyDraft[];
  currentUserName: string;
  currentUserAvatar: string;
  showReplyOptions: boolean;
  showDiscardConfirm: boolean;
  isSubmitting?: boolean;
  onRequestClose: () => void;
  onForceClose: () => void;
  onToggleReplyOptions: () => void;
  onSubmit: () => void;
  onChangeReply: (replyId: number, content: string) => void;
  onRemoveReply: (replyId: number) => void;
  onAddReply: () => void;
  onCancelDiscard: () => void;
}) {
  if (!thread) return null;

  const latestReply = replyList[replyList.length - 1];
  const canAddReply = Boolean(latestReply?.content.trim());
  const canSubmit = replyList.some((reply) => reply.content.trim());

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onRequestClose}
        />
        <div className="relative bg-white dark:bg-[#181818] w-full max-w-[600px] rounded-[16px] sm:rounded-[24px] shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] border border-gray-100 dark:border-[#333] transform transition-all">
          <div className="px-5 py-4 flex justify-between items-center border-b border-gray-100 dark:border-[#222]">
            <button
              onClick={onRequestClose}
              className="text-[15px] font-medium text-black dark:text-white hover:opacity-70 transition-opacity"
              type="button"
            >
              取消
            </button>
            <span className="font-bold text-[16px] text-black dark:text-white">回复</span>
            <div className="w-10" />
          </div>

          <div className="flex-1 overflow-y-auto p-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <ThreadCard
              {...thread}
              isReplyNode={true}
              isLoggedIn={true}
              currentUserName={currentUserName}
            />

            {replyList.map((reply, index) => (
              <div key={reply.id} className="flex gap-3 px-4 sm:px-5 py-2 relative">
                <div className="flex flex-col items-center flex-shrink-0">
                  <Avatar name={currentUserName} src={currentUserAvatar} size="md" />
                  <div className="w-[2px] flex-1 bg-gray-200 dark:bg-[#333] mt-2 mb-[-16px] rounded-full" />
                </div>

                <div className="flex-1 pt-1 pb-2">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-bold text-[14px] text-black dark:text-[#F3F5F7] flex items-center">
                      {currentUserName}
                      {index === 0 && (
                        <span className="text-[#999999] dark:text-[#777777] font-normal text-[13px] ml-1.5 select-none">
                          &gt; 添加话题
                        </span>
                      )}
                    </div>

                    {index > 0 && (
                      <button
                        onClick={() => onRemoveReply(reply.id)}
                        className="text-[#999999] hover:text-black dark:hover:text-white p-1 -mr-2 rounded-full transition-colors"
                        type="button"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <textarea
                    autoFocus={index === replyList.length - 1}
                    placeholder={index === 0 ? `回复 ${thread.authorName}...` : '发布回复...'}
                    value={reply.content}
                    onChange={(event) => {
                      onChangeReply(reply.id, event.target.value);
                      event.target.style.height = 'auto';
                      event.target.style.height = `${event.target.scrollHeight}px`;
                    }}
                    className="w-full bg-transparent border-none focus:ring-0 focus:outline-none p-0 text-[15px] text-black dark:text-[#F3F5F7] placeholder-[#999999] dark:placeholder-[#777777] resize-none overflow-hidden min-h-[36px]"
                    rows={1}
                  />

                  {showReplyOptions && (
                    <div className="mt-3 text-[13px] text-[#999999] dark:text-[#777777] border border-dashed border-gray-200 dark:border-[#333] rounded-[14px] px-3 py-2">
                      这里后面可以接“谁可以回复 / 是否同时分享到 Instagram / 引用设置”等选项。
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between text-[#999999] dark:text-[#777777]">
                    <div className="flex items-center gap-4 text-[16px]">
                      <button className="hover:text-black dark:hover:text-white transition-colors" type="button">
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <span className="text-[10px] border border-current rounded-[4px] px-1 font-bold h-[16px] flex items-center">GIF</span>
                      <span className="text-[18px] leading-none font-light">#</span>
                      <button className="hover:text-black dark:hover:text-white transition-colors" type="button">
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div
              className={`flex gap-3 px-4 sm:px-5 py-3 transition-opacity duration-200 ${canAddReply ? 'opacity-100 cursor-pointer group hover:opacity-80' : 'opacity-40 cursor-not-allowed'}`}
              onClick={canAddReply ? onAddReply : undefined}
            >
              <div className={`w-[40px] flex justify-center ${canAddReply ? '' : 'pointer-events-none'}`}>
                <Avatar name={currentUserName} src={currentUserAvatar} size="sm" />
              </div>
              <div className="text-[14px] pt-1 font-medium text-[#999999] dark:text-[#777777] group-hover:text-black dark:group-hover:text-white">
                添加到串文
              </div>
            </div>
          </div>

          <div className="p-4 px-5 flex justify-between items-center bg-white dark:bg-[#181818] border-t border-gray-100 dark:border-[#222]">
            <button
              onClick={onToggleReplyOptions}
              className="flex items-center text-[14px] font-medium text-[#999999] dark:text-[#777777] hover:text-black dark:hover:text-white transition-colors"
              type="button"
            >
              <svg className="w-[18px] h-[18px] mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="4" ry="4" />
                <path d="M9 16V8m-3 3l3-3 3 3M15 8v8m-3-3l3 3 3-3" />
              </svg>
              回复选项
            </button>
            <button
              onClick={onSubmit}
              disabled={!canSubmit || isSubmitting}
              className="bg-black dark:bg-[#F3F5F7] text-white dark:text-black px-6 py-2 rounded-full font-bold text-[15px] disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
              type="button"
            >
              {isSubmitting ? '发布中...' : '发布'}
            </button>
          </div>
        </div>
      </div>

      <DiscardConfirmModal
        open={showDiscardConfirm}
        onConfirm={onForceClose}
        onCancel={onCancelDiscard}
      />
    </>
  );
}
