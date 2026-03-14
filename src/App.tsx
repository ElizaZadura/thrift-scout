import React, { useState } from 'react';
import { CameraCapture } from './components/CameraCapture';
import { EvaluationResult } from './components/EvaluationResult';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ItemEvaluation, evaluateItem } from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { ScanSearch } from 'lucide-react';

type AppState = 'idle' | 'analyzing' | 'result' | 'error';

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [evaluation, setEvaluation] = useState<ItemEvaluation | null>(null);
  const [groundingChunks, setGroundingChunks] = useState<any[]>([]);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);

  // Check if we already have a key selected
  React.useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setNeedsKey(!hasKey);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setNeedsKey(false);
      setAppState('idle');
      setErrorMsg(null);
    } else {
      alert("To select an API key, please use this app inside the AI Studio preview window.");
    }
  };

  // Cleanup Blob URLs to prevent memory leaks
  React.useEffect(() => {
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  // Debugging state transitions and global errors
  React.useEffect(() => {
    console.log(`App state changed to: ${appState}`);
    
    // Crash detection: check if we were processing before a reload
    const wasProcessing = localStorage.getItem('thrift_scout_processing');
    if (wasProcessing === 'true') {
      localStorage.removeItem('thrift_scout_processing');
      setErrorMsg("The app seems to have restarted during analysis. This usually happens if the photo was too large for your phone's memory. Try taking the photo from further away or use a lower resolution setting.");
      setAppState('error');
    }

    const handleError = (event: ErrorEvent | PromiseRejectionEvent) => {
      console.error("Global error caught:", event);
      const message = (event as ErrorEvent).message || "An unexpected error occurred.";
      setErrorMsg(`System Error: ${message}`);
      setAppState('error');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, [appState]);

  const handleImageCapture = async (base64: string, mimeType: string) => {
    console.log("Image captured, starting analysis...");
    localStorage.setItem('thrift_scout_processing', 'true');
    setAppState('analyzing');
    setErrorMsg(null);

    try {
      console.log("Calling evaluateItem...");
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Analysis timed out. The connection might be slow or the image was too large.")), 60000)
      );

      // Race the evaluation against the timeout
      const result = await Promise.race([
        evaluateItem(base64, mimeType),
        timeoutPromise
      ]) as { evaluation: ItemEvaluation, groundingChunks?: any[] };
      
      localStorage.removeItem('thrift_scout_processing');
      // Check if we are still in the analyzing state (user hasn't cancelled)
      setAppState(current => {
        if (current === 'analyzing') {
          console.log("Evaluation successful:", result);
          
          // Convert base64 back to a Blob for memory-efficient preview
          try {
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });
            const blobUrl = URL.createObjectURL(blob);
            setImageSrc(blobUrl);
          } catch (e) {
            console.error("Error creating blob URL", e);
            // Fallback to data URL if blob fails
            setImageSrc(`data:${mimeType};base64,${base64}`);
          }

          setEvaluation(result.evaluation);
          setGroundingChunks(result.groundingChunks || []);
          return 'result';
        }
        return current;
      });
    } catch (error) {
      console.error("Evaluation failed in App.tsx:", error);
      const message = error instanceof Error ? error.message : "Failed to evaluate the item.";
      
      if (message.includes("API_KEY_INVALID") || message.includes("API key not valid")) {
        setNeedsKey(true);
        setErrorMsg("Your API key is missing or invalid. Please click the button below to connect your Google Cloud project.");
      } else {
        setErrorMsg(message);
      }
      
      setAppState('error');
    }
  };

  const handleReset = () => {
    setAppState('idle');
    setEvaluation(null);
    setImageSrc(null);
    setGroundingChunks([]);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-6 py-4 flex items-center gap-3 shadow-sm">
        <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-sm">
          <ScanSearch size={24} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Thrift Scout</h1>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {appState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="text-center mb-10 max-w-md">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">What did you find?</h2>
                <p className="text-slate-600 leading-relaxed">
                  Snap a photo of an interesting item at a thrift store, flea market, or garage sale. We'll identify it and estimate its resale value.
                </p>
              </div>
              <CameraCapture onImageCapture={handleImageCapture} />
            </motion.div>
          )}

          {appState === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <LoadingSpinner onCancel={handleReset} />
            </motion.div>
          )}

          {appState === 'result' && evaluation && imageSrc && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <EvaluationResult
                evaluation={evaluation}
                groundingChunks={groundingChunks}
                imageSrc={imageSrc}
                onReset={handleReset}
              />
            </motion.div>
          )}

          {appState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto"
            >
              <div className="bg-rose-100 text-rose-600 p-4 rounded-full mb-6">
                <ScanSearch size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Oops, something went wrong</h2>
              <p className="text-slate-600 mb-8">{errorMsg}</p>
              
              <div className="flex flex-col gap-3 w-full">
                {needsKey ? (
                  <button
                    onClick={handleSelectKey}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl shadow-md transition-all active:scale-95 font-medium"
                  >
                    Connect to Gemini
                  </button>
                ) : (
                  <button
                    onClick={handleReset}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-2xl shadow-md transition-all active:scale-95 font-medium"
                  >
                    Try Again
                  </button>
                )}
                
                {needsKey && (
                  <p className="text-xs text-slate-400 mt-2">
                    Note: You must use a paid Google Cloud project key for Gemini 3 models.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
