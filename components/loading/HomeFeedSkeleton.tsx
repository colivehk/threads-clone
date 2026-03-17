type HomeFeedSkeletonProps = {
  showPromptPlaceholder?: boolean;
};

export default function HomeFeedSkeleton({ showPromptPlaceholder = false }: HomeFeedSkeletonProps) {
  return (
    <main className="min-h-screen bg-white dark:bg-[#101010] flex justify-center relative">
      <div className="w-full max-w-[620px] border-x border-gray-200 dark:border-[#333638] min-h-screen flex flex-col animate-pulse">
        <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#101010]/90 backdrop-blur-md border-b border-gray-100 dark:border-[#222]">
          <div className="h-[60px] flex items-center justify-center px-4">
            <div className="h-5 w-24 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
          </div>
        </header>

        {showPromptPlaceholder && <div className="border-b border-gray-100 dark:border-[#222] px-5 py-4 h-[78px] bg-gray-50/70 dark:bg-[#111111]" />}

        <div className="flex-1 px-4 py-3 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="border-b border-gray-100 dark:border-[#222] pb-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#2A2A2A] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="h-4 w-24 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
                    <div className="h-3 w-10 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="h-4 w-full rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
                    <div className="h-4 w-4/5 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
                  </div>
                  <div className="mt-4 flex gap-4">
                    <div className="h-4 w-12 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
                    <div className="h-4 w-12 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
                    <div className="h-4 w-12 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
