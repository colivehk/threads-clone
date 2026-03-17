'use client';

export default function ImageLightbox({
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
  return (
    <div
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/95 backdrop-blur-md px-4 select-none"
    >
      <button
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className="absolute top-6 right-6 z-10 text-white/50 hover:text-white transition-colors bg-black/20 rounded-full p-2"
        type="button"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {activeIndex > 0 && (
        <button
          onClick={(event) => {
            event.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 sm:left-10 z-10 text-white/50 hover:text-white transition-colors bg-black/50 hover:bg-black/80 rounded-full p-3"
          type="button"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <img
        src={images[activeIndex]}
        alt="Zoomed"
        draggable={false}
        onDragStart={(event) => event.preventDefault()}
        onClick={(event) => event.stopPropagation()}
        className="relative z-0 max-w-full max-h-[90vh] object-contain transition-all duration-300 [-webkit-user-drag:none] select-none cursor-default"
      />

      {activeIndex < images.length - 1 && (
        <button
          onClick={(event) => {
            event.stopPropagation();
            onNext();
          }}
          className="absolute right-4 sm:right-10 z-10 text-white/50 hover:text-white transition-colors bg-black/50 hover:bg-black/80 rounded-full p-3"
          type="button"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2 z-10 pointer-events-none">
          {images.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${index === activeIndex ? 'bg-white scale-125' : 'bg-white/30'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
