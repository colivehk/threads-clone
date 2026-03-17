'use client';

export default function ThreadActionBar({
  isLiked,
  likes,
  replies,
  onLike,
  onReply,
}: {
  isLiked: boolean;
  likes: number;
  replies: number;
  onLike: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onReply: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <div className="flex items-center gap-5 mt-4 text-[#999999] dark:text-[#777777]">
      <button
        onClick={onLike}
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
        <span className="text-[13px] font-medium mt-[2px]">{likes > 0 ? likes : ''}</span>
      </button>

      <button
        onClick={onReply}
        className="flex items-center gap-1.5 hover:text-black dark:hover:text-white transition-colors"
        type="button"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="text-[13px] font-medium mt-[2px]">{replies > 0 ? replies : ''}</span>
      </button>
    </div>
  );
}
