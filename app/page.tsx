'use client';

import { useState, useEffect } from 'react';
import ThreadCard from '@/components/ThreadCard';
import CreatePostModal from '@/components/CreatePostModal';
import { supabase } from '../lib/supabase'; // 确认这里是你修改后的正确路径
import Login from '@/components/Login'; // 🔴 引入安检闸机

export default function Home() {
  const [user, setUser] = useState<any>(null); // 🔴 新增：记录当前登录的士兵
  const [isAuthChecking, setIsAuthChecking] = useState(true); // 🔴 新增：记录是否正在查验身份 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // 🔴 新增一个 useEffect：专门用来监听用户的登录状态
  useEffect(() => {
    // 获取当前会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthChecking(false);
    });

    // 实时监听登录/登出动作
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ... 原本的 fetchThreads 和 realtime useEffect 保持不变 ...
  // 初次拉取历史数据
  const fetchThreads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('threads')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setThreads(data || []);
    }
    setLoading(false);
  };

  // 🔴 核心魔法：部署 WebSocket 全天候实时雷达
  useEffect(() => {
    // 1. 先把历史帖子拉下来
    fetchThreads();

    // 2. 建立实时监听通道
    const channel = supabase
      .channel('realtime:threads')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'threads' }, // 监听 threads 表的所有事件(增删改)
        (payload) => {
          console.log('📡 接收到云端实时情报:', payload);

          // 敌情判断 1：有人发了新帖子 (INSERT)
          if (payload.eventType === 'INSERT') {
            setThreads((prev) => {
              // 防重复雷达：如果自己刚刚发帖，前端已经乐观更新过了，就不再重复塞入
              if (prev.some((t) => t.id === payload.new.id)) return prev;
              // 否则，将别人发的新帖子塞到列表最前面！
              return [payload.new, ...prev];
            });
          }

          // 敌情判断 2：有人点赞或修改了帖子 (UPDATE)
          if (payload.eventType === 'UPDATE') {
            setThreads((prev) =>
              prev.map((thread) =>
                // 找到那条被点赞的帖子，用云端传来的最新数据替换它
                thread.id === payload.new.id ? payload.new : thread
              )
            );
          }
        }
      )
      .subscribe(); // 正式通电连线！

    // 3. 撤退时清理战场：当用户离开这个页面时，掐断连接以省电
    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // 空数组代表这个雷达只在页面首次打开时架设一次
// 🔴 新增魔法：一键安全撤退 (登出)
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert('撤退失败：' + error.message);
    }
  };
            // 🔴 新增魔法：接收前线的销毁呼叫，并在屏幕上瞬间抹除它
  const handleDeletePost = (idToDelete: number) => {
    // 乐观更新：直接把那个被删除的 ID 过滤掉，实现瞬间消失！
    setThreads((prev) => prev.filter((thread) => thread.id !== idToDelete));
  };
  // 写入云端逻辑 (保持不变)
// 🔴 升级：接收并保存 imageUrl
  const handleAddNewPost = async (newContent: string, imageUrl?: string) => {
    if (!user) return; 

    const userName = user.email.split('@')[0];
    const newPostData = {
      author_name: userName,
      author_avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`,
      content: newContent,
      image_url: imageUrl || null, // 🔴 把图片链接一并写入数据库
      likes: 0,
      replies: 0,
    };

    const { data, error } = await supabase.from('threads').insert([newPostData]).select();
    if (!error && data) {
      setThreads((prev) => [data[0], ...prev]);
    }
  };

  // 如果还在查验身份，先显示白屏或加载中
  if (isAuthChecking) return <div className="min-h-screen bg-[#101010] flex items-center justify-center text-white">识别中...</div>;
  return (
    <main className="min-h-screen bg-white dark:bg-[#101010] flex justify-center">
      {/* 🔴 如果当前没有 user，就渲染 Login 组件拦截屏幕 */}
      {!user && <Login />}
      <div className="w-full max-w-[620px] border-x border-gray-200 dark:border-[#333638] min-h-screen relative">
          <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#101010]/80 backdrop-blur-md border-b border-gray-200 dark:border-[#333638] p-4 flex justify-between items-center relative">
          
          {/* 🔴 左侧：安全撤退 (登出) 按钮 */}
          <button 
            onClick={handleLogout}
            title="退出登录"
            className="text-[#999999] hover:text-black dark:text-[#777777] dark:hover:text-white p-2 -ml-2 rounded-full transition-colors flex items-center justify-center z-10"
          >
            {/* 这是一个“开门离开”的矢量图标 */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>

          {/* 中间：标题 (通过绝对定位保证死死钉在正中间) */}
          <h1 className="text-[16px] font-bold text-black dark:text-white absolute left-1/2 transform -translate-x-1/2">
            推荐
          </h1>
          
          {/* 右侧：发帖呼叫按钮 (保持不变) */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#2A2A2A] p-2 -mr-2 rounded-full transition-colors z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </header>

        <div className="pb-20">
          {loading ? (
            <div className="p-10 text-center text-gray-500">雷达扫描中...</div>
          ) : (
            threads.map((thread) => (
              <ThreadCard
                key={thread.id}
                id={thread.id}
                authorName={thread.author_name}
                authorAvatar={thread.author_avatar}
                content={thread.content}
                timestamp={new Date(thread.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                likes={thread.likes}
                replies={thread.replies}
                // 👇 新接上的两根电缆 👇
                currentUserName={user ? user.email.split('@')[0] : ''} // 告诉卡片我现在是谁
                onDelete={handleDeletePost} // 告诉卡片删除后该呼叫谁
                imageUrl={thread.image_url} // 🔴 确保你接上了这根线！把数据库里的 image_url 传给卡片
              />
            ))
          )}
        </div>
      </div>

      {/* 🔴 把计算好的真实姓名和头像传给弹窗 */}
      <CreatePostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleAddNewPost}
        userName={user ? user.email.split('@')[0] : '未知用户'}
        userAvatar={user ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email.split('@')[0]}` : ''}
      />
      
    </main>
  );
}