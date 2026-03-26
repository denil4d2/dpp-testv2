import { groupedMassByCategory, getFactorById, unique } from '../engine/context.js';

export function validateC4(context) {
  const issues = [];
  if (!context.scenarios.C4?.disposalFactorId) issues.push({ moduleId: 'C4', severity: 'warning', message: 'Missing C4 disposal factor.' });
  return issues;
}

export function calculateC4(context) {
  const c3Scenario = context.scenarios.C3;
  const c4Scenario = context.scenarios.C4;
  const massByCategory = groupedMassByCategory(context.bomRows);
  const disposalFactor = getFactorById(context.factors, c4Scenario.disposalFactorId);
  const breakdown = (c3Scenario.routes || [])
    .filter((route) => route.treatmentRoute === 'landfill')
    .map((route) => {
      const baseMass = massByCategory[route.materialCategory] || 0;
      const disposedMass = baseMass * (Number(route.sharePct || 0) / 100);
      const value = disposedMass * Number(disposalFactor?.factorValue || 0);
      return {
        label: `${route.materialCategory} — landfill`,
        materialCategory: route.materialCategory,
        disposedMass,
        value,
        factorId: disposalFactor?.factorId || null,
        factorName: disposalFactor?.factorName || null,
        status: disposalFactor ? 'Configured' : 'Missing factor',
      };
    });
  const warnings = disposalFactor ? [] : ['C4 disposal factor missing.'];
  return {
    moduleId: 'C4',
    label: 'Disposal',
    group: 'End-of-life',
    resultType: 'active_calculation',
    status: warnings.length ? 'warning' : 'ok',
    unit: 'kg CO2e',
    value: breakdown.reduce((sum, item) => sum + item.value, 0),
    normalizedValue: breakdown.reduce((sum, item) => sum + item.value, 0),
    breakdown,
    inputs: { routeCount: breakdown.length },
    assumptions: ['C4 is derived from landfill-routed fractions.'],
    factorIdsUsed: unique([disposalFactor?.factorId]),
    warnings,
    methodologyNote: 'C4 = routed disposal mass × disposal factor.',
  };
}
