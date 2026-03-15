'use client';

import { useState, useEffect } from 'react';
import ThreadCard from '@/components/ThreadCard';
import { supabase } from '../lib/supabase'; 
import Login from '@/components/Login'; 
import Avatar from '@/components/Avatar'; 

export default function Home() {
  const [user, setUser] = useState<any>(null); 
  const [isAuthChecking, setIsAuthChecking] = useState(true); 
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // 🔴 新增：刷新菊花圈状态
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [replyTarget, setReplyTarget] = useState<any>(null); 
  const [replyList, setReplyList] = useState([{ id: Date.now(), content: '' }]); 
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showReplyOptions, setShowReplyOptions] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthChecking(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setShowLoginModal(false); 
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchThreads = async () => {
    const { data, error } = await supabase.from('threads').select('*').is('parent_id', null).order('created_at', { ascending: false });
    if (!error) setThreads(data || []);
  };

  // 🔴 新增：监听来自左侧导航栏的刷新指令
  useEffect(() => {
    const handleTriggerRefresh = async () => {
      setIsRefreshing(true);
      // 故意延迟 500ms，让您能看清官方原版的加载圈圈
      await new Promise(resolve => setTimeout(resolve, 500)); 
      await fetchThreads();
      setIsRefreshing(false);
    };

    window.addEventListener('trigger-refresh', handleTriggerRefresh);
    return () => window.removeEventListener('trigger-refresh', handleTriggerRefresh);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchThreads().then(() => setLoading(false));
    
    const channel = supabase.channel('realtime:threads').on('postgres_changes', { event: '*', schema: 'public', table: 'threads' }, (payload) => {
      if (payload.eventType === 'INSERT' && payload.new.parent_id === null) {
        setThreads((prev) => prev.some((t) => t.id === payload.new.id) ? prev : [payload.new, ...prev]);
      }
      if (payload.eventType === 'UPDATE') {
        setThreads((prev) => prev.map((thread) => thread.id === payload.new.id ? payload.new : thread));
      }
    }).subscribe(); 
    return () => { supabase.removeChannel(channel); };
  }, []); 

  const handleDeletePost = (idToDelete: number) => { setThreads((prev) => prev.filter((thread) => thread.id !== idToDelete)); };

  const handlePostMultiReply = async () => {
    if (!user || !replyTarget) return; 
    const validReplies = replyList.filter(r => r.content.trim());
    if (validReplies.length === 0) return;
    const userName = user.email.split('@')[0];
    const userAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`;
    const insertPromises = validReplies.map(reply => supabase.from('threads').insert([{ content: reply.content, author_name: userName, author_avatar: userAvatar, parent_id: replyTarget.id }]));
    await Promise.all(insertPromises); 
    await supabase.from('threads').update({ replies: (replyTarget.replies || 0) + validReplies.length }).eq('id', replyTarget.id);
    forceCloseReplyModal();
    fetchThreads(); 
  };

  const handleAttemptClose = () => { if (replyList.some(r => r.content.trim() !== '')) setShowDiscardConfirm(true); else forceCloseReplyModal(); };
  const forceCloseReplyModal = () => { setReplyTarget(null); setReplyList([{ id: Date.now(), content: '' }]); setShowDiscardConfirm(false); };

  if (isAuthChecking) return <div className="min-h-screen bg-[#101010] flex items-center justify-center text-white italic">识别中...</div>;

  const currentUserName = user ? user.email.split('@')[0] : '未知用户';
  const currentUserAvatar = user ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserName}` : '';

  return (
    <main className="h-[100dvh] overflow-hidden bg-white dark:bg-[#101010] flex justify-center relative w-full px-5">
      {showLoginModal && !user && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLoginModal(false)}></div>
          <div className="relative pointer-events-auto w-full max-w-[400px]"><Login /></div>
        </div>
      )}

      {/* 保留您最完美的水平排版结构 */}
      <div className="flex w-full max-w-[1077px] justify-between h-full">

        <div className="hidden md:block w-[76px] shrink-0"></div>

        <div className="w-full max-w-[640px] md:min-w-[640px] flex flex-col relative h-full pb-6">
          
          {/* 🔴 修复：点击顶部的“首页”也能触发刷新 */}
          <header onClick={() => window.dispatchEvent(new Event('trigger-refresh'))} className="h-[60px] bg-transparent flex justify-center items-center shrink-0 cursor-pointer select-none">
            <h1 className="text-[16px] font-bold text-black dark:text-white transition-opacity hover:opacity-70">首页</h1>
          </header>

          <div className="flex-1 overflow-y-auto bg-transparent rounded-[24px] border border-gray-100 dark:border-[#222] shadow-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="min-h-full flex flex-col">
              
              {/* 🔴 完美复刻：注入您源码中的官方 Loading 菊花圈 */}
              {(loading || isRefreshing) && (
                <div className="flex justify-center items-center py-6 shrink-0 transition-all duration-300">
                  <svg aria-label="正在加载..." role="img" viewBox="0 0 100 100" className="w-6 h-6 text-[#999999] animate-spin">
                    <rect fill="currentColor" height="10" opacity="0" rx="5" ry="5" transform="rotate(-90 50 50)" width="28" x="67" y="45"></rect>
                    <rect fill="currentColor" height="10" opacity="0.125" rx="5" ry="5" transform="rotate(-45 50 50)" width="28" x="67" y="45"></rect>
                    <rect fill="currentColor" height="10" opacity="0.25" rx="5" ry="5" transform="rotate(0 50 50)" width="28" x="67" y="45"></rect>
                    <rect fill="currentColor" height="10" opacity="0.375" rx="5" ry="5" transform="rotate(45 50 50)" width="28" x="67" y="45"></rect>
                    <rect fill="currentColor" height="10" opacity="0.5" rx="5" ry="5" transform="rotate(90 50 50)" width="28" x="67" y="45"></rect>
                    <rect fill="currentColor" height="10" opacity="0.625" rx="5" ry="5" transform="rotate(135 50 50)" width="28" x="67" y="45"></rect>
                    <rect fill="currentColor" height="10" opacity="0.75" rx="5" ry="5" transform="rotate(180 50 50)" width="28" x="67" y="45"></rect>
                    <rect fill="currentColor" height="10" opacity="0.875" rx="5" ry="5" transform="rotate(225 50 50)" width="28" x="67" y="45"></rect>
                  </svg>
                </div>
              )}

              {!loading && threads.map((thread) => (
                <ThreadCard key={thread.id} {...thread} authorName={thread.author_name} authorAvatar={thread.author_avatar} timestamp={new Date(thread.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} currentUserName={currentUserName} onDelete={handleDeletePost} imageUrl={thread.image_url} onReplyClick={(data) => { if (!user) { setShowLoginModal(true); return; } setReplyTarget(data); setReplyList([{ id: Date.now(), content: '' }]); setShowReplyOptions(false); }} />
              ))}
            </div>
          </div>
        </div>

        <div className="hidden lg:block w-[337px] min-w-[337px] ml-[12px] pt-[60px] relative shrink-0">
          {!user && (
            <div className="bg-white dark:bg-[#181818] rounded-[24px] p-6 border border-gray-100 dark:border-[#222]">
              <h2 className="text-[16px] font-bold text-black dark:text-white mb-2">登录或注册 Threads</h2>
              <p className="text-[#999] dark:text-[#777] text-[14px] mb-6">看看大家都在聊什么，加入他们的对话吧。</p>
              <button onClick={() => setShowLoginModal(true)} className="w-full bg-black text-white dark:bg-white dark:text-black font-bold rounded-[12px] py-3.5 hover:opacity-80 transition-opacity">使用账号登录</button>
              <div className="mt-6 text-[12px] text-[#999] dark:text-[#777] flex flex-wrap gap-x-4 gap-y-2 justify-center">
                <span>© 2026 Threads 克隆版</span>
                <span className="cursor-pointer hover:underline">隐私政策</span>
                <span className="cursor-pointer hover:underline">服务条款</span>
              </div>
            </div>
          )}
        </div>

      </div>
      
      {/* 弹窗逻辑保持原封不动 */}
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
                      <div className="font-bold text-[14px] text-black dark:text-[#F3F5F7] flex items-center">{currentUserName} {idx === 0 && <span className="text-[#999999] dark:text-[#777777] font-normal text-[13px] ml-1.5 select-none">&gt; 添加话题</span>}</div>
                      {idx > 0 && <button onClick={() => { const newList = [...replyList]; newList.splice(idx, 1); setReplyList(newList); }} className="text-[#999999] hover:text-black dark:hover:text-white p-1 -mr-2 rounded-full transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>}
                    </div>
                    <textarea autoFocus={idx === replyList.length - 1} placeholder={idx === 0 ? `回复 ${replyTarget.authorName}...` : "发布回复..."} value={reply.content} onChange={(e) => { const newList = [...replyList]; newList[idx].content = e.target.value; setReplyList(newList); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} className="w-full bg-transparent border-none focus:ring-0 focus:outline-none p-0 text-[15px] text-black dark:text-[#F3F5F7] placeholder-[#999999] dark:placeholder-[#777777] resize-none min-h-[40px] leading-relaxed" />
                    <div className="flex items-center gap-4 mt-2 text-[#999999] dark:text-[#777777]"><button className="hover:text-black dark:hover:text-white transition-colors"><svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button><span className="text-[10px] border border-current rounded-[4px] px-1 font-bold h-[16px] flex items-center">GIF</span><span className="text-[18px] leading-none font-light">#</span><button className="hover:text-black dark:hover:text-white transition-colors"><svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg></button></div>
                  </div>
                </div>
              ))}
              <div className={`flex gap-3 px-4 sm:px-5 py-3 transition-opacity duration-200 ${replyList[replyList.length - 1].content.trim() === '' ? 'opacity-40 cursor-not-allowed' : 'opacity-100 cursor-pointer group hover:opacity-80'}`} onClick={() => { if (replyList[replyList.length - 1].content.trim() !== '') setReplyList([...replyList, { id: Date.now(), content: '' }]); }}>
                <div className={`w-[40px] flex justify-center ${replyList[replyList.length - 1].content.trim() === '' ? 'pointer-events-none' : ''}`}><Avatar name={currentUserName} src={currentUserAvatar} size="sm" /></div>
                <div className={`text-[14px] pt-1 font-medium text-[#999999] dark:text-[#777777] group-hover:text-black dark:group-hover:text-white`}>添加到串文</div>
              </div>
            </div>
            <div className="p-4 px-5 flex justify-between items-center bg-white dark:bg-[#181818] border-t border-gray-100 dark:border-[#222]">
              <button onClick={() => setShowReplyOptions(!showReplyOptions)} className="flex items-center text-[14px] font-medium text-[#999999] dark:text-[#777777] hover:text-black dark:hover:text-white transition-colors"><svg className="w-[18px] h-[18px] mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4" ry="4"></rect><path d="M9 16V8m-3 3l3-3 3 3M15 8v8m-3-3l3 3 3-3"></path></svg>回复选项</button>
              <button onClick={handlePostMultiReply} disabled={!replyList.some(r => r.content.trim())} className="bg-black dark:bg-[#F3F5F7] text-white dark:text-black px-6 py-2 rounded-full font-bold text-[15px] disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95">发布</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}