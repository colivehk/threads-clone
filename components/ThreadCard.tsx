'use client';
import { useState, useEffect, useRef } from 'react';
import Avatar from './Avatar';
import { supabase } from '../lib/supabase'; // 接入云端雷达

// 🔴 注意：我们新增了一个 id 参数，这是数据库寻找该帖子的唯一坐标！
interface ThreadCardProps {
  id: number; 
  authorName: string;
  authorAvatar?: string;
  content: string;
  timestamp: string;
  likes: number;
  replies: number;
  currentUserName?: string; // 🔴 新增：当前拿手机的人是谁？
  onDelete?: (id: number) => void; // 🔴 新增：向总部汇报“我要自毁”的对讲机
  imageUrl?: string;
}

export default function ThreadCard({ id, authorName, authorAvatar, content, timestamp, likes, replies, currentUserName, onDelete, imageUrl }: ThreadCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(likes);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false); // 🔴 新增：控制确认面板的开关
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null); // 🔴 升级：记录当前放大的是第几张图的序号
  // 🔴 魔法切割：如果收到了图片链接，按逗号切开变成数组
  const imagesArray = imageUrl ? imageUrl.split(',') : [];
// 🔴 新增魔法 1：鼠标“手抓”横移逻辑的专属状态
  const scrollRef = useRef<HTMLDivElement>(null); 
  const draggedRef = useRef(false); // 🔴 新增：极其敏锐的物理拖拽记录仪！
  const [isDragging, setIsDragging] = useState(false); 
  const [startX, setStartX] = useState(0); 
  const [scrollLeft, setScrollLeft] = useState(0); 
// 🔴 升级魔法 2：采用现代浏览器的终极黑科技 —— Pointer 事件与指针捕获
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    draggedRef.current = false;
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    
    // 🟢 绝妙修正：让当前被摸到的“图片（e.target）”去锁定指针，而不是外面的大框！
    // 这样既能实现全屏幕防脱手，又能让浏览器完美保留图片自己的 Click 事件！
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      // 🟢 松开鼠标时，释放图片的锁定
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {
      // 忽略因意外打断导致的释放错误
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // ... 这里的 Move 代码保持你现在的样子不变 ...
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    
    if (Math.abs(walk) > 5) {
      draggedRef.current = true;
    }
    
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };
  // 📡 强制监听指令：一旦总部传来的 likes 发生变化，立刻更新自己脑子里的数字！
  useEffect(() => {
    setCurrentLikes(likes);
  }, [likes]);
  // 👆 插入结束 👆 
  // 🔴 核心魔法：点赞的云端同步战术
  const handleLike = async () => {
    // 1. 乐观更新：不管三七二十一，先让前端数字变动，给用户极致丝滑的体验
    const newLikedState = !isLiked;
    const newLikesCount = newLikedState ? currentLikes + 1 : currentLikes - 1;
    
    setIsLiked(newLikedState);
    setCurrentLikes(newLikesCount);

    // 2. 隐秘行动：在后台悄悄告诉 Supabase 更新这条帖子的 likes 字段
    const { error } = await supabase
      .from('threads')
      .update({ likes: newLikesCount })
      .eq('id', id); // 精准狙击：只更新这一个 ID 的帖子

    if (error) {
      console.error('点赞情报同步失败:', error);
      // 如果云端更新失败，我们可以在这里把红心变回去（这里为了简化暂时只打印错误）
    }
  };
