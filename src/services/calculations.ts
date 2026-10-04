import { AmortizationRow } from '../types';
import { validateFiniteNumber, validateDateString, validateTemperature } from '../utils/validation';
import { getActiveCurrencyRates } from './currencyRates';

export interface CalculationResult<T> {
  isValid: boolean;
  data?: T;
  error?: string;
}

// -------------------------------------------------------------
// 1. EMI & Loan Calculator
// -------------------------------------------------------------
export interface EmiInput {
  principal: number;
  annualRatePct: number;
  tenureYears: number;
}

export interface EmiResult {
  monthlyEmi: number;
  totalPayment: number;
  totalInterest: number;
  totalMonths: number;
  amortizationSchedule: AmortizationRow[];
}

export function calculateEmi(input: EmiInput): CalculationResult<EmiResult> {
  const pCheck = validateFiniteNumber(input.principal, {
    label: 'Principal Loan Amount',
    min: 1,
    max: 100_000_000,
    allowZero: false,
  });
  if (!pCheck.isValid) return { isValid: false, error: pCheck.error };

  const rCheck = validateFiniteNumber(input.annualRatePct, {
    label: 'Annual Interest Rate',
    min: 0,
    max: 100,
    allowZero: true,
  });
  if (!rCheck.isValid) return { isValid: false, error: rCheck.error };

  const tCheck = validateFiniteNumber(input.tenureYears, {
    label: 'Tenure (Years)',
    min: 0.1,
    max: 50,
    allowZero: false,
  });
  if (!tCheck.isValid) return { isValid: false, error: tCheck.error };

  const principal = pCheck.value;
  const annualRate = rCheck.value;
  const tenureYears = tCheck.value;
  const totalMonths = Math.round(tenureYears * 12);

  if (totalMonths <= 0) {
    return { isValid: false, error: 'Tenure must be at least 1 month.' };
  }

  let monthlyEmi = 0;
  let totalPayment = 0;
  let totalInterest = 0;
  const amortizationSchedule: AmortizationRow[] = [];

  // Zero Interest Rate Case
  if (annualRate === 0) {
    monthlyEmi = principal / totalMonths;
    totalPayment = principal;
    totalInterest = 0;

    let balance = principal;
    let accumulatedInterest = 0;

    for (let m = 1; m <= totalMonths; m++) {
      const principalPortion = m === totalMonths ? balance : principal / totalMonths;
      balance = Math.max(0, balance - principalPortion);

      amortizationSchedule.push({
        month: m,
        year: Math.ceil(m / 12),
        payment: principalPortion,
        principal: principalPortion,
        interest: 0,
        totalInterestPaid: accumulatedInterest,
        remainingBalance: balance,
      });
    }
  } else {
    const monthlyRate = annualRate / 100 / 12;
    // Standard EMI formula: E = P * r * (1+r)^n / ((1+r)^n - 1)
    const factor = Math.pow(1 + monthlyRate, totalMonths);
    monthlyEmi = (principal * monthlyRate * factor) / (factor - 1);
    totalPayment = monthlyEmi * totalMonths;
    totalInterest = totalPayment - principal;

    let balance = principal;
    let accumulatedInterest = 0;

    for (let m = 1; m <= totalMonths; m++) {
      const interestPortion = balance * monthlyRate;
      let principalPortion = monthlyEmi - interestPortion;
      accumulatedInterest += interestPortion;

      if (m === totalMonths || principalPortion > balance) {
        principalPortion = balance;
        balance = 0;
      } else {
        balance -= principalPortion;
      }

      amortizationSchedule.push({
        month: m,
        year: Math.ceil(m / 12),
        payment: principalPortion + interestPortion,
        principal: principalPortion,
        interest: interestPortion,
        totalInterestPaid: accumulatedInterest,
        remainingBalance: Math.max(0, balance),
      });
    }
  }

  return {
    isValid: true,
    data: {
      monthlyEmi: Number(monthlyEmi.toFixed(2)),
      totalPayment: Number(totalPayment.toFixed(2)),
      totalInterest: Number(totalInterest.toFixed(2)),
      totalMonths,
      amortizationSchedule,
    },
  };
}

// -------------------------------------------------------------
// 2. Compound Interest & Savings Calculator
// -------------------------------------------------------------
export interface CompoundInterestInput {
  initialDeposit: number;
  monthlyContribution: number;
  annualRatePct: number;
  years: number;
  compoundingFrequency: 1 | 2 | 4 | 12 | 365; // Annually, Semi-Annually, Quarterly, Monthly, Daily
  timing: 'start' | 'end'; // Annuity Due vs Ordinary Annuity
}

export interface CompoundInterestResult {
  futureValue: number;
  totalPrincipal: number;
  totalContributions: number;
  totalInterest: number;
  breakdownByYear: {
    year: number;
    deposited: number;
    interestEarned: number;
    endBalance: number;
  }[];
}

