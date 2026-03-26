import { parseCsv } from '../../utils/csv.js';
import { productTemplateHeaders } from '../templates/productTemplate.js';

function numberOr(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function inspectProductHeaders(records) {
  if (!records.length) return [];
  return Object.keys(records[0]).map((header) => ({
    sourceHeader: header,
    targetField: productTemplateHeaders.includes(header) ? header : 'unmapped',
    matched: productTemplateHeaders.includes(header),
  }));
}

export function validateProductRecords(records) {
  const errors = [];
  const warnings = [];
  const infos = [];
  const seenIds = new Set();

  records.forEach((row, index) => {
    const label = row.productId || `row ${index + 1}`;
    ['productId', 'productName', 'declaredUnit', 'pcrVersion'].forEach((field) => {
      if (!row[field]) errors.push(`${label}: missing required field ${field}.`);
    });
    if (seenIds.has(row.productId)) errors.push(`${label}: duplicate product ID.`);
    seenIds.add(row.productId);
    if (!row.configurationCode) warnings.push(`${label}: missing configuration code.`);
    if (!row.platform) warnings.push(`${label}: missing platform.`);
    if (!row.productionSite) warnings.push(`${label}: missing production site.`);
    if (!row.standardMethodology) infos.push(`${label}: standard/methodology not provided.`);
  });

  return { errors, warnings, infos };
}

export function importProductsFromCsv(text) {
  const records = parseCsv(text);
  return {
    records: records.map((row) => ({
      productId: row.productId || '',
      productName: row.productName || '',
      brand: row.brand || 'DOVISTA',
      platform: row.platform || '',
      productFamily: row.productFamily || '',
      configurationCode: row.configurationCode || '',
      declaredUnit: row.declaredUnit || '1 m²',
      conversionFactorKgPerM2: numberOr(row.conversionFactorKgPerM2, 0),
      referenceServiceLifeYears: numberOr(row.referenceServiceLifeYears, 50),
      productionSite: row.productionSite || '',
      country: row.country || '',
      pcrVersion: row.pcrVersion || 'PCR 2019:14 VERSION 2.0.1',
      standardMethodology: row.standardMethodology || 'EN 15804+A2 + PCR 2019:14 v2.0.1',
      status: row.status || 'Draft',
      notes: row.notes || '',
      manufacturingProfile: {
        profileId: row.manufacturingProfileId || `${row.productId || 'PRD'}-MFG`,
        siteName: row.manufacturingSiteName || row.productionSite || '',
        country: row.manufacturingCountry || row.country || '',
        electricityKwhPerDeclaredUnit: Number(numberOr(row.electricityKwhPerDeclaredUnit, 0)),
        electricityFactorId: row.electricityFactorId || 'FAC-EL-PL-001',
        heatMjPerDeclaredUnit: Number(numberOr(row.heatMjPerDeclaredUnit, 0)),
        heatFactorId: row.heatFactorId || 'FAC-HEAT-GEN-001',
        consumablesImpact: Number(numberOr(row.consumablesImpact, 0)),
        woodWasteRate: Number(numberOr(row.woodWasteRate, 0.07)),
        aluminiumWasteRate: Number(numberOr(row.aluminiumWasteRate, 0.15)),
        processNotes: row.processNotes || '',
      },
    })),
    headerMap: inspectProductHeaders(records),
    validation: validateProductRecords(records),
  };
}
