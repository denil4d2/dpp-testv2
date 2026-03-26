import { massTonnes, unique } from '../engine/context.js';

export function validateA2(context) {
  const issues = [];
  context.bomRows.forEach((row) => {
    if (!row.transportFactor) issues.push({ moduleId: 'A2', severity: 'warning', message: `${row.componentId}: missing transport factor.` });
    else if (row.transportFactor.unit !== 'tkm') issues.push({ moduleId: 'A2', severity: 'warning', message: `${row.componentId}: transport factor unit ${row.transportFactor.unit} is not tkm.` });
    if (!Number(row.distanceKm)) issues.push({ moduleId: 'A2', severity: 'warning', message: `${row.componentId}: missing transport distance.` });
  });
  return issues;
}

export function calculateA2(context) {
  const rowBreakdown = context.bomRows.map((row) => {
    const factor = row.transportFactor;
    const tonnes = massTonnes(row);
    const distanceKm = Number(row.distanceKm || 0);
    const valid = factor && factor.unit === 'tkm';
    const value = valid ? tonnes * distanceKm * Number(factor.factorValue || 0) : 0;
    return {
      componentId: row.componentId,
      label: row.partName,
      tonnes,
      distanceKm,
      factorId: factor?.factorId || null,
      factorName: factor?.factorName || null,
      sourceStatus: factor?.sourceStatus || 'missing',
      value,
      status: valid ? 'Configured' : 'Missing factor',
    };
  });
  const warnings = rowBreakdown.filter((item) => !item.factorId || !item.distanceKm).map((item) => `${item.componentId}: transport setup incomplete for A2.`);
  return {
    moduleId: 'A2',
    label: 'Transport',
    group: 'Product stage',
    resultType: 'active_calculation',
    status: warnings.length ? 'warning' : 'ok',
    unit: 'kg CO2e',
    value: rowBreakdown.reduce((sum, item) => sum + item.value, 0),
    normalizedValue: rowBreakdown.reduce((sum, item) => sum + item.value, 0),
    breakdown: rowBreakdown,
    inputs: { componentCount: rowBreakdown.length },
    assumptions: ['A2 uses tonnes × transport distance × transport factor.'],
    factorIdsUsed: unique(rowBreakdown.map((item) => item.factorId)),
    warnings,
    methodologyNote: 'A2 = tonnes × km × transport factor.',
  };
}
