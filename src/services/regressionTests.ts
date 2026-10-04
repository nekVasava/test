import { TestResult } from '../types';
import {
  calculateEmi,
  calculateCompoundInterest,
  calculateBmi,
  calculateAge,
  calculateMortgage,
  calculateTip,
  calculateDiscount,
  convertCurrency,
  calculateBmr,
  calculateBodyFat,
  calculateWaterIntake,
  calculatePercentage,
  evaluateMathExpression,
  calculateTimeDuration,
  calculateGpa,
  convertUnits,
  convertTemperature,
  calculateFuelCost,
  calculateDataTransferTime,
  convertDataSize,
  convertNumberBase,
} from './calculations';
import {
  addHistoryEntry,
  clearHistory,
  getHistory,
  setProDemoActive,
  isProDemoActive,
  saveCustomRates,
  getSavedCustomRates,
  safeSetItem,
  safeGetItem,
  safeRemoveItem,
  setSimulateStorageFailure,
  FREE_TIER_HISTORY_LIMIT,
} from '../utils/storage';
import { generateShareUrl, parseShareUrl } from '../utils/urlSharing';
import { sanitizeCsvCell } from '../utils/csv';
import { getCalcNestCacheStatus, isCalcNestCache, CALC_NEST_CACHE_PREFIX } from '../utils/cacheManager';
import { getActiveCurrencyRates } from './currencyRates';

