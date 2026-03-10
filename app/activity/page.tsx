'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Avatar from '@/components/Avatar';
import Login from '@/components/Login';

export default function Activity() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [activeTab, setActiveTab] = useState<'all' | 'follows' | 'replies'>('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. 安检闸机
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

  // 2. 拉取通知情报
  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const userName = user.email.split('@')[0];

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('receiver', userName)
      .order('created_at', { ascending: false });

    if (data) setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // 3. 渲染单条通知雷达的组件
  const renderNotification = (notif: any) => {
    const actorAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.actor}`;
    const timeStr = new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let icon = null;
    let actionText = '';
    
    if (notif.type === 'follow') {
      actionText = '关注了你';
      icon = <div className="absolute -bottom-1 -right-1 bg-[#8733FF] rounded-full p-[2px] border-2 border-white dark:border-[#101010]"><svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>;
    } else if (notif.type === 'like') {
      actionText = '赞了你的串文';
      icon = <div className="absolute -bottom-1 -right-1 bg-[#FF3040] rounded-full p-[2px] border-2 border-white dark:border-[#101010]"><svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></div>;
    } else if (notif.type === 'reply') {
      actionText = '回复了你';
      icon = <div className="absolute -bottom-1 -right-1 bg-[#0095F6] rounded-full p-[2px] border-2 border-white dark:border-[#101010]"><svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg></div>;
    }

    return (
      <div 
        key={notif.id} 
        onClick={() => notif.thread_id ? router.push(`/thread/${notif.thread_id}`) : router.push(`/profile/${notif.actor}`)}
        className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors cursor-pointer border-b border-gray-100 dark:border-[#222]"
      >
        <div className="relative flex-shrink-0 mt-1">
          <Avatar name={notif.actor} src={actorAvatar} size="md" />
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline">
            <span className="font-bold text-[15px] text-black dark:text-[#F3F5F7] hover:underline" onClick={(e) => { e.stopPropagation(); router.push(`/profile/${notif.actor}`); }}>
              {notif.actor}
            </span>
            <span className="text-[#999999] dark:text-[#777777] text-[14px] ml-2 flex-shrink-0">{timeStr}</span>
          </div>
          <div className="text-[#999999] dark:text-[#777777] text-[15px] mt-0.5">{actionText}</div>
          {notif.content && (
            <div className="text-black dark:text-[#F3F5F7] text-[15px] mt-1 line-clamp-2 leading-relaxed">
              {notif.content}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isAuthChecking) return <div className="min-h-screen bg-[#101010] flex items-center justify-center text-white">识别中...</div>;

  // 本地过滤器
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'follows') return n.type === 'follow';
    if (activeTab === 'replies') return n.type === 'reply';
    return true;
  });

  return (
    <main className="min-h-screen bg-white dark:bg-[#101010] flex justify-center relative">
      {!user && <Login />}
      <div className="w-full max-w-[620px] border-x border-gray-200 dark:border-[#333638] min-h-screen relative pb-20">
        
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#101010]/80 backdrop-blur-md px-4 pt-4 pb-2">
          <div className="flex items-center mb-4">
            <button onClick={() => router.push('/')} className="text-black dark:text-white hover:opacity-70 transition-opacity p-2 -ml-2 rounded-full">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="text-[24px] font-bold text-black dark:text-[#F3F5F7] ml-2">动态</h1>
          </div>
          
          {/* 横向滚动 Tab */}
          <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {['all', 'follows', 'replies'].map((tab) => {
              const labels = { all: '全部', follows: '关注', replies: '回复' };
              const isActive = activeTab === tab;
              return (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-5 py-1.5 rounded-lg text-[15px] font-bold transition-colors flex-shrink-0 ${
                    isActive 
                      ? 'bg-black text-white dark:bg-white dark:text-black' 
                      : 'bg-transparent text-black dark:text-white border border-gray-300 dark:border-[#444] hover:bg-gray-100 dark:hover:bg-[#1C1C1C]'
                  }`}
                >
                  {labels[tab as keyof typeof labels]}
                </button>
              );
            })}
          </div>
        </header>

        <div className="mt-2">
          {loading ? (
            <div className="p-10 text-center text-[#999999]">雷达扫描中...</div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map(renderNotification)
          ) : (
            <div className="p-10 text-center text-[#999999]">
              {activeTab === 'all' ? '这里空空如也，快去发条串文吧！' : '暂无相关动态'}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}