import { normalizeText, safeNumber } from './context.js';

export const INDICATOR_ORDER = ['GWP-total', 'GWP-fossil', 'GWP-biogenic', 'GWP-luluc', 'GWP-GHG'];

function defaultMatrix() {
  return Object.fromEntries(INDICATOR_ORDER.map((name) => [name, 0]));
}

function explicitMatrix(factor) {
  const explicit = factor?.indicatorValues || null;
  if (explicit && typeof explicit === 'object') {
    return {
      'GWP-total': safeNumber(explicit['GWP-total']),
      'GWP-fossil': safeNumber(explicit['GWP-fossil']),
      'GWP-biogenic': safeNumber(explicit['GWP-biogenic']),
      'GWP-luluc': safeNumber(explicit['GWP-luluc']),
      'GWP-GHG': safeNumber(explicit['GWP-GHG']),
    };
  }
  const flat = {
    'GWP-total': factor?.gwpTotal,
    'GWP-fossil': factor?.gwpFossil,
    'GWP-biogenic': factor?.gwpBiogenic,
    'GWP-luluc': factor?.gwpLuluc,
    'GWP-GHG': factor?.gwpGhg,
  };
  if (Object.values(flat).some((value) => value !== undefined && value !== null && value !== '')) {
    return {
      'GWP-total': safeNumber(flat['GWP-total']),
      'GWP-fossil': safeNumber(flat['GWP-fossil']),
      'GWP-biogenic': safeNumber(flat['GWP-biogenic']),
      'GWP-luluc': safeNumber(flat['GWP-luluc']),
      'GWP-GHG': safeNumber(flat['GWP-GHG']),
    };
  }
  return null;
}

export function factorIndicatorMatrix(factor) {
  if (!factor) return defaultMatrix();
  const explicit = explicitMatrix(factor);
  if (explicit) return explicit;
  const base = safeNumber(factor.factorValue);
  const category = normalizeText(factor.materialCategory);
  const indicatorName = normalizeText(factor.indicatorName);

  if (indicatorName == 'gwp-ghg') {
    return { 'GWP-total': base, 'GWP-fossil': base, 'GWP-biogenic': 0, 'GWP-luluc': 0, 'GWP-GHG': base };
  }
  if (category in {'transport':1,'energy':1,'consumables':1,'end-of-life':1}) {
    return { 'GWP-total': base, 'GWP-fossil': base, 'GWP-biogenic': 0, 'GWP-luluc': 0, 'GWP-GHG': base };
  }
  if (category == 'wood') {
    return {
      'GWP-total': base,
      'GWP-fossil': +(base * 0.35).toFixed(6),
      'GWP-biogenic': +(base * 0.6).toFixed(6),
      'GWP-luluc': +(base * 0.05).toFixed(6),
      'GWP-GHG': +(base * 0.9).toFixed(6),
    };
  }
  return {
    'GWP-total': base,
    'GWP-fossil': +(base * 0.92).toFixed(6),
    'GWP-biogenic': 0,
    'GWP-luluc': +(base * 0.08).toFixed(6),
    'GWP-GHG': +(base * 0.96).toFixed(6),
  };
}

export function scaleMatrix(matrix, scalar, baseValue) {
  const denominator = safeNumber(baseValue, 0);
  if (!denominator) return { ...defaultMatrix(), 'GWP-total': safeNumber(scalar) };
  const ratio = safeNumber(scalar) / denominator;
  return Object.fromEntries(INDICATOR_ORDER.map((name) => [name, safeNumber(matrix[name]) * ratio]));
}

export function addMatrices(a, b) {
  const left = a || defaultMatrix();
  const right = b || defaultMatrix();
  return Object.fromEntries(INDICATOR_ORDER.map((name) => [name, safeNumber(left[name]) + safeNumber(right[name])]));
}

export function ensureResultIndicators(result, factors, workingIndicatorName = 'GWP-total') {
  if (result.indicators) return result;
  let indicators = defaultMatrix();
  const breakdown = Array.isArray(result.breakdown) ? result.breakdown : [];
  if (breakdown.length) {
    breakdown.forEach((item) => {
      const value = safeNumber(item.value);
      if (!value) return;
      const factor = factors.find((candidate) => candidate.factorId === item.factorId);
      const matrix = factorIndicatorMatrix(factor);
      const working = factor ? (factor.indicatorName ? matrix[factor.indicatorName] ?? factor.factorValue : factor.factorValue) : 0;
      indicators = addMatrices(indicators, scaleMatrix(matrix, value, working || factor?.factorValue || value));
    });
  }
  if (INDICATOR_ORDER.every((name) => !safeNumber(indicators[name])) && safeNumber(result.value)) {
    indicators = { ...defaultMatrix(), [workingIndicatorName]: safeNumber(result.value), 'GWP-total': safeNumber(result.value) };
  }
  return { ...result, indicators };
}

export function sumIndicatorMatrices(results = []) {
  return results.reduce((acc, result) => addMatrices(acc, result.indicators || defaultMatrix()), defaultMatrix());
}