// 1. 点击垃圾桶时：不再弹原生粗糙弹窗，而是打开我们的高颜值面板
  const handleDeleteClick = () => {
    setIsConfirmOpen(true);
  };

  // 2. 在高颜值面板里点击“确定”时，才真正执行起爆
  const executeDelete = async () => {
    setIsConfirmOpen(false); // 先把面板关掉

    // 悄悄让云端数据库删除这条记录
    const { error } = await supabase.from('threads').delete().eq('id', id);

    if (error) {
      console.error('销毁失败:', error);
      alert('销毁失败，请检查雷达链路。');
    } else {
      // 呼叫总部在屏幕上抹除
      if (onDelete) onDelete(id); 
    }
  };
  return (
    <article className="p-4 sm:p-5 border-b border-gray-200 dark:border-[#333638] hover:bg-gray-50/50 dark:hover:bg-[#2A2A2A]/50 transition-colors cursor-pointer">
      <div className="flex gap-3">
        <div className="flex flex-col items-center flex-shrink-0">
          <Avatar name={authorName} src={authorAvatar} size="md" />
        </div>

        <div className="flex-1 min-w-0 pb-2">
            <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-[15px] text-black dark:text-[#F3F5F7]">
              {authorName}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[14px] text-[#999999] dark:text-[#777777]">
                {timestamp}
              </span>
              {/* 🔴 敌我识别：只有当前登录的人（currentUserName）等于发帖人（authorName），才渲染这个红色的垃圾桶按钮！ */}
              {currentUserName === authorName && (
                <button onClick={handleDeleteClick} className="text-[#999999] hover:text-[#FF3040] transition-colors" title="销毁帖子">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          <div className="text-[15px] text-black dark:text-[#F3F5F7] whitespace-pre-wrap break-words mt-1 leading-relaxed">
            {content}
          </div>
{/* 🔴 智能图片网格布局 - 重新改装：接上 Ref 和 4 个鼠标事件 */}
        {imagesArray.length > 0 && (
          <div
            ref={scrollRef} 
            onPointerDown={handlePointerDown}      // 🟢 换成 Pointer 按下
            onPointerUp={handlePointerUp}          // 🟢 换成 Pointer 松开
            onPointerCancel={handlePointerUp}      // 🟢 新增保险：如果浏览器发生意外打断，强制松开
            onPointerMove={handlePointerMove}      // 🟢 换成 Pointer 移动
            className={`mt-3 flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
              ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab snap-x snap-mandatory'}`}
          >
            {imagesArray.map((img, idx) => (
              <img 
                key={idx} 
                src={img} 
                alt={`Image ${idx + 1}`} 
                draggable={false} // 🔴 终极封印：彻底禁止浏览器的原生图片拖拽（消除幽灵残影）！
                onClick={(e) => {
                  if (draggedRef.current) return;
                  setZoomedIndex(idx);
                }} 
                className={`flex-shrink-0 object-cover rounded-[12px] border border-gray-100 dark:border-[#333638] transition-transform hover:opacity-90 snap-center
                  ${imagesArray.length === 1 ? 'w-full max-h-[500px]' : 'w-[260px] h-[260px] sm:w-[300px] sm:h-[300px]'}`} 
              />
            ))}
          </div>
        )}
          <div className="flex items-center gap-5 mt-4 text-[#999999] dark:text-[#777777]">
            {/* 🔴 点赞按钮绑定了最新的 handleLike 指令 */}
            <button 
              onClick={handleLike}
              className={`flex items-center gap-1.5 transition-colors group ${isLiked ? 'text-[#FF3040]' : 'hover:text-[#FF3040]'}`}
            >
              <svg className={`w-5 h-5 group-hover:scale-110 transition-transform ${isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isLiked ? (
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                )}
              </svg>
              <span className="text-[13px] font-medium mt-[2px]">{currentLikes > 0 ? currentLikes : ''}</span>
            </button>
            
            <button className="flex items-center gap-1.5 hover:text-black dark:hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              <span className="text-[13px] font-medium mt-[2px]">{replies > 0 ? replies : ''}</span>
            </button>
          </div>
        </div>
      </div>
      {/* 🔴 高颜值战术确认面板 */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-[#181818] w-full max-w-[320px] p-6 rounded-[20px] shadow-2xl border border-gray-200 dark:border-[#333638] transform transition-all scale-100 opacity-100">
            <h3 className="text-lg font-bold text-center text-black dark:text-white mb-2">删除帖子？</h3>
            <p className="text-sm text-center text-[#999999] dark:text-[#777777] mb-6">
              如果你删除了这条帖子，它将在云端被永久抹除，无法恢复。
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={executeDelete}
                className="w-full bg-[#FF3040] hover:bg-[#E02030] text-white font-bold py-3 rounded-xl transition-colors"
              >
                彻底删除
              </button>
              <button 
                onClick={() => setIsConfirmOpen(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-[#2A2A2A] dark:hover:bg-[#333333] text-black dark:text-white font-bold py-3 rounded-xl transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 🔴 全屏放大镜遮罩 */}
{/* 🔴 全屏多图轮播放大镜 */}
      {zoomedIndex !== null && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/95 backdrop-blur-md px-4 select-none">
          
          {/* 顶层透明遮罩，点击它就关闭放大镜 */}
          <div className="absolute inset-0 cursor-zoom-out" onClick={() => setZoomedIndex(null)}></div>

          {/* 右上角关闭按钮 */}
          <button 
            onClick={() => setZoomedIndex(null)}
            className="absolute top-6 right-6 z-10 text-white/50 hover:text-white transition-colors bg-black/20 rounded-full p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          {/* 左翻页按钮 (如果不是第一张图才显示) */}
          {zoomedIndex > 0 && (
            <button 
              onClick={(e) => { e.stopPropagation(); setZoomedIndex(zoomedIndex - 1); }}
              className="absolute left-4 sm:left-10 z-10 text-white/50 hover:text-white transition-colors bg-black/50 hover:bg-black/80 rounded-full p-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}

          {/* 核心大图展示区 */}
          <img 
            src={imagesArray[zoomedIndex]} 
            alt="Zoomed" 
            className="relative z-0 max-w-full max-h-[90vh] object-contain transition-all duration-300" 
          />

          {/* 右翻页按钮 (如果不是最后一张图才显示) */}
          {zoomedIndex < imagesArray.length - 1 && (
            <button 
              onClick={(e) => { e.stopPropagation(); setZoomedIndex(zoomedIndex + 1); }}
              className="absolute right-4 sm:right-10 z-10 text-white/50 hover:text-white transition-colors bg-black/50 hover:bg-black/80 rounded-full p-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          )}

          {/* 底部小圆点指示器 */}
          {imagesArray.length > 1 && (
            <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2 z-10 pointer-events-none">
              {imagesArray.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === zoomedIndex ? 'bg-white scale-125' : 'bg-white/30'}`} 
                />
              ))}
            </div>
          )}
          
        </div>
      )}

    </article>
  );
}