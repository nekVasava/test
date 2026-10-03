/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Landmark,
  TrendingUp,
  Home,
  Receipt,
  Tag,
  Coins,
  Activity,
  Flame,
  HeartPulse,
  Droplet,
  Calendar,
  Percent,
  Calculator,
  Clock,
  GraduationCap,
  ArrowLeftRight,
  Thermometer,
  Fuel,
  Wifi,
  Binary,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ALL_CALCULATORS } from './services/calculatorList';
import { CalculatorCategory, HistoryEntry } from './types';
import {
  getHistory,
  addHistoryEntry,
  isProDemoActive,
  setProDemoActive,
} from './utils/storage';
import { parseShareUrl } from './utils/urlSharing';
import { Header } from './components/common/Header';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { StorageFallbackBanner } from './components/common/StorageFallbackBanner';
import { AriaLiveRegion } from './components/common/AriaLiveRegion';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { HistoryModal } from './components/history/HistoryModal';
import { TestRunnerModal } from './components/tests/TestRunnerModal';

// Calculator Component Views
import {
  EmiCalculatorView,
  CompoundInterestCalculatorView,
  MortgageCalculatorView,
  TipCalculatorView,
  DiscountCalculatorView,
  CurrencyCalculatorView,
} from './components/calculators/FinancialCalculators';
import {
  BmiCalculatorView,
  BmrCalculatorView,
  BodyFatCalculatorView,
  WaterCalculatorView,
} from './components/calculators/HealthCalculators';
import {
  AgeCalculatorView,
  PercentageCalculatorView,
  ScientificCalculatorView,
  TimeCalculatorView,
  GpaCalculatorView,
} from './components/calculators/MathCalculators';
import {
  UnitCalculatorView,
  TemperatureCalculatorView,
  FuelCalculatorView,
  DataTransferCalculatorView,
  NumberBaseCalculatorView,
} from './components/calculators/ConversionCalculators';

const ICON_MAP: Record<string, React.ReactNode> = {
  Landmark: <Landmark className="w-4 h-4" />,
  TrendingUp: <TrendingUp className="w-4 h-4" />,
  Home: <Home className="w-4 h-4" />,
  Receipt: <Receipt className="w-4 h-4" />,
  Tag: <Tag className="w-4 h-4" />,
  Coins: <Coins className="w-4 h-4" />,
  Activity: <Activity className="w-4 h-4" />,
  Flame: <Flame className="w-4 h-4" />,
  HeartPulse: <HeartPulse className="w-4 h-4" />,
  Droplet: <Droplet className="w-4 h-4" />,
  Calendar: <Calendar className="w-4 h-4" />,
  Percent: <Percent className="w-4 h-4" />,
  Calculator: <Calculator className="w-4 h-4" />,
  Clock: <Clock className="w-4 h-4" />,
  GraduationCap: <GraduationCap className="w-4 h-4" />,
  ArrowLeftRight: <ArrowLeftRight className="w-4 h-4" />,
  Thermometer: <Thermometer className="w-4 h-4" />,
  Fuel: <Fuel className="w-4 h-4" />,
  Wifi: <Wifi className="w-4 h-4" />,
  Binary: <Binary className="w-4 h-4" />,
};

