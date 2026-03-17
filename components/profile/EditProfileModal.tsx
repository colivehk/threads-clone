'use client';

import { useEffect, useState } from 'react';
import type { UserProfile } from '@/lib/profile-types';

type EditProfileModalProps = {
  profile: UserProfile;
  onClose: () => void;
  onSave: (values: { displayName: string; bio: string; avatarUrl: string }) => Promise<void> | void;
};

export default function EditProfileModal({ profile, onClose, onSave }: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDisplayName(profile.displayName);
    setBio(profile.bio);
    setAvatarUrl(profile.avatarUrl);
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({ displayName, bio, avatarUrl });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-[460px] rounded-[24px] border border-gray-200 dark:border-[#333638] bg-white dark:bg-[#181818] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#222]">
          <button onClick={onClose} type="button" className="text-[#999999] hover:text-black dark:hover:text-white transition-colors">
            取消
          </button>
          <div className="font-bold text-[16px] text-black dark:text-white">编辑个人主页</div>
          <button type="submit" disabled={isSaving} className="text-black dark:text-white font-bold disabled:opacity-40">
            {isSaving ? '保存中' : '保存'}
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-bold text-[#777777] mb-2">显示名称</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={40}
              className="w-full rounded-[14px] border border-gray-200 dark:border-[#333638] bg-gray-50 dark:bg-[#101010] px-4 py-3 text-[15px] text-black dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#777777] mb-2">简介</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={4}
              className="w-full rounded-[14px] border border-gray-200 dark:border-[#333638] bg-gray-50 dark:bg-[#101010] px-4 py-3 text-[15px] text-black dark:text-white outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#777777] mb-2">头像 URL</label>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full rounded-[14px] border border-gray-200 dark:border-[#333638] bg-gray-50 dark:bg-[#101010] px-4 py-3 text-[15px] text-black dark:text-white outline-none"
              placeholder="留空则使用默认头像"
            />
            <div className="text-[12px] text-[#999999] mt-2">当前路由用户名固定为 @{profile.username}</div>
          </div>
        </div>
      </form>
    </div>
  );
}
