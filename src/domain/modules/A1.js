import { adjustedMassKg, unique } from '../engine/context.js';

export function validateA1(context) {
  const issues = [];
  context.bomRows.forEach((row) => {
    if (!row.resolvedFactor) issues.push({ moduleId: 'A1', severity: 'warning', message: `${row.componentId}: missing A1 factor.` });
    else if (row.resolvedFactor.unit !== 'kg') issues.push({ moduleId: 'A1', severity: 'warning', message: `${row.componentId}: A1 factor unit ${row.resolvedFactor.unit} is not kg.` });
  });
  return issues;
}

export function calculateA1(context) {
  const rowBreakdown = context.bomRows.map((row) => {
    const factor = row.resolvedFactor;
    const massKg = adjustedMassKg(row);
    const valid = factor && factor.unit === 'kg';
    const value = valid ? massKg * Number(factor.factorValue || 0) : 0;
    return {
      componentId: row.componentId,
      label: row.partName,
      materialCategory: row.materialCategory,
      supplier: row.supplier || 'Missing supplier',
      massKg,
      factorId: factor?.factorId || null,
      factorName: factor?.factorName || null,
      sourceStatus: factor?.sourceStatus || 'missing',
      value,
      status: valid ? row.mappingStatus : 'Missing factor',
    };
  });
  const warnings = rowBreakdown.filter((item) => !item.factorId).map((item) => `${item.componentId}: factor missing for A1.`);
  return {
    moduleId: 'A1',
    label: 'Raw material supply',
    group: 'Product stage',
    resultType: 'active_calculation',
    status: warnings.length ? 'warning' : 'ok',
    unit: 'kg CO2e',
    value: rowBreakdown.reduce((sum, item) => sum + item.value, 0),
    normalizedValue: rowBreakdown.reduce((sum, item) => sum + item.value, 0),
    breakdown: rowBreakdown,
    inputs: { componentCount: rowBreakdown.length },
    assumptions: ['Adjusted mass = total weight × (1 + waste rate).'],
    factorIdsUsed: unique(rowBreakdown.map((item) => item.factorId)),
    warnings,
    methodologyNote: 'A1 = adjusted mass × material factor.',
  };
}
