export default function SearchLoading() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#101010] flex justify-center">
      <div className="w-full max-w-[620px] border-x border-gray-200 dark:border-[#333638] min-h-screen animate-pulse px-4 pt-4 pb-6">
        <div className="h-8 w-20 rounded bg-gray-100 dark:bg-[#1C1C1C] mb-3 ml-2" />
        <div className="h-11 w-full rounded-[12px] bg-gray-100 dark:bg-[#1C1C1C] mb-6" />
        <div className="space-y-5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1C1C1C]" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-28 rounded bg-gray-100 dark:bg-[#1C1C1C]" />
                  <div className="h-4 w-32 rounded bg-gray-100 dark:bg-[#1C1C1C]" />
                </div>
              </div>
              <div className="w-20 h-9 rounded-lg bg-gray-100 dark:bg-[#1C1C1C]" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
