'use client';

import { useEffect, useRef, useState } from 'react';
import Avatar from './Avatar';
import { supabase } from '../lib/supabase';
import { compressImageFile } from '../lib/image-compression';
import type { ReplyAudience, ThreadReplySettings } from '@/lib/thread-types';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string, imageUrl?: string, replySettings?: ThreadReplySettings) => void | Promise<void>;
  userName: string;
  userAvatar: string;
}

const replyAudienceOptions: Array<{ value: ReplyAudience; label: string }> = [
  { value: 'everyone', label: '任何人' },
  { value: 'followers', label: '你的粉丝' },
  { value: 'following', label: '你关注的主页' },
];

function getUploadExtension(file: File): string {
  if (file.type === 'image/webp') return 'webp';
  if (file.type === 'image/jpeg') return 'jpg';
  if (file.type === 'image/png') return 'png';
  const fallback = file.name.split('.').pop()?.toLowerCase();
  return fallback || 'bin';
}

export default function CreatePostModal({ isOpen, onClose, onSubmit, userName, userAvatar }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showReplyOptions, setShowReplyOptions] = useState(false);
  const [replyAudience, setReplyAudience] = useState<ReplyAudience>('everyone');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  useEffect(() => {
    if (!isOpen) {
      setShowReplyOptions(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const mergedFiles = [...imageFiles, ...files].slice(0, 4);

    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setImageFiles(mergedFiles);
    setImagePreviews(mergedFiles.map((file) => URL.createObjectURL(file)));
  };

  const removeImage = (indexToRemove: number) => {
    if (imagePreviews[indexToRemove]) {
      URL.revokeObjectURL(imagePreviews[indexToRemove]);
    }

    setImageFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetComposer = () => {
    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setContent('');
    setImageFiles([]);
    setImagePreviews([]);
    setIsUploading(false);
    setShowReplyOptions(false);
    setReplyAudience('everyone');
  };

  const handleSubmit = async () => {
    if (!content.trim() && imageFiles.length === 0) return;

    setIsUploading(true);
    let finalImageUrls: string[] = [];

    if (imageFiles.length > 0) {
      try {
        const compressedResults = await Promise.all(
          imageFiles.map((file) =>
            compressImageFile(file, {
              maxDimension: 1920,
              quality: 0.82,
              minSizeBytes: 350 * 1024,
            }),
          ),
        );

        const uploadPromises = compressedResults.map(async ({ file }) => {
          const fileExt = getUploadExtension(file);
          const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
          const { error } = await supabase.storage.from('images').upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
          });

          if (error) throw error;
          const { data } = supabase.storage.from('images').getPublicUrl(fileName);
          return data.publicUrl;
        });

        finalImageUrls = await Promise.all(uploadPromises);
      } catch (error) {
        console.error('图片压缩/上传失败', error);
        alert('图片传输失败，请检查网络或稍后重试。');
        setIsUploading(false);
        return;
      }
    }

    const joinedUrls = finalImageUrls.length > 0 ? finalImageUrls.join(',') : undefined;
    await onSubmit(content, joinedUrls, {
      replyAudience,
      reviewReplies: false,
    });
    resetComposer();
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

            {imagePreviews.length > 0 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative flex-shrink-0 w-[120px] h-[160px] sm:w-[150px] sm:h-[200px]">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-xl border border-gray-200 dark:border-[#333638]" />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white rounded-full p-1 backdrop-blur-sm transition-colors"
                      type="button"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 sm:px-5 -mt-2 pb-2 text-[12px] text-[#777] dark:text-[#8d8d8d]">
          图片会在上传前自动压缩到更适合网页显示的大小，GIF/SVG 将保持原样。
        </div>

        <div className="p-4 sm:p-5 flex justify-between items-center relative">
          <div className="relative flex items-center gap-2">
            <button
              onClick={() => setShowReplyOptions(!showReplyOptions)}
              className="flex items-center text-[14px] font-medium text-[#999999] dark:text-[#777777] hover:text-black dark:hover:text-white transition-colors"
              type="button"
            >
              <svg className="w-[18px] h-[18px] mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="4" ry="4"></rect>
                <path d="M9 16V8m-3 3l3-3 3 3M15 8v8m-3-3l3 3 3-3"></path>
              </svg>
              回复选项
            </button>

            {showReplyOptions && (
              <>
                <div className="fixed inset-0 z-[60]" onClick={() => setShowReplyOptions(false)}></div>
                <div className="absolute bottom-[44px] left-0 z-[70] w-[260px] bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-[#333] rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.6)] py-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-5 py-2 text-[12px] font-bold text-[#999999] dark:text-[#777777] select-none">谁能回复和引用</div>
                  {replyAudienceOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setReplyAudience(option.value);
                        setShowReplyOptions(false);
                      }}
                      className="w-full text-left px-5 py-3 text-[15px] font-bold text-black dark:text-[#F3F5F7] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] flex justify-between items-center transition-colors"
                      type="button"
                    >
                      {option.label}
                      {replyAudience === option.value && (
                        <svg className="w-5 h-5 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      )}
                    </button>
                  ))}
                  <div className="h-[1px] bg-gray-200 dark:bg-[#333] my-1 mx-5"></div>
                  <button
                    onClick={() => {
                      setReplyAudience('mentioned');
                      setShowReplyOptions(false);
                    }}
                    className="w-full text-left px-5 py-3 text-[15px] font-bold text-black dark:text-[#F3F5F7] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] flex justify-between items-center transition-colors"
                    type="button"
                  >
                    你提及的主页
                    {replyAudience === 'mentioned' && (
                      <svg className="w-5 h-5 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    )}
                  </button>
                  <div className="h-[1px] bg-gray-200 dark:bg-[#333] my-1 mx-5"></div>
                  <div className="w-full px-5 py-3 flex justify-between items-center cursor-not-allowed opacity-50">
                    <span className="text-[15px] font-bold text-black dark:text-[#F3F5F7]">审核并批准回复</span>
                    <div className="w-[36px] h-[22px] bg-gray-300 dark:bg-[#444] rounded-full relative">
                      <div className="absolute left-[2px] top-[2px] w-[18px] h-[18px] bg-white dark:bg-[#888] rounded-full shadow-sm"></div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={imageFiles.length >= 4 || isUploading}
              className="text-[#999999] hover:text-black dark:hover:text-white transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#2A2A2A] disabled:opacity-30 disabled:cursor-not-allowed"
              title="添加图片 (最多4张)"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={(!content.trim() && imageFiles.length === 0) || isUploading}
            className="bg-black text-white dark:bg-white dark:text-black font-semibold px-6 py-2 rounded-full hover:opacity-80 transition-opacity disabled:opacity-40"
            type="button"
          >
            {isUploading ? '压缩并上传中...' : '发布'}
          </button>
        </div>
      </div>
    </div>
  );
}
