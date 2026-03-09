'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false); // 切换登录/注册状态
  const [loading, setLoading] = useState(false);

  // 🔴 核心魔法：呼叫云端进行鉴权
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // 执行注册
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('注册成功！正在为您自动登录...');
      } else {
        // 执行登录
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      alert(error.message || '发生错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
      <div className="bg-white dark:bg-[#181818] w-full max-w-md p-8 rounded-[24px] shadow-2xl border border-gray-200 dark:border-[#333638]">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
            {isSignUp ? '加入 Threads V2.0' : '欢迎回到指挥部'}
          </h2>
          <p className="text-[#999999] dark:text-[#777777] text-sm">
            使用邮箱和密码{isSignUp ? '创建您的账号' : '验证您的身份'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="您的电子邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#2A2A2A] text-black dark:text-white px-4 py-3 rounded-xl border border-transparent focus:border-gray-300 dark:focus:border-gray-500 outline-none transition-colors"
            required
          />
          <input
            type="password"
            placeholder="密码 (至少 6 位)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#2A2A2A] text-black dark:text-white px-4 py-3 rounded-xl border border-transparent focus:border-gray-300 dark:focus:border-gray-500 outline-none transition-colors"
            required
            minLength={6}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white dark:bg-white dark:text-black font-semibold py-3 rounded-xl mt-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? '雷达通讯中...' : (isSignUp ? '立即注册' : '登 录')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[14px] text-gray-500 hover:text-black dark:hover:text-white transition-colors"
          >
            {isSignUp ? '已有账号？点击这里登录' : '还没有通行证？点击注册'}
          </button>
        </div>
      </div>
    </div>
  );
}