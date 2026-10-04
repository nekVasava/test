import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { handleDialogKeyDown } from '../src/hooks/useDialogAccessibility';
import { TestResult } from '../src/types';

function readSource(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

export function runAccessibilityTests(): TestResult[] {
  const results: TestResult[] = [];
  const addResult = (id: string, name: string, expected: string, passed: boolean, actual: string) => {
    results.push({
      id,
      name,
      category: 'Regression',
      status: passed ? 'passed' : 'failed',
      expected,
      actual,
      durationMs: 0,
    });
  };

  const calculatorFiles = [
    'src/components/calculators/ConversionCalculators.tsx',
    'src/components/calculators/FinancialCalculators.tsx',
    'src/components/calculators/HealthCalculators.tsx',
    'src/components/calculators/MathCalculators.tsx',
  ];
  const actionButtons = calculatorFiles.flatMap((file) => {
    const source = readSource(file);
    return Array.from(source.matchAll(/<button\b(?=[^>]*onClick=\{handle(?:Share|Save)\})[^>]*>/gs))
      .map((match) => ({ file, tag: match[0] }));
  });
  const unnamedActions = actionButtons.filter(({ tag }) => !/\baria-label\s*=\s*"[^"]+"/.test(tag));
  const mathSource = readSource('src/components/calculators/MathCalculators.tsx');
  const deleteKeyNamed = mathSource.includes("aria-label={btn === 'DEL' ? 'Delete last character' : undefined}");
  addResult(
    'a11y-action-names',
    'Accessibility: icon-only calculator action names',
    'Share, Bookmark, and Scientific Math delete controls have accessible names',
    actionButtons.length > 0 && unnamedActions.length === 0 && deleteKeyNamed,
    `${actionButtons.length} Share/Bookmark actions checked; ${unnamedActions.length} unnamed; delete key named=${deleteKeyNamed}`
  );

  const dialogFiles = [
    'src/components/history/HistoryModal.tsx',
    'src/components/tests/TestRunnerModal.tsx',
    'src/components/common/PWAInstallButton.tsx',
  ];
  const invalidDialogs = dialogFiles.filter((file) => {
    const source = readSource(file);
    return !source.includes('role="dialog"') ||
      !source.includes('aria-modal="true"') ||
      !source.includes('useDialogAccessibility');
  });
  addResult(
    'a11y-dialog-contracts',
    'Accessibility: modal labels and focus manager',
    'Each custom modal is labelled, modal, and uses shared focus management',
    invalidDialogs.length === 0,
    invalidDialogs.length === 0 ? `${dialogFiles.length} modal surfaces checked` : `Missing contract: ${invalidDialogs.join(', ')}`
  );

  const historySource = readSource('src/components/history/HistoryModal.tsx');
  addResult(
    'a11y-history-restore-button',
    'Accessibility: history restore is keyboard-operable',
    'Saved history rows restore from a named native button',
    historySource.includes('type="button"') && historySource.includes('aria-label={`Restore ${item.calculatorName}: ${item.summary}`}'),
    'History restore control uses a named button'
  );

  const appSource = readSource('src/App.tsx');
  addResult(
    'a11y-financial-disclaimer',
    'Accessibility: financial disclaimer is programmatically noted',
    'Financial tools expose the informational-only disclaimer as a note',
    appSource.includes('role="note"') && appSource.includes('not financial, tax, or legal advice'),
    'Financial-only disclaimer note is present'
  );

  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const documentShim: { activeElement: unknown } = { activeElement: null };
  let tabDialog: HTMLElement;
  let first: { hidden: boolean; tabIndex: number; focus: () => void; getAttribute: () => null };
  let last: { hidden: boolean; tabIndex: number; focus: () => void; getAttribute: () => null };
  first = {
    hidden: false,
    tabIndex: 0,
    focus: () => { documentShim.activeElement = first; },
    getAttribute: () => null,
  };
  last = {
    hidden: false,
    tabIndex: 0,
    focus: () => { documentShim.activeElement = last; },
    getAttribute: () => null,
  };
  tabDialog = {
    querySelectorAll: () => [first, last],
    contains: (element: unknown) => element === first || element === last,
    focus: () => { documentShim.activeElement = tabDialog; },
  } as unknown as HTMLElement;
  Object.defineProperty(globalThis, 'document', { configurable: true, value: documentShim });

  try {
    let escaped = false;
    let escapePrevented = false;
    handleDialogKeyDown({
      key: 'Escape',
      shiftKey: false,
      preventDefault: () => { escapePrevented = true; },
    }, tabDialog, () => { escaped = true; });
    addResult(
      'a11y-dialog-escape',
      'Accessibility: Escape closes dialog',
      'Escape prevents default and calls the close handler',
      escaped && escapePrevented,
      `closed=${escaped}, prevented=${escapePrevented}`
    );

    let tabPrevented = false;
    documentShim.activeElement = last;
    handleDialogKeyDown({
      key: 'Tab',
      shiftKey: false,
      preventDefault: () => { tabPrevented = true; },
    }, tabDialog, () => undefined);
    addResult(
      'a11y-dialog-tab-wrap',
      'Accessibility: Tab wraps within dialog',
      'Tab from the last focusable control returns focus to the first',
      documentShim.activeElement === first && tabPrevented,
      `wrapped=${documentShim.activeElement === first}, prevented=${tabPrevented}`
    );

    let reversePrevented = false;
    documentShim.activeElement = first;
    handleDialogKeyDown({
      key: 'Tab',
      shiftKey: true,
      preventDefault: () => { reversePrevented = true; },
    }, tabDialog, () => undefined);
    addResult(
      'a11y-dialog-shift-tab-wrap',
      'Accessibility: Shift+Tab wraps within dialog',
      'Shift+Tab from the first focusable control returns focus to the last',
      documentShim.activeElement === last && reversePrevented,
      `wrapped=${documentShim.activeElement === last}, prevented=${reversePrevented}`
    );
  } finally {
    if (originalDocument) {
      Object.defineProperty(globalThis, 'document', originalDocument);
    } else {
      Reflect.deleteProperty(globalThis, 'document');
    }
  }

  return results;
}