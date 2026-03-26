import { getFactorById, unique } from '../engine/context.js';

export function validateA3(context) {
  const issues = [];
  const profile = context.product.manufacturingProfile;
  if (!profile) {
    issues.push({ moduleId: 'A3', severity: 'error', message: 'Missing manufacturing profile.' });
    return issues;
  }
  if (!getFactorById(context.factors, profile.electricityFactorId)) issues.push({ moduleId: 'A3', severity: 'warning', message: 'Missing electricity factor.' });
  if (!getFactorById(context.factors, profile.heatFactorId)) issues.push({ moduleId: 'A3', severity: 'warning', message: 'Missing heat factor.' });
  if (!Number(profile.electricityKwhPerDeclaredUnit || 0)) issues.push({ moduleId: 'A3', severity: 'info', message: 'Electricity use is zero or blank.' });
  return issues;
}

export function calculateA3(context) {
  const profile = context.product.manufacturingProfile;
  const electricityFactor = getFactorById(context.factors, profile.electricityFactorId);
  const heatFactor = getFactorById(context.factors, profile.heatFactorId);
  const electricityImpact = Number(profile.electricityKwhPerDeclaredUnit || 0) * Number(electricityFactor?.factorValue || 0);
  const heatImpact = Number(profile.heatMjPerDeclaredUnit || 0) * Number(heatFactor?.factorValue || 0);
  const consumablesImpact = Number(profile.consumablesImpact || 0);
  const value = electricityImpact + heatImpact + consumablesImpact;
  const warnings = [];
  if (!electricityFactor) warnings.push('Electricity factor missing for A3.');
  if (!heatFactor) warnings.push('Heat factor missing for A3.');
  return {
    moduleId: 'A3',
    label: 'Manufacturing',
    group: 'Product stage',
    resultType: 'active_calculation',
    status: warnings.length ? 'warning' : 'ok',
    unit: 'kg CO2e',
    value,
    normalizedValue: value,
    breakdown: [
      { label: 'Electricity', value: electricityImpact, factorId: electricityFactor?.factorId || null, factorName: electricityFactor?.factorName || null, sourceStatus: electricityFactor?.sourceStatus || 'missing' },
      { label: 'Heat', value: heatImpact, factorId: heatFactor?.factorId || null, factorName: heatFactor?.factorName || null, sourceStatus: heatFactor?.sourceStatus || 'missing' },
      { label: 'Consumables', value: consumablesImpact, factorId: null, factorName: 'Direct consumables impact', sourceStatus: 'direct input' },
    ],
    inputs: {
      electricityKwhPerDeclaredUnit: Number(profile.electricityKwhPerDeclaredUnit || 0),
      heatMjPerDeclaredUnit: Number(profile.heatMjPerDeclaredUnit || 0),
      consumablesImpact,
    },
    assumptions: ['A3 = electricity + heat + consumables.'],
    factorIdsUsed: unique([electricityFactor?.factorId, heatFactor?.factorId]),
    warnings,
    methodologyNote: 'A3 = electricity + heat + consumables.',
  };
}
