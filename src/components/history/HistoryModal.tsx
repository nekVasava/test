import React, { useState } from 'react';
import { History, Download, Trash2, X, RotateCcw, Search, Sparkles, AlertCircle } from 'lucide-react';
import { HistoryEntry } from '../../types';
import { clearHistory, deleteHistoryEntry, FREE_TIER_HISTORY_LIMIT } from '../../utils/storage';
import { buildCsv, downloadCsv } from '../../utils/csv';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onSelectEntry: (entry: HistoryEntry) => void;
  onRefreshHistory: () => void;
  isPro: boolean;
  onShowToast: (msg: { type: 'success' | 'error' | 'info'; message: string }) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectEntry,
  onRefreshHistory,
  isPro,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.calculatorName.toLowerCase().includes(term) ||
      item.summary.toLowerCase().includes(term)
    );
  });

  const handleExportCsv = () => {
    if (history.length === 0) {
      onShowToast({ type: 'info', message: 'No history records to export.' });
      return;
    }

    try {
      const headers = ['Timestamp', 'Calculator', 'Summary', 'Inputs (JSON)'];
      const rows = history.map((item) => [
        new Date(item.timestamp).toISOString(),
        item.calculatorName,
        item.summary,
        JSON.stringify(item.inputs),
      ]);

      const csvContent = buildCsv(headers, rows);
      const filename = `calcnest_history_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCsv(filename, csvContent);
      onShowToast({ type: 'success', message: 'History exported safely (formula-injection protected).' });
    } catch (err) {
      onShowToast({
        type: 'error',
        message: `Failed to export CSV: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = deleteHistoryEntry(id);
    if (res.success) {
      onRefreshHistory();
      onShowToast({ type: 'info', message: 'Entry removed from history.' });
    } else {
      onShowToast({ type: 'error', message: res.error || 'Failed to delete entry.' });
    }
  };

  const handleClearAll = () => {
    const res = clearHistory();
    if (res.success) {
      onRefreshHistory();
      setConfirmClear(false);
      onShowToast({ type: 'info', message: 'All calculation history cleared.' });
    } else {
      onShowToast({ type: 'error', message: res.error || 'Failed to clear history.' });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
    >
      <div className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 id="history-modal-title" className="text-base sm:text-lg font-bold text-white">
                Calculation History
              </h2>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>
                  {history.length} {isPro ? 'saved entries (Pro unlimited)' : `/ ${FREE_TIER_HISTORY_LIMIT} entries (Free Tier)`}
                </span>
                {isPro ? (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-medium">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-400" /> Pro Demo
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">(Oldest pruned beyond 50)</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close history modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-3 sm:p-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap gap-2 items-center justify-between shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search past calculations..."
              aria-label="Search calculations"
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              disabled={history.length === 0}
              aria-label="Export history to CSV"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-slate-200 transition focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>

            {confirmClear ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleClearAll}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white transition focus-visible:ring-2 focus-visible:ring-rose-400"
                >
                  Confirm Clear
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                disabled={history.length === 0}
                aria-label="Clear all history"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-900/40 bg-rose-950/20 text-rose-300 hover:bg-rose-900/30 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-800/40">
          {filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <History className="w-10 h-10 mx-auto text-slate-600 stroke-[1.5]" />
              <p className="text-sm font-medium text-slate-400">No calculation history found</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Tap a calculator's bookmark icon to save its result here for one-tap restore and export.
              </p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectEntry(item);
                  onClose();
                }}
                className="pt-2.5 first:pt-0 group flex items-start justify-between gap-3 p-3 rounded-xl hover:bg-slate-800/70 cursor-pointer transition border border-transparent hover:border-slate-700"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-emerald-400">
                      {item.calculatorName}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' · '}
                      {new Date(item.timestamp).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-200 line-clamp-2">
                    {item.summary}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100">
                  <span
                    title="Load into calculator"
                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </span>
                  <button
                    onClick={(e) => handleDeleteItem(item.id, e)}
                    aria-label="Delete entry"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Tap any entry to reload its values into the calculator.</span>
          </div>
          <span className="text-slate-500">Safe offline storage</span>
        </div>
      </div>
    </div>
  );
};
