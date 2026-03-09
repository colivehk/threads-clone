'use client';

import Link from 'next/link';

export default function BottomNav() {
  return (
    // 固定在底部，高度 68px，带有顶部边框和磨砂玻璃背景
    <nav className="fixed bottom-0 left-0 w-full h-[68px] bg-white/90 dark:bg-[#101010]/90 backdrop-blur-md border-t border-gray-200 dark:border-[#333638] z-[100] sm:hidden flex items-center justify-around px-2 transition-colors duration-500">
      
      {/* 首页 (Home) */}
      <Link href="/" className="p-3 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-lg transition-colors">
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z" />
        </svg>
      </Link>

      {/* 搜索 (Search) */}
      <button className="p-3 text-[#999999] dark:text-[#777777] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-lg transition-colors">
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {/* 核心发帖按钮 (中间的加号) */}
      <button className="p-3 text-[#999999] dark:text-[#777777] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-lg transition-colors">
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* 动态/点赞 (Activity) */}
      <button className="p-3 text-[#999999] dark:text-[#777777] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-lg transition-colors">
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      {/* 个人主页 (Profile) */}
      <button className="p-3 text-[#999999] dark:text-[#777777] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-lg transition-colors">
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </button>

    </nav>
  );
}