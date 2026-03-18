'use client';
import { supabase } from '@/lib/supabase';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createThreadPost } from '@/lib/thread-actions';
import { useAuthUser } from '@/hooks/useAuthUser';
import CreatePostModal from './CreatePostModal';
import Login from './Login';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn, currentUserName, currentUserAvatar } = useAuthUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 更多菜单状态
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [moreMenuView, setMoreMenuView] = useState<'main' | 'appearance'>('main');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // 真实主题切换状态引擎
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');

  // 初始化主题并监听系统变化
  useEffect(() => {
    const savedTheme = localStorage.getItem('threads-theme') as 'light' | 'dark' | 'auto' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme('auto');
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (localStorage.getItem('threads-theme') === 'auto' || !localStorage.getItem('threads-theme')) {
        applyTheme('auto');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const applyTheme = (newTheme: 'light' | 'dark' | 'auto') => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else if (newTheme === 'light') {
      root.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
    localStorage.setItem('threads-theme', newTheme);
    applyTheme(newTheme);
  };


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
        setTimeout(() => setMoreMenuView('main'), 200);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMoreMenuOpen]);


  const handleAddNewPost = async (
    newContent: string,
    imageUrl?: string,
    replySettings?: import('@/lib/thread-types').ThreadReplySettings,
  ) => {
    if (!isLoggedIn) return;

    const { error } = await createThreadPost({
      authorName: currentUserName,
      authorAvatar: currentUserAvatar,
      content: newContent,
      imageUrl,
      replySettings,
    });

    if (!error) {
      setIsModalOpen(false);
      if (pathname !== '/') router.push('/');
    }
  };

  const isActive = (path: string) => path === '/' ? pathname === '/' : pathname.startsWith(path);
  const getIconClass = (path: string) => `w-[28px] h-[28px] transition-all duration-200 ${isActive(path) ? 'text-black dark:text-white scale-110 cursor-default' : 'text-[#999999] dark:text-[#777777] hover:text-black dark:hover:text-white cursor-default'}`;

  const handleHomeClick = () => {
    if (pathname === '/') {
      window.dispatchEvent(new Event('trigger-refresh'));
    } else {
      router.push('/');
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 w-full z-[90] md:w-[76px] md:h-screen md:top-0 pointer-events-none pb-safe flex justify-center md:block">
        <nav className="w-full max-w-[640px] md:w-full md:h-full bg-white/90 dark:bg-[#101010]/90 backdrop-blur-xl border-t md:border-t-0 border-gray-200 dark:border-[#222] flex md:flex-col items-center justify-between md:justify-between px-6 sm:px-10 md:px-0 md:py-8 h-[68px] md:h-auto pointer-events-auto">
          
          <div onClick={handleHomeClick} className="hidden md:flex flex-none w-12 h-12 items-center justify-center text-black dark:text-white cursor-default hover:scale-105 transition-transform">
            <svg viewBox="0 0 192 192" width="32" height="32" fill="currentColor"><path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0113 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.011 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.194473 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.0476C101.061 97.8658 103.146 97.6892 105.322 97.515C108.566 97.2558 111.965 96.993 115.421 96.6575C114.735 116.142 107.388 129.014 98.4405 129.507Z"></path></svg>
          </div>

          <div className="flex w-full md:w-auto md:flex-col justify-between md:justify-center items-center md:flex-1 md:gap-10">
            <button onClick={handleHomeClick} className="p-2 -m-2 cursor-default"><svg className={getIconClass('/')} viewBox="0 0 24 24" fill={isActive('/') ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive('/') ? "0" : "2.5"}><path d="M12 2L2 12h3v8h5v-6h4v6h5v-8h3L12 2z" stroke="none" /></svg></button>
            {/* 全量拦截：搜索 */}
            <button onClick={() => user ? router.push('/search') : setShowLoginModal(true)} className="p-2 -m-2 cursor-default"><svg className={getIconClass('/search')} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
            {/* 全量拦截：发帖 */}
            <button onClick={() => user ? setIsModalOpen(true) : setShowLoginModal(true)} className="p-2 -m-2 text-[#999999] hover:text-black dark:hover:text-white cursor-default"><div className="w-[36px] h-[36px] rounded-xl border-[2.5px] border-current flex items-center justify-center bg-gray-50/50 dark:bg-[#1A1A1A]/50 backdrop-blur-sm"><svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg></div></button>
            {/* 全量拦截：动态 */}
            <button onClick={() => user ? router.push('/activity') : setShowLoginModal(true)} className="p-2 -m-2 cursor-default"><svg className={getIconClass('/activity')} fill={isActive('/activity') ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive('/activity') ? "0" : "2.5"} viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg></button>
            {/* 全量拦截：个人主页 */}
            <button onClick={() => user ? router.push('/profile') : setShowLoginModal(true)} className="p-2 -m-2 cursor-default"><svg className={getIconClass(`/profile`)} fill={isActive(`/profile`) ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive(`/profile`) ? "0" : "2.5"} viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></button>
          </div>

          <div className="hidden md:flex flex-col items-center gap-6 relative">
            <button className="text-[#999999] hover:text-black dark:hover:text-white transition-colors cursor-default" title="图钉">
               <svg className="w-6 h-6 rotate-45" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 13l-4 4L5 7l4-4 10 10zM7 17l-4 4" /></svg>
            </button>
            
            <div className="relative flex justify-center w-full">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMoreMenuOpen(!isMoreMenuOpen); }} 
                className="p-2 text-[#999999] hover:text-black dark:hover:text-white transition-colors cursor-default" 
                title="更多"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 9h16M4 15h16" /></svg>
              </button>

              {isMoreMenuOpen && (
                <div 
                  ref={moreMenuRef} 
                  className="absolute bottom-2 left-[60px] w-[280px] bg-white dark:bg-[#181818] rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-[#333] py-2 z-[200] overflow-hidden text-left"
                >
                  {moreMenuView === 'main' ? (
                    <div className="flex flex-col">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setMoreMenuView('appearance'); }} 
                        className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors text-[15px] font-bold text-black dark:text-white w-full text-left"
                      >
                        外观
                        <svg className="w-4 h-4 text-[#999]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setIsMoreMenuOpen(false); 
                          setIsReportModalOpen(true); 
                        }} 
                        className="flex items-center px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors text-[15px] font-bold text-black dark:text-white w-full text-left"
                      >
                        报告问题
                      </button>
                      {isLoggedIn && (
                        <button 
                          onClick={async () => {
                            setIsMoreMenuOpen(false);
                            await supabase.auth.signOut(); 
                            router.push('/'); 
                            router.refresh();
                          }} 
                          className="flex items-center px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors text-[15px] font-bold text-[#FF3040] w-full text-left border-t border-gray-100 dark:border-[#333] mt-1"
                        >
                          退出登录
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <div className="flex items-center px-4 py-3 mb-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setMoreMenuView('main'); }} 
                          className="p-1 -ml-1 mr-3 text-[#999] hover:text-black dark:hover:text-white transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <span className="font-bold text-[15px] text-black dark:text-white">外观</span>
                      </div>
                      
                      <div className="flex items-center justify-between px-4 pb-4 pt-1 gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleThemeChange('light'); }}
                          className={`relative flex-1 flex flex-col items-center justify-center py-4 rounded-[16px] border-2 transition-colors ${theme === 'light' ? 'border-black dark:border-white bg-gray-50 dark:bg-[#1A1A1A] text-black dark:text-white' : 'border-transparent hover:bg-gray-50 dark:hover:bg-[#2A2A2A] text-[#999] dark:text-[#777] hover:text-black dark:hover:text-white'}`}
                        >
                          <svg className="w-[22px] h-[22px] mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                          <span className="text-[13px] font-bold">浅色</span>
                          {theme === 'light' && (
                            <div className="absolute top-1.5 right-1.5 bg-black dark:bg-white text-white dark:text-black rounded-full p-[2px]">
                               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                          )}
                        </button>

                        <button 
                          onClick={(e) => { e.stopPropagation(); handleThemeChange('dark'); }}
                          className={`relative flex-1 flex flex-col items-center justify-center py-4 rounded-[16px] border-2 transition-colors ${theme === 'dark' ? 'border-black dark:border-white bg-gray-50 dark:bg-[#1A1A1A] text-black dark:text-white' : 'border-transparent hover:bg-gray-50 dark:hover:bg-[#2A2A2A] text-[#999] dark:text-[#777] hover:text-black dark:hover:text-white'}`}
                        >
                          <svg className="w-[22px] h-[22px] mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path></svg>
                          <span className="text-[13px] font-bold">深色</span>
                          {theme === 'dark' && (
                            <div className="absolute top-1.5 right-1.5 bg-black dark:bg-white text-white dark:text-black rounded-full p-[2px]">
                               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                          )}
                        </button>

                        <button 
                          onClick={(e) => { e.stopPropagation(); handleThemeChange('auto'); }}
                          className={`relative flex-1 flex flex-col items-center justify-center py-4 rounded-[16px] border-2 transition-colors ${theme === 'auto' ? 'border-black dark:border-white bg-gray-50 dark:bg-[#1A1A1A] text-black dark:text-white' : 'border-transparent hover:bg-gray-50 dark:hover:bg-[#2A2A2A] text-[#999] dark:text-[#777] hover:text-black dark:hover:text-white'}`}
                        >
                          <svg className="w-[22px] h-[22px] mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" /><path strokeLinecap="round" strokeLinejoin="round" fill="currentColor" d="M12 2V22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2Z"/></svg>
                          <span className="text-[13px] font-bold">自动</span>
                          {theme === 'auto' && (
                            <div className="absolute top-1.5 right-1.5 bg-black dark:bg-white text-white dark:text-black rounded-full p-[2px]">
                               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* 确保只挂载一个带 onClose 的 Login 组件 */}
      {showLoginModal && <Login onClose={() => setShowLoginModal(false)} />}
      
      {isLoggedIn && <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleAddNewPost} userName={currentUserName} userAvatar={currentUserAvatar} />}

      {isReportModalOpen && (
        <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto px-4">
          <div className="relative bg-white dark:bg-[#181818] w-full max-w-[500px] h-[500px] sm:h-[550px] rounded-[20px] shadow-2xl flex flex-col border border-gray-200 dark:border-[#333]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#333]">
              <button onClick={() => setIsReportModalOpen(false)} className="text-[#999] hover:text-black dark:hover:text-white transition-colors cursor-default">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <span className="font-bold text-black dark:text-white text-[16px]">报告问题</span>
              <div className="w-6"></div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <textarea 
                placeholder="请提供尽可能多的详情..." 
                className="w-full flex-1 bg-transparent text-black dark:text-white placeholder-[#999] dark:placeholder-[#777] resize-none outline-none text-[15px]"
                autoFocus
              ></textarea>
              <div className="mt-4 flex justify-between items-center border-t border-gray-100 dark:border-[#333] pt-4">
                 <button className="text-[#999] hover:text-black dark:hover:text-white transition-colors cursor-default">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                 </button>
                 <button className="bg-gray-100 text-[#999] dark:bg-[#333] dark:text-[#777] font-bold py-2.5 px-6 rounded-full cursor-not-allowed">提交</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}