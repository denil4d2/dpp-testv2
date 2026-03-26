import { parseCsv } from '../../utils/csv.js';

function numberOr(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseJsonArray(value, label, warnings) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    warnings.push(`${label}: invalid JSON array, field ignored.`);
    return [];
  }
}

export function importScenariosFromCsv(text) {
  const rawRecords = parseCsv(text);
  const errors = [];
  const warnings = [];
  const records = {};

  rawRecords.forEach((row, index) => {
    const moduleId = row.moduleId?.trim();
    const label = moduleId || `row ${index + 1}`;
    if (!moduleId) {
      errors.push(`${label}: missing required field moduleId.`);
      return;
    }
    records[moduleId] = {
      status: row.status || 'Draft',
      scenarioPresetName: row.scenarioPresetName || `${moduleId} imported scenario`,
      methodologyNote: row.methodologyNote || '',
      dataCompletenessPct: numberOr(row.dataCompletenessPct, 0),
      previewEnabled: String(row.previewEnabled || 'false').toLowerCase() === 'true',
      reviewNote: row.reviewNote || '',
      replacementIntervalYears: numberOr(row.replacementIntervalYears, 0),
      replacedMaterialCategory: row.replacedMaterialCategory || '',
      replacementSharePct: numberOr(row.replacementSharePct, 0),
      replacementMassBasisKg: numberOr(row.replacementMassBasisKg, 0),
      replacementTransportMode: row.replacementTransportMode || '',
      replacementVehicleSpec: row.replacementVehicleSpec || '',
      replacementDistanceKm: numberOr(row.replacementDistanceKm, 0),
      replacementFactorSource: row.replacementFactorSource || '',
      demolitionProcessType: row.demolitionProcessType || '',
      demolitionEnergyFactorId: row.demolitionEnergyFactorId || '',
      demolitionEnergyAmountMj: numberOr(row.demolitionEnergyAmountMj, 0),
      collectionSortingDistanceKm: numberOr(row.collectionSortingDistanceKm, 0),
      treatmentDistanceKm: numberOr(row.treatmentDistanceKm, 0),
      totalTransportDistanceKm: numberOr(row.totalTransportDistanceKm, 0),
      mode: row.mode || '',
      vehicleSpec: row.vehicleSpec || '',
      transportFactorId: row.transportFactorId || '',
      routes: parseJsonArray(row.routesJson, `${label} routesJson`, warnings),
      disposalFactorId: row.disposalFactorId || '',
      recoveredFlows: parseJsonArray(row.recoveredFlowsJson, `${label} recoveredFlowsJson`, warnings),
    };

    if (!['B4', 'C1', 'C2', 'C3', 'C4', 'D'].includes(moduleId)) {
      warnings.push(`${label}: moduleId is outside the main future-ready module set.`);
    }
    if (!records[moduleId].methodologyNote) warnings.push(`${label}: methodology note is empty.`);
  });

  return { records, validation: { errors, warnings, infos: [] } };
}
