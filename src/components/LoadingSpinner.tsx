import React from 'react';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-6">
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
        <p className="text-slate-500 text-sm animate-pulse">Searching the web for current prices</p>
      </div>
    </div>
  );
}
