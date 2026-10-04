import React, { useState, useEffect } from 'react';
import {
  Activity,
  Flame,
  HeartPulse,
  Droplet,
  Share2,
  BookmarkPlus,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  calculateBmi,
  calculateBmr,
  calculateBodyFat,
  calculateWaterIntake,
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
// 7. BMI & Body Health Calculator
// =================================================================
export const BmiCalculatorView: React.FC<CommonProps> = ({
  initialInputs,
  onSaveHistory,
  onAnnounce,
  onShowToast,
}) => {
  const [unit, setUnit] = useState<'metric' | 'imperial'>((initialInputs?.unit as 'metric' | 'imperial') || 'metric');
  const [weight, setWeight] = useState<string>(initialInputs?.weight || (unit === 'metric' ? '70' : '154.3'));
  const [height, setHeight] = useState<string>(initialInputs?.height || (unit === 'metric' ? '175' : '68.9'));

  const res = calculateBmi(Number(weight), Number(height), unit);

  useEffect(() => {
    if (res.isValid && res.data) {
      onAnnounce(`BMI calculated: ${res.data.bmi}, category: ${res.data.category}`);
    }
  }, [res.data?.bmi]);

  const handleShare = () => {
    const url = generateShareUrl('bmi', { unit, weight, height });
    navigator.clipboard.writeText(url);
    onShowToast({ type: 'success', message: 'BMI calculation link copied!' });
  };

  const handleSave = () => {
    if (!res.isValid || !res.data) return;
    onSaveHistory(
      'bmi',
      'BMI & Body Health',
      { unit, weight, height },
      `${weight}${unit === 'metric' ? 'kg' : 'lbs'}, ${height}${unit === 'metric' ? 'cm' : 'in'} -> BMI: ${res.data.bmi} (${res.data.category})`
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Body Mass Index (BMI)</h2>
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

        {/* Metric vs Imperial Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">Measurement System:</span>
          <div className="flex rounded-lg bg-slate-950 p-0.5 text-xs border border-slate-800">
            <button
              onClick={() => {
                setUnit('metric');
                setWeight('70');
                setHeight('175');
              }}
              className={`px-3 py-1 rounded-md transition font-medium ${
                unit === 'metric' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              Metric (kg, cm)
            </button>
            <button
              onClick={() => {
                setUnit('imperial');
                setWeight('154.324');
                setHeight('68.898');
              }}
              className={`px-3 py-1 rounded-md transition font-medium ${
                unit === 'imperial' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              Imperial (lbs, in)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Weight ({unit === 'metric' ? 'kg' : 'lbs'})
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Height ({unit === 'metric' ? 'cm' : 'total inches'})
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
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
        <div className="space-y-4 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30">
              <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Your BMI Score</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
                {res.data.bmi}
              </div>
              <div className={`text-sm font-bold mt-1.5 ${res.data.categoryColor}`}>
                {res.data.category}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">WHO Classification</span>
              <div className="space-y-1 font-mono text-slate-300">
                <div className="flex justify-between py-0.5 border-b border-slate-800">
                  <span>Underweight:</span> <span>&lt; 18.5</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800 text-emerald-400 font-semibold">
                  <span>Normal Weight:</span> <span>18.5 – 24.9</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800 text-amber-400">
                  <span>Overweight:</span> <span>25.0 – 29.9</span>
                </div>
                <div className="flex justify-between py-0.5 text-rose-400">
                  <span>Obese:</span> <span>≥ 30.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>{res.data.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// =================================================================
// 8. BMR & Daily Calorie Needs
// =================================================================
export const BmrCalculatorView: React.FC<CommonProps> = ({
  initialInputs,
  onSaveHistory,
  onAnnounce,
  onShowToast,
}) => {
  const [gender, setGender] = useState<'male' | 'female'>((initialInputs?.gender as 'male' | 'female') || 'male');
  const [weight, setWeight] = useState<string>(initialInputs?.weight || '78');
  const [height, setHeight] = useState<string>(initialInputs?.height || '178');
  const [age, setAge] = useState<string>(initialInputs?.age || '29');
  const [activity, setActivity] = useState<number>(1.375); // Light exercise

  const res = calculateBmr(gender, Number(weight), Number(height), Number(age), activity);

  useEffect(() => {
    if (res.isValid && res.data) {
      onAnnounce(`BMR: ${res.data.bmr} kcal. Maintenance: ${res.data.maintenanceCalories} kcal.`);
    }
  }, [res.data?.bmr]);

  const handleShare = () => {
    const url = generateShareUrl('bmr', { gender, weight, height, age, activity });
    navigator.clipboard.writeText(url);
    onShowToast({ type: 'success', message: 'BMR calculation link copied!' });
  };

  const handleSave = () => {
    if (!res.isValid || !res.data) return;
    onSaveHistory(
      'bmr',
      'BMR & Calorie Needs',
      { gender, weight, height, age },
      `${gender}, ${weight}kg, ${height}cm, age ${age} -> BMR: ${res.data.bmr} kcal, Maintenance: ${res.data.maintenanceCalories} kcal`
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Basal Metabolic Rate & TDEE</h2>
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as 'male' | 'female')}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Height (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Age (years)</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Daily Activity Level</label>
          <select
            value={activity}
            onChange={(e) => setActivity(Number(e.target.value))}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-white"
          >
            <option value="1.2">Sedentary (Little or no exercise, desk job)</option>
            <option value="1.375">Lightly Active (Exercise 1-3 days/week)</option>
            <option value="1.55">Moderately Active (Exercise 3-5 days/week)</option>
            <option value="1.725">Very Active (Hard training 6-7 days/week)</option>
            <option value="1.9">Extremely Active (Athletic training / physical labor)</option>
          </select>
        </div>

        {!res.isValid && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
            {res.error}
          </div>
        )}
      </div>

      {res.isValid && res.data && (
        <div className="space-y-4 animate-in fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Basal Rate (BMR)</span>
              <div className="text-xl font-bold text-white mt-1">{res.data.bmr} kcal</div>
              <p className="text-[10px] text-slate-500 mt-0.5">At complete rest</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
              <span className="text-[11px] text-emerald-400 uppercase font-semibold">Maintenance</span>
              <div className="text-xl font-bold text-emerald-300 mt-1">{res.data.maintenanceCalories} kcal</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Stay at current weight</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-amber-400 uppercase font-semibold">Weight Loss (-500)</span>
              <div className="text-xl font-bold text-amber-300 mt-1">{res.data.weightLossCalories} kcal</div>
              <p className="text-[10px] text-slate-500 mt-0.5">~1 lb fat loss/week</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-cyan-400 uppercase font-semibold">Muscle Gain (+350)</span>
              <div className="text-xl font-bold text-cyan-300 mt-1">{res.data.weightGainCalories} kcal</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Lean caloric surplus</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>{res.data.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// =================================================================
// 9. Body Fat Percentage (US Navy Method)
// =================================================================
export const BodyFatCalculatorView: React.FC<CommonProps> = ({
  initialInputs,
  onSaveHistory,
  onAnnounce,
  onShowToast,
}) => {
  const [gender, setGender] = useState<'male' | 'female'>((initialInputs?.gender as 'male' | 'female') || 'male');
  const [height, setHeight] = useState<string>(initialInputs?.height || '178');
  const [neck, setNeck] = useState<string>(initialInputs?.neck || '38');
  const [waist, setWaist] = useState<string>(initialInputs?.waist || '84');
  const [hip, setHip] = useState<string>(initialInputs?.hip || '96');

  const res = calculateBodyFat(gender, Number(height), Number(neck), Number(waist), Number(hip));

  useEffect(() => {
    if (res.isValid && res.data) {
      onAnnounce(`Estimated Body Fat: ${res.data.bodyFatPct}%`);
    }
  }, [res.data?.bodyFatPct]);

  const handleShare = () => {
    const url = generateShareUrl('bodyfat', { gender, height, neck, waist, hip });
    navigator.clipboard.writeText(url);
    onShowToast({ type: 'success', message: 'Body Fat link copied!' });
  };

  const handleSave = () => {
    if (!res.isValid || !res.data) return;
    onSaveHistory(
      'bodyfat',
      'Body Fat Percentage',
      { gender, height, neck, waist, hip },
      `${gender} (${height}cm, neck ${neck}cm, waist ${waist}cm) -> Body Fat: ${res.data.bodyFatPct}%`
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <HeartPulse className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Body Fat (US Navy Circumference)</h2>
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Biological Sex</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as 'male' | 'female')}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Height (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Neck Circumference (cm)</label>
            <input
              type="number"
              value={neck}
              onChange={(e) => setNeck(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Waist Circumference (cm)</label>
            <input
              type="number"
              value={waist}
              onChange={(e) => setWaist(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
            />
          </div>
        </div>

        {gender === 'female' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hip Circumference (cm, at widest)</label>
            <input
              type="number"
              value={hip}
              onChange={(e) => setHip(e.target.value)}
              className="w-full max-w-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
            />
          </div>
        )}

        {!res.isValid && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
            {res.error}
          </div>
        )}
      </div>

      {res.isValid && res.data && (
        <div className="space-y-4 animate-in fade-in">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30">
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Estimated Body Fat</span>
            <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
              {res.data.bodyFatPct}%
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Standard US Navy formula based on circumference ratios.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>{res.data.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// =================================================================
// 10. Water Intake & Hydration Calculator
// =================================================================
export const WaterCalculatorView: React.FC<CommonProps> = ({
  initialInputs,
  onSaveHistory,
  onAnnounce,
  onShowToast,
}) => {
  const [weight, setWeight] = useState<string>(initialInputs?.weight || '70');
  const [exercise, setExercise] = useState<string>(initialInputs?.exercise || '45');
  const [climate, setClimate] = useState<'normal' | 'hot' | 'cold'>((initialInputs?.climate as 'normal') || 'normal');

  const res = calculateWaterIntake(Number(weight), Number(exercise), climate);

  useEffect(() => {
    if (res.isValid && res.data) {
      onAnnounce(`Daily hydration goal: ${res.data.liters} Liters (${res.data.glassesCount} glasses)`);
    }
  }, [res.data?.liters]);

  const handleShare = () => {
    const url = generateShareUrl('water', { weight, exercise, climate });
    navigator.clipboard.writeText(url);
    onShowToast({ type: 'success', message: 'Hydration calculation link copied!' });
  };

  const handleSave = () => {
    if (!res.isValid || !res.data) return;
    onSaveHistory(
      'water',
      'Water Intake & Hydration',
      { weight, exercise, climate },
      `${weight}kg, ${exercise}min exercise, ${climate} -> ${res.data.liters}L (${res.data.glassesCount} glasses/day)`
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Droplet className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Daily Hydration Target</h2>
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Body Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Daily Exercise (Minutes)</label>
            <input
              type="number"
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ambient Climate</label>
            <select
              value={climate}
              onChange={(e) => setClimate(e.target.value as 'normal' | 'hot' | 'cold')}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="normal">Temperate / Moderate</option>
              <option value="hot">Hot / Arid (+500ml)</option>
              <option value="cold">Cold / Winter</option>
            </select>
          </div>
        </div>

        {!res.isValid && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
            {res.error}
          </div>
        )}
      </div>

      {res.isValid && res.data && (
        <div className="space-y-4 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30">
              <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Daily Water Volume</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
                {res.data.liters} L
              </div>
              <p className="text-xs text-slate-400 mt-1">{res.data.fluidOunces} fl oz</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Equivalent 250ml Glasses</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-cyan-400 mt-1">
                {res.data.glassesCount}
              </div>
              <p className="text-xs text-slate-400 mt-1">Standard 8 oz drinking glasses</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Workout Hydration</span>
              <div className="text-xl font-bold text-amber-400 mt-1">
                +{((Number(exercise) / 30) * 0.35).toFixed(2)} L
              </div>
              <p className="text-xs text-slate-400 mt-1">For {exercise} minutes of sweat loss</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>{res.data.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
};
