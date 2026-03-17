export default function RootLoading() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#101010] flex justify-center">
      <div className="w-full max-w-[620px] border-x border-gray-200 dark:border-[#333638] min-h-screen animate-pulse px-4 py-6">
        <div className="h-8 w-24 rounded bg-gray-100 dark:bg-[#1C1C1C] mb-6" />
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1C1C1C]" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-24 rounded bg-gray-100 dark:bg-[#1C1C1C]" />
                <div className="h-4 w-full rounded bg-gray-100 dark:bg-[#1C1C1C]" />
                <div className="h-4 w-2/3 rounded bg-gray-100 dark:bg-[#1C1C1C]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
