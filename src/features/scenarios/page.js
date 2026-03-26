import { pill, smallTable } from '../helpers.js';

export function renderScenarios(state) {
  const scenarioRows = Object.entries(state.scenarios).map(([moduleId, scenario]) => `
    <tr>
      <td><strong>${moduleId}</strong></td>
      <td>${scenario.scenarioPresetName}</td>
      <td>${pill(scenario.status)}</td>
      <td>${scenario.dataCompletenessPct}%</td>
      <td>${scenario.reviewNote}</td>
    </tr>
  `).join('');
  const c3Routes = (state.scenarios.C3.routes || []).map((route) => `
    <tr><td>${route.materialCategory}</td><td>${route.treatmentRoute}</td><td>${route.sharePct}%</td><td>${route.processingFactorId}</td><td>${route.note}</td></tr>
  `).join('');
  const validation = state.lastScenarioImport?.validation || { errors: [], warnings: [], infos: [] };
  const b4Options = (state.scenarioPresetLibrary?.B4 || []).map((preset) => `<option value="${preset.presetId}" ${state.scenarios.B4.presetId === preset.presetId ? 'selected' : ''}>${preset.label}</option>`).join('');
  const cOptions = (state.scenarioPresetLibrary?.C || []).map((preset) => `<option value="${preset.presetId}" ${(state.scenarios.C3.presetId || state.scenarios.C2.presetId) === preset.presetId ? 'selected' : ''}>${preset.label}</option>`).join('');
  const dOptions = (state.scenarioPresetLibrary?.D || []).map((preset) => `<option value="${preset.presetId}" ${state.scenarios.D.presetId === preset.presetId ? 'selected' : ''}>${preset.label}</option>`).join('');

  return `
    <div class="header">
      <div>
        <h2>Scenarios and lifecycle configuration</h2>
        <p>Structured lifecycle module inputs for B4, C1–C4, and D. These modules are active in the engine and can now use preset libraries.</p>
      </div>
      <div class="header-meta">
        ${pill('B4/C/D preset library')}
      </div>
    </div>

    <section class="section grid grid-2">
      <div class="card stack">
        <div class="section-title"><div><h3>Scenario preset library</h3><p>Reusable scenario presets for replacement, end-of-life, and module D.</p></div></div>
        <label>B4 preset<select data-scenario-preset="B4">${b4Options}</select></label>
        <label>C-stage preset<select data-scenario-preset="C">${cOptions}</select></label>
        <label>Module D preset<select data-scenario-preset="D">${dOptions}</select></label>
        <div class="notice small">Apply a preset to the active product. This updates the active scenario configuration without changing the overall methodology structure.</div>
      </div>
      <div class="card stack">
        <div class="section-title"><div><h3>Scenario import / export</h3><p>Lifecycle scenario scaffolding for B4, C1–C4, and D.</p></div></div>
        <div class="download-links">
          <button data-action="download-scenario-template">Download blank scenario template CSV</button>
          <button data-action="download-scenario-example">Download populated scenario example CSV</button>
          <button data-action="export-current-scenarios">Export current scenarios CSV</button>
        </div>
        <label class="notice"><strong>Import scenario CSV</strong><div class="small muted">Load lifecycle scenario libraries without changing the engine structure.</div><input id="scenario-import-input" type="file" accept=".csv" /></label>
        <div class="notice ${validation.errors.length ? 'bad' : 'warn'} small"><strong>Import validation</strong><br>Errors: ${validation.errors.length}<br>Warnings: ${validation.warnings.length}</div>
      </div>
    </section>

    <section class="section card">
      <div class="section-title"><div><h3>Scenario status</h3><p>These stored lifecycle configurations feed active modules and are versioned through run snapshots.</p></div></div>
      ${smallTable(['Module', 'Scenario preset', 'Status', 'Completeness', 'Review note'], scenarioRows)}
    </section>

    <section class="section grid grid-2">
      <div class="card"><div class="section-title"><div><h3>B4 replacement module</h3><p>Component/material level replacement logic is active.</p></div></div><div class="list"><div class="list-item"><span>Replacement interval</span><strong>${state.scenarios.B4.replacementIntervalYears} years</strong></div><div class="list-item"><span>Replaced category</span><strong>${state.scenarios.B4.replacedMaterialCategory}</strong></div><div class="list-item"><span>Distance</span><strong>${state.scenarios.B4.replacementDistanceKm} km</strong></div><div class="list-item"><span>Factor source</span><strong>${state.scenarios.B4.replacementFactorSource}</strong></div></div></div>
      <div class="card"><div class="section-title"><div><h3>C2 route logic</h3><p>Structured for two-leg transport logic under PCR 2019:14 VERSION 2.0.1.</p></div></div><div class="list"><div class="list-item"><span>Collection/sorting leg</span><strong>${state.scenarios.C2.collectionSortingDistanceKm} km</strong></div><div class="list-item"><span>Treatment leg</span><strong>${state.scenarios.C2.treatmentDistanceKm} km</strong></div><div class="list-item"><span>Total transport</span><strong>${state.scenarios.C2.totalTransportDistanceKm} km</strong></div><div class="list-item"><span>Vehicle</span><strong>${state.scenarios.C2.vehicleSpec}</strong></div></div></div>
    </section>

    <section class="section card">
      <div class="section-title"><div><h3>C3 end-of-life route split</h3><p>Shares should sum correctly by material category before external reporting.</p></div></div>
      ${smallTable(['Material', 'Route', 'Share', 'Processing factor', 'Note'], c3Routes)}
    </section>
  `;
}