export function calculateCompoundInterest(
  input: CompoundInterestInput
): CalculationResult<CompoundInterestResult> {
  const initCheck = validateFiniteNumber(input.initialDeposit, {
    label: 'Initial Deposit',
    min: 0,
    allowZero: true,
  });
  if (!initCheck.isValid) return { isValid: false, error: initCheck.error };

  const contCheck = validateFiniteNumber(input.monthlyContribution, {
    label: 'Monthly Contribution',
    min: 0,
    allowZero: true,
  });
  if (!contCheck.isValid) return { isValid: false, error: contCheck.error };

  const rateCheck = validateFiniteNumber(input.annualRatePct, {
    label: 'Annual Interest Rate',
    min: 0,
    max: 100,
    allowZero: true,
  });
  if (!rateCheck.isValid) return { isValid: false, error: rateCheck.error };

  const yrCheck = validateFiniteNumber(input.years, {
    label: 'Investment Years',
    min: 1,
    max: 100,
    allowZero: false,
  });
  if (!yrCheck.isValid) return { isValid: false, error: yrCheck.error };

  const P = initCheck.value;
  const C = contCheck.value;
  const r = rateCheck.value / 100;
  const t = yrCheck.value;
  const totalMonths = t * 12;

  // Zero interest case
  if (r === 0) {
    const totalCont = C * totalMonths;
    const fv = P + totalCont;

    const breakdownByYear = [];
    for (let y = 1; y <= t; y++) {
      const deposited = P + C * (y * 12);
      breakdownByYear.push({
        year: y,
        deposited,
        interestEarned: 0,
        endBalance: deposited,
      });
    }

    return {
      isValid: true,
      data: {
        futureValue: Number(fv.toFixed(2)),
        totalPrincipal: P,
        totalContributions: totalCont,
        totalInterest: 0,
        breakdownByYear,
      },
    };
  }

  // Equivalent monthly rate based on compounding frequency (Effective Annual Rate equivalence)
  // freq: 1=Annually, 2=Semi-Annually, 4=Quarterly, 12=Monthly, 365=Daily
  const freq = input.compoundingFrequency || 12;
  const rMonth = freq === 12 ? r / 12 : Math.pow(1 + r / freq, freq / 12) - 1;

  let currentBalance = P;
  let cumulativeInterest = 0;
  const breakdownByYear = [];

  for (let m = 1; m <= totalMonths; m++) {
    if (input.timing === 'start') {
      currentBalance += C;
      const monthInterest = currentBalance * rMonth;
      currentBalance += monthInterest;
      cumulativeInterest += monthInterest;
    } else {
      const monthInterest = currentBalance * rMonth;
      currentBalance += monthInterest + C;
      cumulativeInterest += monthInterest;
    }

    if (m % 12 === 0) {
      const currentYear = m / 12;
      const deposited = P + C * m;
      breakdownByYear.push({
        year: currentYear,
        deposited: Number(deposited.toFixed(2)),
        interestEarned: Number(cumulativeInterest.toFixed(2)),
        endBalance: Number(currentBalance.toFixed(2)),
      });
    }
  }

  const totalContributions = C * totalMonths;

  return {
    isValid: true,
    data: {
      futureValue: Number(currentBalance.toFixed(2)),
      totalPrincipal: P,
      totalContributions: Number(totalContributions.toFixed(2)),
      totalInterest: Number(cumulativeInterest.toFixed(2)),
      breakdownByYear,
    },
  };
}

// -------------------------------------------------------------
// 3. Mortgage Calculator
// -------------------------------------------------------------
export interface MortgageInput {
  homePrice: number;
  downPayment: number;
  annualRatePct: number;
  loanTermYears: number;
  annualPropertyTax: number;
  annualInsurance: number;
  monthlyPmi: number;
}

export function calculateMortgage(input: MortgageInput) {
  const priceCheck = validateFiniteNumber(input.homePrice, {
    label: 'Home Price',
    min: 1000,
    allowZero: false,
  });
  if (!priceCheck.isValid) return { isValid: false, error: priceCheck.error };

  const downCheck = validateFiniteNumber(input.downPayment, {
    label: 'Down Payment',
    min: 0,
    max: input.homePrice,
    allowZero: true,
  });
  if (!downCheck.isValid) return { isValid: false, error: downCheck.error };

  const loanAmount = input.homePrice - input.downPayment;
  const emiRes = calculateEmi({
    principal: loanAmount,
    annualRatePct: input.annualRatePct,
    tenureYears: input.loanTermYears,
  });

  if (!emiRes.isValid || !emiRes.data) {
    return { isValid: false, error: emiRes.error };
  }

  const monthlyTax = (input.annualPropertyTax || 0) / 12;
  const monthlyIns = (input.annualInsurance || 0) / 12;
  const monthlyPmi = input.monthlyPmi || 0;
  const totalMonthlyPayment = emiRes.data.monthlyEmi + monthlyTax + monthlyIns + monthlyPmi;
  const ltv = ((loanAmount / input.homePrice) * 100).toFixed(1);

  return {
    isValid: true,
    data: {
      loanAmount,
      monthlyPrincipalAndInterest: emiRes.data.monthlyEmi,
      monthlyPropertyTax: Number(monthlyTax.toFixed(2)),
      monthlyInsurance: Number(monthlyIns.toFixed(2)),
      monthlyPmi,
      totalMonthlyPayment: Number(totalMonthlyPayment.toFixed(2)),
      totalLoanInterest: emiRes.data.totalInterest,
      ltvPct: Number(ltv),
    },
  };
}

