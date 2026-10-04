import React, { useRef, useState } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';

interface PWAInstallButtonProps {
  variant?: 'header' | 'compact' | 'drawer';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogAccessibility(dialogRef, showIOSGuide, () => setShowIOSGuide(false));

  // If already installed in standalone mode, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        aria-label="Install CalcNest App"
        className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:from-emerald-600 hover:to-teal-700 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
          variant === 'drawer' ? 'w-full justify-center py-2.5 text-sm' : ''
        }`}
      >
        <Download className="w-4 h-4" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          aria-label="Install on iOS"
          className={`flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-900/50 transition-all focus-visible:ring-2 focus-visible:ring-emerald-400 ${
            variant === 'drawer' ? 'w-full justify-center py-2.5 text-sm' : ''
          }`}
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-guide-title"
            tabIndex={-1}
            ref={dialogRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in"
          >
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 id="ios-guide-title" className="text-base font-bold text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-emerald-400" />
                  Install CalcNest on iOS
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close"
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 text-emerald-400 shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">1. Tap Share</span>
                    <p className="text-slate-400 mt-0.5">In Safari browser, tap the Share icon at the bottom of the screen.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 text-emerald-400 shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">2. Add to Home Screen</span>
                    <p className="text-slate-400 mt-0.5">Scroll down the menu list and tap &quot;Add to Home Screen&quot;.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-[11px] leading-relaxed">
                  ✓ Launches full screen without browser toolbars<br />
                  ✓ Works 100% offline with zero load delay
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-white transition focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
