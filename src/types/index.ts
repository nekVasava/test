export type CalculatorCategory = 'financial' | 'health' | 'math' | 'conversion';

export interface CalculatorMeta {
  id: string;
  name: string;
  shortName: string;
  category: CalculatorCategory;
  description: string;
  icon: string;
  keywords: string[];
}

export interface HistoryEntry {
  id: string;
  calculatorId: string;
  calculatorName: string;
  timestamp: number;
  inputs: Record<string, string | number>;
  summary: string;
  details?: Record<string, string | number>;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface AmortizationRow {
  month: number;
  year: number;
  payment: number;
  principal: number;
  interest: number;
  totalInterestPaid: number;
  remainingBalance: number;
}

export interface TestResult {
  id: string;
  name: string;
  category: 'Regression' | 'Calculator';
  status: 'passed' | 'failed' | 'running' | 'pending';
  expected: string;
  actual?: string;
  durationMs?: number;
  errorDetails?: string;
}
