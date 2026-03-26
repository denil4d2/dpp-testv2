import { parseCsv } from '../../utils/csv.js';

function numberOr(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function optionalNumber(value) {
  return value === '' || value === undefined ? undefined : numberOr(value);
}

export function importFactorsFromCsv(text) {
  const records = parseCsv(text).map((row) => ({
    ...row,
    validityYear: numberOr(row.validityYear, 2024),
    factorValue: numberOr(row.factorValue, 0),
    gwpTotal: optionalNumber(row.gwpTotal),
    gwpFossil: optionalNumber(row.gwpFossil),
    gwpBiogenic: optionalNumber(row.gwpBiogenic),
    gwpLuluc: optionalNumber(row.gwpLuluc),
    gwpGhg: optionalNumber(row.gwpGhg),
    lowerBound: optionalNumber(row.lowerBound),
    upperBound: optionalNumber(row.upperBound),
    priority: numberOr(row.priority, 0),
    version: row.version || '1.0',
    versionGroup: row.versionGroup || row.factorId,
    approvalStatus: row.approvalStatus || 'approved',
    effectiveFrom: row.effectiveFrom || '',
    effectiveTo: row.effectiveTo || '',
    isDefault: String(row.isDefault).toLowerCase() === 'true',
    active: String(row.active || 'true').toLowerCase() !== 'false',
  }));

  const errors = [];
  const warnings = [];
  const ids = new Set();
  records.forEach((factor, index) => {
    const label = factor.factorId || `row ${index + 1}`;
    ['factorId', 'factorName', 'materialCategory', 'unit', 'indicatorFramework', 'indicatorName'].forEach((field) => {
      if (!factor[field]) errors.push(`${label}: missing required field ${field}.`);
    });
    const uniqueKey = `${factor.factorId}@${factor.version}`;
    if (ids.has(uniqueKey)) errors.push(`${label}: duplicate factor version key ${uniqueKey}.`);
    ids.add(uniqueKey);
    if (!['kg', 'tkm', 'kWh', 'MJ', 'item', 'lump_sum'].includes(factor.unit)) warnings.push(`${label}: unit ${factor.unit} is outside the standard unit set.`);
    if (!['confirmed', 'provisional', 'missing_verification'].includes(factor.sourceStatus)) warnings.push(`${label}: source status ${factor.sourceStatus} should be reviewed.`);
    if (!['approved', 'draft', 'archived'].includes(factor.approvalStatus)) warnings.push(`${label}: approvalStatus ${factor.approvalStatus} should be approved, draft, or archived.`);
    if (factor.lowerBound !== undefined && factor.upperBound !== undefined && factor.lowerBound > factor.upperBound) warnings.push(`${label}: lowerBound is greater than upperBound.`);
  });

  return { records, validation: { errors, warnings, infos: [] } };
}
