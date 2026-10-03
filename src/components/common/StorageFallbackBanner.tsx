import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useStorageFallback } from '../../hooks/useStorageFallback';

export const StorageFallbackBanner: React.FC = () => {
  const isFallback = useStorageFallback();
  const [dismissed, setDismissed] = useState(false);

  if (!isFallback || dismissed) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-16 left-4 z-50 flex items-center gap-2.5 max-w-sm rounded-xl bg-amber-500/95 backdrop-blur-md px-3.5 py-2.5 text-xs font-medium text-slate-950 shadow-xl border border-amber-300 animate-in fade-in slide-in-from-bottom-2"
    >
      <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />
      <span className="flex-1 leading-tight">
        <strong>Session Only:</strong> Local storage is unavailable. Calculations won't persist after closing.
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss storage warning"
        className="p-1 -mr-1 rounded-lg hover:bg-amber-600/30 transition-colors text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
