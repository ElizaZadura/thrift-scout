import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, X } from 'lucide-react';

interface CameraCaptureProps {
  onImageCapture: (base64: string, mimeType: string) => void;
}

export function CameraCapture({ onImageCapture }: CameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showLiveCamera, setShowLiveCamera] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showLiveCamera]);

  const startLiveCamera = async () => {
    setShowLiveCamera(true);
    setIsCameraReady(false);

    try {
      // Very low res stream for maximum stability
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setIsCameraReady(true);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setShowLiveCamera(false);
      alert("Could not access camera. Try the gallery upload.");
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !isCameraReady) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    
    // Standard resolution for desktop/stable environments
    const targetWidth = 800;
    const targetHeight = (video.videoHeight / video.videoWidth) * targetWidth;
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      
      canvas.toBlob((blob) => {
        if (!blob) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = (reader.result as string).split(',')[1];
          
          // Stop stream
          if (video.srcObject) {
            const stream = video.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
          }
          
          onImageCapture(base64data, 'image/jpeg');
        };
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.85);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      const maxDim = 1024; // Higher res for computer
      let width = bitmap.width;
      let height = bitmap.height;

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
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bitmap, 0, 0, width, height);
      }
      bitmap.close();

      canvas.toBlob((blob) => {
        if (!blob) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = (reader.result as string).split(',')[1];
          onImageCapture(base64data, 'image/jpeg');
        };
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.85);
    } catch (e) {
      alert("Error processing image. Please try a different file.");
    }
  };

  if (showLiveCamera) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-2xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute top-6 left-6">
            <button 
              onClick={() => setShowLiveCamera(false)} 
              className="bg-black/40 backdrop-blur-md p-3 rounded-full text-white hover:bg-black/60 transition-all"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Viewfinder Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-3/4 h-3/4 border border-white/20 rounded-2xl flex items-center justify-center">
              <div className="w-8 h-8 border-t-2 border-l-2 border-white/40 absolute top-0 left-0 rounded-tl-lg"></div>
              <div className="w-8 h-8 border-t-2 border-r-2 border-white/40 absolute top-0 right-0 rounded-tr-lg"></div>
              <div className="w-8 h-8 border-b-2 border-l-2 border-white/40 absolute bottom-0 left-0 rounded-bl-lg"></div>
              <div className="w-8 h-8 border-b-2 border-r-2 border-white/40 absolute bottom-0 right-0 rounded-br-lg"></div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <button 
            onClick={captureFrame} 
            disabled={!isCameraReady}
            className={`w-20 h-20 rounded-full border-4 border-white p-1 transition-all active:scale-90 shadow-xl ${!isCameraReady ? 'opacity-50 grayscale' : 'opacity-100'}`}
          >
            <div className="w-full h-full bg-white rounded-full"></div>
          </button>
          <p className="text-white/60 text-xs font-bold tracking-widest uppercase">Capture Item</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
      
      <button 
        onClick={startLiveCamera} 
        className="group relative overflow-hidden bg-indigo-600 text-white p-8 rounded-3xl font-bold transition-all hover:bg-indigo-700 active:scale-95 shadow-xl shadow-indigo-200"
      >
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="bg-white/20 p-4 rounded-full group-hover:scale-110 transition-transform">
            <Camera size={32} />
          </div>
          <div className="text-center">
            <span className="block text-xl">Live Camera</span>
            <span className="text-indigo-200 text-xs font-normal">Use your webcam or phone camera</span>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
      </button>

      <button 
        onClick={() => fileInputRef.current?.click()} 
        className="flex items-center justify-center gap-3 bg-white border border-slate-200 p-5 rounded-2xl font-semibold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
      >
        <Upload size={20} className="text-slate-400" />
        <span>Upload from Gallery</span>
      </button>
    </div>
  );
}
