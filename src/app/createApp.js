import { methodologyConfig } from '../domain/methodology/config.js';
import { baseFactors } from '../data/libraries/base/factors.js';
import { customFactors as seededCustomFactors } from '../data/libraries/custom/customFactors.js';
import { demoProducts, demoBomRows } from '../data/seed/demoProduct.js';
import { demoScenariosByProduct, createDefaultScenarioSetForProduct } from '../data/seed/scenarios.js';
import { scenarioPresetLibrary, applyScenarioPreset } from '../data/seed/scenarioPresets.js';
import { runCalculation } from '../domain/engine/calculationEngine.js';
import { buildEpdReportHtml } from '../domain/engine/reporting.js';
import { bomTemplateHeaders, bomExampleRows } from '../data/templates/bomTemplate.js';
import { factorTemplateHeaders, factorExampleRows } from '../data/templates/factorTemplate.js';
import { scenarioTemplateHeaders, scenarioExampleRows } from '../data/templates/scenarioTemplate.js';
import { productTemplateHeaders, productExampleRows } from '../data/templates/productTemplate.js';
import { toCsv, downloadTextFile, readFileAsText } from '../utils/csv.js';
import { importBomFromCsv } from '../data/importers/bomImporter.js';
import { importFactorsFromCsv } from '../data/importers/factorImporter.js';
import { importScenariosFromCsv } from '../data/importers/scenarioImporter.js';
import { importProductsFromCsv } from '../data/importers/productImporter.js';
import { renderDashboard } from '../features/dashboard/page.js';
import { renderProducts } from '../features/products/page.js';
import { renderBom } from '../features/bom/page.js';
import { renderFactors } from '../features/factors/page.js';
import { renderCalculations } from '../features/calculations/page.js';
import { renderScenarios } from '../features/scenarios/page.js';
import { renderResults } from '../features/results/page.js';
import { renderSettings } from '../features/settings/page.js';
import { renderCompare } from '../features/compare/page.js';

const STORAGE_KEY = 'dovista-epd-generator-local-en15804a2-v1';

const pages = {
  dashboard: { label: 'Dashboard', render: renderDashboard },
  compare: { label: 'Compare', render: renderCompare },
  products: { label: 'Products', render: renderProducts },
  bom: { label: 'BOM', render: renderBom },
  factors: { label: 'Factors', render: renderFactors },
  scenarios: { label: 'Scenarios', render: renderScenarios },
  calculations: { label: 'Calculations', render: renderCalculations },
  results: { label: 'Results', render: renderResults },
  settings: { label: 'Settings', render: renderSettings },
};

function assumptionsRecords(state) {
  return state.calculation.assumptionsLog.map((item) => ({ key: `${item.category} - ${item.key}`, value: item.value }));
}

function summaryRecords(state) {
  const calc = state.calculation;
  return [
    ...calc.activeResults.map((result) => ({ module: result.moduleId, label: result.label, value: result.value, unit: result.unit, resultType: result.resultType, status: result.status })),
    { module: 'A1-A3', label: 'Total A1-A3', value: calc.totalA1A3, unit: 'kg CO2e', resultType: 'active_calculation', status: calc.readinessStatus },
    { module: 'LIFECYCLE-EXCL-D', label: 'Total lifecycle excl. D', value: calc.totalLifecycleExcludingD, unit: 'kg CO2e', resultType: 'active_calculation', status: calc.readinessStatus },
    { module: 'LIFECYCLE-INCL-D', label: 'Total lifecycle incl. D', value: calc.totalLifecycleIncludingD, unit: 'kg CO2e', resultType: 'active_calculation', status: calc.readinessStatus },
  ];
}

function dedupeBy(records, keyFn) {
  const seen = new Map();
  records.forEach((record) => seen.set(keyFn(record), record));
  return [...seen.values()];
}

function activeProduct(state) {
  return state.products.find((product) => product.productId === state.activeProductId) || state.products[0] || null;
}

