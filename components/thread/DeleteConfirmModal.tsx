'use client';

export default function DeleteConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      onClick={(event) => event.stopPropagation()}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
    >
      <div className="bg-white dark:bg-[#181818] w-full max-w-[320px] p-6 rounded-[20px] shadow-2xl border border-gray-200 dark:border-[#333638] transform transition-all scale-100 opacity-100">
        <h3 className="text-lg font-bold text-center text-black dark:text-white mb-2">删除帖子？</h3>
        <p className="text-sm text-center text-[#999999] dark:text-[#777777] mb-6">
          如果你删除了这条帖子，它将在云端被永久抹除，无法恢复。
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full bg-[#FF3040] hover:bg-[#E02030] text-white font-bold py-3 rounded-xl transition-colors"
            type="button"
          >
            彻底删除
          </button>
          <button
            onClick={onCancel}
            className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-[#2A2A2A] dark:hover:bg-[#333333] text-black dark:text-white font-bold py-3 rounded-xl transition-colors"
            type="button"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
