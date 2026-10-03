import React, { useState, useEffect } from 'react';
import {
  Landmark,
  TrendingUp,
  Home,
  Receipt,
  Tag,
  Coins,
  Share2,
  BookmarkPlus,
  Download,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  calculateEmi,
  calculateCompoundInterest,
  calculateMortgage,
  calculateTip,
  calculateDiscount,
  convertCurrency,
} from '../../services/calculations';
import {
  DEFAULT_CURRENCY_RATES,
  RATES_REFERENCE_DATE,
  getActiveCurrencyRates,
  updateCustomCurrencyRate,
  resetCustomCurrencyRates,
} from '../../services/currencyRates';
import { generateShareUrl } from '../../utils/urlSharing';
import { buildCsv, downloadCsv } from '../../utils/csv';

interface CommonProps {
  initialInputs?: Record<string, string>;
  onSaveHistory: (
    calculatorId: string,
    calculatorName: string,
    inputs: Record<string, string | number>,
    summary: string
  ) => void;
  onAnnounce: (msg: string) => void;
  onShowToast: (msg: { type: 'success' | 'error' | 'info'; message: string }) => void;
}

// =================================================================
// 1. EMI & Loan Calculator (with full 40-year Amortization Schedule)
// =================================================================
export const EmiCalculatorView: React.FC<CommonProps> = ({
  initialInputs,
  onSaveHistory,
  onAnnounce,
  onShowToast,
}) => {
  const [principal, setPrincipal] = useState<string>(initialInputs?.principal || '250000');
  const [rate, setRate] = useState<string>(initialInputs?.rate || '6.5');
  const [tenure, setTenure] = useState<string>(initialInputs?.tenure || '30');
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleViewMode, setScheduleViewMode] = useState<'yearly' | 'monthly'>('yearly');

  const pNum = Number(principal);
  const rNum = Number(rate);
  const tNum = Number(tenure);

  const emiRes = calculateEmi({
    principal: pNum,
    annualRatePct: rNum,
    tenureYears: tNum,
  });

  useEffect(() => {
    if (emiRes.isValid && emiRes.data) {
      onAnnounce(
        `Loan calculated: Monthly EMI is $${emiRes.data.monthlyEmi}, Total Interest is $${emiRes.data.totalInterest}`
      );
    }
  }, [emiRes.data?.monthlyEmi]);

  const handleShare = () => {
    const url = generateShareUrl('emi', { principal, rate, tenure });
    navigator.clipboard.writeText(url);
    onShowToast({ type: 'success', message: 'Share link copied to clipboard!' });
  };

  const handleSave = () => {
    if (!emiRes.isValid || !emiRes.data) return;
    onSaveHistory(
      'emi',
      'Loan & EMI Calculator',
      { principal, rate, tenure },
      `$${Number(principal).toLocaleString()} at ${rate}% for ${tenure} yrs -> EMI: $${emiRes.data.monthlyEmi.toLocaleString()}/mo`
    );
  };

  const handleExportScheduleCsv = () => {
    if (!emiRes.isValid || !emiRes.data) return;
    const headers = ['Month', 'Year', 'Payment', 'Principal Paid', 'Interest Paid', 'Cumulative Interest', 'Remaining Balance'];
    const rows = emiRes.data.amortizationSchedule.map((row) => [
      row.month,
      row.year,
      row.payment.toFixed(2),
      row.principal.toFixed(2),
      row.interest.toFixed(2),
      row.totalInterestPaid.toFixed(2),
      row.remainingBalance.toFixed(2),
    ]);
    const csv = buildCsv(headers, rows);
    downloadCsv(`amortization_schedule_${tenure}yr_loan.csv`, csv);
    onShowToast({ type: 'success', message: 'Amortization schedule exported safely to CSV!' });
  };

  // Group schedule into yearly rows
  const yearlySchedule = React.useMemo(() => {
    if (!emiRes.data) return [];
    const map = new Map<number, { year: number; principalPaid: number; interestPaid: number; endingBalance: number }>();
    emiRes.data.amortizationSchedule.forEach((row) => {
      const existing = map.get(row.year) || {
        year: row.year,
        principalPaid: 0,
        interestPaid: 0,
        endingBalance: row.remainingBalance,
      };
      existing.principalPaid += row.principal;
      existing.interestPaid += row.interest;
      existing.endingBalance = row.remainingBalance;
      map.set(row.year, existing);
    });
    return Array.from(map.values());
  }, [emiRes.data]);

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Landmark className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Loan & EMI Parameters</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              title="Share calculation link"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={!emiRes.isValid}
              title="Save to History"
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition disabled:opacity-40"
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Principal Loan Amount ($)
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. 250000"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Annual Interest Rate (%)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.05"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. 6.5"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Supports 0% interest loans
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Loan Term (Years)
            </label>
            <input
              type="number"
              inputMode="numeric"
              step="1"
              value={tenure}
              onChange={(e) => setTenure(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. 30"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Supports up to 50 years (600 months)
            </span>
          </div>
        </div>

        {!emiRes.isValid && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{emiRes.error}</span>
          </div>
        )}
      </div>

      {/* Result Cards */}
      {emiRes.isValid && emiRes.data && (
        <div className="space-y-5 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30 shadow-lg">
              <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                Monthly EMI
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                ${emiRes.data.monthlyEmi.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                For {emiRes.data.totalMonths} total payments
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Total Interest Payable
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1">
                ${emiRes.data.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {rNum === 0 ? '0% Interest financing' : `${((emiRes.data.totalInterest / pNum) * 100).toFixed(1)}% of principal`}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Total Amount Paid
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 mt-1">
                ${emiRes.data.totalPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Principal (${pNum.toLocaleString()}) + Interest
              </p>
            </div>
          </div>

          {/* Amortization Schedule Accordion */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Full Amortization Schedule
                  <span className="text-xs font-mono font-normal text-slate-400">
                    ({emiRes.data.amortizationSchedule.length} payments, {tNum} Years)
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Complete repayment table without 30-year truncation. Includes full 40+ year term schedules.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {showSchedule && (
                  <div className="flex rounded-lg bg-slate-800 p-0.5 text-xs border border-slate-700">
                    <button
                      onClick={() => setScheduleViewMode('yearly')}
                      className={`px-2.5 py-1 rounded-md transition font-medium ${
                        scheduleViewMode === 'yearly' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      Yearly
                    </button>
                    <button
                      onClick={() => setScheduleViewMode('monthly')}
                      className={`px-2.5 py-1 rounded-md transition font-medium ${
                        scheduleViewMode === 'monthly' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      Monthly ({emiRes.data.totalMonths})
                    </button>
                  </div>
                )}

                <button
                  onClick={handleExportScheduleCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={() => setShowSchedule(!showSchedule)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  aria-label="Toggle schedule visibility"
                >
                  {showSchedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {showSchedule && (
              <div className="mt-4 overflow-x-auto max-h-96 overflow-y-auto">
                {scheduleViewMode === 'yearly' ? (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Year</th>
                        <th className="py-2.5 px-3">Principal Paid</th>
                        <th className="py-2.5 px-3">Interest Paid</th>
                        <th className="py-2.5 px-3">Ending Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {yearlySchedule.map((row) => (
                        <tr key={row.year} className="hover:bg-slate-800/40">
                          <td className="py-2 px-3 font-semibold text-slate-200">Year {row.year}</td>
                          <td className="py-2 px-3 text-emerald-400">${row.principalPaid.toFixed(2)}</td>
                          <td className="py-2 px-3 text-amber-400">${row.interestPaid.toFixed(2)}</td>
                          <td className="py-2 px-3 text-slate-300">${row.endingBalance.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Month</th>
                        <th className="py-2.5 px-3">Year</th>
                        <th className="py-2.5 px-3">EMI Payment</th>
                        <th className="py-2.5 px-3">Principal</th>
                        <th className="py-2.5 px-3">Interest</th>
                        <th className="py-2.5 px-3">Remaining Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {emiRes.data.amortizationSchedule.map((row) => (
                        <tr key={row.month} className="hover:bg-slate-800/40">
                          <td className="py-1.5 px-3 text-slate-400">#{row.month}</td>
                          <td className="py-1.5 px-3 text-slate-400">Yr {row.year}</td>
                          <td className="py-1.5 px-3 text-slate-200">${row.payment.toFixed(2)}</td>
                          <td className="py-1.5 px-3 text-emerald-400">${row.principal.toFixed(2)}</td>
                          <td className="py-1.5 px-3 text-amber-400">${row.interest.toFixed(2)}</td>
                          <td className="py-1.5 px-3 text-slate-300">${row.remainingBalance.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// =================================================================
// 2. Compound Interest & Savings Calculator
// =================================================================
export const CompoundInterestCalculatorView: React.FC<CommonProps> = ({
  initialInputs,
  onSaveHistory,
  onAnnounce,
  onShowToast,
}) => {
  const [initialDeposit, setInitialDeposit] = useState<string>(initialInputs?.deposit || '10000');
  const [monthlyContribution, setMonthlyContribution] = useState<string>(initialInputs?.monthly || '500');
  const [rate, setRate] = useState<string>(initialInputs?.rate || '7.0');
  const [years, setYears] = useState<string>(initialInputs?.years || '10');
  const [timing, setTiming] = useState<'start' | 'end'>((initialInputs?.timing as 'start' | 'end') || 'end');
  const [frequency, setFrequency] = useState<1 | 2 | 4 | 12>(
    initialInputs?.freq ? (Number(initialInputs.freq) as 1 | 2 | 4 | 12) : 12
  );

  const compRes = calculateCompoundInterest({
    initialDeposit: Number(initialDeposit),
    monthlyContribution: Number(monthlyContribution),
    annualRatePct: Number(rate),
    years: Number(years),
    compoundingFrequency: frequency,
    timing,
  });

  useEffect(() => {
    if (compRes.isValid && compRes.data) {
      onAnnounce(`Compound future value: $${compRes.data.futureValue.toLocaleString()}`);
    }
  }, [compRes.data?.futureValue]);

  const handleShare = () => {
    const url = generateShareUrl('compound', {
      deposit: initialDeposit,
      monthly: monthlyContribution,
      rate,
      years,
      timing,
      freq: String(frequency),
    });
    navigator.clipboard.writeText(url);
    onShowToast({ type: 'success', message: 'Compound interest link copied!' });
  };

  const handleSave = () => {
    if (!compRes.isValid || !compRes.data) return;
    onSaveHistory(
      'compound',
      'Compound Interest & Savings',
      { initialDeposit, monthlyContribution, rate, years, timing, frequency },
      `$${Number(initialDeposit).toLocaleString()} + $${monthlyContribution}/mo @ ${rate}% (${frequency === 12 ? 'Monthly' : frequency === 4 ? 'Quarterly' : frequency === 2 ? 'Semi-Annual' : 'Annual'}) for ${years}y -> $${compRes.data.futureValue.toLocaleString()}`
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Compound Savings Growth</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={handleShare} className="p-1.5 rounded-lg text-slate-400 hover:text-white transition">
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={!compRes.isValid}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 transition disabled:opacity-40"
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Documented Assumptions Box */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            Documented Compounding Assumptions:
          </div>
          <p>
            • Compounding Frequency: {frequency === 12 ? 'Monthly (12×/year)' : frequency === 4 ? 'Quarterly (4×/year)' : frequency === 2 ? 'Semi-Annually (2×/year)' : 'Annually (1×/year)'}.
            <br />
            • Contributions: Deposited at {timing === 'start' ? 'beginning of each month (Annuity Due)' : 'end of each month (Ordinary Annuity)'}.
            <br />
            • Zero-Interest Guarantee: When rate is 0%, Future Value = Principal + (Monthly Contribution × Total Months).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Initial Deposit ($)</label>
            <input
              type="number"
              inputMode="decimal"
              value={initialDeposit}
              onChange={(e) => setInitialDeposit(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Monthly Contribution ($)</label>
            <input
              type="number"
              inputMode="decimal"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Estimated Annual Return (%)</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Investment Horizon (Years)</label>
            <input
              type="number"
              inputMode="numeric"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Compounding frequency and Contribution timing toggles */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Compounding Frequency:</span>
            <div className="flex rounded-lg bg-slate-950 p-0.5 text-xs border border-slate-800">
              {[
                { label: 'Monthly', val: 12 },
                { label: 'Quarterly', val: 4 },
                { label: 'Semi-Annual', val: 2 },
                { label: 'Annually', val: 1 },
              ].map((f) => (
                <button
                  key={f.val}
                  onClick={() => setFrequency(f.val as 1 | 2 | 4 | 12)}
                  className={`px-2.5 py-1 rounded-md transition font-medium ${
                    frequency === f.val ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Contribution Timing:</span>
            <div className="flex rounded-lg bg-slate-950 p-0.5 text-xs border border-slate-800">
              <button
                onClick={() => setTiming('end')}
                className={`px-3 py-1 rounded-md transition font-medium ${
                  timing === 'end' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                End of Month
              </button>
              <button
                onClick={() => setTiming('start')}
                className={`px-3 py-1 rounded-md transition font-medium ${
                  timing === 'start' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Beginning of Month
              </button>
            </div>
          </div>
        </div>

        {!compRes.isValid && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
            {compRes.error}
          </div>
        )}
      </div>

      {/* Results */}
      {compRes.isValid && compRes.data && (
        <div className="space-y-5 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30 shadow-lg">
              <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Future Balance</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                ${compRes.data.futureValue.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                In {years} years ({Number(years) * 12} compounding cycles)
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Principal Deposited</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-200 mt-1">
                ${(compRes.data.totalPrincipal + compRes.data.totalContributions).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Init: ${compRes.data.totalPrincipal.toLocaleString()} + Contribs: ${compRes.data.totalContributions.toLocaleString()}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Compound Interest Earned</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
                ${compRes.data.totalInterest.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {Number(rate) === 0 ? '0% Interest rate' : `${((compRes.data.totalInterest / (compRes.data.totalPrincipal + compRes.data.totalContributions)) * 100).toFixed(1)}% compound yield`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =================================================================
// 3. Mortgage Calculator
// =================================================================
export const MortgageCalculatorView: React.FC<CommonProps> = ({
  initialInputs,
  onSaveHistory,
  onAnnounce,
  onShowToast,
}) => {
  const [price, setPrice] = useState<string>(initialInputs?.price || '450000');
  const [down, setDown] = useState<string>(initialInputs?.down || '90000');
  const [rate, setRate] = useState<string>(initialInputs?.rate || '6.75');
  const [term, setTerm] = useState<string>(initialInputs?.term || '30');
  const [tax, setTax] = useState<string>(initialInputs?.tax || '5400');
  const [insurance, setInsurance] = useState<string>(initialInputs?.insurance || '1400');
  const [pmi, setPmi] = useState<string>(initialInputs?.pmi || '0');

  const res = calculateMortgage({
    homePrice: Number(price),
    downPayment: Number(down),
    annualRatePct: Number(rate),
    loanTermYears: Number(term),
    annualPropertyTax: Number(tax),
    annualInsurance: Number(insurance),
    monthlyPmi: Number(pmi),
  });

  useEffect(() => {
    if (res.isValid && res.data) {
      onAnnounce(`Mortgage calculated: $${res.data.totalMonthlyPayment} total monthly payment.`);
    }
  }, [res.data?.totalMonthlyPayment]);

  const handleShare = () => {
    const url = generateShareUrl('mortgage', { price, down, rate, term, tax, insurance, pmi });
    navigator.clipboard.writeText(url);
    onShowToast({ type: 'success', message: 'Mortgage calculation link copied!' });
  };

  const handleSave = () => {
    if (!res.isValid || !res.data) return;
    onSaveHistory(
      'mortgage',
      'Mortgage & Escrow',
      { price, down, rate, term },
      `$${Number(price).toLocaleString()} house ($${Number(down).toLocaleString()} down) -> Total $${res.data.totalMonthlyPayment}/mo`
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Home className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Mortgage & Escrow Details</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={handleShare} className="p-1.5 rounded-lg text-slate-400 hover:text-white transition">
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={!res.isValid}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 transition disabled:opacity-40"
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Home Purchase Price ($)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Down Payment ($)</label>
            <input
              type="number"
              value={down}
              onChange={(e) => setDown(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mortgage Rate (%)</label>
            <input
              type="number"
              step="0.05"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Term (Years)</label>
            <input
              type="number"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Annual Taxes ($)</label>
            <input
              type="number"
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Annual Home Insurance ($)</label>
            <input
              type="number"
              value={insurance}
              onChange={(e) => setInsurance(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Monthly PMI ($)</label>
            <input
              type="number"
              value={pmi}
              onChange={(e) => setPmi(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-white"
            />
          </div>
        </div>

        {!res.isValid && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
            {res.error}
          </div>
        )}
      </div>

      {res.isValid && res.data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30">
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Total Monthly Escrow</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              ${res.data.totalMonthlyPayment.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Principal + Interest + Taxes + Ins.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Principal & Interest</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 mt-1">
              ${res.data.monthlyPrincipalAndInterest.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Loan: ${res.data.loanAmount.toLocaleString()} ({res.data.ltvPct}% LTV)</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Monthly Escrow Items</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1">
              ${(res.data.monthlyPropertyTax + res.data.monthlyInsurance + res.data.monthlyPmi).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Tax: ${res.data.monthlyPropertyTax} · Ins: ${res.data.monthlyInsurance}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// =================================================================
// 4. Tip & Bill Splitter
// =================================================================
export const TipCalculatorView: React.FC<CommonProps> = ({
  initialInputs,
  onSaveHistory,
  onAnnounce,
  onShowToast,
}) => {
  const [bill, setBill] = useState<string>(initialInputs?.bill || '120.00');
  const [tipPct, setTipPct] = useState<string>(initialInputs?.tipPct || '18');
  const [people, setPeople] = useState<string>(initialInputs?.people || '3');
  const [roundUp, setRoundUp] = useState<boolean>(false);

  const res = calculateTip(Number(bill), Number(tipPct), Number(people), roundUp);

  useEffect(() => {
    if (res.isValid && res.data) {
      onAnnounce(`Tip calculated: $${res.data.perPersonTotal} per person.`);
    }
  }, [res.data?.perPersonTotal]);

  const handleShare = () => {
    const url = generateShareUrl('tip', { bill, tipPct, people });
    navigator.clipboard.writeText(url);
    onShowToast({ type: 'success', message: 'Tip link copied to clipboard!' });
  };

  const handleSave = () => {
    if (!res.isValid || !res.data) return;
    onSaveHistory(
      'tip',
      'Tip & Bill Splitter',
      { bill, tipPct, people },
      `$${bill} bill + ${tipPct}% tip (${people} people) -> $${res.data.perPersonTotal}/person`
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Dining Bill & Gratuity</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={handleShare} className="p-1.5 rounded-lg text-slate-400 hover:text-white transition">
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={!res.isValid}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 transition disabled:opacity-40"
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Bill Amount ($)</label>
            <input
              type="number"
              inputMode="decimal"
              value={bill}
              onChange={(e) => setBill(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tip Percentage (%)</label>
            <div className="flex gap-1.5">
              {[15, 18, 20, 25].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setTipPct(String(pct))}
                  className={`flex-1 py-1 rounded-lg text-xs font-semibold transition ${
                    Number(tipPct) === pct ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
            <input
              type="number"
              value={tipPct}
              onChange={(e) => setTipPct(e.target.value)}
              className="mt-2 w-full px-3 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              placeholder="Custom %"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Split Between (People)</label>
            <input
              type="number"
              min="1"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="roundUp"
            checked={roundUp}
            onChange={(e) => setRoundUp(e.target.checked)}
            className="rounded text-emerald-500 focus:ring-emerald-500 w-4 h-4 bg-slate-950 border-slate-700"
          />
          <label htmlFor="roundUp" className="text-xs text-slate-300 cursor-pointer">
            Round up total to nearest whole dollar
          </label>
        </div>

        {!res.isValid && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
            {res.error}
          </div>
        )}
      </div>

      {res.isValid && res.data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30">
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Per Person Total</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              ${res.data.perPersonTotal.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Includes ${res.data.perPersonTip.toFixed(2)} tip/person</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Tip Amount</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1">
              ${res.data.tipAmount.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{tipPct}% gratuity</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Bill Payable</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 mt-1">
              ${res.data.totalBill.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Split across {people} diners</p>
          </div>
        </div>
      )}
    </div>
  );
};

// =================================================================
// 5. Discount & Sales Tax Calculator
// =================================================================
export const DiscountCalculatorView: React.FC<CommonProps> = ({
  initialInputs,
  onSaveHistory,
  onAnnounce,
  onShowToast,
}) => {
  const [price, setPrice] = useState<string>(initialInputs?.price || '89.99');
  const [discount, setDiscount] = useState<string>(initialInputs?.discount || '25');
  const [tax, setTax] = useState<string>(initialInputs?.tax || '8.25');

  const res = calculateDiscount(Number(price), Number(discount), Number(tax));

  useEffect(() => {
    if (res.isValid && res.data) {
      onAnnounce(`Final price: $${res.data.finalPrice}`);
    }
  }, [res.data?.finalPrice]);

  const handleShare = () => {
    const url = generateShareUrl('discount', { price, discount, tax });
    navigator.clipboard.writeText(url);
    onShowToast({ type: 'success', message: 'Discount link copied!' });
  };

  const handleSave = () => {
    if (!res.isValid || !res.data) return;
    onSaveHistory(
      'discount',
      'Discount & Sales Tax',
      { price, discount, tax },
      `$${price} with ${discount}% off + ${tax}% tax -> Final $${res.data.finalPrice}`
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Tag className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Retail Markdown & Tax</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={handleShare} className="p-1.5 rounded-lg text-slate-400 hover:text-white transition">
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={!res.isValid}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 transition disabled:opacity-40"
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Original Retail Price ($)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Discount (%)</label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sales Tax (%)</label>
            <input
              type="number"
              step="0.05"
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {!res.isValid && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
            {res.error}
          </div>
        )}
      </div>

      {res.isValid && res.data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30">
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Final Total Out of Pocket</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              ${res.data.finalPrice.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Price after discount and local tax</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total You Save</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
              ${res.data.discountSavings.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{discount}% promotional savings</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tax Added</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1">
              ${res.data.taxAmount.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{tax}% sales tax</p>
          </div>
        </div>
      )}
    </div>
  );
};

// =================================================================
// 6. Currency Converter (with Documented Date & Custom Rates Persistence)
// =================================================================
export const CurrencyCalculatorView: React.FC<CommonProps> = ({
  initialInputs,
  onSaveHistory,
  onAnnounce,
  onShowToast,
}) => {
  const [amount, setAmount] = useState<string>(initialInputs?.amount || '100');
  const [from, setFrom] = useState<string>(initialInputs?.from || 'USD');
  const [to, setTo] = useState<string>(initialInputs?.to || 'EUR');
  const [rates, setRates] = useState<Record<string, number>>(getActiveCurrencyRates());
  const [showCustomRates, setShowCustomRates] = useState(false);

  const res = convertCurrency(Number(amount), from, to, rates);

  useEffect(() => {
    if (res.isValid && res.data) {
      onAnnounce(`${amount} ${from} equals ${res.data.convertedAmount} ${to}`);
    }
  }, [res.data?.convertedAmount]);

  const handleUpdateCustomRate = (code: string, val: string) => {
    const num = parseFloat(val);
    if (num > 0) {
      updateCustomCurrencyRate(code, num);
      setRates(getActiveCurrencyRates());
      onShowToast({ type: 'info', message: `Custom rate for ${code} saved (persists on refresh).` });
    }
  };

  const handleResetRates = () => {
    resetCustomCurrencyRates();
    setRates(getActiveCurrencyRates());
    onShowToast({ type: 'info', message: 'Restored baseline exchange rates.' });
  };

  const handleShare = () => {
    const url = generateShareUrl('currency', { amount, from, to });
    navigator.clipboard.writeText(url);
    onShowToast({ type: 'success', message: 'Currency conversion link copied!' });
  };

  const handleSave = () => {
    if (!res.isValid || !res.data) return;
    onSaveHistory(
      'currency',
      'Currency Converter',
      { amount, from, to },
      `${amount} ${from} -> ${res.data.convertedAmount} ${to} (Rate: ${res.data.exchangeRate})`
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Coins className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white">Currency Conversion</h2>
              <p className="text-[11px] text-slate-400">
                Rates reference date: <span className="font-semibold text-emerald-400">{RATES_REFERENCE_DATE}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={handleShare} className="p-1.5 rounded-lg text-slate-400 hover:text-white transition">
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={!res.isValid}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 transition disabled:opacity-40"
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Amount</label>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">From Currency</label>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {Object.keys(DEFAULT_CURRENCY_RATES).map((code) => (
                <option key={code} value={code}>
                  {code} - {DEFAULT_CURRENCY_RATES[code].name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">To Currency</label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {Object.keys(DEFAULT_CURRENCY_RATES).map((code) => (
                <option key={code} value={code}>
                  {code} - {DEFAULT_CURRENCY_RATES[code].name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Rate Management */}
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={() => setShowCustomRates(!showCustomRates)}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5"
          >
            <span>{showCustomRates ? 'Hide Custom Exchange Rates' : 'Edit / Persist Custom Rates (Offline Matrix)'}</span>
            {showCustomRates ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showCustomRates && (
            <div className="mt-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">
                  Custom rates per 1 USD (persisted locally across reloads):
                </span>
                <button
                  onClick={handleResetRates}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  Reset to Defaults
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.keys(DEFAULT_CURRENCY_RATES).map((code) => (
                  <div key={code}>
                    <label className="block text-[11px] font-mono text-slate-400 mb-0.5">{code}</label>
                    <input
                      type="number"
                      step="0.001"
                      defaultValue={rates[code]}
                      onBlur={(e) => handleUpdateCustomRate(code, e.target.value)}
                      className="w-full px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {!res.isValid && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
            {res.error}
          </div>
        )}
      </div>

      {res.isValid && res.data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30">
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Converted Amount</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {DEFAULT_CURRENCY_RATES[to]?.symbol}
              {res.data.convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {to}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              From {amount} {from}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Exchange Rate</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 mt-1">
              1 {from} = {res.data.exchangeRate} {to}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Inverse: 1 {to} = {(1 / res.data.exchangeRate).toFixed(4)} {from}</p>
          </div>
        </div>
      )}
    </div>
  );
};
