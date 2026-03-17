export type CompressedImageResult = {
  file: File;
  originalSize: number;
  compressedSize: number;
  wasCompressed: boolean;
  skippedReason?: string;
};

type CompressionOptions = {
  maxDimension?: number;
  quality?: number;
  minSizeBytes?: number;
};

const DEFAULT_MAX_DIMENSION = 1920;
const DEFAULT_QUALITY = 0.82;
const DEFAULT_MIN_SIZE_BYTES = 350 * 1024;
const SKIP_TYPES = new Set(['image/gif', 'image/svg+xml']);

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`无法读取图片：${file.name}`));
    };
    image.src = objectUrl;
  });
}

function getScaledSize(width: number, height: number, maxDimension: number) {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height, resized: false };
  }

  if (width >= height) {
    const ratio = maxDimension / width;
    return {
      width: maxDimension,
      height: Math.round(height * ratio),
      resized: true,
    };
  }

  const ratio = maxDimension / height;
  return {
    width: Math.round(width * ratio),
    height: maxDimension,
    resized: true,
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function getOutputType(file: File): string {
  // GIF/SVG 已在上面跳过；其余统一优先转成 webp，兼顾体积与透明通道。
  if (file.type.startsWith('image/')) {
    return 'image/webp';
  }

  return file.type || 'image/webp';
}

function getFileExtension(type: string): string {
  switch (type) {
    case 'image/webp':
      return 'webp';
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    default:
      return 'bin';
  }
}

export async function compressImageFile(
  file: File,
  options: CompressionOptions = {},
): Promise<CompressedImageResult> {
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const quality = options.quality ?? DEFAULT_QUALITY;
  const minSizeBytes = options.minSizeBytes ?? DEFAULT_MIN_SIZE_BYTES;

  if (SKIP_TYPES.has(file.type)) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      wasCompressed: false,
      skippedReason: '文件类型跳过压缩',
    };
  }

  if (!file.type.startsWith('image/')) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      wasCompressed: false,
      skippedReason: '非图片文件',
    };
  }

  const image = await loadImage(file);
  const { width, height, resized } = getScaledSize(image.naturalWidth, image.naturalHeight, maxDimension);

  if (!resized && file.size <= minSizeBytes) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      wasCompressed: false,
      skippedReason: '文件已足够小',
    };
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      wasCompressed: false,
      skippedReason: '无法创建 canvas 上下文',
    };
  }

  context.drawImage(image, 0, 0, width, height);

  const outputType = getOutputType(file);
  const blob = await canvasToBlob(canvas, outputType, quality);

  if (!blob) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      wasCompressed: false,
      skippedReason: '压缩失败，已回退原图',
    };
  }

  if (blob.size >= file.size * 0.98) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      wasCompressed: false,
      skippedReason: '压缩收益不明显，已保留原图',
    };
  }

  const baseName = file.name.replace(/\.[^.]+$/, '');
  const compressedFile = new File([blob], `${baseName}.${getFileExtension(blob.type)}`, {
    type: blob.type,
    lastModified: Date.now(),
  });

  return {
    file: compressedFile,
    originalSize: file.size,
    compressedSize: compressedFile.size,
    wasCompressed: true,
  };
}
