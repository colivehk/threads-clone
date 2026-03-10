'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ThreadCard from '@/components/ThreadCard';
import { supabase } from '@/lib/supabase'; 
import Login from '@/components/Login'; 
import Avatar from '@/components/Avatar'; 

export default function Profile() {
  const router = useRouter();
  const params = useParams();
  
  const profileUserName = decodeURIComponent(params.username as string);

  const [user, setUser] = useState<any>(null); 
  const [isAuthChecking, setIsAuthChecking] = useState(true); 

  const [activeTab, setActiveTab] = useState<'threads' | 'replies'>('threads');
  const [threads, setThreads] = useState<any[]>([]);
  const [repliesData, setRepliesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🟢 关注系统专属雷达核心
  const [followerCount, setFollowerCount] = useState(0); // 粉丝数
  const [isFollowing, setIsFollowing] = useState(false); // 我是否关注了 TA
  const [isFollowProcessing, setIsFollowProcessing] = useState(false); // 防手抖物理保险

  // 高级弹窗系统
  const [replyTarget, setReplyTarget] = useState<any>(null); 
  const [replyList, setReplyList] = useState([{ id: Date.now(), content: '' }]); 
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showReplyOptions, setShowReplyOptions] = useState(false);
  const [replyAudience, setReplyAudience] = useState('任何人');

  const currentUserName = user ? user.email.split('@')[0] : '';
  const isMyProfile = currentUserName === profileUserName;

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

  const fetchUserData = async () => {
    setLoading(true);

    // 拉取博主帖子
    const { data: myThreads } = await supabase.from('threads').select('*').eq('author_name', profileUserName).is('parent_id', null).order('created_at', { ascending: false });
    if (myThreads) setThreads(myThreads);

    // 拉取博主回复
    const { data: myReplies } = await supabase.from('threads').select('*').eq('author_name', profileUserName).not('parent_id', 'is', null).order('created_at', { ascending: false });
    if (myReplies) setRepliesData(myReplies);
    
    setLoading(false);
  };

  // 🟢 专属情报搜集：查阅该主页的粉丝数据
  const fetchFollowData = async () => {
    if (!profileUserName) return;
    
    // 1. 查询总粉丝数
    const { count, error: countError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following', profileUserName);
      
    if (!countError && count !== null) {
      setFollowerCount(count);
    }

    // 2. 如果是我看别人，查阅“我”有没有关注“TA”
    if (currentUserName && !isMyProfile) {
       const { data } = await supabase
         .from('follows')
         .select('id')
         .eq('follower', currentUserName)
         .eq('following', profileUserName)
         .maybeSingle();
         
       setIsFollowing(!!data);
    }
  };

  useEffect(() => {
    if (profileUserName) {
      fetchUserData();
    }
  }, [profileUserName]);

  useEffect(() => {
    fetchFollowData();
  }, [profileUserName, currentUserName]);

  // 🟢 核心射击控制：关注/取消关注扳机
  const handleToggleFollow = async () => {
    if (!currentUserName) {
      alert('指挥官，请先登录！');
      return;
    }
    if (isFollowProcessing) return; // 锁死扳机，防连发
    setIsFollowProcessing(true);

    try {
      if (isFollowing) {
        // 取消关注：乐观更新（先改UI再请求）
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
        await supabase.from('follows').delete().match({ follower: currentUserName, following: profileUserName });
      } else {
        // 关注：乐观更新
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        const { error } = await supabase.from('follows').insert([{ follower: currentUserName, following: profileUserName }]);
        // 如果被云端拦截（比如断网），撤回本地改动
        if (error) {
          setIsFollowing(false);
          setFollowerCount(prev => prev - 1);
        }
      }
    } catch (err) {
      console.error('通信干扰', err);
    } finally {
      setIsFollowProcessing(false); // 解锁扳机
    }
  };

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
    fetchUserData(); 
  };

  const handleAttemptClose = () => {
    const hasUnsavedContent = replyList.some(r => r.content.trim() !== '');
    if (hasUnsavedContent) setShowDiscardConfirm(true);
    else forceCloseReplyModal();
  };

  const forceCloseReplyModal = () => {
    setReplyTarget(null);
    setReplyList([{ id: Date.now(), content: '' }]);
    setShowDiscardConfirm(false);
    setShowReplyOptions(false);
  };

  const handleDeletePost = (idToDelete: number) => {
    setThreads(prev => prev.filter(t => t.id !== idToDelete));
    setRepliesData(prev => prev.filter(r => r.id !== idToDelete));
  };

  if (isAuthChecking) return <div className="min-h-screen bg-[#101010] flex items-center justify-center text-white">识别中...</div>;

  const currentUserAvatar = user ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserName}` : '';
  const profileAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUserName}`;

  return (
    <main className="min-h-screen bg-white dark:bg-[#101010] flex justify-center relative">
      {!user && <Login />}
      <div className="w-full max-w-[620px] border-x border-gray-200 dark:border-[#333638] min-h-screen relative pb-20">
        
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#101010]/80 backdrop-blur-md px-4 h-[60px] flex items-center justify-between border-b border-transparent dark:border-transparent">
          <button onClick={() => router.back()} className="text-black dark:text-white hover:opacity-70 transition-opacity flex items-center justify-center w-10 h-10 -ml-2 rounded-full">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="font-bold text-[16px] text-black dark:text-white absolute left-1/2 transform -translate-x-1/2">{profileUserName}</span>
          <div className="flex gap-4">
             <button className="text-black dark:text-white hover:opacity-70"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg></button>
          </div>
        </header>

        <div className="px-4 sm:px-6 pt-2 pb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-[24px] font-bold text-black dark:text-[#F3F5F7] leading-tight">{profileUserName}</h1>
              <p className="text-[15px] text-black dark:text-[#F3F5F7] mt-1">{profileUserName}</p>
            </div>
            <div className="w-[72px] h-[72px] rounded-full overflow-hidden border border-gray-100 dark:border-[#333]">
               <img src={profileAvatar} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
          
          <p className="mt-4 text-[15px] text-black dark:text-[#F3F5F7]">
            {isMyProfile ? '这是我的个人主页。目前正在构建 Threads V2.0 终极克隆版。🚀' : `这是 @${profileUserName} 的主页，快来看看 TA 都发了什么！👀`}
          </p>
          
          {/* 🟢 粉丝雷达显示器 */}
          <div className="mt-4 text-[#999999] dark:text-[#777777] text-[15px] flex items-center gap-2 hover:underline cursor-pointer">
            {followerCount > 0 && (
              <div className="flex -space-x-1">
                <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                {followerCount > 1 && <div className="w-4 h-4 rounded-full bg-gray-400 dark:bg-gray-500"></div>}
              </div>
            )}
            {followerCount} 个关注者
          </div>
          
          <div className="flex gap-3 mt-5">
            {isMyProfile ? (
              <>
                <button className="flex-1 py-1.5 border border-gray-300 dark:border-[#444] rounded-lg font-bold text-[15px] text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#1C1C1C] transition-colors">
                  编辑个人主页
                </button>
                <button className="flex-1 py-1.5 border border-gray-300 dark:border-[#444] rounded-lg font-bold text-[15px] text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#1C1C1C] transition-colors">
                  分享个人主页
                </button>
              </>
            ) : (
              <>
                {/* 🟢 关注/已关注 智能切换按钮 */}
                <button 
                  onClick={handleToggleFollow}
                  disabled={isFollowProcessing}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-[15px] transition-all ${
                    isFollowing 
                      ? 'bg-transparent text-black dark:text-white border border-gray-300 dark:border-[#444] hover:bg-gray-50 dark:hover:bg-[#1C1C1C]' 
                      : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-80'
                  }`}
                >
                  {isFollowing ? '正在关注' : '关注'}
                </button>
                <button className="flex-1 py-1.5 border border-gray-300 dark:border-[#444] rounded-lg font-bold text-[15px] text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#1C1C1C] transition-colors">
                  提及
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex w-full border-b border-gray-200 dark:border-[#333]">
          <button onClick={() => setActiveTab('threads')} className={`flex-1 pb-3 text-[15px] font-bold transition-colors relative ${activeTab === 'threads' ? 'text-black dark:text-white' : 'text-[#999999] dark:text-[#777777] hover:text-[#666] dark:hover:text-[#aaa]'}`}>
            串文
            {activeTab === 'threads' && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-black dark:bg-white rounded-t-full"></div>}
          </button>
          <button onClick={() => setActiveTab('replies')} className={`flex-1 pb-3 text-[15px] font-bold transition-colors relative ${activeTab === 'replies' ? 'text-black dark:text-white' : 'text-[#999999] dark:text-[#777777] hover:text-[#666] dark:hover:text-[#aaa]'}`}>
            回复
            {activeTab === 'replies' && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-black dark:bg-white rounded-t-full"></div>}
          </button>
        </div>

        <div className="mt-2">
          {loading ? (
            <div className="p-10 text-center text-[#999999]">拉取数据中...</div>
          ) : activeTab === 'threads' ? (
            threads.length > 0 ? threads.map(t => (
              <ThreadCard key={t.id} {...t} currentUserName={currentUserName} onDelete={handleDeletePost} onReplyClick={(data) => { setReplyTarget(data); setReplyList([{ id: Date.now(), content: '' }]); setShowReplyOptions(false); }} />
            )) : <div className="p-10 text-center text-[#999999]">暂无串文</div>
          ) : (
            repliesData.length > 0 ? repliesData.map(r => (
              <ThreadCard key={r.id} {...r} currentUserName={currentUserName} onDelete={handleDeletePost} onReplyClick={(data) => { setReplyTarget(data); setReplyList([{ id: Date.now(), content: '' }]); setShowReplyOptions(false); }} />
            )) : <div className="p-10 text-center text-[#999999]">暂无回复</div>
          )}
        </div>
      </div>

      {/* 弹窗系统（保持完美状态） */}
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
                        {idx === 0 && <span className="text-[#999999] dark:text-[#777777] font-normal text-[13px] ml-1.5 select-none">&gt; 添加话题</span>}
                      </div>
                      {idx > 0 && (
                        <button onClick={() => { const newList = [...replyList]; newList.splice(idx, 1); setReplyList(newList); }} className="text-[#999999] hover:text-black dark:hover:text-white p-1 -mr-2 rounded-full transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                      )}
                    </div>
                    <textarea autoFocus={idx === replyList.length - 1} placeholder={idx === 0 ? `回复 ${replyTarget.authorName}...` : "发布回复..."} value={reply.content} onChange={(e) => { const newList = [...replyList]; newList[idx].content = e.target.value; setReplyList(newList); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} className="w-full bg-transparent border-none focus:ring-0 focus:outline-none p-0 text-[15px] text-black dark:text-[#F3F5F7] placeholder-[#999999] dark:placeholder-[#777777] resize-none min-h-[40px] leading-relaxed" />
                    <div className="flex items-center gap-4 mt-2 text-[#999999] dark:text-[#777777]">
                      <button className="hover:text-black dark:hover:text-white transition-colors"><svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
                      <span className="text-[10px] border border-current rounded-[4px] px-1 font-bold h-[16px] flex items-center">GIF</span>
                      <span className="text-[18px] leading-none font-light">#</span>
                      <button className="hover:text-black dark:hover:text-white transition-colors"><svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg></button>
                    </div>
                  </div>
                </div>
              ))}
              <div className={`flex gap-3 px-4 sm:px-5 py-3 transition-opacity duration-200 ${replyList[replyList.length - 1].content.trim() === '' ? 'opacity-40 cursor-not-allowed' : 'opacity-100 cursor-pointer group hover:opacity-80'}`} onClick={() => { if (replyList[replyList.length - 1].content.trim() !== '') setReplyList([...replyList, { id: Date.now(), content: '' }]); }}>
                <div className={`w-[40px] flex justify-center ${replyList[replyList.length - 1].content.trim() === '' ? 'pointer-events-none' : ''}`}>
                  <div className={replyList[replyList.length - 1].content.trim() === '' ? "opacity-50" : ""}><Avatar name={currentUserName} src={currentUserAvatar} size="sm" /></div>
                </div>
                <div className={`text-[14px] pt-1 font-medium ${replyList[replyList.length - 1].content.trim() === '' ? 'text-[#999999] dark:text-[#777777] pointer-events-none' : 'text-[#999999] dark:text-[#777777] group-hover:text-black dark:group-hover:text-white'}`}>添加到串文</div>
              </div>
            </div>

            <div className="p-4 px-5 flex justify-between items-center bg-white dark:bg-[#181818] border-t border-gray-100 dark:border-[#222] relative">
              <div className="relative flex items-center">
                <button onClick={() => setShowReplyOptions(!showReplyOptions)} className="flex items-center text-[14px] font-medium text-[#999999] dark:text-[#777777] hover:text-black dark:hover:text-white transition-colors">
                  <svg className="w-[18px] h-[18px] mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4" ry="4"></rect><path d="M9 16V8m-3 3l3-3 3 3M15 8v8m-3-3l3 3 3-3"></path></svg>
                  回复选项
                </button>
                {showReplyOptions && (
                  <>
                    <div className="fixed inset-0 z-[110]" onClick={() => setShowReplyOptions(false)}></div>
                    <div className="absolute bottom-[40px] left-0 z-[120] w-[260px] bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-[#333] rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.6)] py-2 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-5 py-2 text-[12px] font-bold text-[#999999] dark:text-[#777777] select-none">谁能回复和引用</div>
                      {['任何人', '你的粉丝', '你关注的主页'].map((option) => (
                        <button key={option} onClick={() => { setReplyAudience(option); setShowReplyOptions(false); }} className="w-full text-left px-5 py-3 text-[15px] font-bold text-black dark:text-[#F3F5F7] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] flex justify-between items-center transition-colors">
                          {option}
                          {replyAudience === option && <svg className="w-5 h-5 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button onClick={handlePostMultiReply} disabled={!replyList.some(r => r.content.trim())} className="bg-black dark:bg-[#F3F5F7] text-white dark:text-black px-6 py-2 rounded-full font-bold text-[15px] disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95">发布</button>
            </div>
          </div>
        </div>
      )}

      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setShowDiscardConfirm(false)}></div>
          <div className="relative bg-white dark:bg-[#1C1C1C] w-[280px] sm:w-[320px] rounded-[16px] shadow-2xl flex flex-col border border-gray-200 dark:border-[#333] animate-in zoom-in-95 duration-200">
            <div className="py-6 px-4 text-center"><span className="font-bold text-[16px] text-black dark:text-white">放弃串文？</span></div>
            <div className="flex border-t border-gray-200 dark:border-[#333] h-[50px]">
              <button onClick={() => setShowDiscardConfirm(false)} className="flex-1 font-medium text-[15px] text-black dark:text-white border-r border-gray-200 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors rounded-bl-[16px]">取消</button>
              <button onClick={forceCloseReplyModal} className="flex-1 font-bold text-[15px] text-[#FF3040] hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors rounded-br-[16px]">放弃</button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}