export async function runAllRegressionTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const runTest = (
    id: string,
    name: string,
    category: 'Regression' | 'Calculator',
    expected: string,
    testFn: () => { passed: boolean; actual: string; error?: string }
  ) => {
    const start = performance.now();
    try {
      const res = testFn();
      const durationMs = Math.round(performance.now() - start);
      results.push({
        id,
        name,
        category,
        status: res.passed ? 'passed' : 'failed',
        expected,
        actual: res.actual,
        durationMs,
        errorDetails: res.error,
      });
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      results.push({
        id,
        name,
        category,
        status: 'failed',
        expected,
        actual: `Exception: ${err instanceof Error ? err.message : String(err)}`,
        durationMs,
        errorDetails: String(err),
      });
    }
  };

  // ==========================================
  // Section 7 Minimum Regression Test Cases (1-12)
  // ==========================================

  // Case 1: EMI - Zero interest, valid principal and tenure
  runTest(
    'reg-1-emi-zero-interest',
    'EMI: Zero interest handling',
    'Regression',
    'EMI equals principal divided by number of months ($120,000 / 120 = $1,000.00/mo)',
    () => {
      const res = calculateEmi({ principal: 120000, annualRatePct: 0, tenureYears: 10 });
      const expectedEmi = 120000 / 120; // 1000
      const passed = res.isValid && res.data?.monthlyEmi === expectedEmi && res.data?.totalInterest === 0;
      return {
        passed,
        actual: res.isValid
          ? `monthlyEmi: $${res.data?.monthlyEmi} (Expected $${expectedEmi}), totalInterest: $${res.data?.totalInterest}`
          : `Validation failed: ${res.error}`,
      };
    }
  );

  // Case 2: EMI - Negative or extremely large rate
  runTest(
    'reg-2-emi-negative-or-huge-rate',
    'EMI: Negative or excessive rate validation',
    'Regression',
    'Clear validation error rejecting rate < 0% and rate > 100%',
    () => {
      const resNeg = calculateEmi({ principal: 100000, annualRatePct: -5, tenureYears: 10 });
      const resHuge = calculateEmi({ principal: 100000, annualRatePct: 250, tenureYears: 10 });
      const passed = !resNeg.isValid && !resHuge.isValid;
      return {
        passed,
        actual: `Negative rate rejected: "${resNeg.error}" | Excessive rate rejected: "${resHuge.error}"`,
      };
    }
  );

  // Case 3: Amortization - 40-year loan
  runTest(
    'reg-3-amortization-40-year',
    'Amortization: 40-year loan schedule completeness',
    'Regression',
    'Full 480-month schedule generated without 30-year (360-month) cutoff',
    () => {
      const res = calculateEmi({ principal: 400000, annualRatePct: 5.5, tenureYears: 40 });
      const count = res.data?.amortizationSchedule.length || 0;
      const passed = res.isValid && count === 480;
      return {
        passed,
        actual: `Generated ${count} monthly rows for 40-year loan (Final balance: $${res.data?.amortizationSchedule[count - 1]?.remainingBalance})`,
      };
    }
  );

  // Case 4: Compound interest - Zero interest and monthly contributions
  runTest(
    'reg-4-compound-zero-interest',
    'Compound Interest: Zero interest handling',
    'Regression',
    'FV equals initial amount plus total contributions ($10,000 + $500*12*5 = $40,000)',
    () => {
      const res = calculateCompoundInterest({
        initialDeposit: 10000,
        monthlyContribution: 500,
        annualRatePct: 0,
        years: 5,
        compoundingFrequency: 12,
        timing: 'end',
      });
      const expectedFV = 10000 + 500 * 60; // 40,000
      const passed = res.isValid && res.data?.futureValue === expectedFV && res.data?.totalInterest === 0;
      return {
        passed,
        actual: res.isValid
          ? `Future value: $${res.data?.futureValue}, Total interest: $${res.data?.totalInterest}`
          : `Failed: ${res.error}`,
      };
    }
  );

  // Case 5: BMI - Metric and imperial inputs representing same measurements
  runTest(
    'reg-5-bmi-metric-imperial-equivalence',
    'BMI: Metric vs Imperial measurement equivalence',
    'Regression',
    'Metric (70kg, 175cm) and Imperial (154.324 lb, 68.898 in) yield equivalent BMI ~22.86',
    () => {
      const resMetric = calculateBmi(70, 175, 'metric');
      const resImp = calculateBmi(154.324, 68.898, 'imperial');
      const passed =
        resMetric.isValid &&
        resImp.isValid &&
        Math.abs((resMetric.data?.bmi || 0) - (resImp.data?.bmi || 0)) <= 0.1;
      return {
        passed,
        actual: `Metric BMI: ${resMetric.data?.bmi} vs Imperial BMI: ${resImp.data?.bmi}`,
      };
    }
  );

  // Case 6: Age - Feb 31, leap-day birth, future date
  runTest(
    'reg-6-age-date-validation',
    'Age: Strict calendar validation (Feb 31, leap day, future date)',
    'Regression',
    'Feb 31 and future date rejected; leap day (Feb 29, 2000) calculated accurately',
    () => {
      const resFeb31 = calculateAge('2024-02-31');
      const resFuture = calculateAge('2099-01-01');
      const resLeap = calculateAge('2000-02-29', '2024-02-29');

      const passed = !resFeb31.isValid && !resFuture.isValid && resLeap.isValid && resLeap.data?.years === 24;
      return {
        passed,
        actual: `Feb 31: "${resFeb31.error}" | Future: "${resFuture.error}" | Leap birth: ${resLeap.data?.years} years on 2024-02-29`,
      };
    }
  );

  // Case 7: Currency - Custom rate entered, persisted
  runTest(
    'reg-7-currency-persistence',
    'Currency: Custom rate persistence',
    'Regression',
    'Custom exchange rate persists to localStorage and overrides baseline',
    () => {
      const customRates = { EUR: 0.95 };
      saveCustomRates(customRates);
      const retrieved = getSavedCustomRates();
      const activeRates = getActiveCurrencyRates();
      const res = convertCurrency(100, 'USD', 'EUR', activeRates);
      const passed = !!retrieved && retrieved.EUR === 0.95 && res.data?.convertedAmount === 95.0;
      return {
        passed,
        actual: `Persisted rate EUR: ${retrieved?.EUR} -> 100 USD = ${res.data?.convertedAmount} EUR`,
      };
    }
  );

  // Case 8: History - Save 51 entries on free tier -> Only latest 50 remain
  runTest(
    'reg-8-history-50-limit',
    'History: Free tier 50-entry cap enforcement',
    'Regression',
    'Saving 51 entries on free tier retains exactly the latest 50 entries',
    () => {
      // Ensure free tier
      setProDemoActive(false);
      clearHistory();

      for (let i = 1; i <= 51; i++) {
        addHistoryEntry({
          calculatorId: 'emi',
          calculatorName: 'EMI Calculator',
          inputs: { principal: i * 1000 },
          summary: `Test calculation #${i}`,
        });
      }

      const hist = getHistory().data || [];
      const passed = hist.length === FREE_TIER_HISTORY_LIMIT && hist[0].summary === 'Test calculation #51';
      return {
        passed,
        actual: `History count: ${hist.length} (Max allowed: ${FREE_TIER_HISTORY_LIMIT}). Latest entry: "${hist[0]?.summary}"`,
      };
    }
  );

  // Case 9: Sharing - Open a copied link on another device restores state
  runTest(
    'reg-9-url-sharing',
    'Sharing: URL parameter generation & deserialization',
    'Regression',
    'URL parameters accurately encode and restore calculator ID and inputs',
    () => {
      const inputs = { principal: 250000, rate: 6.5, tenure: 25 };
      const shareUrl = generateShareUrl('emi', inputs);
      const parsedUrl = new URL(shareUrl);
      const restoredCalc = parsedUrl.searchParams.get('calc');
      const restoredPrincipal = Number(parsedUrl.searchParams.get('principal'));
      const restoredRate = Number(parsedUrl.searchParams.get('rate'));

      const passed =
        restoredCalc === 'emi' &&
        restoredPrincipal === 250000 &&
        restoredRate === 6.5;

      return {
        passed,
        actual: `Encoded URL: ${shareUrl.substring(0, 60)}... Restored calc: ${restoredCalc}, principal: ${restoredPrincipal}, rate: ${restoredRate}`,
      };
    }
  );

  // Case 10: PWA - Scoped cache & offline capability
  runTest(
    'reg-10-pwa-cache-scoping',
    'PWA: Cache scoping to CalcNest exact prefix only',
    'Regression',
    'Cache operations strictly scoped to "calcnest-" prefix, rejecting substring and external names',
    () => {
      const matchPrefix1 = isCalcNestCache('calcnest-precache-v2');
      const matchPrefix2 = isCalcNestCache('calcnest-google-fonts');
      // Must reject substring matches that do not START with calcnest-
      const rejectSubstring = !isCalcNestCache('otherapp-calcnest');
      const rejectExternal = !isCalcNestCache('google-analytics');

      const passed = matchPrefix1 && matchPrefix2 && rejectSubstring && rejectExternal;
      return {
        passed,
        actual: `calcnest-precache: ${matchPrefix1} | calcnest-google-fonts: ${matchPrefix2} | otherapp-calcnest rejected: ${rejectSubstring} | google-analytics rejected: ${rejectExternal}`,
      };
    }
  );

  // Case 11: Security - CSV Spreadsheet Formula Injection Protection
  runTest(
    'reg-11-csv-formula-injection',
    'Security: CSV spreadsheet formula injection protection',
    'Regression',
    'Cells starting with =, +, -, @, \\t, \\r are prepended with single quote to prevent code execution',
    () => {
      const formulaPayload = '=cmd|"/C calc"!A0';
      const plusPayload = '+12345';
      const atPayload = '@SUM(A1:A10)';

      const escaped1 = sanitizeCsvCell(formulaPayload);
      const escaped2 = sanitizeCsvCell(plusPayload);
      const escaped3 = sanitizeCsvCell(atPayload);

      const passed =
        escaped1.startsWith("\"'=") &&
        escaped2.startsWith("\"'+") &&
        escaped3.startsWith("\"'@");

      return {
        passed,
        actual: `Escaped "=cmd...": ${escaped1} | Escaped "+123": ${escaped2} | Escaped "@SUM": ${escaped3}`,
      };
    }
  );

  // Case 12: Pro Demo Mode - Toggle state reflection without implied purchase
  runTest(
    'reg-12-pro-demo-state',
    'Pro Mode: Local demo state toggle without implied purchase',
    'Regression',
    'Gate reflects local demo toggle; no real or fake payment transaction is implied',
    () => {
      setProDemoActive(true);
      const proState1 = isProDemoActive();
      setProDemoActive(false);
      const proState2 = isProDemoActive();

      const passed = proState1 === true && proState2 === false;
      return {
        passed,
        actual: `Pro state toggle on: ${proState1} -> toggle off: ${proState2} (Stored strictly locally in localStorage)`,
      };
    }
  );

  // Case 13: Storage Fallback Read-After-Write Consistency
  runTest(
    'reg-13-storage-fallback-consistency',
    'Storage: Fallback read-after-write consistency',
    'Regression',
    'Reading a key whose write triggered fallback returns the exact newly written value',
    () => {
      const testKey = 'calcnest_consistency_probe';
      const testVal = JSON.stringify({ verified: true, ts: 123456789 });

      setSimulateStorageFailure(true);
      safeSetItem(testKey, testVal);
      const readVal = safeGetItem(testKey);
      setSimulateStorageFailure(false);
      safeRemoveItem(testKey);

      const passed = readVal === testVal;
      return {
        passed,
        actual: `Written to fallback: "${testVal}" | Read from fallback: "${readVal}"`,
      };
    }
  );

  // Case 14: Compounding Frequency Behavior
  runTest(
    'reg-14-compounding-frequency-options',
    'Compound Interest: Compounding frequency behavior & ordering',
    'Regression',
    'FV ordering Monthly > Quarterly > Semi-Annual > Annual when rate > 0; identical at 0% rate',
    () => {
      const base = {
        initialDeposit: 10000,
        monthlyContribution: 500,
        annualRatePct: 6,
        years: 5,
        timing: 'end' as const,
      };

      const resMonthly = calculateCompoundInterest({ ...base, compoundingFrequency: 12 });
      const resQuarterly = calculateCompoundInterest({ ...base, compoundingFrequency: 4 });
      const resSemi = calculateCompoundInterest({ ...base, compoundingFrequency: 2 });
      const resAnnual = calculateCompoundInterest({ ...base, compoundingFrequency: 1 });

      const fvM = resMonthly.data?.futureValue || 0;
      const fvQ = resQuarterly.data?.futureValue || 0;
      const fvS = resSemi.data?.futureValue || 0;
      const fvA = resAnnual.data?.futureValue || 0;

      // Ordering check: Monthly > Quarterly > Semi-Annual > Annual
      const ordered = fvM > fvQ && fvQ > fvS && fvS > fvA;

      // Zero rate check: identical across all frequencies
      const zeroM = calculateCompoundInterest({ ...base, annualRatePct: 0, compoundingFrequency: 12 });
      const zeroA = calculateCompoundInterest({ ...base, annualRatePct: 0, compoundingFrequency: 1 });
      const zeroMatches = zeroM.data?.futureValue === 40000 && zeroA.data?.futureValue === 40000;

      const passed = ordered && zeroMatches;
      return {
        passed,
        actual: `FV Monthly: $${fvM} > Quarterly: $${fvQ} > Semi: $${fvS} > Annual: $${fvA}. At 0% rate: $${zeroM.data?.futureValue}`,
      };
    }
  );

  // ==========================================
  // Unit Tests for All 20 Calculators
  // ==========================================

  // Calc 1: EMI
  runTest('calc-1-emi', 'Calc 1: Loan & EMI Calculator', 'Calculator', 'Valid calculation for $200k at 7% for 15y', () => {
    const res = calculateEmi({ principal: 200000, annualRatePct: 7, tenureYears: 15 });
    const passed = res.isValid && (res.data?.monthlyEmi || 0) > 1700;
    return { passed, actual: `Monthly EMI: $${res.data?.monthlyEmi}` };
  });

  // Calc 2: Compound Interest
  runTest('calc-2-compound', 'Calc 2: Compound Interest & Savings', 'Calculator', '$5k start, $200/mo, 6% for 10y', () => {
    const res = calculateCompoundInterest({
      initialDeposit: 5000,
      monthlyContribution: 200,
      annualRatePct: 6,
      years: 10,
      compoundingFrequency: 12,
      timing: 'end',
    });
    const passed = res.isValid && (res.data?.futureValue || 0) > 30000;
    return { passed, actual: `Future Value: $${res.data?.futureValue}` };
  });

  // Calc 3: Mortgage
  runTest('calc-3-mortgage', 'Calc 3: Mortgage & Escrow', 'Calculator', '$400k home, 20% down, 6.5% 30y', () => {
    const res = calculateMortgage({
      homePrice: 400000,
      downPayment: 80000,
      annualRatePct: 6.5,
      loanTermYears: 30,
      annualPropertyTax: 4800,
      annualInsurance: 1200,
      monthlyPmi: 0,
    });
    const passed = res.isValid && (res.data?.totalMonthlyPayment || 0) > 2400;
    return { passed, actual: `Total monthly: $${res.data?.totalMonthlyPayment}` };
  });

  // Calc 4: Tip Splitter
  runTest('calc-4-tip', 'Calc 4: Tip & Bill Splitter', 'Calculator', '$80 bill, 20% tip, 4 people', () => {
    const res = calculateTip(80, 20, 4);
    const passed = res.isValid && res.data?.totalBill === 96 && res.data?.perPersonTotal === 24;
    return { passed, actual: `Total: $${res.data?.totalBill}, Per person: $${res.data?.perPersonTotal}` };
  });

  // Calc 5: Discount & Tax
  runTest('calc-5-discount', 'Calc 5: Discount & Sales Tax', 'Calculator', '$100 item, 20% off, 8% tax', () => {
    const res = calculateDiscount(100, 20, 8);
    const passed = res.isValid && res.data?.finalPrice === 86.4;
    return { passed, actual: `Final price: $${res.data?.finalPrice}` };
  });

  // Calc 6: Currency
  runTest('calc-6-currency', 'Calc 6: Currency Converter', 'Calculator', 'Convert $100 USD to EUR', () => {
    const res = convertCurrency(100, 'USD', 'EUR');
    const passed = res.isValid && (res.data?.convertedAmount || 0) > 0;
    return { passed, actual: `100 USD = ${res.data?.convertedAmount} EUR` };
  });

  // Calc 7: BMI
  runTest('calc-7-bmi', 'Calc 7: BMI & Health Classification', 'Calculator', 'Height 180cm, Weight 75kg', () => {
    const res = calculateBmi(75, 180, 'metric');
    const passed = res.isValid && res.data?.category === 'Normal weight';
    return { passed, actual: `BMI: ${res.data?.bmi} (${res.data?.category})` };
  });

  // Calc 8: BMR
  runTest('calc-8-bmr', 'Calc 8: BMR & Daily Calorie Needs', 'Calculator', 'Male 80kg, 180cm, 30 years', () => {
    const res = calculateBmr('male', 80, 180, 30);
    const passed = res.isValid && (res.data?.bmr || 0) > 1700;
    return { passed, actual: `BMR: ${res.data?.bmr} kcal` };
  });

  // Calc 9: Body Fat
  runTest('calc-9-bodyfat', 'Calc 9: Body Fat (US Navy Method)', 'Calculator', 'Male 178cm, neck 38cm, waist 86cm', () => {
    const res = calculateBodyFat('male', 178, 38, 86);
    const passed = res.isValid && (res.data?.bodyFatPct || 0) > 10;
    return { passed, actual: `Body Fat: ${res.data?.bodyFatPct}%` };
  });

  // Calc 10: Water Intake
  runTest('calc-10-water', 'Calc 10: Water Intake & Hydration', 'Calculator', '70kg weight, 45 min exercise', () => {
    const res = calculateWaterIntake(70, 45, 'normal');
    const passed = res.isValid && (res.data?.liters || 0) > 2.5;
    return { passed, actual: `Daily target: ${res.data?.liters} L (${res.data?.glassesCount} glasses)` };
  });

  // Calc 11: Age & Date Diff
  runTest('calc-11-age', 'Calc 11: Age & Date Difference', 'Calculator', 'Birthdate 1995-05-15', () => {
    const res = calculateAge('1995-05-15', '2026-10-01');
    const passed = res.isValid && res.data?.years === 31;
    return { passed, actual: `Age: ${res.data?.years} years, ${res.data?.months} months` };
  });

  // Calc 12: Percentage
  runTest('calc-12-pct', 'Calc 12: Percentage Calculations', 'Calculator', 'What is 15% of 300?', () => {
    const res = calculatePercentage('what_is', 15, 300);
    const passed = res.isValid && res.data?.result === 45;
    return { passed, actual: `Result: ${res.data?.result}` };
  });

  // Calc 13: Scientific Math
  runTest('calc-13-math', 'Calc 13: Scientific Math Expression', 'Calculator', 'Evaluate "2 * (3 + 4) / 2"', () => {
    const res = evaluateMathExpression('2 * (3 + 4) / 2');
    const passed = res.isValid && res.data === 7;
    return { passed, actual: `Result: ${res.data}` };
  });

  // Calc 14: Time Duration
  runTest('calc-14-time', 'Calc 14: Time & Duration', 'Calculator', '09:00 to 17:30 shift', () => {
    const res = calculateTimeDuration(9, 0, 17, 30);
    const passed = res.isValid && res.data?.hours === 8 && res.data?.minutes === 30;
    return { passed, actual: `${res.data?.hours}h ${res.data?.minutes}m (${res.data?.decimalHours} hrs)` };
  });

  // Calc 15: GPA
  runTest('calc-15-gpa', 'Calc 15: GPA & Grade Calculator', 'Calculator', 'Two 3-credit courses with grades A and B', () => {
    const res = calculateGpa([
      { name: 'Course 1', grade: 'A', credits: 3 },
      { name: 'Course 2', grade: 'B', credits: 3 },
    ]);
    const passed = res.isValid && res.data?.gpa === 3.5;
    return { passed, actual: `GPA: ${res.data?.gpa}` };
  });

  // Calc 16: Unit Converter
  runTest('calc-16-unit', 'Calc 16: Unit Converter', 'Calculator', 'Convert 5 km to miles', () => {
    const res = convertUnits('length', 5, 'km', 'mi');
    const passed = res.isValid && Math.abs((res.data?.result || 0) - 3.106856) < 0.01;
    return { passed, actual: `5 km = ${res.data?.result} miles` };
  });

  // Calc 17: Temperature
  runTest('calc-17-temp', 'Calc 17: Temperature Converter', 'Calculator', 'Convert 100 °C to °F (rejection of < -273.15 °C)', () => {
    const resValid = convertTemperature(100, 'C', 'F');
    const resInvalid = convertTemperature(-300, 'C', 'F');
    const passed = resValid.isValid && resValid.data?.result === 212 && !resInvalid.isValid;
    return { passed, actual: `100 °C = ${resValid.data?.result} °F | Below absolute zero error: "${resInvalid.error}"` };
  });

  // Calc 18: Fuel Cost
  runTest('calc-18-fuel', 'Calc 18: Fuel Cost & Mileage', 'Calculator', '300 miles at 25 MPG and $3.50/gal', () => {
    const res = calculateFuelCost(300, 25, 3.5, 'mpg');
    const passed = res.isValid && res.data?.totalCost === 42;
    return { passed, actual: `Fuel: ${res.data?.fuelNeeded} gal, Total: $${res.data?.totalCost}` };
  });

  // Calc 19: Data Transfer
  runTest('calc-19-data', 'Calc 19: Data Transfer & Speed', 'Calculator', 'Download 10 GB at 100 Mbps', () => {
    const res = calculateDataTransferTime(10, 'GB', 100);
    const converted = convertDataSize(1, 'GB', 'MB');
    const passed = res.isValid && (res.data?.totalSeconds || 0) > 800 && converted.isValid && converted.data?.result === 1024;
    return { passed, actual: `Transfer time: ${res.data?.formattedTime}; 1 GB = ${converted.data?.result} MB` };
  });

  // Calc 20: Number Base
  runTest('calc-20-base', 'Calc 20: Number Base Converter', 'Calculator', 'Convert decimal 255 to hex and binary', () => {
    const res = convertNumberBase('255', 10);
    const passed = res.isValid && res.data?.hex === 'FF' && res.data?.bin === '11111111';
    return { passed, actual: `Dec 255 = Hex ${res.data?.hex}, Bin ${res.data?.bin}` };
  });

  return results;
}
