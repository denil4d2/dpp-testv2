import { totalMassKg, getFactorById, unique } from '../engine/context.js';

export function validateC2(context) {
  const issues = [];
  const scenario = context.scenarios.C2;
  if (!scenario?.transportFactorId) issues.push({ moduleId: 'C2', severity: 'warning', message: 'Missing transport factor.' });
  if (!Number(scenario?.collectionSortingDistanceKm || 0)) issues.push({ moduleId: 'C2', severity: 'warning', message: 'Missing collection/sorting transport distance.' });
  if (!Number(scenario?.treatmentDistanceKm || 0)) issues.push({ moduleId: 'C2', severity: 'warning', message: 'Missing treatment transport distance.' });
  return issues;
}

export function calculateC2(context) {
  const scenario = context.scenarios.C2;
  const factor = getFactorById(context.factors, scenario.transportFactorId);
  const tonnes = totalMassKg(context.bomRows) / 1000;
  const collectionSortingDistanceKm = Number(scenario.collectionSortingDistanceKm || 0);
  const treatmentDistanceKm = Number(scenario.treatmentDistanceKm || 0);
  const leg1 = tonnes * collectionSortingDistanceKm * Number(factor?.factorValue || 0);
  const leg2 = tonnes * treatmentDistanceKm * Number(factor?.factorValue || 0);
  const value = leg1 + leg2;
  const warnings = factor ? [] : ['C2 transport factor missing.'];
  return {
    moduleId: 'C2',
    label: 'Transport to waste processing',
    group: 'End-of-life',
    resultType: 'active_calculation',
    status: warnings.length ? 'warning' : 'ok',
    unit: 'kg CO2e',
    value,
    normalizedValue: value,
    breakdown: [
      { label: 'Collection / sorting leg', value: leg1, factorId: factor?.factorId || null, factorName: factor?.factorName || null },
      { label: 'Treatment leg', value: leg2, factorId: factor?.factorId || null, factorName: factor?.factorName || null },
    ],
    inputs: { tonnes, collectionSortingDistanceKm, treatmentDistanceKm, totalTransportDistanceKm: collectionSortingDistanceKm + treatmentDistanceKm },
    assumptions: ['C2 is structured as a two-leg route: collection/sorting plus treatment transport.'],
    factorIdsUsed: unique([factor?.factorId]),
    warnings,
    methodologyNote: 'C2 = tonnes × (collection leg + treatment leg) × transport factor.',
  };
}
