import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Percent,
  Calculator,
  Clock,
  GraduationCap,
  Share2,
  BookmarkPlus,
  Plus,
  Trash2,
  AlertCircle,
  Delete,
} from 'lucide-react';
import {
  calculateAge,
  calculatePercentage,
  evaluateMathExpression,
  calculateTimeDuration,
  calculateGpa,
  CourseGrade,
} from '../../services/calculations';
import { generateShareUrl } from '../../utils/urlSharing';

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
// 11. Age & Date Difference Calculator
// =================================================================
export const AgeCalculatorView: React.FC<CommonProps> = ({
  initialInputs,
  onSaveHistory,
  onAnnounce,
  onShowToast,
}) => {
  const [birthDate, setBirthDate] = useState<string>(initialInputs?.birthDate || '1998-07-24');
  const [targetDate, setTargetDate] = useState<string>(
    initialInputs?.targetDate || new Date().toISOString().split('T')[0]
  );

  const res = calculateAge(birthDate, targetDate);

  useEffect(() => {
    if (res.isValid && res.data) {
      onAnnounce(`Age calculated: ${res.data.years} years, ${res.data.months} months, ${res.data.days} days.`);
    }
  }, [res.data?.years]);

  const handleShare = () => {
    const url = generateShareUrl('age', { birthDate, targetDate });
    navigator.clipboard.writeText(url);
    onShowToast({ type: 'success', message: 'Age calculation link copied!' });
  };

  const handleSave = () => {
    if (!res.isValid || !res.data) return;
    onSaveHistory(
      'age',
      'Age & Date Difference',
      { birthDate, targetDate },
      `Born ${birthDate} -> ${res.data.years} yrs, ${res.data.months} mos, ${res.data.days} days (${res.data.totalDays.toLocaleString()} days lived)`
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Age & Life Chronology</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={handleShare} aria-label="Share calculation link" className="p-1.5 rounded-lg text-slate-400 hover:text-white transition">
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              aria-label="Save calculation to history"
              disabled={!res.isValid}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 transition disabled:opacity-40"
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Date of Birth</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Rejects impossible dates (e.g. Feb 31) & future dates
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Age As Of Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Defaults to current local date
            </span>
          </div>
        </div>

        {!res.isValid && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{res.error}</span>
          </div>
        )}
      </div>

      {res.isValid && res.data && (
        <div className="space-y-4 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30">
              <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Exact Chronological Age</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {res.data.years} <span className="text-base font-normal text-slate-400">years</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {res.data.months} months, {res.data.days} days
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Days Lived</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 mt-1">
                {res.data.totalDays.toLocaleString()}
              </div>
              <p className="text-xs text-slate-400 mt-1">Across {res.data.totalWeeks.toLocaleString()} full weeks</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Next Birthday</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1">
                {res.data.daysUntilNextBirthday}
              </div>
              <p className="text-xs text-slate-400 mt-1">Days remaining until birthday</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =================================================================
// 12. Percentage Calculator
// =================================================================
export const PercentageCalculatorView: React.FC<CommonProps> = ({
  initialInputs,
  onSaveHistory,
  onAnnounce,
  onShowToast,
}) => {
  const [mode, setMode] = useState<'what_is' | 'is_what' | 'change'>(
    (initialInputs?.mode as 'what_is' | 'is_what' | 'change') || 'what_is'
  );
  const [valX, setValX] = useState<string>(initialInputs?.x || '25');
  const [valY, setValY] = useState<string>(initialInputs?.y || '120');

  const res = calculatePercentage(mode, Number(valX), Number(valY));

  useEffect(() => {
    if (res.isValid && res.data) {
      onAnnounce(res.data.explanation);
    }
  }, [res.data?.result]);

  const handleShare = () => {
    const url = generateShareUrl('percentage', { mode, x: valX, y: valY });
    navigator.clipboard.writeText(url);
    onShowToast({ type: 'success', message: 'Percentage link copied!' });
  };

  const handleSave = () => {
    if (!res.isValid || !res.data) return;
    onSaveHistory('percentage', 'Percentage Calculator', { mode, x: valX, y: valY }, res.data.explanation);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Percent className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Percentage Calculations</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={handleShare} aria-label="Share calculation link" className="p-1.5 rounded-lg text-slate-400 hover:text-white transition">
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              aria-label="Save calculation to history"
              disabled={!res.isValid}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 transition disabled:opacity-40"
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMode('what_is')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              mode === 'what_is' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            What is X% of Y?
          </button>
          <button
            onClick={() => setMode('is_what')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              mode === 'is_what' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            X is what % of Y?
          </button>
          <button
            onClick={() => setMode('change')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              mode === 'change' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Percentage Change (X to Y)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {mode === 'what_is' ? 'Percentage (X %)' : mode === 'is_what' ? 'Part (X)' : 'Initial Value (X)'}
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={valX}
              onChange={(e) => setValX(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {mode === 'what_is' ? 'Total Amount (Y)' : mode === 'is_what' ? 'Whole (Y)' : 'Final Value (Y)'}
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={valY}
              onChange={(e) => setValY(e.target.value)}
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
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30 animate-in fade-in">
          <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Calculation Result</span>
          <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
            {res.data.result}
            {mode !== 'what_is' && '%'}
          </div>
          <p className="text-sm font-medium text-slate-300 mt-2 font-mono">
            {res.data.explanation}
          </p>
        </div>
      )}
    </div>
  );
};

// =================================================================
// 13. Scientific Math Calculator
// =================================================================
export const ScientificCalculatorView: React.FC<CommonProps> = ({
  initialInputs,
  onSaveHistory,
  onAnnounce,
  onShowToast,
}) => {
  const [expression, setExpression] = useState<string>(initialInputs?.expr || '');
  const [historyTape, setHistoryTape] = useState<string[]>([]);

  const appendToken = (token: string) => {
    setExpression((prev) => prev + token);
  };

  const handleClear = () => {
    setExpression('');
  };

  const handleBackspace = () => {
    setExpression((prev) => prev.slice(0, -1));
  };

  const handleEvaluate = () => {
    if (!expression) return;
    const res = evaluateMathExpression(expression);
    if (res.isValid && res.data !== undefined) {
      const resultStr = String(res.data);
      const tapeItem = `${expression} = ${resultStr}`;
      setHistoryTape((prev) => [tapeItem, ...prev.slice(0, 4)]);
      onAnnounce(tapeItem);
      onSaveHistory('scientific', 'Scientific Math', { expr: expression }, tapeItem);
      setExpression(resultStr);
    } else {
      onShowToast({ type: 'error', message: res.error || 'Evaluation error' });
    }
  };

  const buttons = [
    ['sin(', 'cos(', 'tan(', '(', ')'],
    ['sqrt(', 'log(', 'ln(', 'π', '÷'],
    ['7', '8', '9', '×', '%'],
    ['4', '5', '6', '-', '^'],
    ['1', '2', '3', '+', 'e'],
    ['0', '.', 'AC', 'DEL', '='],
  ];

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Scientific Keypad</h2>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Finite Math Engine</span>
        </div>

        {/* Display Screen */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-right">
          {historyTape.length > 0 && (
            <div className="text-[11px] font-mono text-slate-500 mb-1 truncate">
              {historyTape[0]}
            </div>
          )}
          <input
            type="text"
            readOnly
            value={expression || '0'}
            aria-label="Calculator expression display"
            className="w-full bg-transparent text-right text-2xl sm:text-3xl font-mono font-bold text-white focus:outline-none tracking-wider overflow-x-auto"
          />
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-5 gap-2">
          {buttons.flat().map((btn) => {
            const isOperator = ['÷', '×', '-', '+', '='].includes(btn);
            const isAction = ['AC', 'DEL'].includes(btn);
            const isSci = ['sin(', 'cos(', 'tan(', 'sqrt(', 'log(', 'ln(', 'π', 'e', '(', ')', '%', '^'].includes(btn);

            let bg = 'bg-slate-800 text-slate-200 hover:bg-slate-700 active:scale-95';
            if (btn === '=') {
              bg = 'bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 active:scale-95';
            } else if (isOperator) {
              bg = 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/60 active:scale-95';
            } else if (isAction) {
              bg = 'bg-rose-950/40 text-rose-300 border border-rose-500/30 hover:bg-rose-900/50 active:scale-95';
            } else if (isSci) {
              bg = 'bg-slate-950 text-cyan-400 border border-slate-800 hover:bg-slate-800 active:scale-95';
            }

            return (
              <button
                key={btn}
                onClick={() => {
                  if (btn === '=') handleEvaluate();
                  else if (btn === 'AC') handleClear();
                  else if (btn === 'DEL') handleBackspace();
                  else appendToken(btn);
                }}
                aria-label={btn === 'DEL' ? 'Delete last character' : undefined}
                className={`h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${bg}`}
              >
                {btn === 'DEL' ? <Delete className="w-4 h-4" /> : btn}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// =================================================================
// 14. Time & Duration Calculator
// =================================================================
export const TimeCalculatorView: React.FC<CommonProps> = ({
  initialInputs,
  onSaveHistory,
  onAnnounce,
  onShowToast,
}) => {
  const [startH, setStartH] = useState<string>(initialInputs?.sh || '9');
  const [startM, setStartM] = useState<string>(initialInputs?.sm || '0');
  const [endH, setEndH] = useState<string>(initialInputs?.eh || '17');
  const [endM, setEndM] = useState<string>(initialInputs?.em || '30');

  const res = calculateTimeDuration(Number(startH), Number(startM), Number(endH), Number(endM));

  useEffect(() => {
    if (res.isValid && res.data) {
      onAnnounce(`Duration: ${res.data.hours} hours and ${res.data.minutes} minutes.`);
    }
  }, [res.data?.hours, res.data?.minutes]);

  const handleShare = () => {
    const url = generateShareUrl('time', { sh: startH, sm: startM, eh: endH, em: endM });
    navigator.clipboard.writeText(url);
    onShowToast({ type: 'success', message: 'Time link copied!' });
  };

  const handleSave = () => {
    if (!res.isValid || !res.data) return;
    onSaveHistory(
      'time',
      'Time & Duration',
      { startH, startM, endH, endM },
      `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')} to ${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')} -> ${res.data.hours}h ${res.data.minutes}m (${res.data.decimalHours} hrs)`
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Work Shift & Duration</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={handleShare} aria-label="Share calculation link" className="p-1.5 rounded-lg text-slate-400 hover:text-white transition">
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              aria-label="Save calculation to history"
              disabled={!res.isValid}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 transition disabled:opacity-40"
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300">Start Time (24h)</span>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                max="23"
                value={startH}
                onChange={(e) => setStartH(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-center text-white"
                placeholder="HH"
              />
              <span className="text-slate-500 font-bold self-center">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={startM}
                onChange={(e) => setStartM(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-center text-white"
                placeholder="MM"
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300">End Time (24h)</span>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                max="23"
                value={endH}
                onChange={(e) => setEndH(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-center text-white"
                placeholder="HH"
              />
              <span className="text-slate-500 font-bold self-center">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={endM}
                onChange={(e) => setEndM(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-center text-white"
                placeholder="MM"
              />
            </div>
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
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Elapsed Time</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {res.data.hours}h {res.data.minutes}m
            </div>
            <p className="text-xs text-slate-400 mt-1">{res.data.totalMinutes} total minutes</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Payroll Decimal Hours</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 mt-1">
              {res.data.decimalHours} hrs
            </div>
            <p className="text-xs text-slate-400 mt-1">Ready for timesheet entry</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Overnight Support</span>
            <div className="text-sm font-semibold text-slate-300 mt-1">
              {Number(endH) < Number(startH) ? 'Crosses Midnight (Next Day)' : 'Same Day Shift'}
            </div>
            <p className="text-xs text-slate-500 mt-1">Automatically resolves 24-hour cycles</p>
          </div>
        </div>
      )}
    </div>
  );
};

// =================================================================
// 15. GPA & Grade Calculator
// =================================================================
export const GpaCalculatorView: React.FC<CommonProps> = ({
  onSaveHistory,
  onAnnounce,
  onShowToast,
}) => {
  const [courses, setCourses] = useState<CourseGrade[]>([
    { name: 'Computer Science 101', grade: 'A', credits: 4 },
    { name: 'Calculus I', grade: 'B+', credits: 4 },
    { name: 'Physics & Lab', grade: 'A-', credits: 4 },
    { name: 'Technical Writing', grade: 'A', credits: 3 },
  ]);

  const res = calculateGpa(courses);

  useEffect(() => {
    if (res.isValid && res.data) {
      onAnnounce(`GPA calculated: ${res.data.gpa}`);
    }
  }, [res.data?.gpa]);

  const addCourse = () => {
    setCourses([...courses, { name: `Course ${courses.length + 1}`, grade: 'A', credits: 3 }]);
  };

  const removeCourse = (index: number) => {
    setCourses(courses.filter((_, i) => i !== index));
  };

  const updateCourse = (index: number, field: keyof CourseGrade, val: string | number) => {
    const updated = [...courses];
    updated[index] = { ...updated[index], [field]: val };
    setCourses(updated);
  };

  const handleSave = () => {
    if (!res.isValid || !res.data) return;
    onSaveHistory(
      'gpa',
      'GPA & Grade Calculator',
      { count: courses.length },
      `${courses.length} courses (${res.data.totalCredits} credits) -> GPA: ${res.data.gpa}`
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">4.0 Scale Collegiate GPA</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={addCourse}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Course</span>
            </button>
            <button
              onClick={handleSave}
              aria-label="Save calculation to history"
              disabled={!res.isValid}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 transition disabled:opacity-40"
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {courses.map((course, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={course.name}
                onChange={(e) => updateCourse(idx, 'name', e.target.value)}
                placeholder="Course title"
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
              />
              <select
                value={course.grade}
                onChange={(e) => updateCourse(idx, 'grade', e.target.value)}
                className="w-24 px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
              >
                {['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={course.credits}
                onChange={(e) => updateCourse(idx, 'credits', Number(e.target.value))}
                className="w-20 px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white text-center"
                placeholder="Credits"
              />
              <button
                onClick={() => removeCourse(idx)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition"
                aria-label="Remove course"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
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
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Cumulative GPA</span>
            <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
              {res.data.gpa} / 4.0
            </div>
            <p className="text-xs text-slate-400 mt-1">Weighted standard academic scale</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Credit Hours</span>
            <div className="text-3xl font-extrabold text-cyan-400 mt-1">
              {res.data.totalCredits}
            </div>
            <p className="text-xs text-slate-400 mt-1">Across {courses.length} registered classes</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Honor Standing</span>
            <div className="text-xl font-bold text-amber-400 mt-1">
              {res.data.gpa >= 3.8 ? 'Summa Cum Laude' : res.data.gpa >= 3.5 ? 'Dean\'s List / Honors' : 'Good Standing'}
            </div>
            <p className="text-xs text-slate-500 mt-1">Based on standard academic benchmarks</p>
          </div>
        </div>
      )}
    </div>
  );
};
