import React from 'react';
import {
  Calculator,
  History,
  ShieldCheck,
  Sparkles,
  Search,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { clearCalcNestCachesOnly } from '../../utils/cacheManager';

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenTests: () => void;
  historyCount: number;
  isPro: boolean;
  onTogglePro: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onShowToast: (msg: { type: 'success' | 'error' | 'info'; message: string }) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHistory,
  onOpenTests,
  historyCount,
  isPro,
  onTogglePro,
  searchQuery,
  onSearchChange,
  onShowToast,
}) => {
  const handleClearCache = async () => {
    const res = await clearCalcNestCachesOnly();
    if (res.success) {
      onShowToast({
        type: 'info',
        message: `CalcNest offline caches refreshed (${res.deletedCount} scoped caches cleaned).`,
      });
    } else {
      onShowToast({
        type: 'error',
        message: res.error || 'Failed to refresh cache.',
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-lg">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div className="hidden min-[400px]:block">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                CalcNest
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-none">
              20 Calculators · Offline Ready
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative flex-1 max-w-xs md:max-w-md hidden sm:block">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search 20 calculators (e.g. EMI, BMI, Tax)..."
            aria-label="Search calculators"
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Pro Demo Mode Toggle */}
          <button
            onClick={onTogglePro}
            title={
              isPro
                ? 'CalcNest Pro Demo Active (Local demonstration only, no purchase required or implied)'
                : 'Enable CalcNest Pro Demo (Local demonstration only, no purchase required or implied)'
            }
            aria-label="Toggle Pro demo mode (Local demonstration only)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
              isPro
                ? 'bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isPro ? 'text-amber-400' : 'text-slate-400'}`} />
            <span className="hidden md:inline">{isPro ? 'Pro Demo Active' : 'Pro Demo'}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                isPro ? 'bg-emerald-400 ring-2 ring-emerald-400/40' : 'bg-slate-600'
              }`}
            />
          </button>

          {/* Test Runner Button */}
          <button
            onClick={onOpenTests}
            aria-label="Run automated regression tests"
            title="Automated Test Runner & Verification"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden lg:inline">Tests</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-1 rounded">
              34
            </span>
          </button>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            aria-label="View calculation history"
            title="Calculation History"
            className="relative p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <History className="w-4 h-4" />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950">
                {historyCount > 99 ? '99+' : historyCount}
              </span>
            )}
          </button>

          {/* Refresh CalcNest Cache */}
          <button
            onClick={handleClearCache}
            aria-label="Refresh app cache"
            title="Refresh CalcNest Offline Cache"
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 transition focus-visible:ring-2 focus-visible:ring-emerald-400 hidden sm:block"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* In-App PWA Install */}
          <PWAInstallButton variant="header" />
        </div>
      </div>

      {/* Mobile Search Bar Row */}
      <div className="p-2.5 bg-slate-950 sm:hidden border-t border-slate-800/80">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search 20 calculators..."
            aria-label="Search calculators"
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>
    </header>
  );
};
