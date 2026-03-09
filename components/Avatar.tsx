'use client';

import { useState } from 'react';

// 定义组件接收的“参数”
interface AvatarProps {
  src?: string;      // 头像图片链接
  name?: string;     // 用户名 (用来提取首字母)
  size?: 'sm' | 'md' | 'lg'; // 预设大小
}

export default function Avatar({ src, name = 'Guest', size = 'md' }: AvatarProps) {
  // 记录图片是否加载失败
  const [imageFailed, setImageFailed] = useState(false);

  // 提取首字母：安全、绝对不会变成 Array 的 A！
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  // 尺寸映射表 (Tailwind CSS)
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-[#E5E5E5] dark:bg-[#1E1E1E] flex flex-shrink-0 items-center justify-center font-bold text-[#999999] dark:text-[#777777] uppercase overflow-hidden border border-gray-200 dark:border-[#333638] select-none`}
    >
      {/* 如果有图片，且没有加载失败，就显示图片 */}
      {src && !imageFailed ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageFailed(true)} // 一旦 404，立刻触发失败状态，切回首字母
        />
      ) : (
        /* 如果没图片，或者图片烂了，就稳稳地显示首字母 */
        <span>{initial}</span>
      )}
    </div>
  );
}