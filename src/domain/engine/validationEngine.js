import { adjustedMassKg, normalizeText } from './context.js';

function baseValidation(context) {
  const issues = [];
  if (!context.product?.productId) issues.push({ moduleId: 'GLOBAL', severity: 'error', message: 'Missing active product.' });
  if (!context.methodology?.governingPcr) issues.push({ moduleId: 'GLOBAL', severity: 'error', message: 'Missing governing PCR configuration.' });
  if (!context.bomRows.length) issues.push({ moduleId: 'GLOBAL', severity: 'warning', message: 'No BOM rows for the active product.' });

  const seenIds = new Set();
  context.bomRows.forEach((row) => {
    const key = `${row.productId}::${row.componentId}`;
    if (seenIds.has(key)) issues.push({ moduleId: 'GLOBAL', severity: 'warning', message: `${row.componentId}: duplicate BOM row ID in active dataset.` });
    seenIds.add(key);
    if (adjustedMassKg(row) <= 0) issues.push({ moduleId: 'GLOBAL', severity: 'warning', message: `${row.componentId}: adjusted mass is zero or negative.` });
    if (!row.supplier) issues.push({ moduleId: 'GLOBAL', severity: 'info', message: `${row.componentId}: supplier name is missing.` });
    if (normalizeText(row.mappingStatus) === 'unit mismatch') issues.push({ moduleId: 'GLOBAL', severity: 'warning', message: `${row.componentId}: mapped factor unit mismatch requires review.` });
  });
  return issues;
}

export function collectValidationIssues(context, registry) {
  const issues = [
    ...baseValidation(context),
    ...registry.flatMap((module) => module.validate(context).map((issue) => ({ ...issue, moduleStatus: module.status }))),
  ];

  const unique = new Map();
  issues.forEach((issue) => {
    const key = `${issue.moduleId}|${issue.severity}|${issue.message}`;
    if (!unique.has(key)) unique.set(key, issue);
  });
  return [...unique.values()];
}