// -------------------------------------------------------------
// 4. Tip & Bill Splitter
// -------------------------------------------------------------
export function calculateTip(
  billAmount: number,
  tipPct: number,
  peopleCount: number,
  roundUp: boolean = false
) {
  const billCheck = validateFiniteNumber(billAmount, {
    label: 'Bill Amount',
    min: 0.01,
    allowZero: false,
  });
  if (!billCheck.isValid) return { isValid: false, error: billCheck.error };

  const tipCheck = validateFiniteNumber(tipPct, {
    label: 'Tip Percentage',
    min: 0,
    max: 500,
    allowZero: true,
  });
  if (!tipCheck.isValid) return { isValid: false, error: tipCheck.error };

  const peopleCheck = validateFiniteNumber(peopleCount, {
    label: 'Number of People',
    min: 1,
    max: 200,
    integerOnly: true,
  });
  if (!peopleCheck.isValid) return { isValid: false, error: peopleCheck.error };

  const bill = billCheck.value;
  const pct = tipCheck.value;
  const people = peopleCheck.value;

  let tipAmount = bill * (pct / 100);
  let totalBill = bill + tipAmount;

  if (roundUp) {
    totalBill = Math.ceil(totalBill);
    tipAmount = totalBill - bill;
  }

  const perPersonTotal = totalBill / people;
  const perPersonTip = tipAmount / people;

  return {
    isValid: true,
    data: {
      tipAmount: Number(tipAmount.toFixed(2)),
      totalBill: Number(totalBill.toFixed(2)),
      perPersonTotal: Number(perPersonTotal.toFixed(2)),
      perPersonTip: Number(perPersonTip.toFixed(2)),
    },
  };
}

// -------------------------------------------------------------
// 5. Discount & Sales Tax Calculator
// -------------------------------------------------------------
export function calculateDiscount(originalPrice: number, discountPct: number, taxPct: number) {
  const priceCheck = validateFiniteNumber(originalPrice, {
    label: 'Original Price',
    min: 0,
    allowZero: true,
  });
  if (!priceCheck.isValid) return { isValid: false, error: priceCheck.error };

  const discCheck = validateFiniteNumber(discountPct, {
    label: 'Discount Percentage',
    min: 0,
    max: 100,
    allowZero: true,
  });
  if (!discCheck.isValid) return { isValid: false, error: discCheck.error };

  const taxCheck = validateFiniteNumber(taxPct, {
    label: 'Tax Percentage',
    min: 0,
    max: 100,
    allowZero: true,
  });
  if (!taxCheck.isValid) return { isValid: false, error: taxCheck.error };

  const price = priceCheck.value;
  const discountSavings = price * (discCheck.value / 100);
  const discountedPrice = price - discountSavings;
  const taxAmount = discountedPrice * (taxCheck.value / 100);
  const finalPrice = discountedPrice + taxAmount;

  return {
    isValid: true,
    data: {
      originalPrice: price,
      discountSavings: Number(discountSavings.toFixed(2)),
      discountedPrice: Number(discountedPrice.toFixed(2)),
      taxAmount: Number(taxAmount.toFixed(2)),
      finalPrice: Number(finalPrice.toFixed(2)),
    },
  };
}

// -------------------------------------------------------------
// 6. Currency Converter
// -------------------------------------------------------------
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number> = getActiveCurrencyRates()
) {
  const amtCheck = validateFiniteNumber(amount, {
    label: 'Currency Amount',
    min: 0,
    allowZero: true,
  });
  if (!amtCheck.isValid) return { isValid: false, error: amtCheck.error };

  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];

  if (!fromRate || !toRate) {
    return { isValid: false, error: 'Selected currency exchange rate not found.' };
  }

  // Conversion: amount in USD = amount / fromRate; amount in target = USD * toRate
  const usdAmount = amtCheck.value / fromRate;
  const result = usdAmount * toRate;
  const exchangeRate = toRate / fromRate;

  return {
    isValid: true,
    data: {
      convertedAmount: Number(result.toFixed(2)),
      exchangeRate: Number(exchangeRate.toFixed(4)),
    },
  };
}