function activeScenarios(state, productId) {
  if (!state.scenariosByProduct[productId]) {
    const product = state.products.find((item) => item.productId === productId) || { productId, platform: 'Imported product' };
    state.scenariosByProduct[productId] = createDefaultScenarioSetForProduct(product);
  }
  return state.scenariosByProduct[productId];
}

function defaultState() {
  return {
    page: 'dashboard',
    methodology: structuredClone(methodologyConfig),
    products: structuredClone(demoProducts),
    activeProductId: demoProducts[0].productId,
    product: null,
    bomRows: structuredClone(demoBomRows),
    baseFactors: structuredClone(baseFactors),
    customFactors: structuredClone(seededCustomFactors),
    scenariosByProduct: structuredClone(demoScenariosByProduct),
    scenarios: null,
    scenarioPresetLibrary: structuredClone(scenarioPresetLibrary),
    lastBomImport: null,
    lastFactorImport: null,
    lastScenarioImport: null,
    lastProductImport: null,
    calculation: null,
    calculationHistory: [],
    compare: {
      leftProductId: demoProducts[0].productId,
      rightProductId: demoProducts[1]?.productId || demoProducts[0].productId,
      leftSnapshotId: '',
      rightSnapshotId: '',
    },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const base = defaultState();
    return {
      ...base,
      ...parsed,
      methodology: { ...base.methodology, ...(parsed.methodology || {}) },
      products: parsed.products?.length ? parsed.products : base.products,
      bomRows: parsed.bomRows?.length ? parsed.bomRows : base.bomRows,
      baseFactors: base.baseFactors,
      customFactors: parsed.customFactors || base.customFactors,
      scenariosByProduct: parsed.scenariosByProduct || base.scenariosByProduct,
      calculationHistory: parsed.calculationHistory || [],
      compare: { ...base.compare, ...(parsed.compare || {}) },
      scenarioPresetLibrary: base.scenarioPresetLibrary,
      product: null,
      scenarios: null,
      calculation: null,
    };
  } catch (error) {
    console.warn('Failed to load saved state, using defaults.', error);
    return defaultState();
  }
}

