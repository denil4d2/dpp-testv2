import { parseCsv } from '../../utils/csv.js';
import { bomTemplateHeaders } from '../templates/bomTemplate.js';

function numberOrZero(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function inspectBomHeaders(records) {
  if (!records.length) return [];
  return Object.keys(records[0]).map((header) => ({
    sourceHeader: header,
    targetField: bomTemplateHeaders.includes(header) ? header : 'unmapped',
    matched: bomTemplateHeaders.includes(header),
  }));
}

export function validateBomRecords(records) {
  const errors = [];
  const warnings = [];
  const infos = [];
  const seenIds = new Set();
  records.forEach((row, index) => {
    const label = row.componentId || `row ${index + 1}`;
    ['productId', 'componentId', 'partName', 'materialCategory', 'unit', 'totalWeight'].forEach((field) => {
      if (!row[field]) errors.push(`${label}: missing required field ${field}.`);
    });
    if (seenIds.has(row.componentId)) errors.push(`${label}: duplicate component ID.`);
    seenIds.add(row.componentId);
    if (numberOrZero(row.totalWeight) <= 0) errors.push(`${label}: zero or negative total weight.`);
    if (numberOrZero(row.wasteRatePct) < 0 || numberOrZero(row.wasteRatePct) > 100) errors.push(`${label}: invalid waste rate %.`);
    if (numberOrZero(row.recycledContentPct) < 0 || numberOrZero(row.recycledContentPct) > 100) errors.push(`${label}: invalid recycled content %.`);
    if (!['kg', 'item'].includes(row.unit)) warnings.push(`${label}: unit ${row.unit} is not one of the main template units.`);
    if (!row.supplier) warnings.push(`${label}: missing supplier name.`);
    if (!row.distanceKm) warnings.push(`${label}: missing transport distance.`);
    if (!row.materialCategory) warnings.push(`${label}: missing material category.`);
    if (row.openLcaDatasetId === '') infos.push(`${label}: openLCA dataset ID not provided.`);
  });
  return { errors, warnings, infos };
}

export function importBomFromCsv(text) {
  const records = parseCsv(text);
  return {
    records: records.map((row) => ({
      ...row,
      quantity: numberOrZero(row.quantity || 1),
      unitWeight: numberOrZero(row.unitWeight),
      totalWeight: numberOrZero(row.totalWeight),
      recycledContentPct: numberOrZero(row.recycledContentPct),
      wasteRatePct: numberOrZero(row.wasteRatePct),
      distanceKm: numberOrZero(row.distanceKm),
      preferredFactorId: row.preferredFactorId || '',
      openLcaDatasetId: row.openLcaDatasetId || '',
      manualFactorId: '',
      auditNote: '',
    })),
    headerMap: inspectBomHeaders(records),
    validation: validateBomRecords(records),
  };
}
