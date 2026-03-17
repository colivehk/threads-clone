export default function ActivityScreenSkeleton() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#101010] flex justify-center relative">
      <div className="w-full max-w-[620px] border-x border-gray-200 dark:border-[#333638] min-h-screen relative pb-20 animate-pulse">
        <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#101010]/90 backdrop-blur-md px-4 pt-4 pb-3 border-b border-gray-100 dark:border-[#222]">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
            <div className="h-7 w-20 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
          </div>
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-9 w-20 rounded-xl bg-gray-200 dark:bg-[#2A2A2A]" />
            ))}
          </div>
        </header>

        <div className="px-4 py-3 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex gap-4 border-b border-gray-100 dark:border-[#222] pb-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#2A2A2A] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-4 w-24 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
                  <div className="h-3 w-10 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
                </div>
                <div className="mt-2 h-4 w-32 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
                <div className="mt-3 h-4 w-11/12 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
