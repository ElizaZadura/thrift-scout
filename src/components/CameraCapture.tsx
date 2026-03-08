import React, { useRef, useState } from 'react';
import { Camera, Upload } from 'lucide-react';

interface CameraCaptureProps {
  onImageCapture: (base64: string, mimeType: string) => void;
}

export function CameraCapture({ onImageCapture }: CameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Use URL.createObjectURL instead of FileReader for better memory efficiency
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    
    img.onerror = (e) => {
      console.error("Image load error", e);
      URL.revokeObjectURL(objectUrl);
      alert("Failed to process the image. It might be corrupted or in an unsupported format.");
    };

    img.onload = () => {
      // Resize image to max 1024px width/height
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const maxDim = 1024;

      if (width > height) {
        if (width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      // Clean up the object URL
      URL.revokeObjectURL(objectUrl);

      const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const [prefix, base64] = resizedDataUrl.split(',');
      const mimeType = prefix.match(/:(.*?);/)?.[1] || 'image/jpeg';
      onImageCapture(base64, mimeType);
    };

    img.src = objectUrl;
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full max-w-md mx-auto">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex flex-col items-center justify-center gap-4 bg-indigo-600 hover:bg-indigo-700 text-white p-8 rounded-3xl shadow-lg transition-all active:scale-95"
      >
        <div className="bg-white/20 p-4 rounded-full">
          <Camera size={48} />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-1">Snap a Photo</h3>
          <p className="text-indigo-100 text-sm">Take a picture of your find</p>
        </div>
      </button>

      <div className="relative w-full flex items-center py-2">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">or</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      <button
        onClick={() => {
          if (fileInputRef.current) {
            fileInputRef.current.removeAttribute('capture');
            fileInputRef.current.click();
            // Restore capture attribute after a short delay
            setTimeout(() => {
              fileInputRef.current?.setAttribute('capture', 'environment');
            }, 1000);
          }
        }}
        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 p-4 rounded-2xl shadow-sm transition-all active:scale-95"
      >
        <Upload size={20} className="text-slate-400" />
        <span className="font-medium">Upload from Gallery</span>
      </button>
    </div>
  );
}
