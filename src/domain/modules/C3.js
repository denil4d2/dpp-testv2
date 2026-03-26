import { groupedMassByCategory, getFactorById, unique } from '../engine/context.js';

export function validateC3(context) {
  const issues = [];
  const routes = context.scenarios.C3?.routes || [];
  const byCategory = routes.reduce((acc, route) => {
    acc[route.materialCategory] = (acc[route.materialCategory] || 0) + Number(route.sharePct || 0);
    return acc;
  }, {});
  Object.entries(byCategory).forEach(([materialCategory, totalShare]) => {
    if (Math.round(totalShare * 100) / 100 !== 100) {
      issues.push({ moduleId: 'C3', severity: 'warning', message: `${materialCategory}: route shares sum to ${totalShare}% not 100%.` });
    }
  });
  routes.forEach((route) => {
    if (!route.processingFactorId) issues.push({ moduleId: 'C3', severity: 'warning', message: `${route.materialCategory}: missing processing factor for ${route.treatmentRoute}.` });
  });
  return issues;
}

export function calculateC3(context) {
  const scenario = context.scenarios.C3;
  const massByCategory = groupedMassByCategory(context.bomRows);
  const breakdown = (scenario.routes || []).map((route) => {
    const factor = getFactorById(context.factors, route.processingFactorId);
    const baseMass = massByCategory[route.materialCategory] || 0;
    const routedMass = baseMass * (Number(route.sharePct || 0) / 100);
    const value = routedMass * Number(factor?.factorValue || 0);
    return {
      label: `${route.materialCategory} — ${route.treatmentRoute}`,
      materialCategory: route.materialCategory,
      treatmentRoute: route.treatmentRoute,
      sharePct: Number(route.sharePct || 0),
      routedMass,
      value,
      factorId: factor?.factorId || null,
      factorName: factor?.factorName || null,
      status: factor ? 'Configured' : 'Missing factor',
    };
  });
  const warnings = breakdown.filter((item) => !item.factorId).map((item) => `${item.materialCategory} ${item.treatmentRoute}: processing factor missing.`);
  return {
    moduleId: 'C3',
    label: 'Waste processing',
    group: 'End-of-life',
    resultType: 'active_calculation',
    status: warnings.length ? 'warning' : 'ok',
    unit: 'kg CO2e',
    value: breakdown.reduce((sum, item) => sum + item.value, 0),
    normalizedValue: breakdown.reduce((sum, item) => sum + item.value, 0),
    breakdown,
    inputs: { routeCount: breakdown.length },
    assumptions: ['C3 uses treatment-route shares by material category.'],
    factorIdsUsed: unique(breakdown.map((item) => item.factorId)),
    warnings,
    methodologyNote: 'C3 = Σ(material mass × route share × processing factor).',
  };
}
