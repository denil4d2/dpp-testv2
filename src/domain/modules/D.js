import { getFactorById, unique } from '../engine/context.js';

export function validateD(context) {
  const issues = [];
  (context.scenarios.D?.recoveredFlows || []).forEach((flow) => {
    if (!flow.creditFactorId) issues.push({ moduleId: 'D', severity: 'warning', message: `${flow.materialCategory}: missing credit factor.` });
  });
  return issues;
}

export function calculateD(context) {
  const scenario = context.scenarios.D;
  const breakdown = (scenario.recoveredFlows || []).map((flow) => {
    const factor = getFactorById(context.factors, flow.creditFactorId);
    const outputFlowMassKg = Number(flow.outputFlowMassKg || 0);
    const value = outputFlowMassKg * Number(factor?.factorValue || 0);
    return {
      label: `${flow.materialCategory} — ${flow.substitutionAssumption}`,
      materialCategory: flow.materialCategory,
      outputFlowMassKg,
      value,
      factorId: factor?.factorId || null,
      factorName: factor?.factorName || null,
      status: factor ? 'Configured' : 'Missing factor',
    };
  });
  const warnings = breakdown.filter((item) => !item.factorId).map((item) => `${item.materialCategory}: credit factor missing.`);
  return {
    moduleId: 'D',
    label: 'Benefits and loads beyond system boundary',
    group: 'Beyond system boundary',
    resultType: 'active_calculation',
    status: warnings.length ? 'warning' : 'ok',
    unit: 'kg CO2e',
    value: breakdown.reduce((sum, item) => sum + item.value, 0),
    normalizedValue: breakdown.reduce((sum, item) => sum + item.value, 0),
    breakdown,
    inputs: { recoveredFlowCount: breakdown.length },
    assumptions: ['Module D is reported separately from the product-stage interpretation.'],
    factorIdsUsed: unique(breakdown.map((item) => item.factorId)),
    warnings,
    methodologyNote: 'D = recovered output flows × credit factors. Reported separately from product stage impacts.',
  };
}
