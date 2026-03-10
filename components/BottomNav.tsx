'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import CreatePostModal from './CreatePostModal';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. 身份雷达：全局监听当前用户
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 如果没有登录，底部导航隐身
  if (!user) return null;

  const currentUserName = user.email?.split('@')[0];
  const currentUserAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserName}`;

  // 2. 全局导弹发射器：无论在哪个页面，发完贴都能同步云端
  const handleAddNewPost = async (newContent: string, imageUrl?: string) => {
    const newPostData = {
      author_name: currentUserName,
      author_avatar: currentUserAvatar,
      content: newContent,
      image_url: imageUrl || null,
      likes: 0,
      replies: 0,
    };

    const { error } = await supabase.from('threads').insert([newPostData]);
    if (!error) {
      setIsModalOpen(false);
      // 如果不在首页，发完贴自动传送回首页看最新动态
      if (pathname !== '/') {
        router.push('/');
      }
    } else {
      alert('发送失败，请检查通讯链路。');
    }
  };

  // 图标点亮状态判定器
  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const getIconClass = (path: string) => 
    `w-[26px] h-[26px] transition-all duration-200 ${
      isActive(path) 
        ? 'text-black dark:text-white scale-110' 
        : 'text-[#999999] dark:text-[#777777] hover:text-black dark:hover:text-white hover:scale-105'
    }`;

  return (
    <>
      {/* 🔴 全局底部导航栏 UI */}
      <div className="fixed bottom-0 left-0 right-0 z-[90] flex justify-center pointer-events-none pb-safe">
        <nav className="w-full max-w-[620px] bg-white/90 dark:bg-[#101010]/90 backdrop-blur-xl border-t border-gray-200 dark:border-[#222] flex justify-between items-center px-6 sm:px-10 h-[68px] pointer-events-auto">
          
          {/* 1. 主页 */}
          <button onClick={() => router.push('/')} className="p-2 -m-2">
            <svg className={getIconClass('/')} fill={isActive('/') ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive('/') ? "0" : "2"} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>

          {/* 2. 搜索 */}
          <button onClick={() => router.push('/search')} className="p-2 -m-2">
            <svg className={getIconClass('/search')} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* 3. 发布 (呼叫发帖弹窗) */}
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="p-2 -m-2 text-[#999999] dark:text-[#777777] hover:text-black dark:hover:text-white transition-colors"
          >
            <div className="w-[32px] h-[32px] rounded-lg border-2 border-current flex items-center justify-center bg-gray-50/50 dark:bg-[#1A1A1A]/50 backdrop-blur-sm hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </button>

          {/* 4. 动态 */}
          <button onClick={() => router.push('/activity')} className="p-2 -m-2">
            <svg className={getIconClass('/activity')} fill={isActive('/activity') ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive('/activity') ? "0" : "2"} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* 5. 个人主页 */}
          <button onClick={() => router.push(`/profile/${currentUserName}`)} className="p-2 -m-2">
            <svg className={getIconClass(`/profile/${currentUserName}`)} fill={isActive(`/profile`) ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive(`/profile`) ? "0" : "2"} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>

        </nav>
      </div>

      {/* 🔴 全局挂载的发帖悬浮舱 */}
      <CreatePostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleAddNewPost}
        userName={currentUserName}
        userAvatar={currentUserAvatar}
      />
    </>
  );
}