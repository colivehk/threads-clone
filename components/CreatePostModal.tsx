'use client';

import { useState, useRef } from 'react';
import Avatar from './Avatar';
import { supabase } from '../lib/supabase';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string, imageUrl?: string) => void;
  userName: string;
  userAvatar: string;
}

export default function CreatePostModal({ isOpen, onClose, onSubmit, userName, userAvatar }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  // 🔴 状态升级：变成数组，支持多张图
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 🔴 选图魔法：支持多选，并限制最多 4 张
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 把新选的图加进来，限制最多 4 张（模拟 Threads 的体验）
    const newFiles = [...imageFiles, ...files].slice(0, 4);
    setImageFiles(newFiles);
    setImagePreviews(newFiles.map(file => URL.createObjectURL(file)));
  };

  const removeImage = (indexToRemove: number) => {
    setImageFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setImagePreviews(prev => prev.filter((_, idx) => idx !== indexToRemove));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 🔴 并发上传魔法：Promise.all 同时上传多张图
  const handleSubmit = async () => {
    if (!content.trim() && imageFiles.length === 0) return; 
    setIsUploading(true);
    let finalImageUrls: string[] = [];

    if (imageFiles.length > 0) {
      // 创建多个并发的上传任务
      const uploadPromises = imageFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const { error } = await supabase.storage.from('images').upload(fileName, file);
        if (error) throw error;
        const { data } = supabase.storage.from('images').getPublicUrl(fileName);
        return data.publicUrl; // 返回这张图的独立链接
      });

      try {
        // 等待所有图片上传完毕
        finalImageUrls = await Promise.all(uploadPromises);
      } catch (error) {
        alert('图片传输失败，请检查雷达链路。');
        setIsUploading(false);
        return;
      }
    }

    // 🔴 核心技巧：把所有链接用【逗号】拼接成一个字符串，传给总部！
    const joinedUrls = finalImageUrls.length > 0 ? finalImageUrls.join(',') : undefined;
    onSubmit(content, joinedUrls);

    setContent('');
    setImageFiles([]);
    setImagePreviews([]);
    setIsUploading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:items-start sm:pt-[10vh] bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-[#181818] w-full sm:w-[620px] h-full sm:h-auto sm:min-h-[300px] sm:rounded-[16px] flex flex-col sm:border border-[#E5E5E5] dark:border-[#333638] shadow-2xl relative overflow-hidden">
        
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-[#E5E5E5] dark:border-[#333638]">
          <button onClick={onClose} className="text-[15px] text-black dark:text-white font-medium hover:opacity-70 transition-opacity">取消</button>
          <div className="font-bold text-[16px] text-black dark:text-white">新帖子</div>
          <div className="w-8"></div>
        </div>

        <div className="p-5 sm:p-6 flex gap-3 sm:gap-4 flex-1 overflow-y-auto">
          <div className="flex-shrink-0 flex flex-col items-center">
            <Avatar name={userName} src={userAvatar} size="md" />
            <div className="w-[2px] h-full bg-[#E5E5E5] dark:bg-[#333638] mt-3 rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0 pt-1 pb-4">
            <div className="font-bold text-[15px] text-black dark:text-[#F3F5F7] mb-1">{userName}</div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="开始写帖子..."
              className="w-full bg-transparent text-[15px] text-black dark:text-[#F3F5F7] placeholder-[#999999] dark:placeholder-[#777777] resize-none outline-none overflow-hidden min-h-[60px]"
              autoFocus
            />
            
            {/* 🔴 图片预览区：横向滚动展示多图 */}
            {imagePreviews.length > 0 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative flex-shrink-0 w-[120px] h-[160px] sm:w-[150px] sm:h-[200px]">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-xl border border-gray-200 dark:border-[#333638]" />
                    <button 
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white rounded-full p-1 backdrop-blur-sm transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-[#999999] dark:text-[#777777]">任何人都可以回复</span>
            
            {/* 🔴 注意这里的 multiple 属性，允许同时选多张图！ */}
            <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={imageFiles.length >= 4}
              className="text-[#999999] hover:text-black dark:hover:text-white transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#2A2A2A] disabled:opacity-30 disabled:cursor-not-allowed"
              title="添加图片 (最多4张)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={(!content.trim() && imageFiles.length === 0) || isUploading}
            className="bg-black text-white dark:bg-white dark:text-black font-semibold px-6 py-2 rounded-full hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {isUploading ? '发射中...' : '发布'}
          </button>
        </div>

      </div>
    </div>
  );
}