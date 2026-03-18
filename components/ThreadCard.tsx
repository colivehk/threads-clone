'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/Avatar';
import Login from '@/components/Login';
import { supabase } from '@/lib/supabase';
import type { ReplyAudience, ThreadCardData } from '@/lib/thread-types';
import { parseImageUrls } from '@/lib/thread-utils';
import { checkReplyPermission } from '@/lib/reply-permissions';

type ThreadCardProps = ThreadCardData & {
  currentUserName?: string;
  isLoggedIn?: boolean;
  onDelete?: (id: number) => void;
  onReplyClick?: (data: ThreadCardData) => void;
  onRequireLogin?: () => void;
  isReplyNode?: boolean;
  replyAudience?: ReplyAudience;
  reviewReplies?: boolean;
};

function DeleteConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
    >
      <div className="bg-white dark:bg-[#181818] w-full max-w-[320px] p-6 rounded-[20px] shadow-2xl border border-gray-200 dark:border-[#333638] transform transition-all scale-100 opacity-100">
        <h3 className="text-lg font-bold text-center text-black dark:text-white mb-2">删除帖子？</h3>
        <p className="text-sm text-center text-[#999999] dark:text-[#777777] mb-6">
          如果你删除了这条帖子，它将在云端被永久抹除，无法恢复。
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full bg-[#FF3040] hover:bg-[#E02030] text-white font-bold py-3 rounded-xl transition-colors"
            type="button"
          >
            彻底删除
          </button>
          <button
            onClick={onCancel}
            className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-[#2A2A2A] dark:hover:bg-[#333333] text-black dark:text-white font-bold py-3 rounded-xl transition-colors"
            type="button"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

function ImageLightbox({
  images,
  activeIndex,
  onClose,
  onPrev,
  onNext,
}: {
  images: string[];
  activeIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const canSwipe = images.length > 1;
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const draggedRef = useRef(false);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && activeIndex > 0) onPrev();
      if (event.key === 'ArrowRight' && activeIndex < images.length - 1) onNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, images.length, onClose, onNext, onPrev]);

  useEffect(() => {
    setDragOffsetX(0);
    setIsDragging(false);
    draggedRef.current = false;
    pointerIdRef.current = null;
  }, [activeIndex]);

  const releasePointer = (pointerId?: number) => {
    if (pointerId == null || !stageRef.current) return;
    try {
      stageRef.current.releasePointerCapture(pointerId);
    } catch {}
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canSwipe) return;
    dragStartXRef.current = e.clientX;
    pointerIdRef.current = e.pointerId;
    draggedRef.current = false;
    setIsDragging(true);
    stageRef.current = e.currentTarget;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canSwipe || pointerIdRef.current !== e.pointerId) return;

    const rawOffset = e.clientX - dragStartXRef.current;
    const atEdge = (activeIndex === 0 && rawOffset > 0) || (activeIndex === images.length - 1 && rawOffset < 0);
    const nextOffset = atEdge ? rawOffset * 0.35 : rawOffset;

    if (Math.abs(rawOffset) > 6) {
      draggedRef.current = true;
    }

    setDragOffsetX(nextOffset);
    e.stopPropagation();
  };

  const finishSwipe = (pointerId?: number) => {
    const threshold = 72;
    const movedEnough = Math.abs(dragOffsetX) > threshold;
    const canGoPrev = dragOffsetX > 0 && activeIndex > 0;
    const canGoNext = dragOffsetX < 0 && activeIndex < images.length - 1;

    releasePointer(pointerId);
    pointerIdRef.current = null;
    setIsDragging(false);

    if (movedEnough && canGoPrev) {
      setDragOffsetX(0);
      onPrev();
      return;
    }

    if (movedEnough && canGoNext) {
      setDragOffsetX(0);
      onNext();
      return;
    }

    setDragOffsetX(0);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canSwipe || pointerIdRef.current !== e.pointerId) return;
    finishSwipe(e.pointerId);
    e.stopPropagation();
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canSwipe || pointerIdRef.current !== e.pointerId) return;
    releasePointer(e.pointerId);
    pointerIdRef.current = null;
    setIsDragging(false);
    setDragOffsetX(0);
    draggedRef.current = false;
    e.stopPropagation();
  };

  return (
    <div className="fixed inset-0 z-[100000] select-none">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/95 backdrop-blur-md"
        aria-hidden="true"
      />

      <div className="relative z-0 flex h-full w-full items-center justify-center px-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-6 right-6 z-20 text-white/50 hover:text-white transition-colors bg-black/20 rounded-full p-2"
          type="button"
        >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

        {images.length > 1 && (
          <div className="absolute top-6 left-6 z-20 rounded-full bg-black/45 px-3 py-1 text-sm text-white/85">
          {activeIndex + 1} / {images.length}
        </div>
      )}

        {activeIndex > 0 && (
          <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
            className="absolute left-4 sm:left-10 z-20 text-white/50 hover:text-white transition-colors bg-black/50 hover:bg-black/80 rounded-full p-3"
          type="button"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

        <div
          ref={stageRef}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className="relative z-10 flex max-h-full max-w-full items-center justify-center"
          style={{ touchAction: canSwipe ? 'pan-y' : 'auto', cursor: canSwipe ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
        <img
          src={images[activeIndex]}
          alt="Zoomed"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          className="max-w-full max-h-[90vh] object-contain select-none [-webkit-user-drag:none]"
          style={{
            transform: `translate3d(${dragOffsetX}px, 0, 0) scale(${isDragging ? 0.985 : 1})`,
            transition: isDragging ? 'none' : 'transform 220ms ease',
            cursor: canSwipe ? (isDragging ? 'grabbing' : 'grab') : 'default',
          }}
        />
      </div>

        {activeIndex < images.length - 1 && (
          <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
            className="absolute right-4 sm:right-10 z-20 text-white/50 hover:text-white transition-colors bg-black/50 hover:bg-black/80 rounded-full p-3"
          type="button"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

        {images.length > 1 && (
          <>
            <div className="absolute bottom-16 left-0 right-0 z-20 flex justify-center pointer-events-none">
            <div className="rounded-full bg-black/35 px-3 py-1 text-xs text-white/70">
              左右拖动可切换图片
            </div>
          </div>
            <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2 z-20 pointer-events-none">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === activeIndex ? 'bg-white scale-125' : 'bg-white/30'}`}
              />
            ))}
          </div>
        </>
        )}
      </div>
    </div>
  );
}

function SingleImagePreview({ image, onOpen }: { image: string; onOpen: () => void }) {
  return (
    <div className="mt-3" onClick={(e) => e.stopPropagation()}>
      <img
        src={image}
        alt="Thread image"
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        className="w-full max-h-[500px] object-cover rounded-[12px] border border-gray-100 dark:border-[#333638] transition-transform hover:opacity-90 [-webkit-user-drag:none] select-none cursor-pointer"
      />
    </div>
  );
}

function ThreadImageGallery({
  images,
  onOpen,
}: {
  images: string[];
  onOpen: (index: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const draggedRef = useRef(false);
  const dragDistanceRef = useRef(0);
  const pressedIndexRef = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    setIsDragging(false);
    draggedRef.current = false;
    dragDistanceRef.current = 0;
    setStartX(e.clientX);
    setScrollLeft(container.scrollLeft);
    container.setPointerCapture(e.pointerId);
    e.stopPropagation();
  };

  const finishDrag = (container: HTMLDivElement, pointerId: number) => {
    try {
      container.releasePointerCapture(pointerId);
    } catch {}

    window.setTimeout(() => {
      setIsDragging(false);
      if (!draggedRef.current && pressedIndexRef.current !== null) {
        onOpen(pressedIndexRef.current);
      }
      pressedIndexRef.current = null;
      draggedRef.current = false;
      dragDistanceRef.current = 0;
    }, 0);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    finishDrag(e.currentTarget, e.pointerId);
    e.stopPropagation();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (!container.hasPointerCapture(e.pointerId)) return;

    const walk = e.clientX - startX;
    dragDistanceRef.current = Math.max(dragDistanceRef.current, Math.abs(walk));
    if (dragDistanceRef.current > 6) {
      draggedRef.current = true;
      setIsDragging(true);
      e.preventDefault();
      container.scrollLeft = scrollLeft - walk;
    }
    e.stopPropagation();
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    pressedIndexRef.current = null;
    draggedRef.current = false;
    dragDistanceRef.current = 0;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    e.stopPropagation();
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerMove={handlePointerMove}
      className={`mt-3 flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab snap-x snap-mandatory'}`}
      style={{ touchAction: 'pan-y', cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {images.map((img, idx) => (
        <button
          key={`${img}-${idx}`}
          type="button"
          onPointerDown={() => {
            pressedIndexRef.current = idx;
          }}
          onClick={(e) => e.preventDefault()}
          className="flex-shrink-0 snap-center rounded-[12px] border border-gray-100 dark:border-[#333638] overflow-hidden transition-transform hover:opacity-90 bg-transparent p-0"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          aria-label={`查看第 ${idx + 1} 张图片`}
        >
          <img
            src={img}
            alt={`Image ${idx + 1}`}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            className="block object-cover [-webkit-user-drag:none] select-none w-[260px] h-[260px] sm:w-[300px] sm:h-[300px]"
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          />
        </button>
      ))}
    </div>
  );
}

export default function ThreadCard({
  id,
  authorName,
  authorAvatar,
  content,
  timestamp,
  likes,
  replies,
  currentUserName,
  isLoggedIn,
  onDelete,
  imageUrl,
  onReplyClick,
  onRequireLogin,
  isReplyNode,
  replyAudience,
  reviewReplies,
}: ThreadCardProps) {
  const router = useRouter();
  const viewerName = currentUserName?.trim() ?? '';
  const canInteract = isLoggedIn ?? Boolean(viewerName);
  const imagesArray = parseImageUrls(imageUrl);

  const [isLiked, setIsLiked] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(likes);
  const [isProcessingLike, setIsProcessingLike] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null);
  const [showLocalLoginModal, setShowLocalLoginModal] = useState(false);

  const threadData: ThreadCardData = {
    id,
    authorName,
    authorAvatar,
    content,
    timestamp,
    likes,
    replies,
    imageUrl,
    replyAudience,
    reviewReplies,
  };

  const requireLogin = () => {
    if (onRequireLogin) {
      onRequireLogin();
      return;
    }

    setShowLocalLoginModal(true);
  };

  useEffect(() => {
    let mounted = true;

    if (!viewerName) {
      setIsLiked(false);
      return;
    }

    const fetchInitialLikeStatus = async () => {
      const { data } = await supabase
        .from('user_likes')
        .select('id')
        .eq('thread_id', id)
        .eq('username', viewerName)
        .maybeSingle();

      if (mounted) {
        setIsLiked(Boolean(data));
      }
    };

    fetchInitialLikeStatus();

    return () => {
      mounted = false;
    };
  }, [id, viewerName]);

  useEffect(() => {
    setCurrentLikes(likes);
  }, [likes]);

  const handleLike = async () => {
    if (!canInteract || !viewerName) {
      requireLogin();
      return;
    }

    if (isProcessingLike) return;

    const nextLiked = !isLiked;
    const likeDelta = nextLiked ? 1 : -1;

    setIsProcessingLike(true);
    setIsLiked(nextLiked);
    setCurrentLikes((prev) => Math.max(0, prev + likeDelta));

    try {
      if (nextLiked) {
        const { error } = await supabase
          .from('user_likes')
          .insert([{ thread_id: id, username: viewerName }]);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_likes')
          .delete()
          .eq('thread_id', id)
          .eq('username', viewerName);

        if (error) throw error;
      }

      const { data: thread, error: threadError } = await supabase
        .from('threads')
        .select('likes')
        .eq('id', id)
        .single();

      if (threadError) throw threadError;

      const { error: updateError } = await supabase
        .from('threads')
        .update({ likes: Math.max(0, (thread?.likes || 0) + likeDelta) })
        .eq('id', id);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('点赞通信失败', error);
      setIsLiked(!nextLiked);
      setCurrentLikes((prev) => Math.max(0, prev - likeDelta));
    } finally {
      setIsProcessingLike(false);
    }
  };

  const executeDelete = async () => {
    setIsConfirmOpen(false);

    const { error } = await supabase.from('threads').delete().eq('id', id);
    if (error) {
      alert('销毁失败，请检查雷达链路。');
      return;
    }

    onDelete?.(id);
  };

  const handleCardClick = () => {
    if (isReplyNode || zoomedIndex !== null) return;

    if (!canInteract) {
      requireLogin();
      return;
    }

    router.push(`/thread/${id}`);
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!canInteract) {
      requireLogin();
      return;
    }

    router.push(`/profile/${encodeURIComponent(authorName)}`);
  };

  const handleReplyAction = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!canInteract) {
      requireLogin();
      return;
    }

    const permission = await checkReplyPermission({
      viewerName: viewerName,
      authorName,
      content,
      replyAudience,
    });

    if (!permission.allowed) {
      alert(permission.reason || '你当前没有权限回复这条帖子。');
      return;
    }

    onReplyClick?.(threadData);
  };

  return (
    <article
      onClick={handleCardClick}
      className={`p-4 sm:p-5 transition-colors cursor-pointer ${isReplyNode ? 'pb-0' : 'border-b border-gray-200 dark:border-[#333638]'}`}
    >
      <div className="flex gap-3">
        <div
          className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
          onClick={handleProfileClick}
          title={`访问 ${authorName} 的主页`}
        >
          <div className="group-hover:opacity-80 transition-opacity">
            <Avatar name={authorName} src={authorAvatar} size="md" />
          </div>
          {isReplyNode && (
            <div className="w-[2px] flex-1 bg-gray-200 dark:bg-[#333] mt-2 mb-[-20px] rounded-full pointer-events-none" />
          )}
        </div>

        <div className="flex-1 min-w-0 pb-2">
          <div className="flex items-center justify-between mb-1">
            <span
              className="font-semibold text-[15px] text-black dark:text-[#F3F5F7] hover:underline cursor-pointer"
              onClick={handleProfileClick}
              title={`访问 ${authorName} 的主页`}
            >
              {authorName}
            </span>

            <div className="flex items-center gap-3">
              <span className="text-[14px] text-[#999999] dark:text-[#777777]">{timestamp}</span>
              {viewerName === authorName && !isReplyNode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsConfirmOpen(true);
                  }}
                  className="text-[#999999] hover:text-[#FF3040] transition-colors"
                  title="销毁帖子"
                  type="button"
                >
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

          {imagesArray.length === 1 && (
            <SingleImagePreview image={imagesArray[0]} onOpen={() => setZoomedIndex(0)} />
          )}

          {imagesArray.length > 1 && (
            <ThreadImageGallery images={imagesArray} onOpen={(index) => setZoomedIndex(index)} />
          )}

          {!isReplyNode && (
            <div className="flex items-center gap-5 mt-4 text-[#999999] dark:text-[#777777]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike();
                }}
                className={`flex items-center gap-1.5 transition-colors group ${isLiked ? 'text-[#FF3040]' : 'hover:text-[#FF3040]'}`}
                type="button"
              >
                <svg
                  className={`w-5 h-5 group-hover:scale-110 transition-transform ${isLiked ? 'fill-current' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isLiked ? (
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  )}
                </svg>
                <span className="text-[13px] font-medium mt-[2px]">{currentLikes > 0 ? currentLikes : ''}</span>
              </button>

              <button
                onClick={handleReplyAction}
                className="flex items-center gap-1.5 hover:text-black dark:hover:text-white transition-colors"
                type="button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-[13px] font-medium mt-[2px]">{replies > 0 ? replies : ''}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {isConfirmOpen && (
        <DeleteConfirmModal onConfirm={executeDelete} onCancel={() => setIsConfirmOpen(false)} />
      )}

      {zoomedIndex !== null && (
        <ImageLightbox
          images={imagesArray}
          activeIndex={zoomedIndex}
          onClose={() => setZoomedIndex(null)}
          onPrev={() => setZoomedIndex((prev) => (prev === null ? null : Math.max(0, prev - 1)))}
          onNext={() => setZoomedIndex((prev) => (prev === null ? null : Math.min(imagesArray.length - 1, prev + 1)))}
        />
      )}

      {showLocalLoginModal && <Login onClose={() => setShowLocalLoginModal(false)} />}
    </article>
  );
}