// -------------------------------------------------------------
// 7. BMI & Body Health Calculator
// -------------------------------------------------------------
export function calculateBmi(
  weight: number,
  height: number,
  unit: 'metric' | 'imperial' // metric: kg & cm; imperial: lbs & inches
) {
  const wCheck = validateFiniteNumber(weight, {
    label: 'Weight',
    min: 1,
    max: 1000,
    allowZero: false,
  });
  if (!wCheck.isValid) return { isValid: false, error: wCheck.error };

  const hCheck = validateFiniteNumber(height, {
    label: 'Height',
    min: 1,
    max: 300,
    allowZero: false,
  });
  if (!hCheck.isValid) return { isValid: false, error: hCheck.error };

  let bmi = 0;
  if (unit === 'metric') {
    // kg / (m^2) where height is in cm
    const heightMeters = hCheck.value / 100;
    bmi = wCheck.value / (heightMeters * heightMeters);
  } else {
    // imperial: 703 * lbs / (in^2)
    bmi = (703 * wCheck.value) / (hCheck.value * hCheck.value);
  }

  let category = 'Normal weight';
  let categoryColor = 'text-emerald-400';

  if (bmi < 18.5) {
    category = 'Underweight';
    categoryColor = 'text-amber-400';
  } else if (bmi < 25) {
    category = 'Normal weight';
    categoryColor = 'text-emerald-400';
  } else if (bmi < 30) {
    category = 'Overweight';
    categoryColor = 'text-yellow-400';
  } else {
    category = 'Obesity';
    categoryColor = 'text-rose-400';
  }

  return {
    isValid: true,
    data: {
      bmi: Number(bmi.toFixed(2)),
      category,
      categoryColor,
      disclaimer:
        'Medical Disclaimer: BMI is a general screening indicator and does not differentiate between muscle mass, bone density, or fat distribution. Consult a licensed physician for clinical guidance.',
    },
  };
}