export default function App() {
  const [selectedCalcId, setSelectedCalcId] = useState<string>('emi');
  const [activeCategory, setActiveCategory] = useState<CalculatorCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTestRunnerOpen, setIsTestRunnerOpen] = useState(false);
  const [screenReaderAnnouncement, setScreenReaderAnnouncement] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [initialInputs, setInitialInputs] = useState<Record<string, string>>({});

  // Initialize data and check URL parameters on launch
  useEffect(() => {
    // 1. Check Pro Demo mode
    setIsPro(isProDemoActive());

    // 2. Load History safely
    const histRes = getHistory();
    if (histRes.success && histRes.data) {
      setHistory(histRes.data);
    } else if (histRes.error) {
      showToast({ type: 'warning', message: histRes.error });
    }

    // 3. Deep Linking via URL Sharing
    const { calculatorId, inputs } = parseShareUrl();
    if (calculatorId && ALL_CALCULATORS.some((c) => c.id === calculatorId)) {
      setSelectedCalcId(calculatorId);
      setInitialInputs(inputs);
      showToast({ type: 'info', message: `Restored ${calculatorId.toUpperCase()} from shared link.` });
    }
  }, []);

  const showToast = (toast: { type: 'success' | 'warning' | 'error' | 'info'; title?: string; message: string }) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleTogglePro = () => {
    const nextState = !isPro;
    const res = setProDemoActive(nextState);
    if (res.success) {
      setIsPro(nextState);
      showToast({
        type: nextState ? 'success' : 'info',
        title: nextState ? 'CalcNest Pro Demo Active' : 'Free Tier Active',
        message: nextState
          ? 'Unlocked unlimited history and advanced exports (local demo mode).'
          : 'Reverted to Free Tier (50 calculation history limit).',
      });
    }
  };

  const handleSaveHistory = (
    calcId: string,
    calculatorName: string,
    inputs: Record<string, string | number>,
    summary: string
  ) => {
    const res = addHistoryEntry({
      calculatorId: calcId,
      calculatorName,
      inputs,
      summary,
    });

    if (res.success && res.data) {
      setHistory(res.data);
      showToast({ type: 'success', message: 'Calculation saved to history.' });
    } else {
      showToast({ type: 'error', message: res.error || 'Failed to save calculation.' });
    }
  };

  const handleSelectHistoryEntry = (entry: HistoryEntry) => {
    setSelectedCalcId(entry.calculatorId);
    // Convert inputs to string record for view initialization
    const strInputs: Record<string, string> = {};
    Object.entries(entry.inputs).forEach(([k, v]) => {
      strInputs[k] = String(v);
    });
    setInitialInputs(strInputs);
    showToast({ type: 'info', message: `Restored inputs for ${entry.calculatorName}` });
  };

  // Filter calculators by category and search term
  const filteredCalculators = ALL_CALCULATORS.filter((calc) => {
    const matchesCategory = activeCategory === 'all' || calc.category === activeCategory;
    const term = searchQuery.toLowerCase().trim();
    if (!term) return matchesCategory;
    const matchesSearch =
      calc.name.toLowerCase().includes(term) ||
      calc.shortName.toLowerCase().includes(term) ||
      calc.description.toLowerCase().includes(term) ||
      calc.keywords.some((k) => k.toLowerCase().includes(term));
    return matchesCategory && matchesSearch;
  });

  const selectedCalcMeta = ALL_CALCULATORS.find((c) => c.id === selectedCalcId) || ALL_CALCULATORS[0];

  // Render current calculator view
  const renderCalculatorView = () => {
    const commonProps = {
      initialInputs,
      onSaveHistory: handleSaveHistory,
      onAnnounce: (msg: string) => setScreenReaderAnnouncement(msg),
      onShowToast: showToast,
    };

    switch (selectedCalcId) {
      // Financial
      case 'emi':
        return <EmiCalculatorView {...commonProps} />;
      case 'compound':
        return <CompoundInterestCalculatorView {...commonProps} />;
      case 'mortgage':
        return <MortgageCalculatorView {...commonProps} />;
      case 'tip':
        return <TipCalculatorView {...commonProps} />;
      case 'discount':
        return <DiscountCalculatorView {...commonProps} />;
      case 'currency':
        return <CurrencyCalculatorView {...commonProps} />;

      // Health
      case 'bmi':
        return <BmiCalculatorView {...commonProps} />;
      case 'bmr':
        return <BmrCalculatorView {...commonProps} />;
      case 'bodyfat':
        return <BodyFatCalculatorView {...commonProps} />;
      case 'water':
        return <WaterCalculatorView {...commonProps} />;

      // Math
      case 'age':
        return <AgeCalculatorView {...commonProps} />;
      case 'percentage':
        return <PercentageCalculatorView {...commonProps} />;
      case 'scientific':
        return <ScientificCalculatorView {...commonProps} />;
      case 'time':
        return <TimeCalculatorView {...commonProps} />;
      case 'gpa':
        return <GpaCalculatorView {...commonProps} />;

      // Conversions
      case 'unit':
        return <UnitCalculatorView {...commonProps} />;
      case 'temperature':
        return <TemperatureCalculatorView {...commonProps} />;
      case 'fuel':
        return <FuelCalculatorView {...commonProps} />;
      case 'datatransfer':
        return <DataTransferCalculatorView {...commonProps} />;
      case 'numberbase':
        return <NumberBaseCalculatorView {...commonProps} />;

      default:
        return <EmiCalculatorView {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Accessible screen reader announcer */}
      <AriaLiveRegion message={screenReaderAnnouncement} />

      {/* Global Toast Manager */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Offline Status Badge */}
      <OfflineIndicator />

      {/* Storage Fallback Warning Banner */}
      <StorageFallbackBanner />

      {/* App Bar / Header */}
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenTests={() => setIsTestRunnerOpen(true)}
        historyCount={history.length}
        isPro={isPro}
        onTogglePro={handleTogglePro}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onShowToast={showToast}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Category Filter Chips Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {[
              { id: 'all', label: 'All 20 Tools', count: 20 },
              { id: 'financial', label: 'Financial', count: 6 },
              { id: 'health', label: 'Health & Fitness', count: 4 },
              { id: 'math', label: 'Math & Dates', count: 5 },
              { id: 'conversion', label: 'Conversions', count: 5 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as CalculatorCategory | 'all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeCategory === tab.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeCategory === tab.id
                      ? 'bg-slate-950/20 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 hidden md:flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>20 of 20 calculators offline enabled</span>
          </div>
        </div>

        {/* 20 Calculators Horizontal Selector / Scrollable Grid */}
        <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2">
          {filteredCalculators.map((calc) => {
            const isSelected = selectedCalcId === calc.id;
            return (
              <button
                key={calc.id}
                onClick={() => {
                  setSelectedCalcId(calc.id);
                  setInitialInputs({});
                }}
                className={`group flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
                  isSelected
                    ? 'bg-gradient-to-b from-emerald-500/20 to-slate-900 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div
                  className={`p-2 rounded-xl transition ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                      : 'bg-slate-800 text-slate-400 group-hover:text-emerald-400'
                  }`}
                >
                  {ICON_MAP[calc.icon] || <Calculator className="w-4 h-4" />}
                </div>
                <span className="text-[11px] font-semibold mt-1.5 truncate max-w-full leading-tight">
                  {calc.shortName}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Calculator Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              {ICON_MAP[selectedCalcMeta.icon] || <Calculator className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {selectedCalcMeta.name}
                </h1>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  {selectedCalcMeta.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedCalcMeta.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTestRunnerOpen(true)}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Verify Calculations</span>
            </button>
          </div>
        </div>

        {/* Active Calculator Workspace */}
        <div className="min-h-[400px]">
          {renderCalculatorView()}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">CalcNest PWA</span>
            <span>·</span>
            <span>Offline-First Progressive Web Application</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Formula-Injection Protected CSV</span>
            <span>·</span>
            <button
              onClick={() => setIsTestRunnerOpen(true)}
              className="hover:text-emerald-400 transition"
            >
              Run Regression Suite (12 Tests)
            </button>
            <span>·</span>
            <span>Android & iOS Ready</span>
          </div>
        </div>
      </footer>

      {/* History Modal Drawer */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectEntry={handleSelectHistoryEntry}
        onRefreshHistory={() => {
          const res = getHistory();
          if (res.success && res.data) setHistory(res.data);
        }}
        isPro={isPro}
        onShowToast={showToast}
      />

      {/* Automated Regression & Test Runner Modal */}
      <TestRunnerModal
        isOpen={isTestRunnerOpen}
        onClose={() => setIsTestRunnerOpen(false)}
      />
    </div>
  );
}
