import { getFactorById, unique } from '../engine/context.js';

export function validateB4(context) {
  const issues = [];
  const scenario = context.scenarios.B4;
  if (!scenario?.replacementIntervalYears) issues.push({ moduleId: 'B4', severity: 'warning', message: 'Missing replacement interval.' });
  if (!scenario?.replacementMassBasisKg) issues.push({ moduleId: 'B4', severity: 'warning', message: 'Missing replacement mass basis.' });
  if (!scenario?.replacementFactorSource) issues.push({ moduleId: 'B4', severity: 'warning', message: 'Missing replacement material factor.' });
  if (!Number(scenario?.replacementDistanceKm || 0)) issues.push({ moduleId: 'B4', severity: 'warning', message: 'Missing replacement transport distance.' });
  return issues;
}

export function calculateB4(context) {
  const scenario = context.scenarios.B4;
  const materialFactor = getFactorById(context.factors, scenario.replacementFactorSource);
  const transportFactor = getFactorById(context.factors, 'FAC-TR-EU5-001');
  const interval = Number(scenario.replacementIntervalYears || 0);
  const replacements = interval > 0 ? Math.max(0, Math.floor(context.methodology.referenceServiceLifeYears / interval) - 1) : 0;
  const share = Number(scenario.replacementSharePct || 100) / 100;
  const replacementMass = Number(scenario.replacementMassBasisKg || 0) * share;
  const materialValue = replacements * replacementMass * Number(materialFactor?.factorValue || 0);
  const transportValue = replacements * (replacementMass / 1000) * Number(scenario.replacementDistanceKm || 0) * Number(transportFactor?.factorValue || 0);
  const value = materialValue + transportValue;
  const warnings = [];
  if (!materialFactor) warnings.push('Replacement material factor missing.');
  if (!transportFactor) warnings.push('Replacement transport factor missing.');
  return {
    moduleId: 'B4',
    label: 'Replacement',
    group: 'Use stage',
    resultType: 'active_calculation',
    status: warnings.length ? 'warning' : 'ok',
    unit: 'kg CO2e',
    value,
    normalizedValue: value,
    breakdown: [
      { label: 'Replacement material impact', value: materialValue, factorId: materialFactor?.factorId || null, factorName: materialFactor?.factorName || null },
      { label: 'Replacement transport impact', value: transportValue, factorId: transportFactor?.factorId || null, factorName: transportFactor?.factorName || null },
    ],
    inputs: {
      replacementIntervalYears: interval,
      replacements,
      replacementSharePct: Number(scenario.replacementSharePct || 100),
      replacementMassBasisKg: Number(scenario.replacementMassBasisKg || 0),
      replacementDistanceKm: Number(scenario.replacementDistanceKm || 0),
    },
    assumptions: ['B4 is based on replacement cycles over the reference service life.'],
    factorIdsUsed: unique([materialFactor?.factorId, transportFactor?.factorId]),
    warnings,
    methodologyNote: 'B4 = replacement cycles × (replacement mass × factor + replacement transport).',
  };
}
