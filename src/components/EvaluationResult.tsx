import React from 'react';
import { ItemEvaluation } from '../services/geminiService';
import { CheckCircle2, Search, DollarSign, Tag, ExternalLink, RefreshCw } from 'lucide-react';

interface EvaluationResultProps {
  evaluation: ItemEvaluation;
  groundingChunks?: any[];
  imageSrc: string;
  onReset: () => void;
}

export function EvaluationResult({ evaluation, groundingChunks, imageSrc, onReset }: EvaluationResultProps) {
  const getResaleColor = (potential: string) => {
    switch (potential.toLowerCase()) {
      case 'high': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 pb-12">
      {/* Header Image */}
      <div className="relative w-full h-64 sm:h-80 rounded-3xl overflow-hidden shadow-md">
        <img src={imageSrc} alt="Scanned item" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
          <div className="text-white">
            <h2 className="text-2xl font-bold leading-tight mb-1">{evaluation.itemName}</h2>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getResaleColor(evaluation.resalePotential)}`}>
              {evaluation.resalePotential} Resale Potential
            </div>
          </div>
        </div>
      </div>

      {/* Value Estimate */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Estimated Value</p>
            <p className="text-2xl font-bold text-slate-900">{evaluation.estimatedValueRange}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Tag size={20} className="text-indigo-500" />
          About this item
        </h3>
        <p className="text-slate-600 leading-relaxed">{evaluation.description}</p>
      </div>

      {/* Key Features */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle2 size={20} className="text-emerald-500" />
          What to look for
        </h3>
        <ul className="space-y-3">
          {evaluation.keyFeatures.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3 text-slate-600">
              <span className="mt-1 w-1.5 h-1.5 bg-emerald-400 rounded-full flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Search Grounding */}
      {groundingChunks && groundingChunks.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Search size={20} className="text-blue-500" />
            Web References
          </h3>
          <div className="space-y-3">
            {groundingChunks.map((chunk, idx) => {
              if (chunk.web?.uri) {
                return (
                  <a
                    key={idx}
                    href={chunk.web.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors group"
                  >
                    <span className="text-sm font-medium text-slate-700 truncate mr-4">
                      {chunk.web.title || chunk.web.uri}
                    </span>
                    <ExternalLink size={16} className="text-slate-400 group-hover:text-blue-500 flex-shrink-0" />
                  </a>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <button
        onClick={onReset}
        className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-2xl shadow-md transition-all active:scale-95 font-medium"
      >
        <RefreshCw size={20} />
        Scan Another Item
      </button>
    </div>
  );
}