// -------------------------------------------------------------
// 8. BMR & Daily Calorie Needs Calculator
// -------------------------------------------------------------
export function calculateBmr(
  gender: 'male' | 'female',
  weightKg: number,
  heightCm: number,
  ageYears: number,
  activityMultiplier: number = 1.2
) {
  const wCheck = validateFiniteNumber(weightKg, { label: 'Weight (kg)', min: 10, max: 400 });
  if (!wCheck.isValid) return { isValid: false, error: wCheck.error };

  const hCheck = validateFiniteNumber(heightCm, { label: 'Height (cm)', min: 50, max: 280 });
  if (!hCheck.isValid) return { isValid: false, error: hCheck.error };

  const aCheck = validateFiniteNumber(ageYears, { label: 'Age (years)', min: 1, max: 120, integerOnly: true });
  if (!aCheck.isValid) return { isValid: false, error: aCheck.error };

  // Mifflin-St Jeor Equation:
  // Male: 10 * weight + 6.25 * height - 5 * age + 5
  // Female: 10 * weight + 6.25 * height - 5 * age - 161
  let bmr = 10 * wCheck.value + 6.25 * hCheck.value - 5 * aCheck.value;
  if (gender === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  const tdee = bmr * activityMultiplier;

  return {
    isValid: true,
    data: {
      bmr: Math.round(bmr),
      maintenanceCalories: Math.round(tdee),
      mildLossCalories: Math.round(tdee - 250),
      weightLossCalories: Math.round(tdee - 500),
      weightGainCalories: Math.round(tdee + 350),
      disclaimer:
        'Health Disclaimer: Calorie targets are statistical estimates based on the Mifflin-St Jeor formula. Dietary requirements vary with metabolism, health condition, and body composition.',
    },
  };
}

// -------------------------------------------------------------
// 9. Body Fat Percentage (US Navy Method)
// -------------------------------------------------------------
export function calculateBodyFat(
  gender: 'male' | 'female',
  heightCm: number,
  neckCm: number,
  waistCm: number,
  hipCm: number = 0
) {
  const hCheck = validateFiniteNumber(heightCm, { label: 'Height (cm)', min: 50, max: 280 });
  if (!hCheck.isValid) return { isValid: false, error: hCheck.error };

  const nCheck = validateFiniteNumber(neckCm, { label: 'Neck (cm)', min: 15, max: 100 });
  if (!nCheck.isValid) return { isValid: false, error: nCheck.error };

  const wCheck = validateFiniteNumber(waistCm, { label: 'Waist (cm)', min: 30, max: 250 });
  if (!wCheck.isValid) return { isValid: false, error: wCheck.error };

  let bodyFatPct = 0;

  if (gender === 'male') {
    if (wCheck.value <= nCheck.value) {
      return { isValid: false, error: 'Waist circumference must be greater than neck circumference.' };
    }
    // 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
    const logWaistNeck = Math.log10(wCheck.value - nCheck.value);
    const logHeight = Math.log10(hCheck.value);
    const denom = 1.0324 - 0.19077 * logWaistNeck + 0.15456 * logHeight;
    bodyFatPct = 495 / denom - 450;
  } else {
    const hipCheck = validateFiniteNumber(hipCm, { label: 'Hip (cm)', min: 30, max: 250 });
    if (!hipCheck.isValid) return { isValid: false, error: hipCheck.error };
    if (wCheck.value + hipCheck.value <= nCheck.value) {
      return { isValid: false, error: 'Waist + hip circumference must exceed neck circumference.' };
    }
    // 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(height)) - 450
    const logWaistHipNeck = Math.log10(wCheck.value + hipCheck.value - nCheck.value);
    const logHeight = Math.log10(hCheck.value);
    const denom = 1.29579 - 0.35004 * logWaistHipNeck + 0.221 * logHeight;
    bodyFatPct = 495 / denom - 450;
  }

  bodyFatPct = Math.max(2, Math.min(70, bodyFatPct));

  return {
    isValid: true,
    data: {
      bodyFatPct: Number(bodyFatPct.toFixed(1)),
      disclaimer:
        'Health Disclaimer: The US Navy body circumference method yields an estimate with an average variance of ~3-4% compared to DEXA scans.',
    },
  };
}

// -------------------------------------------------------------
// 10. Water Intake & Hydration Calculator
// -------------------------------------------------------------
export function calculateWaterIntake(
  weightKg: number,
  exerciseMinutesPerDay: number,
  climate: 'normal' | 'hot' | 'cold'
) {
  const wCheck = validateFiniteNumber(weightKg, { label: 'Body Weight (kg)', min: 10, max: 350 });
  if (!wCheck.isValid) return { isValid: false, error: wCheck.error };

  const exCheck = validateFiniteNumber(exerciseMinutesPerDay, {
    label: 'Daily Exercise Minutes',
    min: 0,
    max: 600,
  });
  if (!exCheck.isValid) return { isValid: false, error: exCheck.error };

  // Base hydration: ~35 ml per kg of body weight
  let liters = (wCheck.value * 35) / 1000;

  // Add 350ml per 30 minutes of exercise
  liters += (exCheck.value / 30) * 0.35;

  if (climate === 'hot') {
    liters += 0.5;
  } else if (climate === 'cold') {
    liters -= 0.1;
  }

  const fluidOunces = liters * 33.814;
  const glasses = Math.round(liters / 0.25); // 250ml glass

  return {
    isValid: true,
    data: {
      liters: Number(liters.toFixed(2)),
      fluidOunces: Number(fluidOunces.toFixed(1)),
      glassesCount: glasses,
      disclaimer:
        'Hydration Disclaimer: Individual fluid needs fluctuate with humidity, health conditions, fever, and medications. Individuals with renal or cardiac restrictions should adhere to clinical guidelines.',
    },
  };
}

// -------------------------------------------------------------
// 11. Age & Date Difference Calculator
// -------------------------------------------------------------
export function calculateAge(birthDateStr: string, asOfDateStr?: string) {
  const bCheck = validateDateString(birthDateStr, { rejectFuture: true, label: 'Birth date' });
  if (!bCheck.isValid) return { isValid: false, error: bCheck.error };

  const targetDateStr = asOfDateStr || new Date().toISOString().split('T')[0];
  const tCheck = validateDateString(targetDateStr, { label: 'Target date' });
  if (!tCheck.isValid) return { isValid: false, error: tCheck.error };

  const bParts = birthDateStr.split('-').map(Number);
  const tParts = targetDateStr.split('-').map(Number);

  const birthDate = new Date(bParts[0], bParts[1] - 1, bParts[2]);
  const targetDate = new Date(tParts[0], tParts[1] - 1, tParts[2]);

  if (targetDate.getTime() < birthDate.getTime()) {
    return { isValid: false, error: 'Target date cannot be earlier than birth date.' };
  }

  let years = targetDate.getFullYear() - birthDate.getFullYear();
  let months = targetDate.getMonth() - birthDate.getMonth();
  let days = targetDate.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    // Get days in previous month
    const prevMonthDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0);
    days += prevMonthDate.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const diffMs = targetDate.getTime() - birthDate.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.floor(totalDays / 7);

  // Next birthday calculation
  let nextBdayYear = targetDate.getFullYear();
  let nextBday = new Date(nextBdayYear, bParts[1] - 1, bParts[2]);
  if (nextBday.getTime() < targetDate.getTime()) {
    nextBday = new Date(nextBdayYear + 1, bParts[1] - 1, bParts[2]);
  }
  const daysUntilNextBirthday = Math.ceil((nextBday.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));

  return {
    isValid: true,
    data: {
      years,
      months,
      days,
      totalDays,
      totalWeeks,
      daysUntilNextBirthday,
    },
  };
}

