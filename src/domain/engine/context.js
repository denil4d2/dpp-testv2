export function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

export function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getFactorById(factors, factorId) {
  return factors.find((factor) => factor.factorId === factorId) || null;
}

const MASS_FACTORS = { kg: 1, g: 0.001, t: 1000, tonne: 1000, tonnes: 1000 };

export function parseDeclaredUnit(text = '1 m²') {
  const match = String(text || '').trim().match(/([\d.]+)\s*(.*)/);
  if (!match) return { amount: 1, unit: String(text || '').trim() || 'm²' };
  return { amount: safeNumber(match[1], 1) || 1, unit: match[2] || 'm²' };
}

export function rawMassKg(row) {
  const unit = normalizeText(row.unit || 'kg');
  if (unit === 'item' || unit === 'piece') {
    const quantity = safeNumber(row.quantity, 1);
    const unitWeight = safeNumber(row.unitWeight, safeNumber(row.totalWeight, 0));
    return quantity * unitWeight;
  }
  const totalWeight = safeNumber(row.totalWeight, 0) || (safeNumber(row.quantity, 1) * safeNumber(row.unitWeight, 0));
  return totalWeight * (MASS_FACTORS[unit] || 1);
}

export function adjustedMassKg(row) {
  const wasteRate = safeNumber(row.wasteRatePct, 0) / 100;
  return rawMassKg(row) * (1 + wasteRate);
}

export function massTonnes(row) {
  return adjustedMassKg(row) / 1000;
}

export function totalMassKg(rows) {
  return rows.reduce((sum, row) => sum + adjustedMassKg(row), 0);
}

export function groupedMassByCategory(rows) {
  return rows.reduce((acc, row) => {
    const key = row.materialCategory || 'unknown';
    acc[key] = (acc[key] || 0) + adjustedMassKg(row);
    return acc;
  }, {});
}

export function normalizeToDeclaredUnit(value, product, methodology) {
  const parsed = parseDeclaredUnit(product?.declaredUnit || methodology?.declaredUnit || '1 m²');
  return safeNumber(value) / (parsed.amount || 1);
}

export function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export function sumValues(items = [], key = 'value') {
  return items.reduce((sum, item) => sum + safeNumber(item[key], 0), 0);
}

export function scenarioStatus(scenario) {
  return scenario?.status || 'Draft';
}

export function simpleHash(input) {
  const text = String(input || '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return `H${Math.abs(hash)}`;
}
