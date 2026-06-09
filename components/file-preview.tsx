'use client';

import { File, Image as ImageIcon, Video, FileText, Music } from 'lucide-react';

type Props = {
  url: string;
  fieldType: string;
  className?: string;
};

export function FilePreview({ url, fieldType, className = '' }: Props) {
  const isImage = fieldType === 'Image';
  const isVideo = url.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i);
  const isPdf = url.match(/\.pdf$/i);
  const isAudio = url.match(/\.(mp3|wav|ogg|m4a)$/i);
  const isImageFile = url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i);

  if ((isImage || isImageFile) && fieldType === 'Image') {
    return (
      <div className={`relative ${className}`}>
        <img
          src={url}
          alt="Preview"
          className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-80"
          onClick={() => window.open(url, '_blank')}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  if (isImageFile && fieldType === 'File') {
    return (
      <div className={`relative ${className}`}>
        <img
          src={url}
          alt="Preview"
          className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-80"
          onClick={() => window.open(url, '_blank')}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Video className="w-5 h-5 text-muted-foreground" />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline truncate max-w-xs"
        >
          {url.split('/').pop()}
        </a>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <FileText className="w-5 h-5 text-red-600" />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline truncate max-w-xs"
          title="Click to view PDF"
        >
          {url.split('/').pop()}
        </a>
        <button
          onClick={() => window.open(url, '_blank')}
          className="ml-1 p-1 hover:bg-muted rounded"
          title="Open in new tab"
        >
          <FileText className="w-4 h-4 text-blue-600" />
        </button>
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Music className="w-5 h-5 text-muted-foreground" />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline truncate max-w-xs"
        >
          {url.split('/').pop()}
        </a>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <File className="w-5 h-5 text-muted-foreground" />
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 hover:underline truncate max-w-xs"
      >
        {url.split('/').pop()}
      </a>
    </div>
  );
}
