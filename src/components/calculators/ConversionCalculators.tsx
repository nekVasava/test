import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  Thermometer,
  Fuel,
  Wifi,
  Binary,
  Share2,
  BookmarkPlus,
  AlertCircle,
  Copy,
} from 'lucide-react';
import {
  convertUnits,
  convertTemperature,
  calculateFuelCost,
  calculateDataTransferTime,
  convertNumberBase,
  UNIT_CONVERSIONS,
  UnitCategory,
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
// 16. Unit Converter
// =================================================================
export const UnitCalculatorView: React.FC<CommonProps> = ({
  initialInputs,
  onSaveHistory,
  onAnnounce,
  onShowToast,
}) => {
  const [category, setCategory] = useState<UnitCategory>(
    (initialInputs?.category as UnitCategory) || 'length'
  );
  const [value, setValue] = useState<string>(initialInputs?.val || '10');
  const [fromUnit, setFromUnit] = useState<string>(initialInputs?.from || 'km');
  const [toUnit, setToUnit] = useState<string>(initialInputs?.to || 'mi');

  // If category changed, adjust units if they don't match category
  const availableUnits = Object.keys(UNIT_CONVERSIONS[category].units);

  const res = convertUnits(category, Number(value), fromUnit, toUnit);

  useEffect(() => {
    if (res.isValid && res.data) {
      onAnnounce(`${value} ${fromUnit} equals ${res.data.result} ${toUnit}`);
    }
  }, [res.data?.result]);

  const handleCategoryChange = (cat: UnitCategory) => {
    setCategory(cat);
    const units = Object.keys(UNIT_CONVERSIONS[cat].units);
    setFromUnit(units[0]);
    setToUnit(units[1] || units[0]);
  };

  const handleShare = () => {
    const url = generateShareUrl('unit', { category, val: value, from: fromUnit, to: toUnit });
    navigator.clipboard.writeText(url);
    onShowToast({ type: 'success', message: 'Unit conversion link copied!' });
  };

  const handleSave = () => {
    if (!res.isValid || !res.data) return;
    onSaveHistory(
      'unit',
      'Unit Converter',
      { category, value, fromUnit, toUnit },
      `${value} ${fromUnit} -> ${res.data.result} ${toUnit} (${category})`
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Universal Unit Converter</h2>
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

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {(['length', 'mass', 'speed', 'area', 'volume'] as UnitCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                category === cat ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Input Value</label>
            <input
              type="number"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">From Unit</label>
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {availableUnits.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">To Unit</label>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {availableUnits.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
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
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30 animate-in fade-in">
          <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Converted Equivalent</span>
          <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1 break-words">
            {res.data.result} <span className="text-xl font-normal text-emerald-400">{toUnit}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono">
            Exact: {value} {fromUnit} = {res.data.result} {toUnit}
          </p>
        </div>
      )}
    </div>
  );
};

// =================================================================
// 17. Temperature Converter
// =================================================================
export const TemperatureCalculatorView: React.FC<CommonProps> = ({
  initialInputs,
  onSaveHistory,
  onAnnounce,
  onShowToast,
}) => {
  const [val, setVal] = useState<string>(initialInputs?.val || '25');
  const [unit, setUnit] = useState<'C' | 'F' | 'K'>((initialInputs?.unit as 'C' | 'F' | 'K') || 'C');

  const res = convertTemperature(Number(val), unit, unit === 'C' ? 'F' : 'C');

  useEffect(() => {
    if (res.isValid && res.data) {
      onAnnounce(`${val} °${unit} = ${res.data.celsius} °C, ${res.data.fahrenheit} °F, ${res.data.kelvin} K`);
    }
  }, [res.data?.celsius]);

  const handleShare = () => {
    const url = generateShareUrl('temperature', { val, unit });
    navigator.clipboard.writeText(url);
    onShowToast({ type: 'success', message: 'Temperature link copied!' });
  };

  const handleSave = () => {
    if (!res.isValid || !res.data) return;
    onSaveHistory(
      'temperature',
      'Temperature Converter',
      { val, unit },
      `${val}°${unit} -> ${res.data.celsius}°C / ${res.data.fahrenheit}°F / ${res.data.kelvin} K`
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Thermometer className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Temperature (With Absolute Zero Bounds)</h2>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Temperature Value</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Rejects impossible values below Absolute Zero (-273.15 °C / 0 K)
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Input Scale</label>
            <div className="flex gap-2">
              {(['C', 'F', 'K'] as const).map((scale) => (
                <button
                  key={scale}
                  onClick={() => setUnit(scale)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                    unit === scale ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  °{scale} {scale === 'C' ? 'Celsius' : scale === 'F' ? 'Fahrenheit' : 'Kelvin'}
                </button>
              ))}
            </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30">
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Celsius</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {res.data.celsius} °C
            </div>
            <p className="text-xs text-slate-400 mt-1">Freezes at 0°C, boils at 100°C</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Fahrenheit</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 mt-1">
              {res.data.fahrenheit} °F
            </div>
            <p className="text-xs text-slate-400 mt-1">Freezes at 32°F, boils at 212°F</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Kelvin</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1">
              {res.data.kelvin} K
            </div>
            <p className="text-xs text-slate-400 mt-1">Absolute thermodynamic zero = 0 K</p>
          </div>
        </div>
      )}
    </div>
  );
};

// =================================================================
// 18. Fuel Cost & Mileage Calculator
// =================================================================
export const FuelCalculatorView: React.FC<CommonProps> = ({
  initialInputs,
  onSaveHistory,
  onAnnounce,
  onShowToast,
}) => {
  const [distance, setDistance] = useState<string>(initialInputs?.dist || '350');
  const [efficiency, setEfficiency] = useState<string>(initialInputs?.eff || '28');
  const [price, setPrice] = useState<string>(initialInputs?.price || '3.75');
  const [unitType, setUnitType] = useState<'mpg' | 'l_100km'>('mpg');

  const res = calculateFuelCost(Number(distance), Number(efficiency), Number(price), unitType);

  useEffect(() => {
    if (res.isValid && res.data) {
      onAnnounce(`Total fuel cost: $${res.data.totalCost}`);
    }
  }, [res.data?.totalCost]);

  const handleShare = () => {
    const url = generateShareUrl('fuel', { dist: distance, eff: efficiency, price });
    navigator.clipboard.writeText(url);
    onShowToast({ type: 'success', message: 'Fuel cost link copied!' });
  };

  const handleSave = () => {
    if (!res.isValid || !res.data) return;
    onSaveHistory(
      'fuel',
      'Fuel Cost & Mileage',
      { distance, efficiency, price },
      `${distance} miles @ ${efficiency} MPG ($${price}/gal) -> $${res.data.totalCost} total`
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Fuel className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Road Trip Fuel & Mileage</h2>
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

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">Measurement Standard:</span>
          <div className="flex rounded-lg bg-slate-950 p-0.5 text-xs border border-slate-800">
            <button
              onClick={() => setUnitType('mpg')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                unitType === 'mpg' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              Miles & MPG (US)
            </button>
            <button
              onClick={() => setUnitType('l_100km')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                unitType === 'l_100km' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              Km & L/100km (Metric)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Trip Distance ({unitType === 'mpg' ? 'miles' : 'km'})
            </label>
            <input
              type="number"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Vehicle Efficiency ({unitType === 'mpg' ? 'MPG' : 'L/100km'})
            </label>
            <input
              type="number"
              step="0.1"
              value={efficiency}
              onChange={(e) => setEfficiency(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Fuel Price ($ / {unitType === 'mpg' ? 'gallon' : 'liter'})
            </label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
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
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Total Fuel Cost</span>
            <div className="text-3xl font-extrabold text-white mt-1">
              ${res.data.totalCost.toFixed(2)}
            </div>
            <p className="text-xs text-slate-400 mt-1">For entire {distance} {unitType === 'mpg' ? 'mile' : 'km'} trip</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Fuel Required</span>
            <div className="text-3xl font-extrabold text-cyan-400 mt-1">
              {res.data.fuelNeeded} <span className="text-base font-normal text-slate-400">{unitType === 'mpg' ? 'gal' : 'L'}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Fuel consumption</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Cost Per Unit Distance</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1">
              ${res.data.costPerUnitDistance.toFixed(3)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Per {unitType === 'mpg' ? 'mile' : 'km'} traveled</p>
          </div>
        </div>
      )}
    </div>
  );
};

// =================================================================
// 19. Data Transfer & Download Time Calculator
// =================================================================
export const DataTransferCalculatorView: React.FC<CommonProps> = ({
  initialInputs,
  onSaveHistory,
  onAnnounce,
  onShowToast,
}) => {
  const [fileSize, setFileSize] = useState<string>(initialInputs?.size || '50');
  const [fileUnit, setFileUnit] = useState<'MB' | 'GB' | 'TB'>('GB');
  const [speed, setSpeed] = useState<string>(initialInputs?.speed || '100');

  const res = calculateDataTransferTime(Number(fileSize), fileUnit, Number(speed));

  useEffect(() => {
    if (res.isValid && res.data) {
      onAnnounce(`Transfer time: ${res.data.formattedTime}`);
    }
  }, [res.data?.totalSeconds]);

  const handleShare = () => {
    const url = generateShareUrl('datatransfer', { size: fileSize, speed });
    navigator.clipboard.writeText(url);
    onShowToast({ type: 'success', message: 'Data transfer link copied!' });
  };

  const handleSave = () => {
    if (!res.isValid || !res.data) return;
    onSaveHistory(
      'datatransfer',
      'Data Transfer & Speed',
      { fileSize, fileUnit, speed },
      `${fileSize} ${fileUnit} at ${speed} Mbps -> Time: ${res.data.formattedTime}`
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Wifi className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Data Transfer & Download ETA</h2>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">File / Payload Size</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <select
                value={fileUnit}
                onChange={(e) => setFileUnit(e.target.value as 'MB' | 'GB' | 'TB')}
                className="w-24 px-2 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white"
              >
                <option value="MB">MB</option>
                <option value="GB">GB</option>
                <option value="TB">TB</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Bandwidth / Network Speed (Mbps)</label>
            <input
              type="number"
              value={speed}
              onChange={(e) => setSpeed(e.target.value)}
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
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Estimated Time</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {res.data.formattedTime}
            </div>
            <p className="text-xs text-slate-400 mt-1">({res.data.totalSeconds} total seconds)</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Effective Transfer Rate</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 mt-1">
              {res.data.transferRateMBps} MB/s
            </div>
            <p className="text-xs text-slate-400 mt-1">Megabytes per second (8 bits = 1 byte)</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">File Volume</span>
            <div className="text-2xl font-extrabold text-amber-400 mt-1">
              {fileSize} {fileUnit}
            </div>
            <p className="text-xs text-slate-500 mt-1">At {speed} megabits/sec line speed</p>
          </div>
        </div>
      )}
    </div>
  );
};

// =================================================================
// 20. Number Base Converter
// =================================================================
export const NumberBaseCalculatorView: React.FC<CommonProps> = ({
  initialInputs,
  onSaveHistory,
  onAnnounce,
  onShowToast,
}) => {
  const [val, setVal] = useState<string>(initialInputs?.val || '255');
  const [base, setBase] = useState<2 | 8 | 10 | 16>(10);

  const res = convertNumberBase(val, base);

  useEffect(() => {
    if (res.isValid && res.data) {
      onAnnounce(`Converted base: Dec ${res.data.dec}, Hex ${res.data.hex}, Bin ${res.data.bin}`);
    }
  }, [res.data?.dec]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    onShowToast({ type: 'info', message: `Copied ${text} to clipboard` });
  };

  const handleShare = () => {
    const url = generateShareUrl('numberbase', { val, base: String(base) });
    navigator.clipboard.writeText(url);
    onShowToast({ type: 'success', message: 'Number base link copied!' });
  };

  const handleSave = () => {
    if (!res.isValid || !res.data) return;
    onSaveHistory(
      'numberbase',
      'Number Base Converter',
      { val, base },
      `Base ${base}: ${val} -> Dec: ${res.data.dec}, Hex: ${res.data.hex}, Bin: ${res.data.bin}`
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Binary className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Programmer Radix Converter</h2>
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
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Value</label>
            <input
              type="text"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Input Radix / Base</label>
            <select
              value={base}
              onChange={(e) => setBase(Number(e.target.value) as 2 | 8 | 10 | 16)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={10}>Base 10 (Decimal)</option>
              <option value={16}>Base 16 (Hexadecimal)</option>
              <option value={2}>Base 2 (Binary)</option>
              <option value={8}>Base 8 (Octal)</option>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in font-mono">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-sans">Decimal (Base 10)</span>
              <div className="text-xl font-bold text-white mt-0.5">{res.data.dec}</div>
            </div>
            <button
              onClick={() => handleCopy(res.data?.dec || '')}
              className="p-1.5 text-slate-500 hover:text-emerald-400 transition"
              aria-label="Copy decimal"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-sans">Hexadecimal (Base 16)</span>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">0x{res.data.hex}</div>
            </div>
            <button
              onClick={() => handleCopy(res.data?.hex || '')}
              className="p-1.5 text-slate-500 hover:text-emerald-400 transition"
              aria-label="Copy hex"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between sm:col-span-2">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] text-slate-400 uppercase font-sans">Binary (Base 2)</span>
              <div className="text-sm sm:text-base font-bold text-cyan-400 mt-0.5 break-all">
                {res.data.bin}
              </div>
            </div>
            <button
              onClick={() => handleCopy(res.data?.bin || '')}
              className="p-1.5 text-slate-500 hover:text-emerald-400 transition shrink-0"
              aria-label="Copy binary"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between sm:col-span-2">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-sans">Octal (Base 8)</span>
              <div className="text-xl font-bold text-amber-400 mt-0.5">{res.data.oct}</div>
            </div>
            <button
              onClick={() => handleCopy(res.data?.oct || '')}
              className="p-1.5 text-slate-500 hover:text-emerald-400 transition"
              aria-label="Copy octal"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
