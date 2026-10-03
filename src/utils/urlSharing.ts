/**
 * Utility for sharing calculations via URL parameters.
 * Allows deep linking to any calculator with prefilled inputs.
 */

export function generateShareUrl(calculatorId: string, inputs: Record<string, string | number>): string {
  const origin = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://calcnest.app/';
  const url = new URL(origin);
  url.searchParams.set('calc', calculatorId);

  Object.entries(inputs).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      url.searchParams.set(key, String(val));
    }
  });

  return url.toString();
}

export function parseShareUrl(): { calculatorId: string | null; inputs: Record<string, string> } {
  if (typeof window === 'undefined') {
    return { calculatorId: null, inputs: {} };
  }

  const params = new URLSearchParams(window.location.search);
  const calculatorId = params.get('calc');
  const inputs: Record<string, string> = {};

  params.forEach((val, key) => {
    if (key !== 'calc') {
      inputs[key] = val;
    }
  });

  return { calculatorId, inputs };
}
