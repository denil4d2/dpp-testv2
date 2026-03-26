import { getFactorById, unique } from '../engine/context.js';

export function validateC1(context) {
  const issues = [];
  const scenario = context.scenarios.C1;
  if (!scenario?.demolitionEnergyAmountMj) issues.push({ moduleId: 'C1', severity: 'warning', message: 'Missing demolition energy amount.' });
  if (!scenario?.demolitionEnergyFactorId) issues.push({ moduleId: 'C1', severity: 'warning', message: 'Missing demolition energy factor.' });
  return issues;
}

export function calculateC1(context) {
  const scenario = context.scenarios.C1;
  const factor = getFactorById(context.factors, scenario.demolitionEnergyFactorId);
  const energyMj = Number(scenario.demolitionEnergyAmountMj || 0);
  const value = energyMj * Number(factor?.factorValue || 0);
  const warnings = factor ? [] : ['Demolition energy factor missing.'];
  return {
    moduleId: 'C1',
    label: 'Deconstruction / demolition',
    group: 'End-of-life',
    resultType: 'active_calculation',
    status: warnings.length ? 'warning' : 'ok',
    unit: 'kg CO2e',
    value,
    normalizedValue: value,
    breakdown: [{ label: 'Demolition energy', value, factorId: factor?.factorId || null, factorName: factor?.factorName || null }],
    inputs: { demolitionEnergyAmountMj: energyMj, demolitionProcessType: scenario.demolitionProcessType || '' },
    assumptions: ['C1 uses configured demolition energy inputs.'],
    factorIdsUsed: unique([factor?.factorId]),
    warnings,
    methodologyNote: 'C1 = demolition energy amount × demolition energy factor.',
  };
}
