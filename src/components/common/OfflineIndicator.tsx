import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/90 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-lg border border-amber-400 animate-in fade-in slide-in-from-bottom-2"
    >
      <WifiOff className="w-4 h-4 animate-pulse text-slate-950" />
      <span>Offline Mode — All 20 calculators operating offline.</span>
    </div>
  );
};
