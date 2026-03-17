'use client';

import { useRef, useState } from 'react';

export default function ThreadImageGallery({
  images,
  onOpen,
}: {
  images: string[];
  onOpen: (index: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;

    setIsDragging(true);
    draggedRef.current = false;
    setStartX(event.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);

    try {
      (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {}
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollRef.current) return;

    event.preventDefault();
    const x = event.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;

    if (Math.abs(walk) > 5) draggedRef.current = true;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div
      ref={scrollRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerMove={handlePointerMove}
      className={`mt-3 flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab snap-x snap-mandatory'}`}
    >
      {images.map((img, index) => (
        <img
          key={`${img}-${index}`}
          src={img}
          alt={`Image ${index + 1}`}
          draggable={false}
          onDragStart={(event) => event.preventDefault()}
          onClick={(event) => {
            event.stopPropagation();
            if (draggedRef.current) return;
            onOpen(index);
          }}
          className={`flex-shrink-0 object-cover rounded-[12px] border border-gray-100 dark:border-[#333638] transition-transform hover:opacity-90 snap-center [-webkit-user-drag:none] select-none ${images.length === 1 ? 'w-full max-h-[500px]' : 'w-[260px] h-[260px] sm:w-[300px] sm:h-[300px]'}`}
        />
      ))}
    </div>
  );
}
