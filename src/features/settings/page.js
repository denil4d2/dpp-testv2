import { metricRow, pill } from '../helpers.js';

export function renderSettings(state) {
  return `
    <div class="header">
      <div>
        <h2>Settings and methodology</h2>
        <p>Centralized methodology config and engine structure for the full local EPD generator under EN 15804+A2 + PCR 2019:14 v2.0.1.</p>
      </div>
      <div class="header-meta">
        ${pill(state.methodology.governingStandard)}
        ${pill(state.methodology.governingPcr)}
        ${pill(state.methodology.indicatorFramework)}
      </div>
    </div>

    <section class="section two-col">
      <div class="card">
        <div class="section-title"><div><h3>Methodology configuration</h3><p>Keep this centralized so new datasets can be loaded without rewriting UI or formulas.</p></div></div>
        ${metricRow('Governing standard', state.methodology.governingStandard)}
        ${metricRow('Governing PCR', state.methodology.governingPcr)}
        ${metricRow('Declared unit', state.methodology.declaredUnit)}
        ${metricRow('Conversion factor', `${state.methodology.conversionFactorKgPerM2} kg/m²`)}
        ${metricRow('Reference service life', `${state.methodology.referenceServiceLifeYears} years`)}
        ${metricRow('Default transport vehicle', state.methodology.defaultTransportVehicle)}
        ${metricRow('Default electricity factor', `${state.methodology.defaultElectricityFactor} kg CO₂e/kWh`)}
        ${metricRow('Primary indicator set', state.methodology.indicatorFramework)}
        ${metricRow('Working climate indicator', state.methodology.workingIndicatorName)}
        ${metricRow('Supporting factor field', state.methodology.supportingFactorField)}
        ${metricRow('Calculation engine version', state.methodology.calculationEngineVersion)}
        ${metricRow('Active modules', state.methodology.activeModules.join(', '))}
      </div>
      <div class="card stack">
        <div class="section-title"><div><h3>Infrastructure notes</h3><p>This version is structured so you mainly load data later instead of redesigning the app.</p></div></div>
        <div class="notice small">The calculation engine now returns a structured EPD calculation package: methodology, product metadata, module results, stage totals, factor usage, assumptions log, and validation issues.</div>
        <div class="notice small">Factor libraries are layered as base + custom and resolved by priority, source status, indicator fit, unit fit, and material matching.</div>
        <div class="notice small">Factor fields are aligned to EN 15804+A2 reporting needs and include method basis, indicator name, optional climate-indicator splits, optional bounds, and openLCA dataset IDs.</div>
        <div class="notice small">BOM, factors, scenarios, and products persist locally in the browser so imports survive refreshes.</div>
        <div class="notice small">Use Reset local data only when you want to go back to the seeded demo state.</div>
        <div class="download-links"><button data-action="reset-local-data">Reset local data</button></div>
      </div>
    </section>
  `;
}