// -------------------------------------------------------------
// 12. Percentage Calculator
// -------------------------------------------------------------
export function calculatePercentage(mode: 'what_is' | 'is_what' | 'change', x: number, y: number) {
  const xCheck = validateFiniteNumber(x, { label: 'First Value (X)', allowNegative: true });
  if (!xCheck.isValid) return { isValid: false, error: xCheck.error };

  const yCheck = validateFiniteNumber(y, { label: 'Second Value (Y)', allowNegative: true });
  if (!yCheck.isValid) return { isValid: false, error: yCheck.error };

  if (mode === 'what_is') {
    // What is X% of Y?
    const result = (xCheck.value / 100) * yCheck.value;
    return {
      isValid: true,
      data: {
        result: Number(result.toFixed(4)),
        explanation: `${xCheck.value}% of ${yCheck.value} = ${Number(result.toFixed(4))}`,
      },
    };
  }

  if (mode === 'is_what') {
    // X is what % of Y?
    if (yCheck.value === 0) {
      return { isValid: false, error: 'Cannot calculate percentage of zero (division by zero).' };
    }
    const result = (xCheck.value / yCheck.value) * 100;
    return {
      isValid: true,
      data: {
        result: Number(result.toFixed(4)),
        explanation: `${xCheck.value} is ${Number(result.toFixed(4))}% of ${yCheck.value}`,
      },
    };
  }

  // mode === 'change'
  // Percentage change from X to Y
  if (xCheck.value === 0) {
    return { isValid: false, error: 'Cannot calculate percentage change from zero.' };
  }
  const diff = yCheck.value - xCheck.value;
  const pctChange = (diff / Math.abs(xCheck.value)) * 100;

  return {
    isValid: true,
    data: {
      result: Number(pctChange.toFixed(4)),
      isIncrease: pctChange >= 0,
      explanation: `${pctChange >= 0 ? 'Increase' : 'Decrease'} of ${Math.abs(Number(pctChange.toFixed(4)))}% from ${xCheck.value} to ${yCheck.value}`,
    },
  };
}

