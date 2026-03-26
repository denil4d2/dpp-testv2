import { normalizeText } from './context.js';

const VALID_UNITS = new Set(['kg', 'tkm', 'kWh', 'MJ', 'item', 'lump_sum']);

function statusWeight(status) {
  const value = normalizeText(status);
  if (value === 'confirmed') return 45;
  if (value === 'provisional') return 15;
  return 0;
}

function frameworkWeight(framework) {
  const value = normalizeText(framework);
  if (value === 'en 15804+a2 supplier epd' || value === 'supplier epd') return 25;
  if (value === 'en 15804+a2') return 20;
  if (value === 'en 15804+a2 supporting data') return 12;
  if (value === 'internal prototype') return 5;
  return 0;
}

function indicatorMatch(expected, actual) {
  if (!expected) return true;
  return normalizeText(expected) === normalizeText(actual);
}

function unitMatch(expected, actual) {
  if (!expected) return true;
  return String(expected || '').trim() === String(actual || '').trim();
}

function approvalWeight(status) {
  const value = normalizeText(status);
  if (value === 'approved') return 20;
  if (value === 'draft') return -10;
  if (value === 'archived') return -50;
  return 0;
}

function scoreFactor(row, factor, options = {}) {
  let score = 0;
  if (normalizeText(factor.materialCategory) === normalizeText(row.materialCategory)) score += 120;
  if (normalizeText(factor.materialSubtype) === normalizeText(row.materialSubtype)) score += 90;
  if (normalizeText(factor.geography) && normalizeText(factor.geography) === normalizeText(row.geography)) score += 25;
  if (normalizeText(options.factorFamilyHint) && normalizeText(factor.factorFamily) === normalizeText(options.factorFamilyHint)) score += 35;
  if (normalizeText(options.sourceTypeHint) && normalizeText(factor.sourceType) === normalizeText(options.sourceTypeHint)) score += 20;
  if (normalizeText(row.supplier) && normalizeText(factor.sourcePublisher) && normalizeText(row.supplier).includes(normalizeText(factor.sourcePublisher))) score += 25;
  if (indicatorMatch(options.indicatorName, factor.indicatorName)) score += 30;
  if (unitMatch(options.expectedUnit, factor.unit)) score += 20;
  if (VALID_UNITS.has(factor.unit)) score += 5;
  score += statusWeight(factor.sourceStatus);
  score += frameworkWeight(factor.indicatorFramework);
  score += approvalWeight(factor.approvalStatus);
  score += Number(factor.priority || 0);
  return score;
}

export function mergeFactorLibraries(baseFactors = [], customFactors = []) {
  const merged = new Map();
  [...baseFactors, ...customFactors]
    .filter((factor) => factor && factor.active !== false && normalizeText(factor.approvalStatus) !== 'archived')
    .forEach((factor) => {
      const normalized = {
        version: factor.version || '1.0',
        versionGroup: factor.versionGroup || factor.factorId,
        approvalStatus: factor.approvalStatus || 'approved',
        factorVersionKey: `${factor.factorId}@${factor.version || '1.0'}`,
        effectiveFrom: factor.effectiveFrom || '',
        effectiveTo: factor.effectiveTo || '',
        ...factor,
      };
      const existing = merged.get(normalized.factorId);
      if (!existing) {
        merged.set(normalized.factorId, normalized);
        return;
      }
      const currentScore = Number(existing.priority || 0) + statusWeight(existing.sourceStatus) + approvalWeight(existing.approvalStatus);
      const nextScore = Number(normalized.priority || 0) + statusWeight(normalized.sourceStatus) + approvalWeight(normalized.approvalStatus);
      if (nextScore >= currentScore) merged.set(normalized.factorId, normalized);
    });
  return [...merged.values()];
}

export function resolveFactorById(factorId, factors, options = {}) {
  const factor = factors.find((candidate) => candidate.factorId === factorId) || null;
  if (!factor) {
    return {
      factor: null,
      mappingStatus: 'Missing factor',
      mappingReason: `Factor ID ${factorId} was referenced but not found in active libraries.`,
      confidence: 'none',
      unitMismatch: false,
    };
  }
  const mismatch = options.expectedUnit ? !unitMatch(options.expectedUnit, factor.unit) : false;
  return {
    factor,
    mappingStatus: mismatch ? 'Unit mismatch' : factor.sourceStatus === 'confirmed' ? 'Auto-mapped confirmed' : 'Auto-mapped provisional',
    mappingReason: mismatch
      ? `Factor ${factor.factorId} was found but uses unit ${factor.unit} instead of ${options.expectedUnit}.`
      : `Factor ${factor.factorId} version ${factor.version || '1.0'} matched by explicit reference.`,
    confidence: mismatch ? 'low' : factor.sourceStatus === 'confirmed' ? 'high' : 'medium',
    unitMismatch: mismatch,
  };
}

export function resolveFactorForRow(row, factors, options = {}) {
  const activeFactors = factors.filter((factor) => factor.active !== false && normalizeText(factor.approvalStatus) !== 'archived');
  if (options.explicitFactorId) return resolveFactorById(options.explicitFactorId, activeFactors, options);
  if (row.manualFactorId) {
    const manual = resolveFactorById(row.manualFactorId, activeFactors, options);
    return { ...manual, mappingStatus: manual.unitMismatch ? 'Unit mismatch' : 'Manual override', mappingReason: manual.unitMismatch ? manual.mappingReason : 'Manual override applied on BOM row.', confidence: manual.unitMismatch ? 'low' : 'manual' };
  }
  if (row.preferredFactorId) return resolveFactorById(row.preferredFactorId, activeFactors, options);

  const scored = activeFactors.map((factor) => ({ factor, score: scoreFactor(row, factor, options) })).filter((item) => item.score >= 120).sort((a, b) => b.score - a.score);
  if (!scored.length) {
    return { factor: null, mappingStatus: 'Missing factor', mappingReason: 'No matching factor found by category, subtype, indicator, geography, and priority rules.', confidence: 'none', unitMismatch: false };
  }
  const selected = scored[0].factor;
  const mismatch = options.expectedUnit ? !unitMatch(options.expectedUnit, selected.unit) : false;
  return {
    factor: selected,
    mappingStatus: mismatch ? 'Unit mismatch' : selected.sourceStatus === 'confirmed' ? 'Auto-mapped confirmed' : 'Auto-mapped provisional',
    mappingReason: mismatch ? `Best match was ${selected.factorId}, but its unit ${selected.unit} does not match expected ${options.expectedUnit}.` : `Matched on category / subtype / indicator / priority logic (${selected.factorId} ${selected.version || '1.0'}).`,
    confidence: mismatch ? 'low' : selected.sourceStatus === 'confirmed' ? 'high' : 'medium',
    unitMismatch: mismatch,
  };
}
