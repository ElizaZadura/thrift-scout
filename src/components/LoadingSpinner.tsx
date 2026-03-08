import React from 'react';
import { motion } from 'motion/react';
import { Search, X } from 'lucide-react';

interface LoadingSpinnerProps {
  onCancel: () => void;
}

export function LoadingSpinner({ onCancel }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="relative"
      >
        <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
        <div className="w-16 h-16 border-4 border-indigo-600 rounded-full border-t-transparent absolute top-0 left-0"></div>
        <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
          <Search size={24} />
        </div>
      </motion.div>
      <div className="text-center">
        <h3 className="text-xl font-semibold text-slate-800 mb-2">Analyzing your find...</h3>
        <p className="text-slate-500 text-sm animate-pulse mb-6">Searching the web for current prices</p>
        
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-6 py-2 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors text-sm font-medium mx-auto"
        >
          <X size={16} />
          Cancel Analysis
        </button>
      </div>
    </div>
  );
}
