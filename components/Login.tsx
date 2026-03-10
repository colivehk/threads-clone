'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // 🔴 终极黑魔法：绕过 React 销毁机制的“不死鸟” Toast 发射器
  const showGlobalToast = (msg: string, type: 'error' | 'success') => {
    // 1. 直接在系统最高层级创建一个 <div>
    const toast = document.createElement('div');
    // 2. 赋予它最高级的 Tailwind 样式和进场动画
    toast.className = `fixed top-10 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-[99999] font-bold text-[14px] text-white transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${type === 'success' ? 'bg-[#00D084]' : 'bg-[#FF3040]'}`;
    toast.innerText = msg;
    // 3. 强行挂载到网页本体上
    document.body.appendChild(toast);

    // 4. 3秒后执行平滑的退场动画，并销毁尸体
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -20px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        showGlobalToast(error.message, 'error');
      } else {
        // 🔴 登录成功提示
        showGlobalToast('登录成功！欢迎回来，指挥官。', 'success');
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        showGlobalToast(error.message, 'error');
      } else {
        // 🔴 注册成功提示
        showGlobalToast('注册成功！雷达已自动连接。', 'success');
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-[400px] bg-[#181818] rounded-[24px] p-8 shadow-2xl border border-[#333]">
        <h2 className="text-2xl font-bold text-white text-center mb-2">加入 Threads V2.0</h2>
        <p className="text-[#777] text-[14px] text-center mb-8">使用邮箱和密码创建您的账号</p>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="邮箱地址"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#2A2A2A] text-white border-none rounded-xl px-4 py-4 focus:ring-2 focus:ring-gray-500 outline-none transition-all"
            required
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#2A2A2A] text-white border-none rounded-xl px-4 py-4 focus:ring-2 focus:ring-gray-500 outline-none transition-all"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold rounded-xl py-4 mt-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {loading ? '雷达通讯中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button" // 加上 type="button" 防止误触发表单
            onClick={() => setIsLogin(!isLogin)}
            className="text-[#999] hover:text-white text-[14px] transition-colors"
          >
            {isLogin ? '没有账号？点击这里注册' : '已有账号？点击这里登录'}
          </button>
        </div>
      </div>
    </div>
  );
}