// -------------------------------------------------------------
// 13. Simple & Scientific Math Calculator
// -------------------------------------------------------------
export function evaluateMathExpression(expr: string): CalculationResult<number> {
  if (!expr || expr.trim() === '') {
    return { isValid: false, error: 'Expression is empty.' };
  }

  // Tokenize & sanitize safely without evil eval
  // Replace symbols: × with *, ÷ with /, π with Math.PI, e with Math.E
  const sanitized = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'Math.PI')
    .replace(/\be\b/g, 'Math.E')
    .replace(/sin\(/g, 'Math.sin(')
    .replace(/cos\(/g, 'Math.cos(')
    .replace(/tan\(/g, 'Math.tan(')
    .replace(/sqrt\(/g, 'Math.sqrt(')
    .replace(/log\(/g, 'Math.log10(')
    .replace(/ln\(/g, 'Math.log(');

  // Validate only allowed math characters
  if (!/^[\d\s+\-*/().%MathPIEcositanqrlg,]+$/.test(sanitized)) {
    return { isValid: false, error: 'Expression contains disallowed tokens.' };
  }

  try {
    const fn = new Function(`"use strict"; return (${sanitized});`);
    const val = fn();

    if (!Number.isFinite(val)) {
      return { isValid: false, error: 'Calculation resulted in an invalid or infinite value (e.g. division by zero).' };
    }

    return { isValid: true, data: Number(val.toFixed(8)) };
  } catch (err) {
    return {
      isValid: false,
      error: `Syntax Error: ${err instanceof Error ? err.message : 'Invalid mathematical expression.'}`,
    };
  }
}

// -------------------------------------------------------------
// 14. Time & Duration Calculator
// -------------------------------------------------------------
export function calculateTimeDuration(
  startH: number,
  startM: number,
  endH: number,
  endM: number
) {
  const startCheckH = validateFiniteNumber(startH, { min: 0, max: 23, integerOnly: true });
  const startCheckM = validateFiniteNumber(startM, { min: 0, max: 59, integerOnly: true });
  const endCheckH = validateFiniteNumber(endH, { min: 0, max: 23, integerOnly: true });
  const endCheckM = validateFiniteNumber(endM, { min: 0, max: 59, integerOnly: true });

  if (!startCheckH.isValid || !startCheckM.isValid || !endCheckH.isValid || !endCheckM.isValid) {
    return { isValid: false, error: 'Hours must be 0-23 and minutes 0-59.' };
  }

  const startTotalMinutes = startH * 60 + startM;
  let endTotalMinutes = endH * 60 + endM;

  // If end is less than start, assume overnight (spans across midnight)
  if (endTotalMinutes < startTotalMinutes) {
    endTotalMinutes += 24 * 60;
  }

  const diffMinutes = endTotalMinutes - startTotalMinutes;
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  const decimalHours = Number((diffMinutes / 60).toFixed(2));

  return {
    isValid: true,
    data: {
      hours,
      minutes,
      totalMinutes: diffMinutes,
      decimalHours,
    },
  };
}

// -------------------------------------------------------------
// 15. GPA & Grade Calculator
// -------------------------------------------------------------
export interface CourseGrade {
  name: string;
  grade: string; // A+, A, A-, B+, B, B-, C+, C, C-, D, F
  credits: number;
}

const GRADE_POINTS: Record<string, number> = {
  'A+': 4.0,
  A: 4.0,
  'A-': 3.7,
  'B+': 3.3,
  B: 3.0,
  'B-': 2.7,
  'C+': 2.3,
  C: 2.0,
  'C-': 1.7,
  'D+': 1.3,
  D: 1.0,
  F: 0.0,
};

export function calculateGpa(courses: CourseGrade[]) {
  if (!courses || courses.length === 0) {
    return { isValid: false, error: 'Add at least one course to compute GPA.' };
  }

  let totalPoints = 0;
  let totalCredits = 0;

  for (const c of courses) {
    const pts = GRADE_POINTS[c.grade.toUpperCase()];
    if (pts === undefined) {
      return { isValid: false, error: `Unrecognized letter grade: ${c.grade}` };
    }
    const credCheck = validateFiniteNumber(c.credits, { label: 'Credits', min: 0.5, max: 20 });
    if (!credCheck.isValid) return { isValid: false, error: credCheck.error };

    totalPoints += pts * credCheck.value;
    totalCredits += credCheck.value;
  }

  if (totalCredits === 0) {
    return { isValid: false, error: 'Total credits cannot be zero.' };
  }

  const gpa = totalPoints / totalCredits;

  return {
    isValid: true,
    data: {
      gpa: Number(gpa.toFixed(2)),
      totalCredits,
      totalPoints: Number(totalPoints.toFixed(2)),
    },
  };
}

// -------------------------------------------------------------
// 16. Unit Converter (Length, Mass, Speed, Area, Volume)
// -------------------------------------------------------------
export type UnitCategory = 'length' | 'mass' | 'speed' | 'area' | 'volume';

export const UNIT_CONVERSIONS: Record<
  UnitCategory,
  { base: string; units: Record<string, number> }
> = {
  length: {
    base: 'm',
    units: {
      m: 1,
      km: 1000,
      cm: 0.01,
      mm: 0.001,
      mi: 1609.344,
      yd: 0.9144,
      ft: 0.3048,
      in: 0.0254,
    },
  },
  mass: {
    base: 'kg',
    units: {
      kg: 1,
      g: 0.001,
      mg: 0.000001,
      lb: 0.45359237,
      oz: 0.028349523,
    },
  },
  speed: {
    base: 'm_s',
    units: {
      m_s: 1,
      km_h: 0.27777778,
      mph: 0.44704,
      knot: 0.514444,
    },
  },
  area: {
    base: 'sq_m',
    units: {
      sq_m: 1,
      sq_km: 1000000,
      sq_ft: 0.092903,
      acre: 4046.86,
      hectare: 10000,
    },
  },
  volume: {
    base: 'l',
    units: {
      l: 1,
      ml: 0.001,
      gal: 3.78541,
      fl_oz: 0.0295735,
      cup: 0.236588,
    },
  },
};

export function convertUnits(
  category: UnitCategory,
  value: number,
  fromUnit: string,
  toUnit: string
) {
  const valCheck = validateFiniteNumber(value, {
    label: 'Value',
    allowNegative: false,
    allowZero: true,
  });
  if (!valCheck.isValid) return { isValid: false, error: valCheck.error };

  const catData = UNIT_CONVERSIONS[category];
  if (!catData) return { isValid: false, error: 'Unknown unit category.' };

  const fromFactor = catData.units[fromUnit];
  const toFactor = catData.units[toUnit];

  if (!fromFactor || !toFactor) {
    return { isValid: false, error: 'Invalid from/to unit selected.' };
  }

  // Convert to base, then to target
  const baseValue = valCheck.value * fromFactor;
  const result = baseValue / toFactor;

  return {
    isValid: true,
    data: {
      result: Number(result.toPrecision(8)),
      fromUnit,
      toUnit,
    },
  };
}

// -------------------------------------------------------------
// 17. Temperature Converter
// -------------------------------------------------------------
export function convertTemperature(value: number, fromUnit: 'C' | 'F' | 'K', toUnit: 'C' | 'F' | 'K') {
  const valCheck = validateTemperature(value, fromUnit);
  if (!valCheck.isValid) return { isValid: false, error: valCheck.error };

  // Convert to Celsius first
  let c = value;
  if (fromUnit === 'F') {
    c = ((value - 32) * 5) / 9;
  } else if (fromUnit === 'K') {
    c = value - 273.15;
  }

  // Double check absolute zero on Celsius
  if (c < -273.15) {
    return {
      isValid: false,
      error: `Temperature cannot be below absolute zero (-273.15 °C). Received: ${value} ${fromUnit}`,
    };
  }

  // Convert Celsius to target
  let target = c;
  if (toUnit === 'F') {
    target = (c * 9) / 5 + 32;
  } else if (toUnit === 'K') {
    target = c + 273.15;
  }

  return {
    isValid: true,
    data: {
      result: Number(target.toFixed(2)),
      celsius: Number(c.toFixed(2)),
      fahrenheit: Number(((c * 9) / 5 + 32).toFixed(2)),
      kelvin: Number((c + 273.15).toFixed(2)),
    },
  };
}

// -------------------------------------------------------------
// 18. Fuel Cost & Mileage Calculator
// -------------------------------------------------------------
export function calculateFuelCost(
  distance: number,
  efficiency: number,
  pricePerUnit: number,
  unitType: 'mpg' | 'l_100km'
) {
  const distCheck = validateFiniteNumber(distance, { label: 'Distance', min: 0.1 });
  const effCheck = validateFiniteNumber(efficiency, { label: 'Fuel Efficiency', min: 0.1 });
  const priceCheck = validateFiniteNumber(pricePerUnit, { label: 'Fuel Price', min: 0.01 });

  if (!distCheck.isValid) return { isValid: false, error: distCheck.error };
  if (!effCheck.isValid) return { isValid: false, error: effCheck.error };
  if (!priceCheck.isValid) return { isValid: false, error: priceCheck.error };

  let totalFuelNeeded = 0;

  if (unitType === 'mpg') {
    // Distance (miles) / MPG = Gallons needed
    totalFuelNeeded = distCheck.value / effCheck.value;
  } else {
    // Distance (km) * (L/100km) / 100 = Liters needed
    totalFuelNeeded = (distCheck.value * effCheck.value) / 100;
  }

  const totalCost = totalFuelNeeded * priceCheck.value;
  const costPerUnitDistance = totalCost / distCheck.value;

  return {
    isValid: true,
    data: {
      fuelNeeded: Number(totalFuelNeeded.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      costPerUnitDistance: Number(costPerUnitDistance.toFixed(3)),
    },
  };
}

// -------------------------------------------------------------
// 19. Data Transfer & Download Time Calculator
// -------------------------------------------------------------
export function calculateDataTransferTime(
  fileSize: number,
  fileUnit: DataSizeUnit,
  networkSpeedMbps: number
) {
  const sizeCheck = validateFiniteNumber(fileSize, { label: 'File Size', min: 0.01 });
  const speedCheck = validateFiniteNumber(networkSpeedMbps, { label: 'Network Speed (Mbps)', min: 0.01 });

  if (!sizeCheck.isValid) return { isValid: false, error: sizeCheck.error };
  if (!speedCheck.isValid) return { isValid: false, error: speedCheck.error };

  // Convert file size to megabits (1 Byte = 8 bits)
  const multipliers: Record<string, number> = {
    B: 8 / (1024 * 1024),
    KB: 8 / 1024,
    MB: 8,
    GB: 8 * 1024,
    TB: 8 * 1024 * 1024,
  };

  const totalMegabits = sizeCheck.value * multipliers[fileUnit];
  const totalSeconds = totalMegabits / speedCheck.value;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);

  return {
    isValid: true,
    data: {
      totalSeconds: Number(totalSeconds.toFixed(1)),
      formattedTime: `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`,
      transferRateMBps: Number((speedCheck.value / 8).toFixed(2)),
    },
  };
}

export type DataSizeUnit = 'B' | 'KB' | 'MB' | 'GB' | 'TB';

export function convertDataSize(value: number, fromUnit: DataSizeUnit, toUnit: DataSizeUnit) {
  const valueCheck = validateFiniteNumber(value, {
    label: 'File Size',
    min: 0,
    allowZero: true,
  });
  if (!valueCheck.isValid) return { isValid: false, error: valueCheck.error };

  const bytesPerUnit: Record<DataSizeUnit, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
    TB: 1024 ** 4,
  };
  const result = (valueCheck.value * bytesPerUnit[fromUnit]) / bytesPerUnit[toUnit];

  return {
    isValid: true,
    data: { result: Number(result.toPrecision(8)), fromUnit, toUnit },
  };
}

// -------------------------------------------------------------
// 20. Number Base Converter
// -------------------------------------------------------------
export function convertNumberBase(valueStr: string, fromBase: 2 | 8 | 10 | 16) {
  if (!valueStr || valueStr.trim() === '') {
    return { isValid: false, error: 'Input value is required.' };
  }

  const clean = valueStr.trim();
  const validCharsMap: Record<number, RegExp> = {
    2: /^[01]+$/,
    8: /^[0-7]+$/,
    10: /^-?\d+$/,
    16: /^[0-9a-fA-F]+$/,
  };

  if (!validCharsMap[fromBase].test(clean)) {
    return { isValid: false, error: `Invalid characters for base ${fromBase}.` };
  }

  const decimalVal = parseInt(clean, fromBase);
  if (!Number.isFinite(decimalVal)) {
    return { isValid: false, error: 'Value exceeds safe integer bounds.' };
  }

  return {
    isValid: true,
    data: {
      bin: (decimalVal >>> 0).toString(2),
      oct: (decimalVal >>> 0).toString(8),
      dec: decimalVal.toString(10),
      hex: (decimalVal >>> 0).toString(16).toUpperCase(),
    },
  };
}
