import { ValidationResult } from '../types';

export interface NumberValidationOptions {
  label?: string;
  min?: number;
  max?: number;
  allowZero?: boolean;
  allowNegative?: boolean;
  integerOnly?: boolean;
}

/**
 * Validates finite number input with range and integrity checks.
 */
export function validateFiniteNumber(
  value: string | number,
  options: NumberValidationOptions = {}
): { isValid: boolean; value: number; error?: string } {
  const {
    label = 'Value',
    min = -Infinity,
    max = Infinity,
    allowZero = true,
    allowNegative = false,
    integerOnly = false,
  } = options;

  if (value === '' || value === null || value === undefined) {
    return { isValid: false, value: 0, error: `${label} is required.` };
  }

  const num = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(num)) {
    return {
      isValid: false,
      value: 0,
      error: `${label} must be a valid, finite number (not NaN or Infinity).`,
    };
  }

  if (!allowNegative && num < 0) {
    return {
      isValid: false,
      value: num,
      error: `${label} cannot be negative.`,
    };
  }

  if (!allowZero && num === 0) {
    return {
      isValid: false,
      value: num,
      error: `${label} must be greater than zero.`,
    };
  }

  if (num < min) {
    return {
      isValid: false,
      value: num,
      error: `${label} must be at least ${min}.`,
    };
  }

  if (num > max) {
    return {
      isValid: false,
      value: num,
      error: `${label} cannot exceed ${max}.`,
    };
  }

  if (integerOnly && !Number.isInteger(num)) {
    return {
      isValid: false,
      value: num,
      error: `${label} must be an integer.`,
    };
  }

  return { isValid: true, value: num };
}

/**
 * Strict calendar date validation.
 * Correctly handles leap years and rejects impossible dates (e.g. Feb 31, April 31).
 * Optionally checks if date is in the future.
 */
export function validateDateString(
  dateStr: string,
  options: { rejectFuture?: boolean; label?: string } = {}
): ValidationResult {
  const { rejectFuture = false, label = 'Date' } = options;

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { isValid: false, error: `${label} must be in YYYY-MM-DD format.` };
  }

  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (month < 1 || month > 12) {
    return { isValid: false, error: `${label} month must be between 1 and 12.` };
  }

  // Days in month logic
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  const maxDays = daysInMonth[month - 1];
  if (day < 1 || day > maxDays) {
    return {
      isValid: false,
      error: `Invalid date: ${year}-${String(month).padStart(2, '0')} has ${maxDays} days. Cannot have day ${day}.`,
    };
  }

  const parsedDate = new Date(year, month - 1, day);
  // Strict roundtrip validation
  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return { isValid: false, error: `${label} is not a valid calendar date.` };
  }

  if (rejectFuture) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (parsedDate.getTime() > today.getTime()) {
      return { isValid: false, error: `${label} cannot be in the future.` };
    }
  }

  return { isValid: true };
}

/**
 * Temperature range validation respecting physical laws (Absolute Zero).
 */
export function validateTemperature(
  value: number | string,
  unit: 'C' | 'F' | 'K'
): ValidationResult {
  const check = validateFiniteNumber(value, {
    label: 'Temperature',
    allowNegative: true,
  });
  if (!check.isValid) return check;

  const t = check.value;
  if (unit === 'C' && t < -273.15) {
    return {
      isValid: false,
      error: `Temperature cannot be below absolute zero (-273.15 °C). Received: ${t} °C`,
    };
  }
  if (unit === 'F' && t < -459.67) {
    return {
      isValid: false,
      error: `Temperature cannot be below absolute zero (-459.67 °F). Received: ${t} °F`,
    };
  }
  if (unit === 'K' && t < 0) {
    return {
      isValid: false,
      error: `Temperature in Kelvin cannot be negative (absolute zero is 0 K). Received: ${t} K`,
    };
  }

  return { isValid: true };
}