function persistState(state) {
  const payload = {
    page: state.page,
    methodology: state.methodology,
    products: state.products,
    activeProductId: state.activeProductId,
    bomRows: state.bomRows,
    customFactors: state.customFactors,
    scenariosByProduct: state.scenariosByProduct,
    calculationHistory: state.calculationHistory,
    compare: state.compare,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function createApp(root) {
  const state = loadState();

  function getCalculationForProduct(productId) {
    const product = state.products.find((item) => item.productId === productId) || state.products[0];
    const scenarios = activeScenarios(state, product.productId);
    const bomRows = state.bomRows.filter((row) => row.productId === product.productId);
    return runCalculation({ methodology: state.methodology, product, bomRows, baseFactors: state.baseFactors, customFactors: state.customFactors, scenarios });
  }

  function recalculate() {
    state.product = activeProduct(state);
    state.scenarios = activeScenarios(state, state.product.productId);
    state.calculation = getCalculationForProduct(state.product.productId);
    state.getCalculationForProduct = getCalculationForProduct;
  }

  function saveRunSnapshot() {
    const snapshot = structuredClone(state.calculation.epdRecord);
    state.calculationHistory = [...state.calculationHistory.filter((run) => run.runId !== snapshot.runId), snapshot].slice(-60);
    if (!state.compare.leftSnapshotId) state.compare.leftSnapshotId = snapshot.runId;
    if (!state.compare.rightSnapshotId) state.compare.rightSnapshotId = snapshot.runId;
    render();
  }

  function resetLocalData() {
    localStorage.removeItem(STORAGE_KEY);
    Object.assign(state, defaultState());
    render();
  }

  function render() {
    recalculate();
    const activeProductBomCount = state.bomRows.filter((row) => row.productId === state.product.productId).length;
    persistState(state);
    root.innerHTML = `
      <div class="app-shell">
        <aside class="sidebar">
          <div class="brand">
            <h1>DOVISTA EPD Generator</h1>
            <p>Full local generator — EN 15804+A2 + PCR 2019:14 v2.0.1</p>
          </div>
          <label class="small muted">Active product</label>
          <select id="global-active-product-select">
            ${state.products.map((product) => `<option value="${product.productId}" ${product.productId === state.activeProductId ? 'selected' : ''}>${product.productName}</option>`).join('')}
          </select>
          <div class="sidebar-card small">
            <strong>${state.product.productName}</strong><br>
            ${state.product.productId}<br>
            ${state.product.platform}<br><br>
            <strong>Products</strong>: ${state.products.length}<br>
            <strong>Active BOM rows</strong>: ${activeProductBomCount}<br>
            <strong>Status</strong>: ${state.product.status}<br>
            <strong>Run</strong>: ${state.calculation.runId}
          </div>
          <nav class="nav">
            ${Object.entries(pages).map(([key, value]) => `<button class="${state.page === key ? 'active' : ''}" data-nav="${key}">${value.label}</button>`).join('')}
          </nav>
          <div class="sidebar-card small">
            <strong>Methodology</strong><br>
            ${state.methodology.governingPcr}<br><br>
            <strong>Standard</strong>: ${state.methodology.governingStandard}<br>
            <strong>Working climate indicator</strong>: ${state.methodology.workingIndicatorName}<br>
            <strong>Engine</strong>: ${state.methodology.calculationEngineVersion}<br>
            <strong>Active</strong>: ${state.methodology.activeModules.join(', ')}<br>
            <strong>Library</strong>: ${state.calculation.libraryMeta.versionFingerprint}
          </div>
        </aside>
        <main class="content">${pages[state.page].render(state)}</main>
      </div>
    `;
    bindEvents();
  }

  function addCustomFactorFromForm() {
    const get = (id) => root.querySelector(`#${id}`)?.value?.trim() || '';
    const factorId = get('cf-factorId');
    const factorName = get('cf-factorName');
    const materialCategory = get('cf-materialCategory');
    if (!factorId || !factorName || !materialCategory) {
      alert('Factor ID, name, and material category are required.');
      return;
    }
    state.customFactors.push({
      factorId,
      factorName,
      factorFamily: 'materials',
      materialCategory,
      materialSubtype: get('cf-materialSubtype'),
      sourceType: 'internal_placeholder',
      sourceStatus: get('cf-sourceStatus') || 'provisional',
      sourceReference: 'Manual local entry',
      sourcePublisher: 'Local app',
      geography: 'EU',
      validityYear: 2024,
      version: '1.0',
      versionGroup: factorId,
      approvalStatus: 'approved',
      effectiveFrom: new Date().toISOString().slice(0, 10),
      effectiveTo: '',
      unit: get('cf-unit') || 'kg',
      indicatorFramework: 'EN 15804+A2 supporting data',
      indicatorName: 'GWP-total',
      factorValue: Number(get('cf-factorValue') || 0),
      lowerBound: undefined,
      upperBound: undefined,
      priority: Number(get('cf-priority') || 95),
      isDefault: false,
      openLcaDatasetId: '',
      notes: 'Added manually in local prototype.',
      active: true,
    });
    render();
  }

  function exportCurrentBom() {
    const activeRows = state.bomRows.filter((row) => row.productId === state.product.productId);
    downloadTextFile(`${state.product.productId}-bom.csv`, toCsv(activeRows, bomTemplateHeaders), 'text/csv;charset=utf-8');
  }

  function exportCurrentProducts() {
    const records = state.products.map((product) => ({
      productId: product.productId,
      productName: product.productName,
      brand: product.brand,
      platform: product.platform,
      productFamily: product.productFamily,
      configurationCode: product.configurationCode,
      declaredUnit: product.declaredUnit,
      conversionFactorKgPerM2: product.conversionFactorKgPerM2,
      referenceServiceLifeYears: product.referenceServiceLifeYears,
      productionSite: product.productionSite,
      country: product.country,
      pcrVersion: product.pcrVersion,
      standardMethodology: product.standardMethodology,
      status: product.status,
      notes: product.notes,
      manufacturingProfileId: product.manufacturingProfile.profileId,
      manufacturingSiteName: product.manufacturingProfile.siteName,
      manufacturingCountry: product.manufacturingProfile.country,
      electricityKwhPerDeclaredUnit: product.manufacturingProfile.electricityKwhPerDeclaredUnit,
      electricityFactorId: product.manufacturingProfile.electricityFactorId,
      heatMjPerDeclaredUnit: product.manufacturingProfile.heatMjPerDeclaredUnit,
      heatFactorId: product.manufacturingProfile.heatFactorId,
      consumablesImpact: product.manufacturingProfile.consumablesImpact,
      woodWasteRate: product.manufacturingProfile.woodWasteRate,
      aluminiumWasteRate: product.manufacturingProfile.aluminiumWasteRate,
      processNotes: product.manufacturingProfile.processNotes,
    }));
    downloadTextFile('products.csv', toCsv(records, productTemplateHeaders), 'text/csv;charset=utf-8');
  }

  function exportCurrentCustomFactors() {
    downloadTextFile('custom-factors.csv', toCsv(state.customFactors, factorTemplateHeaders), 'text/csv;charset=utf-8');
  }

  function exportCurrentScenarios() {
    const scenarioSet = activeScenarios(state, state.product.productId);
    const records = Object.entries(scenarioSet).map(([moduleId, scenario]) => ({
      moduleId,
      status: scenario.status || '',
      scenarioPresetName: scenario.scenarioPresetName || '',
      methodologyNote: scenario.methodologyNote || '',
      dataCompletenessPct: scenario.dataCompletenessPct || 0,
      previewEnabled: scenario.previewEnabled ? 'true' : 'false',
      reviewNote: scenario.reviewNote || '',
      replacementIntervalYears: scenario.replacementIntervalYears || '',
      replacedMaterialCategory: scenario.replacedMaterialCategory || '',
      replacementSharePct: scenario.replacementSharePct || '',
      replacementMassBasisKg: scenario.replacementMassBasisKg || '',
      replacementTransportMode: scenario.replacementTransportMode || '',
      replacementVehicleSpec: scenario.replacementVehicleSpec || '',
      replacementDistanceKm: scenario.replacementDistanceKm || '',
      replacementFactorSource: scenario.replacementFactorSource || '',
      demolitionProcessType: scenario.demolitionProcessType || '',
      demolitionEnergyFactorId: scenario.demolitionEnergyFactorId || '',
      demolitionEnergyAmountMj: scenario.demolitionEnergyAmountMj || '',
      collectionSortingDistanceKm: scenario.collectionSortingDistanceKm || '',
      treatmentDistanceKm: scenario.treatmentDistanceKm || '',
      totalTransportDistanceKm: scenario.totalTransportDistanceKm || '',
      mode: scenario.mode || '',
      vehicleSpec: scenario.vehicleSpec || '',
      transportFactorId: scenario.transportFactorId || '',
      routesJson: scenario.routes ? JSON.stringify(scenario.routes) : '',
      disposalFactorId: scenario.disposalFactorId || '',
      recoveredFlowsJson: scenario.recoveredFlows ? JSON.stringify(scenario.recoveredFlows) : '',
    }));
    downloadTextFile(`${state.product.productId}-scenarios.csv`, toCsv(records, scenarioTemplateHeaders), 'text/csv;charset=utf-8');
  }

  function exportEpdSummary() {
    downloadTextFile(`${state.product.productId}-epd-summary.csv`, toCsv(summaryRecords(state), ['module', 'label', 'value', 'unit', 'resultType', 'status']), 'text/csv;charset=utf-8');
  }

  function exportAssumptionsLog() {
    downloadTextFile(`${state.product.productId}-assumptions-log.csv`, toCsv(assumptionsRecords(state), ['key', 'value']), 'text/csv;charset=utf-8');
  }

  function exportCalculationJson() {
    downloadTextFile(`${state.product.productId}-calculation-package.json`, JSON.stringify(state.calculation.epdRecord, null, 2), 'application/json;charset=utf-8');
  }

  function exportEpdReport() {
    downloadTextFile(`${state.product.productId}-epd-report.html`, buildEpdReportHtml(state), 'text/html;charset=utf-8');
  }

  async function handleBomImport(file) {
    if (!file) return;
    const text = await readFileAsText(file);
    const imported = importBomFromCsv(text);
    state.lastBomImport = imported;
    if (!imported.validation.errors.length) {
      state.bomRows = dedupeBy([...state.bomRows, ...imported.records], (row) => `${row.productId}::${row.componentId}`);
      const firstKnownProductId = imported.records.find((row) => state.products.some((product) => product.productId === row.productId))?.productId;
      if (firstKnownProductId) state.activeProductId = firstKnownProductId;
    }
    render();
  }

  async function handleProductImport(file) {
    if (!file) return;
    const text = await readFileAsText(file);
    const imported = importProductsFromCsv(text);
    state.lastProductImport = imported;
    if (!imported.validation.errors.length) {
      state.products = dedupeBy([...state.products, ...imported.records], (product) => product.productId);
      imported.records.forEach((product) => {
        if (!state.scenariosByProduct[product.productId]) state.scenariosByProduct[product.productId] = createDefaultScenarioSetForProduct(product);
      });
      if (imported.records[0]?.productId) state.activeProductId = imported.records[0].productId;
    }
    render();
  }

  async function handleFactorImport(file) {
    if (!file) return;
    const text = await readFileAsText(file);
    const imported = importFactorsFromCsv(text);
    state.lastFactorImport = imported;
    if (!imported.validation.errors.length) state.customFactors = dedupeBy([...state.customFactors, ...imported.records], (factor) => `${factor.factorId}@${factor.version || '1.0'}`);
    render();
  }

  async function handleScenarioImport(file) {
    if (!file) return;
    const text = await readFileAsText(file);
    const imported = importScenariosFromCsv(text);
    state.lastScenarioImport = imported;
    if (!imported.validation.errors.length) state.scenariosByProduct[state.activeProductId] = { ...activeScenarios(state, state.activeProductId), ...imported.records };
    render();
  }

  function bindEvents() {
    root.querySelector('#global-active-product-select')?.addEventListener('change', (event) => {
      state.activeProductId = event.target.value;
      render();
    });

    root.querySelectorAll('[data-nav]').forEach((button) => {
      button.addEventListener('click', () => {
        state.page = button.dataset.nav;
        render();
      });
    });

    root.querySelectorAll('[data-switch-product]').forEach((button) => {
      button.addEventListener('click', () => {
        state.activeProductId = button.dataset.switchProduct;
        state.page = button.dataset.nextPage || state.page;
        render();
      });
    });

    root.querySelectorAll('[data-compare]').forEach((element) => {
      element.addEventListener('change', (event) => {
        state.compare[event.target.dataset.compare] = event.target.value;
        render();
      });
    });

    root.querySelectorAll('[data-scenario-preset]').forEach((element) => {
      element.addEventListener('change', (event) => {
        const moduleKey = event.target.dataset.scenarioPreset;
        const presetId = event.target.value;
        state.scenariosByProduct[state.activeProductId] = applyScenarioPreset(activeScenarios(state, state.activeProductId), moduleKey, presetId);
        render();
      });
    });

    root.querySelectorAll('[data-action="manual-factor"]').forEach((select) => {
      select.addEventListener('change', (event) => {
        const row = state.bomRows.find((item) => item.productId === state.activeProductId && item.componentId === event.target.dataset.componentId);
        if (!row) return;
        row.manualFactorId = event.target.value;
        render();
      });
    });

    root.querySelectorAll('[data-action="audit-note"]').forEach((input) => {
      input.addEventListener('change', (event) => {
        const row = state.bomRows.find((item) => item.productId === state.activeProductId && item.componentId === event.target.dataset.componentId);
        if (!row) return;
        row.auditNote = event.target.value;
      });
    });

    root.querySelectorAll('[data-action]').forEach((element) => {
      const action = element.dataset.action;
      if (action === 'download-product-template') element.addEventListener('click', () => downloadTextFile('product-template.csv', toCsv([], productTemplateHeaders), 'text/csv;charset=utf-8'));
      if (action === 'download-product-example') element.addEventListener('click', () => downloadTextFile('product-example.csv', toCsv(productExampleRows, productTemplateHeaders), 'text/csv;charset=utf-8'));
      if (action === 'export-products') element.addEventListener('click', exportCurrentProducts);
      if (action === 'download-bom-template') element.addEventListener('click', () => downloadTextFile('bom-template.csv', toCsv([], bomTemplateHeaders), 'text/csv;charset=utf-8'));
      if (action === 'download-bom-example') element.addEventListener('click', () => downloadTextFile('bom-example.csv', toCsv(bomExampleRows, bomTemplateHeaders), 'text/csv;charset=utf-8'));
      if (action === 'download-factor-template') element.addEventListener('click', () => downloadTextFile('factor-template.csv', toCsv([], factorTemplateHeaders), 'text/csv;charset=utf-8'));
      if (action === 'download-factor-example') element.addEventListener('click', () => downloadTextFile('factor-example.csv', toCsv(factorExampleRows, factorTemplateHeaders), 'text/csv;charset=utf-8'));
      if (action === 'download-scenario-template') element.addEventListener('click', () => downloadTextFile('scenario-template.csv', toCsv([], scenarioTemplateHeaders), 'text/csv;charset=utf-8'));
      if (action === 'download-scenario-example') element.addEventListener('click', () => downloadTextFile('scenario-example.csv', toCsv(scenarioExampleRows, scenarioTemplateHeaders), 'text/csv;charset=utf-8'));
      if (action === 'export-current-bom') element.addEventListener('click', exportCurrentBom);
      if (action === 'export-custom-factors') element.addEventListener('click', exportCurrentCustomFactors);
      if (action === 'export-current-scenarios') element.addEventListener('click', exportCurrentScenarios);
      if (action === 'export-epd-summary') element.addEventListener('click', exportEpdSummary);
      if (action === 'export-calculation-json') element.addEventListener('click', exportCalculationJson);
      if (action === 'export-assumptions-log') element.addEventListener('click', exportAssumptionsLog);
      if (action === 'export-epd-report') element.addEventListener('click', exportEpdReport);
      if (action === 'add-custom-factor') element.addEventListener('click', addCustomFactorFromForm);
      if (action === 'save-run-snapshot') element.addEventListener('click', saveRunSnapshot);
      if (action === 'reset-local-data') element.addEventListener('click', resetLocalData);
      if (action === 'auto-map-all') element.addEventListener('click', () => {
        state.bomRows = state.bomRows.map((row) => row.productId === state.activeProductId ? { ...row, manualFactorId: '' } : row);
        render();
      });
      if (action === 'clear-manual-overrides') element.addEventListener('click', () => {
        state.bomRows.forEach((row) => {
          if (row.productId !== state.activeProductId) return;
          row.manualFactorId = '';
          row.auditNote = '';
        });
        render();
      });
    });

    root.querySelector('#product-import-input')?.addEventListener('change', (event) => handleProductImport(event.target.files?.[0]));
    root.querySelector('#bom-import-input')?.addEventListener('change', (event) => handleBomImport(event.target.files?.[0]));
    root.querySelector('#factor-import-input')?.addEventListener('change', (event) => handleFactorImport(event.target.files?.[0]));
    root.querySelector('#scenario-import-input')?.addEventListener('change', (event) => handleScenarioImport(event.target.files?.[0]));
  }

  render();
}
