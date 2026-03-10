'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Avatar from '@/components/Avatar';
import Login from '@/components/Login';

export default function Search() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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

  // 2. 核心雷达扫描逻辑 (防抖动实时搜索)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      setHasSearched(true);
      
      // 扫描全站发过帖或盖过楼的用户
      const { data, error } = await supabase
        .from('threads')
        .select('author_name, author_avatar')
        .ilike('author_name', `%${searchQuery}%`) // 模糊匹配名字
        .limit(100);

      if (!error && data) {
        // 数据去重：因为一个用户可能发了多个帖子，我们只需要展示他一次
        const uniqueUsers = Array.from(
          new Map(data.map(item => [item.author_name, item])).values()
        );
        setSearchResults(uniqueUsers);
      }
      setLoading(false);
    }, 500); // 500毫秒防抖，防止输入太快把数据库打挂

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  if (isAuthChecking) return <div className="min-h-screen bg-[#101010] flex items-center justify-center text-white">识别中...</div>;

  return (
    <main className="min-h-screen bg-white dark:bg-[#101010] flex justify-center relative">
      {!user && <Login />}
      <div className="w-full max-w-[620px] border-x border-gray-200 dark:border-[#333638] min-h-screen relative pb-24">
        
        {/* 顶部搜索输入舱 */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#101010]/80 backdrop-blur-md px-4 pt-4 pb-3">
          <div className="text-[24px] font-bold text-black dark:text-[#F3F5F7] mb-3 ml-2">搜索</div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-[#999999] dark:text-[#777777]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="搜索用户..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 dark:bg-[#1C1C1C] text-black dark:text-[#F3F5F7] border border-transparent focus:border-gray-300 dark:focus:border-[#444] rounded-[12px] py-2.5 pl-10 pr-4 outline-none transition-all placeholder-[#999999] dark:placeholder-[#777777] text-[15px]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#999999] hover:text-black dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </header>

        {/* 搜索结果渲染区 */}
        <div className="mt-2">
          {loading ? (
            <div className="px-6 py-8 text-center text-[#999999] flex justify-center items-center gap-2">
              <svg className="animate-spin w-5 h-5 text-[#999999]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              雷达扫描中...
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((result, idx) => (
              <div 
                key={idx} 
                onClick={() => router.push(`/profile/${result.author_name}`)}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors cursor-pointer border-b border-gray-100 dark:border-[#222]"
              >
                <div className="flex items-center gap-4">
                  <Avatar name={result.author_name} src={result.author_avatar} size="md" />
                  <div className="flex flex-col">
                    <span className="font-bold text-[15px] text-black dark:text-[#F3F5F7]">{result.author_name}</span>
                    <span className="text-[14px] text-[#999999] dark:text-[#777777]">{result.author_name} 的主页</span>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // 阻止点击按钮时跳转到主页
                    router.push(`/profile/${result.author_name}`);
                  }}
                  className="px-4 py-1.5 border border-gray-300 dark:border-[#444] rounded-lg font-bold text-[14px] text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors"
                >
                  查看
                </button>
              </div>
            ))
          ) : hasSearched && !loading ? (
            <div className="px-6 py-10 text-center text-[#999999]">
              <div className="text-[16px] font-bold text-black dark:text-[#F3F5F7] mb-1">未找到用户</div>
              <div className="text-[14px]">尝试搜索其他指挥官的代号。</div>
            </div>
          ) : (
            <div className="px-6 py-10 text-center text-[#999999]">
              输入名称以搜索全站用户
            </div>
          )}
        </div>

      </div>
    </main>
  );
}