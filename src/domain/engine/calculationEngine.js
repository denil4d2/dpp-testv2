import { moduleRegistry } from './moduleRegistry.js';
import { collectValidationIssues } from './validationEngine.js';
import { resolveFactorForRow, mergeFactorLibraries, resolveFactorById } from './factorResolver.js';
import { getFactorById, totalMassKg, unique, safeNumber, normalizeToDeclaredUnit, parseDeclaredUnit, simpleHash } from './context.js';
import { ensureResultIndicators, INDICATOR_ORDER, sumIndicatorMatrices } from './indicators.js';

function createRunId(productId) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${productId}-${stamp}`;
}

function decorateBomRows(product, bomRows, factors) {
  return bomRows.map((row) => {
    const materialResolution = resolveFactorForRow(row, factors, {
      expectedUnit: 'kg',
      indicatorName: 'GWP-total',
      factorFamilyHint: 'materials',
    });
    const transportResolution = row.transportFactorId
      ? resolveFactorById(row.transportFactorId, factors, { expectedUnit: 'tkm', indicatorName: 'Transport' })
      : resolveFactorById('FAC-TR-EU5-001', factors, { expectedUnit: 'tkm', indicatorName: 'Transport' });
    return {
      ...row,
      resolvedFactor: materialResolution.factor,
      mappingStatus: materialResolution.mappingStatus,
      mappingReason: materialResolution.mappingReason,
      mappingConfidence: materialResolution.confidence,
      mappingUnitMismatch: materialResolution.unitMismatch,
      transportFactor: transportResolution.factor,
      transportMappingStatus: transportResolution.mappingStatus,
      transportMappingReason: transportResolution.mappingReason,
      transportUnitMismatch: transportResolution.unitMismatch,
      manualFactorId: row.manualFactorId || '',
      auditNote: row.auditNote || '',
    };
  });
}

function aggregateContributions(results, rows) {
  const trackedModules = new Set(['A1', 'A2', 'B4', 'C2', 'C3', 'C4']);
  const byMaterial = {};
  const bySupplier = {};
  const byComponent = {};
  rows.forEach((row) => {
    const contribution = results
      .filter((item) => trackedModules.has(item.moduleId))
      .reduce((sum, result) => sum + (result.breakdown.find((item) => item.componentId === row.componentId)?.value || 0), 0);
    byMaterial[row.materialCategory] = (byMaterial[row.materialCategory] || 0) + contribution;
    bySupplier[row.supplier || 'Missing supplier'] = (bySupplier[row.supplier || 'Missing supplier'] || 0) + contribution;
    byComponent[row.partName] = (byComponent[row.partName] || 0) + contribution;
  });
  return { byMaterial, bySupplier, byComponent };
}

function summarizeStageTotals(results) {
  const byStage = {
    productStage: results.filter((item) => ['A1', 'A2', 'A3'].includes(item.moduleId)).reduce((sum, item) => sum + safeNumber(item.value), 0),
    useStage: results.filter((item) => item.moduleId === 'B4').reduce((sum, item) => sum + safeNumber(item.value), 0),
    endOfLife: results.filter((item) => ['C1', 'C2', 'C3', 'C4'].includes(item.moduleId)).reduce((sum, item) => sum + safeNumber(item.value), 0),
    moduleD: results.filter((item) => item.moduleId === 'D').reduce((sum, item) => sum + safeNumber(item.value), 0),
  };
  byStage.totalExcludingD = byStage.productStage + byStage.useStage + byStage.endOfLife;
  byStage.totalIncludingD = byStage.totalExcludingD + byStage.moduleD;
  return byStage;
}

function summarizeIndicatorTotals(results) {
  const pack = {
    productStage: sumIndicatorMatrices(results.filter((item) => ['A1', 'A2', 'A3'].includes(item.moduleId))),
    useStage: sumIndicatorMatrices(results.filter((item) => item.moduleId === 'B4')),
    endOfLife: sumIndicatorMatrices(results.filter((item) => ['C1', 'C2', 'C3', 'C4'].includes(item.moduleId))),
    moduleD: sumIndicatorMatrices(results.filter((item) => item.moduleId === 'D')),
  };
  pack.totalExcludingD = Object.fromEntries(INDICATOR_ORDER.map((name) => [name, safeNumber(pack.productStage[name]) + safeNumber(pack.useStage[name]) + safeNumber(pack.endOfLife[name])]));
  pack.totalIncludingD = Object.fromEntries(INDICATOR_ORDER.map((name) => [name, safeNumber(pack.totalExcludingD[name]) + safeNumber(pack.moduleD[name])]));
  return pack;
}

function summarizeFactorUsage(factors, bomRows, results) {
  const usage = new Map();
  const addUsage = (factorId, source) => {
    if (!factorId) return;
    const factor = getFactorById(factors, factorId);
    const existing = usage.get(factorId) || {
      factorId,
      factorName: factor?.factorName || factorId,
      version: factor?.version || '1.0',
      factorVersionKey: factor?.factorVersionKey || `${factorId}@1.0`,
      sourceStatus: factor?.sourceStatus || 'unknown',
      sourceType: factor?.sourceType || 'unknown',
      unit: factor?.unit || 'unknown',
      usedIn: [],
      useCount: 0,
    };
    existing.usedIn = unique([...existing.usedIn, source]);
    existing.useCount += 1;
    usage.set(factorId, existing);
  };

  bomRows.forEach((row) => {
    addUsage(row.resolvedFactor?.factorId, `BOM:${row.componentId}:A1`);
    addUsage(row.transportFactor?.factorId, `BOM:${row.componentId}:A2`);
  });
  results.forEach((result) => {
    (result.factorIdsUsed || []).forEach((factorId) => addUsage(factorId, `Module:${result.moduleId}`));
  });
  return [...usage.values()].sort((a, b) => b.useCount - a.useCount);
}

function buildAssumptionsLog({ methodology, product, scenarios, bomRows, issues, libraryMeta }) {
  const declared = parseDeclaredUnit(product?.declaredUnit || methodology?.declaredUnit || '1 m²');
  return [
    { category: 'Methodology', key: 'Governing standard', value: methodology.governingStandard },
    { category: 'Methodology', key: 'Governing PCR', value: methodology.governingPcr },
    { category: 'Methodology', key: 'Indicator framework', value: methodology.indicatorFramework },
    { category: 'Methodology', key: 'Working indicator', value: methodology.workingIndicatorName },
    { category: 'Methodology', key: 'Declared unit', value: methodology.declaredUnit },
    { category: 'Methodology', key: 'Declared unit amount', value: `${declared.amount} ${declared.unit}` },
    { category: 'Methodology', key: 'Conversion factor', value: `${methodology.conversionFactorKgPerM2} kg/m²` },
    { category: 'Methodology', key: 'Reference service life', value: `${methodology.referenceServiceLifeYears} years` },
    { category: 'Methodology', key: 'Default transport vehicle', value: methodology.defaultTransportVehicle },
    { category: 'Product', key: 'Product ID', value: product.productId },
    { category: 'Product', key: 'Product name', value: product.productName },
    { category: 'Product', key: 'Production site', value: product.productionSite },
    { category: 'Dataset', key: 'BOM rows', value: String(bomRows.length) },
    { category: 'Dataset', key: 'Scenario modules loaded', value: Object.keys(scenarios).join(', ') },
    { category: 'Dataset', key: 'Factor library fingerprint', value: libraryMeta.versionFingerprint },
    { category: 'Dataset', key: 'Factor versions', value: String(libraryMeta.factorCount) },
    { category: 'Validation', key: 'Validation issue count', value: String(issues.length) },
  ];
}

function buildLibraryMeta(factors) {
  const versionFingerprint = simpleHash(factors.map((factor) => `${factor.factorId}@${factor.version || '1.0'}=${factor.factorValue}`).sort().join('|'));
  return {
    versionFingerprint,
    factorCount: factors.length,
    confirmedCount: factors.filter((factor) => factor.sourceStatus === 'confirmed').length,
    provisionalCount: factors.filter((factor) => factor.sourceStatus === 'provisional').length,
    snapshot: factors.map((factor) => ({
      factorId: factor.factorId,
      factorName: factor.factorName,
      version: factor.version || '1.0',
      factorVersionKey: factor.factorVersionKey || `${factor.factorId}@${factor.version || '1.0'}`,
      sourceStatus: factor.sourceStatus,
      unit: factor.unit,
      factorValue: factor.factorValue,
      indicatorName: factor.indicatorName,
      indicatorFramework: factor.indicatorFramework,
    })),
  };
}

function buildEpdRecord({ runId, timestamp, methodology, product, results, issues, stageTotals, indicatorTotals, factorUsage, assumptionsLog, bomRows, readinessStatus, calculationEngineMode, libraryMeta, scenarios }) {
  return {
    runId,
    runName: `${product.productName} — full generator snapshot`,
    timestamp,
    methodology: {
      governingPcr: methodology.governingPcr,
      indicatorFramework: methodology.indicatorFramework,
      workingIndicatorName: methodology.workingIndicatorName,
      supportingFactorField: methodology.supportingFactorField,
      declaredUnit: methodology.declaredUnit,
      conversionFactorKgPerM2: methodology.conversionFactorKgPerM2,
      referenceServiceLifeYears: methodology.referenceServiceLifeYears,
      calculationEngineVersion: methodology.calculationEngineVersion,
      activeModules: methodology.activeModules,
    },
    product: {
      productId: product.productId,
      productName: product.productName,
      platform: product.platform,
      productFamily: product.productFamily,
      declaredUnit: product.declaredUnit,
      conversionFactorKgPerM2: product.conversionFactorKgPerM2,
      referenceServiceLifeYears: product.referenceServiceLifeYears,
      productionSite: product.productionSite,
      country: product.country,
    },
    summary: {
      readinessStatus,
      calculationEngineMode,
      stageTotals,
      indicatorTotals,
      totalMassKg: totalMassKg(bomRows),
      issueCount: issues.length,
      factorUsageCount: factorUsage.length,
      libraryVersionFingerprint: libraryMeta.versionFingerprint,
    },
    normalization: {
      declaredUnitText: product.declaredUnit || methodology.declaredUnit,
      declaredUnitAmount: parseDeclaredUnit(product.declaredUnit || methodology.declaredUnit).amount,
    },
    moduleResults: results.map((result) => ({
      moduleId: result.moduleId,
      label: result.label,
      group: result.group,
      status: result.status,
      resultType: result.resultType,
      unit: result.unit,
      value: result.value,
      normalizedValue: result.normalizedValue,
      indicators: result.indicators,
      methodologyNote: result.methodologyNote,
      assumptions: result.assumptions,
      inputs: result.inputs,
      factorIdsUsed: result.factorIdsUsed,
      warnings: result.warnings,
      breakdown: result.breakdown,
    })),
    factorUsage,
    factorLibraryMeta: libraryMeta,
    factorLibrarySnapshot: libraryMeta.snapshot,
    assumptionsLog,
    scenarioSnapshot: JSON.parse(JSON.stringify(scenarios)),
    bomSnapshot: bomRows,
    validationIssues: issues,
  };
}

export function runCalculation({ methodology, product, bomRows, baseFactors, customFactors, scenarios }) {
  const timestamp = new Date().toISOString();
  const runId = createRunId(product.productId);
  const factors = mergeFactorLibraries(baseFactors, customFactors);
  const libraryMeta = buildLibraryMeta(factors);
  const enrichedRows = decorateBomRows(product, bomRows, factors);
  const context = { methodology, product, bomRows: enrichedRows, factors, scenarios, runId, timestamp };
  const issues = collectValidationIssues(context, moduleRegistry);
  const rawResults = moduleRegistry.map((module) => module.calculate(context));
  const results = rawResults.map((result) => {
    const enriched = ensureResultIndicators(result, factors, methodology.workingIndicatorName || 'GWP-total');
    return {
      ...enriched,
      normalizedValue: normalizeToDeclaredUnit(enriched.value, product, methodology),
      normalizedIndicators: Object.fromEntries(INDICATOR_ORDER.map((name) => [name, normalizeToDeclaredUnit(enriched.indicators?.[name], product, methodology)])),
    };
  });
  const coreModules = new Set(['A1', 'A2', 'A3']);
  const extensionModules = new Set(['B4', 'C1', 'C2', 'C3', 'C4', 'D']);
  const activeResults = results.filter((result) => result.resultType === 'active_calculation');
  const previewResults = results.filter((result) => result.resultType === 'scenario_preview');
  const coreResults = activeResults.filter((result) => coreModules.has(result.moduleId));
  const extensionResults = activeResults.filter((result) => extensionModules.has(result.moduleId));
  const totalA1A3 = coreResults.reduce((sum, item) => sum + safeNumber(item.value), 0);
  const totalLifecycleExcludingD = activeResults.filter((r) => r.moduleId !== 'D').reduce((sum, item) => sum + safeNumber(item.value), 0);
  const totalLifecycleIncludingD = activeResults.reduce((sum, item) => sum + safeNumber(item.value), 0);
  const contributions = aggregateContributions(results, enrichedRows);
  const mappingCoverage = enrichedRows.length ? Math.round((enrichedRows.filter((row) => row.resolvedFactor).length / enrichedRows.length) * 100) : 0;
  const provisionalFactorCount = enrichedRows.filter((row) => row.resolvedFactor?.sourceStatus === 'provisional').length;
  const warningCount = issues.filter((issue) => issue.severity === 'warning').length;
  const errorCount = issues.filter((issue) => issue.severity === 'error').length;
  const readinessStatus = enrichedRows.some((row) => !row.resolvedFactor)
    ? 'Incomplete'
    : errorCount > 0
      ? 'Incomplete'
      : provisionalFactorCount > 0 || warningCount > 0
        ? 'Needs review'
        : 'Ready';

  const stageTotals = summarizeStageTotals(activeResults);
  const indicatorTotals = summarizeIndicatorTotals(activeResults);
  const factorUsage = summarizeFactorUsage(factors, enrichedRows, activeResults);
  const assumptionsLog = buildAssumptionsLog({ methodology, product, scenarios, bomRows: enrichedRows, issues, libraryMeta });
  const calculationEngineMode = 'Internal factor engine';
  const epdRecord = buildEpdRecord({
    runId,
    timestamp,
    methodology,
    product,
    results: activeResults,
    issues,
    stageTotals,
    indicatorTotals,
    factorUsage,
    assumptionsLog,
    bomRows: enrichedRows,
    readinessStatus,
    calculationEngineMode,
    libraryMeta,
    scenarios,
  });

  return {
    runId,
    runName: epdRecord.runName,
    timestamp,
    methodologyLabel: `${methodology.governingStandard} + ${methodology.governingPcr}`, 
    productLabel: product.productName,
    factors,
    bomRows: enrichedRows,
    issues,
    results,
    activeResults,
    previewResults,
    coreResults,
    extensionResults,
    totalA1A3,
    totalLifecycleExcludingD,
    totalLifecycleIncludingD,
    mappingCoverage,
    provisionalFactorCount,
    readinessStatus,
    totalMassKg: totalMassKg(enrichedRows),
    contributions,
    manufacturingProfile: product.manufacturingProfile,
    calculationEngineMode,
    transportFactor: getFactorById(factors, 'FAC-TR-EU5-001'),
    warningCount,
    errorCount,
    stageTotals,
    indicatorTotals,
    factorUsage,
    assumptionsLog,
    normalization: { declaredUnitText: product.declaredUnit || methodology.declaredUnit, declaredUnitAmount: parseDeclaredUnit(product.declaredUnit || methodology.declaredUnit).amount },
    qualitySummary: {
      warningCount,
      errorCount,
      infoCount: issues.filter((issue) => issue.severity === 'info').length,
      mappingCoverage,
      provisionalFactorCount,
    },
    libraryMeta,
    epdRecord,
  };
}
