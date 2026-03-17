export default function SearchScreenSkeleton() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#101010] flex justify-center relative">
      <div className="w-full max-w-[620px] border-x border-gray-200 dark:border-[#333638] min-h-screen relative pb-24 animate-pulse">
        <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#101010]/90 backdrop-blur-md px-4 pt-4 pb-3 border-b border-gray-100 dark:border-[#222]">
          <div className="h-7 w-20 rounded-full bg-gray-200 dark:bg-[#2A2A2A] mb-4 ml-2" />
          <div className="h-11 rounded-[12px] bg-gray-200 dark:bg-[#2A2A2A]" />
        </header>

        <div className="px-4 py-3 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-4 border-b border-gray-100 dark:border-[#222] px-2 py-3">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#2A2A2A] shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="h-4 w-28 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
                  <div className="mt-2 h-3 w-20 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
                  <div className="mt-2 h-3 w-16 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
                </div>
              </div>
              <div className="h-9 w-20 rounded-xl bg-gray-200 dark:bg-[#2A2A2A]" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
