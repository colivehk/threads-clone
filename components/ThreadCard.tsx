'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from './Avatar';
import { supabase } from '../lib/supabase'; 

interface ThreadCardProps {
  id: number; 
  authorName: string;
  authorAvatar?: string;
  content: string;
  timestamp: string;
  likes: number;
  replies: number;
  currentUserName?: string; 
  onDelete?: (id: number) => void; 
  imageUrl?: string;
  onReplyClick?: (data: any) => void; 
  isReplyNode?: boolean;              
}

export default function ThreadCard(props: ThreadCardProps) {
  const { id, authorName, authorAvatar, content, timestamp, likes, replies, currentUserName, onDelete, imageUrl, onReplyClick, isReplyNode } = props;
  
  const router = useRouter(); 

  const [isLiked, setIsLiked] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(likes);
  const [isProcessingLike, setIsProcessingLike] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false); 
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null); 
  const imagesArray = imageUrl ? imageUrl.split(',') : [];

  const scrollRef = useRef<HTMLDivElement>(null); 
  const draggedRef = useRef(false); 
  const [isDragging, setIsDragging] = useState(false); 
  const [startX, setStartX] = useState(0); 
  const [scrollLeft, setScrollLeft] = useState(0); 

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    draggedRef.current = false;
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch (err) {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    if (Math.abs(walk) > 5) draggedRef.current = true;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  useEffect(() => {
    if (!currentUserName) return;
    const fetchInitialLikeStatus = async () => {
      const { data } = await supabase
        .from('user_likes')
        .select('id')
        .eq('thread_id', id)
        .eq('username', currentUserName)
        .maybeSingle(); 
      if (data) setIsLiked(true); 
    };
    fetchInitialLikeStatus();
  }, [id, currentUserName]);

  useEffect(() => {
    setCurrentLikes(likes);
  }, [likes]);

  const handleLike = async () => {
    if (!currentUserName) {
      alert('指挥官，请先登录！');
      return;
    }
    if (isProcessingLike) return; 
    setIsProcessingLike(true);

    try {
      if (isLiked) {
        setIsLiked(false);
        setCurrentLikes(prev => prev - 1);
        await supabase.from('user_likes').delete().eq('thread_id', id).eq('username', currentUserName);
        const { data: thread } = await supabase.from('threads').select('likes').eq('id', id).single();
        if (thread) await supabase.from('threads').update({ likes: Math.max(0, thread.likes - 1) }).eq('id', id);
      } else {
        setIsLiked(true);
        setCurrentLikes(prev => prev + 1);
        const { error } = await supabase.from('user_likes').insert([{ thread_id: id, username: currentUserName }]);
        
        if (!error) {
          const { data: thread } = await supabase.from('threads').select('likes').eq('id', id).single();
          if (thread) await supabase.from('threads').update({ likes: thread.likes + 1 }).eq('id', id);
        } else {
          setIsLiked(false);
          setCurrentLikes(prev => prev - 1);
        }
      }
    } catch (err) {
      console.error('点赞通信失败', err);
    } finally {
      setIsProcessingLike(false); 
    }
  };

  const executeDelete = async () => {
    setIsConfirmOpen(false); 
    const { error } = await supabase.from('threads').delete().eq('id', id);
    if (error) alert('销毁失败，请检查雷达链路。');
    else if (onDelete) onDelete(id); 
  };

  const handleCardClick = () => {
    if (!isReplyNode) {
      router.push(`/thread/${id}`);
    }
  };

  // 🔴 核心魔法：专属头像跳转拦截器
  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 绝对阻断：不要触发外层卡片的跳转详情页事件！
    // 带着这个作者的名字，跳入动态主页！
    router.push(`/profile/${encodeURIComponent(authorName)}`);
  };

  return (
    <article 
      onClick={handleCardClick} 
      className={`p-4 sm:p-5 transition-colors cursor-pointer ${isReplyNode ? 'pb-0' : 'border-b border-gray-200 dark:border-[#333638] hover:bg-gray-50/50 dark:hover:bg-[#2A2A2A]/50'}`}
    >
      <div className="flex gap-3">
        
        {/* 🔴 给头像区穿上带悬停放大的马甲，并绑上跳转雷达 */}
        <div 
          className="flex flex-col items-center flex-shrink-0 cursor-pointer group" 
          onClick={handleProfileClick}
          title={`访问 ${authorName} 的主页`}
        >
          <div className="group-hover:opacity-80 transition-opacity">
            <Avatar name={authorName} src={authorAvatar} size="md" />
          </div>
          {/* 这里的连接线加上 pointer-events-none，防止误触 */}
          {isReplyNode && <div className="w-[2px] flex-1 bg-gray-200 dark:bg-[#333] mt-2 mb-[-20px] rounded-full pointer-events-none"></div>}
        </div>

        <div className="flex-1 min-w-0 pb-2">
          <div className="flex items-center justify-between mb-1">
            
            {/* 🔴 给名字加上下划线反馈，同样绑上跳转雷达 */}
            <span 
              className="font-semibold text-[15px] text-black dark:text-[#F3F5F7] hover:underline cursor-pointer"
              onClick={handleProfileClick}
              title={`访问 ${authorName} 的主页`}
            >
              {authorName}
            </span>

            <div className="flex items-center gap-3">
              <span className="text-[14px] text-[#999999] dark:text-[#777777]">{timestamp}</span>
              {currentUserName === authorName && !isReplyNode && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsConfirmOpen(true); }} 
                  className="text-[#999999] hover:text-[#FF3040] transition-colors" 
                  title="销毁帖子"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          <div className="text-[15px] text-black dark:text-[#F3F5F7] whitespace-pre-wrap break-words mt-1 leading-relaxed">{content}</div>

          {imagesArray.length > 0 && (
            <div
              ref={scrollRef} 
              onPointerDown={handlePointerDown}      
              onPointerUp={handlePointerUp}          
              onPointerCancel={handlePointerUp}      
              onPointerMove={handlePointerMove}      
              className={`mt-3 flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab snap-x snap-mandatory'}`}
            >
            {imagesArray.map((img, idx) => (
                <img 
                  key={idx} 
                  src={img} 
                  alt={`Image ${idx + 1}`} 
                  draggable={false} 
                  onDragStart={(e) => e.preventDefault()} /* 🔴新增：彻底拦截拖拽事件 */
                  onClick={(e) => {
                    e.stopPropagation(); 
                    if (draggedRef.current) return;
                    setZoomedIndex(idx);
                  }} 
                  /* 🔴新增：[-webkit-user-drag:none] 和 select-none 彻底禁止内核拖拽 */
                  className={`flex-shrink-0 object-cover rounded-[12px] border border-gray-100 dark:border-[#333638] transition-transform hover:opacity-90 snap-center [-webkit-user-drag:none] select-none ${imagesArray.length === 1 ? 'w-full max-h-[500px]' : 'w-[260px] h-[260px] sm:w-[300px] sm:h-[300px]'}`} 
                />
              ))}。      
            </div>
          )}

          {!isReplyNode && (
            <div className="flex items-center gap-5 mt-4 text-[#999999] dark:text-[#777777]">
              <button 
                onClick={(e) => { e.stopPropagation(); handleLike(); }} 
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
              
              <button 
                onClick={(e) => { e.stopPropagation(); onReplyClick?.(props); }} 
                className="flex items-center gap-1.5 hover:text-black dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                <span className="text-[13px] font-medium mt-[2px]">{replies > 0 ? replies : ''}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {isConfirmOpen && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
        >
          <div className="bg-white dark:bg-[#181818] w-full max-w-[320px] p-6 rounded-[20px] shadow-2xl border border-gray-200 dark:border-[#333638] transform transition-all scale-100 opacity-100">
            <h3 className="text-lg font-bold text-center text-black dark:text-white mb-2">删除帖子？</h3>
            <p className="text-sm text-center text-[#999999] dark:text-[#777777] mb-6">如果你删除了这条帖子，它将在云端被永久抹除，无法恢复。</p>
            <div className="flex flex-col gap-3">
              <button onClick={executeDelete} className="w-full bg-[#FF3040] hover:bg-[#E02030] text-white font-bold py-3 rounded-xl transition-colors">彻底删除</button>
              <button onClick={() => setIsConfirmOpen(false)} className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-[#2A2A2A] dark:hover:bg-[#333333] text-black dark:text-white font-bold py-3 rounded-xl transition-colors">取消</button>
            </div>
          </div>
        </div>
      )}

      {zoomedIndex !== null && (
        <div 
          onClick={(e) => { e.stopPropagation(); setZoomedIndex(null); }} 
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/95 backdrop-blur-md px-4 select-none"
        >
          <button onClick={(e) => { e.stopPropagation(); setZoomedIndex(null); }} className="absolute top-6 right-6 z-10 text-white/50 hover:text-white transition-colors bg-black/20 rounded-full p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          {zoomedIndex > 0 && (
            <button onClick={(e) => { e.stopPropagation(); setZoomedIndex(zoomedIndex - 1); }} className="absolute left-4 sm:left-10 z-10 text-white/50 hover:text-white transition-colors bg-black/50 hover:bg-black/80 rounded-full p-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          {/* 🔴 全屏大图 */}
          <img 
            src={imagesArray[zoomedIndex]} 
            alt="Zoomed" 
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onClick={(e) => e.stopPropagation()} /* 🔴 终极防穿透：点击图片时拦截事件，绝不关闭！ */
            className="relative z-0 max-w-full max-h-[90vh] object-contain transition-all duration-300 [-webkit-user-drag:none] select-none cursor-default" 
          />      
          {zoomedIndex < imagesArray.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); setZoomedIndex(zoomedIndex + 1); }} className="absolute right-4 sm:right-10 z-10 text-white/50 hover:text-white transition-colors bg-black/50 hover:bg-black/80 rounded-full p-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          )}
          {imagesArray.length > 1 && (
            <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2 z-10 pointer-events-none">
              {imagesArray.map((_, idx) => (
                <div key={idx} className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === zoomedIndex ? 'bg-white scale-125' : 'bg-white/30'}`} />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}