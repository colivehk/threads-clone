export default function ProfileScreenSkeleton() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#101010] flex justify-center relative">
      <div className="w-full max-w-[620px] border-x border-gray-200 dark:border-[#333638] min-h-screen relative pb-20 animate-pulse">
        <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#101010]/90 backdrop-blur-md px-4 h-[60px] flex items-center justify-between border-b border-gray-100 dark:border-[#222]">
          <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
          <div className="h-5 w-24 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
          <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
        </header>

        <div className="px-4 sm:px-6 pt-4 pb-6">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="h-7 w-40 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
              <div className="mt-3 h-4 w-24 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
            </div>
            <div className="w-[72px] h-[72px] rounded-full bg-gray-200 dark:bg-[#2A2A2A] shrink-0" />
          </div>

          <div className="mt-5 space-y-2">
            <div className="h-4 w-full rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
            <div className="h-4 w-4/5 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
          </div>

          <div className="mt-5 h-4 w-32 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="h-10 rounded-xl bg-gray-200 dark:bg-[#2A2A2A]" />
            <div className="h-10 rounded-xl bg-gray-200 dark:bg-[#2A2A2A]" />
          </div>
        </div>

        <div className="flex w-full border-b border-gray-200 dark:border-[#333] px-6">
          <div className="flex-1 py-3">
            <div className="h-4 w-14 rounded-full bg-gray-200 dark:bg-[#2A2A2A] mx-auto" />
          </div>
          <div className="flex-1 py-3">
            <div className="h-4 w-14 rounded-full bg-gray-200 dark:bg-[#2A2A2A] mx-auto" />
          </div>
        </div>

        <div className="px-4 py-3 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
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
                    <div className="h-4 w-3/4 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
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
