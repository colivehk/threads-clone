'use client';

import ThreadCard from '@/components/ThreadCard';
import Avatar from '@/components/Avatar';
import type { ReplyComposerController } from '@/hooks/useReplyComposer';

type ReplyComposerModalProps = {
  composer: ReplyComposerController;
  currentUserName: string;
  currentUserAvatar: string;
};

export default function ReplyComposerModal({
  composer,
  currentUserName,
  currentUserAvatar,
}: ReplyComposerModalProps) {
  const {
    replyTarget,
    replyList,
    showDiscardConfirm,
    showReplyOptions,
    replyAudience,
    isSubmitting,
    hasReplyContent,
    handleAttemptClose,
    resetComposer,
    setShowDiscardConfirm,
    setShowReplyOptions,
    setReplyAudience,
    updateReplyContent,
    removeReply,
    appendReplyDraft,
    submitReplies,
  } = composer;

  if (!replyTarget) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={handleAttemptClose}
        />

        <div className="relative bg-white dark:bg-[#181818] w-full max-w-[600px] rounded-[16px] sm:rounded-[24px] shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] border border-gray-100 dark:border-[#333] transform transition-all">
          <div className="px-5 py-4 flex justify-between items-center border-b border-gray-100 dark:border-[#222]">
            <button
              onClick={handleAttemptClose}
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
              {...replyTarget}
              isReplyNode
              isLoggedIn
              currentUserName={currentUserName}
            />

            {replyList.map((reply, idx) => (
              <div key={reply.id} className="flex gap-3 px-4 sm:px-5 py-2 relative">
                <div className="flex flex-col items-center flex-shrink-0">
                  <Avatar name={currentUserName} src={currentUserAvatar} size="md" />
                  <div className="w-[2px] flex-1 bg-gray-200 dark:bg-[#333] mt-2 mb-[-16px] rounded-full" />
                </div>

                <div className="flex-1 pt-1 pb-2">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-bold text-[14px] text-black dark:text-[#F3F5F7] flex items-center">
                      {currentUserName}
                      {idx === 0 && (
                        <span className="text-[#999999] dark:text-[#777777] font-normal text-[13px] ml-1.5 select-none">
                          &gt; 添加话题
                        </span>
                      )}
                    </div>

                    {idx > 0 && (
                      <button
                        onClick={() => removeReply(reply.id)}
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
                    autoFocus={idx === replyList.length - 1}
                    placeholder={idx === 0 ? `回复 ${replyTarget.authorName}...` : '发布回复...'}
                    value={reply.content}
                    onChange={(e) => {
                      updateReplyContent(reply.id, e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    className="w-full bg-transparent border-none focus:ring-0 focus:outline-none p-0 text-[15px] text-black dark:text-[#F3F5F7] placeholder-[#999999] dark:placeholder-[#777777] resize-none min-h-[40px] leading-relaxed"
                  />

                  <div className="flex items-center gap-4 mt-2 text-[#999999] dark:text-[#777777]">
                    <button className="hover:text-black dark:hover:text-white transition-colors" type="button">
                      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </button>
                    <span className="text-[10px] border border-current rounded-[4px] px-1 font-bold h-[16px] flex items-center">GIF</span>
                    <span className="text-[18px] leading-none font-light">#</span>
                    <button className="hover:text-black dark:hover:text-white transition-colors" type="button">
                      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div
              className={`flex gap-3 px-4 sm:px-5 py-3 transition-opacity duration-200 ${replyList[replyList.length - 1]?.content.trim() ? 'opacity-100 cursor-pointer group hover:opacity-80' : 'opacity-40 cursor-not-allowed'}`}
              onClick={appendReplyDraft}
            >
              <div className={`w-[40px] flex justify-center ${replyList[replyList.length - 1]?.content.trim() ? '' : 'pointer-events-none'}`}>
                <div className={replyList[replyList.length - 1]?.content.trim() ? '' : 'opacity-50'}>
                  <Avatar name={currentUserName} src={currentUserAvatar} size="sm" />
                </div>
              </div>
              <div
                className={`text-[14px] pt-1 font-medium ${replyList[replyList.length - 1]?.content.trim() ? 'text-[#999999] dark:text-[#777777] group-hover:text-black dark:group-hover:text-white' : 'text-[#999999] dark:text-[#777777] pointer-events-none'}`}
              >
                添加到串文
              </div>
            </div>
          </div>

          <div className="p-4 px-5 flex justify-between items-center bg-white dark:bg-[#181818] border-t border-gray-100 dark:border-[#222] relative">
            <div className="relative flex items-center">
              <button
                onClick={() => setShowReplyOptions(!showReplyOptions)}
                className="flex items-center text-[14px] font-medium text-[#999999] dark:text-[#777777] hover:text-black dark:hover:text-white transition-colors"
                type="button"
              >
                <svg className="w-[18px] h-[18px] mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="4" ry="4"></rect>
                  <path d="M9 16V8m-3 3l3-3 3 3M15 8v8m-3-3l3 3 3-3"></path>
                </svg>
                回复选项
              </button>

              {showReplyOptions && (
                <>
                  <div className="fixed inset-0 z-[110]" onClick={() => setShowReplyOptions(false)}></div>
                  <div className="absolute bottom-[40px] left-0 z-[120] w-[260px] bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-[#333] rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.6)] py-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-5 py-2 text-[12px] font-bold text-[#999999] dark:text-[#777777] select-none">谁能回复和引用</div>
                    {['任何人', '你的粉丝', '你关注的主页'].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setReplyAudience(option);
                          setShowReplyOptions(false);
                        }}
                        className="w-full text-left px-5 py-3 text-[15px] font-bold text-black dark:text-[#F3F5F7] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] flex justify-between items-center transition-colors"
                        type="button"
                      >
                        {option}
                        {replyAudience === option && (
                          <svg className="w-5 h-5 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        )}
                      </button>
                    ))}
                    <div className="h-[1px] bg-gray-200 dark:bg-[#333] my-1 mx-5"></div>
                    <button onClick={() => setShowReplyOptions(false)} className="w-full text-left px-5 py-3 text-[15px] font-bold text-black dark:text-[#F3F5F7] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors" type="button">
                      你提及的主页
                    </button>
                    <div className="h-[1px] bg-gray-200 dark:bg-[#333] my-1 mx-5"></div>
                    <div className="w-full px-5 py-3 flex justify-between items-center cursor-not-allowed opacity-50">
                      <span className="text-[15px] font-bold text-black dark:text-[#F3F5F7]">审核并批准回复</span>
                      <div className="w-[36px] h-[22px] bg-gray-300 dark:bg-[#444] rounded-full relative">
                        <div className="absolute left-[2px] top-[2px] w-[18px] h-[18px] bg-white dark:bg-[#888] rounded-full shadow-sm"></div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={submitReplies}
              disabled={!hasReplyContent || isSubmitting}
              className="bg-black dark:bg-[#F3F5F7] text-white dark:text-black px-6 py-2 rounded-full font-bold text-[15px] disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
              type="button"
            >
              {isSubmitting ? '发布中...' : '回复'}
            </button>
          </div>
        </div>
      </div>

      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDiscardConfirm(false)} />
          <div className="relative bg-white dark:bg-[#181818] w-full max-w-[360px] rounded-[24px] border border-gray-100 dark:border-[#333] shadow-2xl p-6">
            <h3 className="text-[20px] font-bold text-black dark:text-white text-center">放弃这条回复？</h3>
            <p className="text-[14px] text-[#999999] dark:text-[#777777] text-center mt-2 leading-relaxed">
              你输入的内容还没有发布，关闭后将无法恢复。
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={resetComposer}
                className="w-full py-3 rounded-[14px] bg-[#FF3040] text-white font-bold hover:opacity-90 transition-opacity"
                type="button"
              >
                放弃
              </button>
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="w-full py-3 rounded-[14px] bg-gray-100 dark:bg-[#2A2A2A] text-black dark:text-white font-bold hover:opacity-90 transition-opacity"
                type="button"
              >
                继续编辑
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
