import React, { useState } from 'react';
import { ItemEvaluation } from '../services/geminiService';
import { CheckCircle2, Search, DollarSign, Tag, ExternalLink, RefreshCw, AlertCircle, TrendingUp, Activity, ShoppingCart } from 'lucide-react';

interface EvaluationResultProps {
  evaluation: ItemEvaluation;
  groundingChunks?: any[];
  imageSrc: string;
  onReset: () => void;
}

type Condition = 'Poor' | 'OK' | 'Good' | 'Very good';

const CONDITION_MULTIPLIERS: Record<Condition, number> = {
  'Poor': 0.4,
  'OK': 0.7,
  'Good': 1.0,
  'Very good': 1.2,
};

export function EvaluationResult({ evaluation, groundingChunks, imageSrc, onReset }: EvaluationResultProps) {
  const [condition, setCondition] = useState<Condition>('Good');
  const [askingPriceStr, setAskingPriceStr] = useState<string>('');

  const askingPrice = parseFloat(askingPriceStr);
  const hasAskingPrice = !isNaN(askingPrice) && askingPrice > 0;

  // Calculate expected resale
  const multiplier = CONDITION_MULTIPLIERS[condition];
  const expectedMin = Math.round(evaluation.baseResaleValueMin * multiplier);
  const expectedMax = Math.round(evaluation.baseResaleValueMax * multiplier);
  const expectedAvg = (expectedMin + expectedMax) / 2;

  // Calculate profit and flip score
  const estimatedProfit = hasAskingPrice ? Math.round(expectedAvg - askingPrice) : null;
  
  let flipScore = 0;
  if (hasAskingPrice) {
    if (askingPrice >= expectedAvg) {
      flipScore = 0;
    } else {
      flipScore = Math.max(0, Math.min(1, 1 - (askingPrice / expectedAvg)));
    }
  }

  // Determine decision label
  let decisionLabel = "Uncertain";
  let decisionColor = "bg-slate-100 text-slate-800 border-slate-200";

  if (hasAskingPrice) {
    if (flipScore >= 0.4 && (evaluation.confidence === 'High' || evaluation.confidence === 'Medium')) {
      decisionLabel = "Likely flip";
      decisionColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
    } else if (flipScore >= 0.15) {
      decisionLabel = "Check further";
      decisionColor = "bg-amber-100 text-amber-800 border-amber-200";
    } else {
      decisionLabel = "Probably not worth it";
      decisionColor = "bg-rose-100 text-rose-800 border-rose-200";
    }
  } else {
    // If no asking price, base it on the spread and confidence
    if (evaluation.confidence === 'High' || evaluation.confidence === 'Medium') {
      decisionLabel = "Check further";
      decisionColor = "bg-amber-100 text-amber-800 border-amber-200";
    } else {
      decisionLabel = "Uncertain";
      decisionColor = "bg-slate-100 text-slate-800 border-slate-200";
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 pb-12">
      {/* Header Image & Decision Label */}
      <div className="relative w-full h-64 sm:h-80 rounded-3xl overflow-hidden shadow-md">
        <img src={imageSrc} alt="Scanned item" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-between p-6">
          <div className="flex justify-end">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border shadow-sm backdrop-blur-md ${decisionColor}`}>
              {decisionLabel}
            </div>
          </div>
          <div className="text-white">
            <h2 className="text-2xl font-bold leading-tight mb-1">{evaluation.itemName}</h2>
            <div className="flex items-center gap-2 text-sm font-medium opacity-90">
              <span className="bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm">Confidence: {evaluation.confidence}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Market Signals */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Activity size={20} className="text-indigo-500" />
          Market Signals
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-sm text-slate-500 font-medium mb-1 flex items-center gap-1">
              <ShoppingCart size={14} /> Active listings
            </p>
            <p className="text-lg font-semibold text-slate-700">{evaluation.activeListingsRange}</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
            <p className="text-sm text-emerald-600 font-medium mb-1 flex items-center gap-1">
              <DollarSign size={14} /> Recent sold prices
            </p>
            <p className="text-lg font-bold text-emerald-700">{evaluation.soldPricesRange}</p>
          </div>
        </div>
        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between">
          <span className="text-indigo-800 font-medium">Estimated bargain threshold:</span>
          <span className="font-bold text-indigo-900">{evaluation.estimatedBargainThreshold}</span>
        </div>
      </div>

      {/* Why Flagged */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <AlertCircle size={20} className="text-amber-500" />
          Why this item may be worth checking
        </h3>
        <ul className="space-y-2">
          {evaluation.whyFlagged.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-3 text-slate-600">
              <span className="mt-1.5 w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* User Input for Real Conditions */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-blue-500" />
          Calculate Profit
        </h3>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Item condition</label>
            <div className="grid grid-cols-4 gap-2">
              {(['Poor', 'OK', 'Good', 'Very good'] as Condition[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCondition(c)}
                  className={`py-2 px-1 text-xs sm:text-sm font-medium rounded-xl border transition-colors ${
                    condition === c 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Asking price ({evaluation.currency})</label>
            <input
              type="number"
              min="0"
              step="any"
              value={askingPriceStr}
              onChange={(e) => setAskingPriceStr(e.target.value)}
              placeholder="e.g. 50"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg"
            />
          </div>

          {hasAskingPrice && (
            <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Expected resale:</span>
                <span className="font-semibold text-slate-900">{expectedMin}–{expectedMax} {evaluation.currency}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Estimated profit:</span>
                <span className={`font-bold text-lg ${estimatedProfit && estimatedProfit > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {estimatedProfit && estimatedProfit > 0 ? '+' : ''}{estimatedProfit} {evaluation.currency}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Flip score (0-1):</span>
                <span className="font-semibold text-slate-900">{flipScore.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description & Key Features */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Tag size={20} className="text-indigo-500" />
          About this item
        </h3>
        <p className="text-slate-600 leading-relaxed mb-6">{evaluation.description}</p>
        
        <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-500" />
          Authenticity & Value Markers
        </h4>
        <ul className="space-y-2">
          {evaluation.keyFeatures.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3 text-slate-600 text-sm">
              <span className="mt-1.5 w-1.5 h-1.5 bg-slate-300 rounded-full flex-shrink-0" />
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
