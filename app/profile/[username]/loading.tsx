export default function ProfileLoading() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#101010] flex justify-center">
      <div className="w-full max-w-[620px] border-x border-gray-200 dark:border-[#333638] min-h-screen animate-pulse">
        <div className="h-[60px] border-b border-transparent px-4 flex items-center justify-between">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1C1C1C]" />
          <div className="h-4 w-20 rounded bg-gray-100 dark:bg-[#1C1C1C]" />
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1C1C1C]" />
        </div>
        <div className="px-4 sm:px-6 pt-4 pb-6">
          <div className="flex justify-between items-center">
            <div className="space-y-3">
              <div className="h-7 w-36 rounded bg-gray-100 dark:bg-[#1C1C1C]" />
              <div className="h-4 w-24 rounded bg-gray-100 dark:bg-[#1C1C1C]" />
            </div>
            <div className="w-[72px] h-[72px] rounded-full bg-gray-100 dark:bg-[#1C1C1C]" />
          </div>
          <div className="mt-4 h-4 w-2/3 rounded bg-gray-100 dark:bg-[#1C1C1C]" />
          <div className="mt-3 h-4 w-32 rounded bg-gray-100 dark:bg-[#1C1C1C]" />
        </div>
      </div>
    </main>
  );
}
