'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase'; 
import ThreadCard from '../../../components/ThreadCard';
import Avatar from '../../../components/Avatar';
import Login from '../../../components/Login'; 

export default function ThreadDetail() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null); 
  const [isAuthChecking, setIsAuthChecking] = useState(true); 

  const [mainThread, setMainThread] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);

  // 🔴 引入悬浮弹窗的全部状态核心
  const [replyTarget, setReplyTarget] = useState<any>(null); 
  const [replyList, setReplyList] = useState([{ id: Date.now(), content: '' }]); 
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showReplyOptions, setShowReplyOptions] = useState(false);
  const [replyAudience, setReplyAudience] = useState('任何人');

  // 身份验证雷达
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 拉取详情页情报
  const fetchData = async () => {
    if (!id) return;
    const { data: threadData } = await supabase.from('threads').select('*').eq('id', id).single();
    if (threadData) setMainThread(threadData);

    const { data: repliesData } = await supabase.from('threads').select('*').eq('parent_id', id).order('created_at', { ascending: true });
    if (repliesData) setReplies(repliesData);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // 🔴 统一的弹窗发射引擎
  const handlePostMultiReply = async () => {
    if (!user || !replyTarget) return; 
    
    const validReplies = replyList.filter(r => r.content.trim());
    if (validReplies.length === 0) return;

    const userName = user.email.split('@')[0];
    const userAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`;

    const insertPromises = validReplies.map(reply => 
      supabase.from('threads').insert([{
        content: reply.content,
        author_name: userName, 
        author_avatar: userAvatar,
        parent_id: replyTarget.id
      }])
    );

    await Promise.all(insertPromises); 
    await supabase.from('threads').update({ replies: (replyTarget.replies || 0) + validReplies.length }).eq('id', replyTarget.id);
    
    setReplyTarget(null);
    setReplyList([{ id: Date.now(), content: '' }]);
    fetchData(); // 重新拉取盖楼数据
  };

  const handleAttemptClose = () => {
    const hasUnsavedContent = replyList.some(r => r.content.trim() !== '');
    if (hasUnsavedContent) {
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
  };

  if (isAuthChecking) return <div className="min-h-screen bg-[#101010] flex items-center justify-center text-white">识别中...</div>;

  const currentUserName = user ? user.email.split('@')[0] : '未知用户';
  const currentUserAvatar = user ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserName}` : '';

  return (
    <main className="min-h-screen bg-white dark:bg-[#101010] flex justify-center relative">
      {!user && <Login />}
      
      <div className="w-full max-w-[620px] border-x border-gray-200 dark:border-[#333638] min-h-screen relative pb-20">
        
        {/* 顶部导航 */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#101010]/80 backdrop-blur-md px-4 h-[60px] flex items-center justify-between border-b border-gray-100 dark:border-[#222]">
          <button onClick={() => router.back()} className="text-[#999999] hover:text-black dark:text-[#777777] dark:hover:text-white p-2 -ml-2 rounded-full transition-colors flex items-center justify-center z-10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="font-bold text-[16px] text-black dark:text-white absolute left-1/2 transform -translate-x-1/2">帖子</span>
          <div className="w-10"></div>
        </header>

        {/* 🔴 主贴区 */}
        {mainThread ? (
          <ThreadCard 
            id={mainThread.id}
            authorName={mainThread.author_name}
            authorAvatar={mainThread.author_avatar}
            content={mainThread.content}
            timestamp={new Date(mainThread.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            likes={mainThread.likes}
            replies={mainThread.replies}
            imageUrl={mainThread.image_url}
            currentUserName={currentUserName}
            onDelete={() => router.push('/')} // 主贴被删，直接退回首页
            onReplyClick={(data) => {
              setReplyTarget(data);
              setReplyList([{ id: Date.now(), content: '' }]); 
              setShowReplyOptions(false);
            }}
          />
        ) : (
          <div className="p-10 text-center text-[#999999]">载入中...</div>
        )}

        {/* 🔴 盖楼列表区（旧版的内嵌输入框已彻底铲除） */}
        <div className="mt-2">
          {replies.map((reply) => (
            <ThreadCard 
              key={reply.id}
              id={reply.id}
              authorName={reply.author_name}
              authorAvatar={reply.author_avatar}
              content={reply.content}
              timestamp={new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              likes={reply.likes}
              replies={reply.replies}
              imageUrl={reply.image_url}
              currentUserName={currentUserName}
              onDelete={(deletedId) => setReplies(prev => prev.filter(r => r.id !== deletedId))}
              onReplyClick={(data) => {
                setReplyTarget(data);
                setReplyList([{ id: Date.now(), content: '' }]); 
                setShowReplyOptions(false);
              }}
            />
          ))}
        </div>

      </div>

      {/* 🔴 统一的悬浮多行盖楼弹窗 (100% 同步首页逻辑) */}
      {replyTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={handleAttemptClose}></div>
          
          <div className="relative bg-white dark:bg-[#181818] w-full max-w-[600px] rounded-[16px] sm:rounded-[24px] shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] border border-gray-100 dark:border-[#333] transform transition-all">
            
            <div className="px-5 py-4 flex justify-between items-center border-b border-gray-100 dark:border-[#222]">
              <button onClick={handleAttemptClose} className="text-[15px] font-medium text-black dark:text-white hover:opacity-70 transition-opacity">取消</button>
              <span className="font-bold text-[16px] text-black dark:text-white">回复</span>
              <div className="w-10"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              
              <ThreadCard {...replyTarget} isReplyNode={true} />

              {replyList.map((reply, idx) => (
                <div key={reply.id} className="flex gap-3 px-4 sm:px-5 py-2 relative">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <Avatar name={currentUserName} src={currentUserAvatar} size="md" />
                    <div className="w-[2px] flex-1 bg-gray-200 dark:bg-[#333] mt-2 mb-[-16px] rounded-full"></div>
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
                          onClick={() => {
                            const newList = [...replyList];
                            newList.splice(idx, 1);
                            setReplyList(newList);
                          }}
                          className="text-[#999999] hover:text-black dark:hover:text-white p-1 -mr-2 rounded-full transition-colors"
                          title="删除此回复"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>

                    <textarea 
                      autoFocus={idx === replyList.length - 1}
                      placeholder={idx === 0 ? `回复 ${replyTarget.authorName}...` : "发布回复..."}
                      value={reply.content}
                      onChange={(e) => {
                        const newList = [...replyList];
                        newList[idx].content = e.target.value;
                        setReplyList(newList);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      className="w-full bg-transparent border-none focus:ring-0 focus:outline-none p-0 text-[15px] text-black dark:text-[#F3F5F7] placeholder-[#999999] dark:placeholder-[#777777] resize-none min-h-[40px] leading-relaxed"
                    />

                    <div className="flex items-center gap-4 mt-2 text-[#999999] dark:text-[#777777]">
                      <button className="hover:text-black dark:hover:text-white transition-colors">
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </button>
                      <span className="text-[10px] border border-current rounded-[4px] px-1 font-bold h-[16px] flex items-center">GIF</span>
                      <span className="text-[18px] leading-none font-light">#</span>
                      <button className="hover:text-black dark:hover:text-white transition-colors">
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div 
                className={`flex gap-3 px-4 sm:px-5 py-3 transition-opacity duration-200 
                  ${replyList[replyList.length - 1].content.trim() === '' 
                    ? 'opacity-40 cursor-not-allowed' 
                    : 'opacity-100 cursor-pointer group hover:opacity-80'}`} 
                onClick={() => {
                  if (replyList[replyList.length - 1].content.trim() !== '') {
                    setReplyList([...replyList, { id: Date.now(), content: '' }]);
                  }
                }}
              >
                <div className={`w-[40px] flex justify-center ${replyList[replyList.length - 1].content.trim() === '' ? 'pointer-events-none' : ''}`}>
                  <div className={replyList[replyList.length - 1].content.trim() === '' ? "opacity-50" : ""}>
                    <Avatar name={currentUserName} src={currentUserAvatar} size="sm" />
                  </div>
                </div>
                <div className={`text-[14px] pt-1 font-medium 
                  ${replyList[replyList.length - 1].content.trim() === '' 
                    ? 'text-[#999999] dark:text-[#777777] pointer-events-none' 
                    : 'text-[#999999] dark:text-[#777777] group-hover:text-black dark:group-hover:text-white'}`}
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
                          onClick={() => { setReplyAudience(option); setShowReplyOptions(false); }}
                          className="w-full text-left px-5 py-3 text-[15px] font-bold text-black dark:text-[#F3F5F7] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] flex justify-between items-center transition-colors"
                        >
                          {option}
                          {replyAudience === option && (
                            <svg className="w-5 h-5 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                          )}
                        </button>
                      ))}
                      <div className="h-[1px] bg-gray-200 dark:bg-[#333] my-1 mx-5"></div>
                      <button onClick={() => setShowReplyOptions(false)} className="w-full text-left px-5 py-3 text-[15px] font-bold text-black dark:text-[#F3F5F7] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors">
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
                onClick={handlePostMultiReply}
                disabled={!replyList.some(r => r.content.trim())}
                className="bg-black dark:bg-[#F3F5F7] text-white dark:text-black px-6 py-2 rounded-full font-bold text-[15px] disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
              >
                发布
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 防误触二次确认拦截 */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setShowDiscardConfirm(false)}></div>
          <div className="relative bg-white dark:bg-[#1C1C1C] w-[280px] sm:w-[320px] rounded-[16px] shadow-2xl flex flex-col border border-gray-200 dark:border-[#333] animate-in zoom-in-95 duration-200">
            <div className="py-6 px-4 text-center">
              <span className="font-bold text-[16px] text-black dark:text-white">放弃串文？</span>
            </div>
            <div className="flex border-t border-gray-200 dark:border-[#333] h-[50px]">
              <button onClick={() => setShowDiscardConfirm(false)} className="flex-1 font-medium text-[15px] text-black dark:text-white border-r border-gray-200 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors rounded-bl-[16px]">
                取消
              </button>
              <button onClick={forceCloseReplyModal} className="flex-1 font-bold text-[15px] text-[#FF3040] hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors rounded-br-[16px]">
                放弃
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}