'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onClose?: () => void; // 新增：控制弹窗关闭的函数
}

export default function Login({ onClose }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // 🔴 终极黑魔法：绕过 React 销毁机制的“不死鸟” Toast 发射器
  const showGlobalToast = (msg: string, type: 'error' | 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-10 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-[999999] font-bold text-[14px] text-white transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${type === 'success' ? 'bg-[#00D084]' : 'bg-[#FF3040]'}`;
    toast.innerText = msg;
    document.body.appendChild(toast);

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
        showGlobalToast('登录成功！欢迎回来，指挥官。', 'success');
        if (onClose) onClose(); // 登录成功后自动关闭弹窗
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        showGlobalToast(error.message, 'error');
      } else {
        showGlobalToast('注册成功！雷达已自动连接。', 'success');
        if (onClose) onClose(); // 注册成功后自动关闭弹窗
      }
    }
    setLoading(false);
  };

  return (
    // 添加 onClick={onClose} 实现点击遮罩层关闭弹窗
    <div onClick={onClose} className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      {/* 添加 onClick={(e) => e.stopPropagation()} 防止点击面板时触发关闭 */}
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-[400px] bg-[#181818] rounded-[24px] p-8 shadow-2xl border border-[#333]">
        
        {/* 新增：右上角关闭按钮 */}
        {onClose && (
          <button onClick={onClose} className="absolute top-5 right-5 text-[#999] hover:text-white transition-colors">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}

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
            type="button"
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