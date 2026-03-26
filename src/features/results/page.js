import { pill, resultRows, smallTable, formatKgCo2, formatNumber } from '../helpers.js';

export function renderResults(state) {
  const calc = state.calculation;
  const c3Routes = (state.scenarios.C3.routes || []).map((route) => `
    <tr>
      <td>${route.materialCategory}</td>
      <td>${route.treatmentRoute}</td>
      <td>${route.sharePct}%</td>
      <td>${state.scenarios.C2.totalTransportDistanceKm} km total</td>
      <td>${route.note}</td>
    </tr>
  `).join('');

  const b4 = state.scenarios.B4;
  const dRows = (state.scenarios.D.recoveredFlows || []).map((flow) => `
    <tr>
      <td>${flow.materialCategory}</td>
      <td>${flow.outputFlowMassKg} kg</td>
      <td>${flow.substitutionAssumption}</td>
      <td>${flow.creditFactorId}</td>
      <td>${flow.note}</td>
    </tr>
  `).join('');

  const factorUsageRows = calc.factorUsage.map((factor) => `
    <tr>
      <td>${factor.factorId}</td>
      <td>${factor.factorName}</td>
      <td>${factor.version}</td>
      <td>${factor.sourceStatus}</td>
      <td>${factor.sourceType}</td>
      <td>${factor.unit}</td>
      <td>${factor.useCount}</td>
      <td>${factor.usedIn.join(', ')}</td>
    </tr>
  `).join('');

  const assumptionsRows = calc.assumptionsLog.map((item) => `
    <tr>
      <td>${item.category}</td>
      <td>${item.key}</td>
      <td>${item.value}</td>
    </tr>
  `).join('');

  const reportedIndicators = ['GWP-total', 'GWP-fossil', 'GWP-biogenic', 'GWP-luluc'];
  const indicatorRows = reportedIndicators.map((name) => `
    <tr>
      <td>${name}</td>
      <td>${formatNumber(calc.indicatorTotals.productStage[name])}</td>
      <td>${formatNumber(calc.indicatorTotals.useStage[name])}</td>
      <td>${formatNumber(calc.indicatorTotals.endOfLife[name])}</td>
      <td>${formatNumber(calc.indicatorTotals.moduleD[name])}</td>
      <td>${formatNumber(calc.indicatorTotals.totalExcludingD[name])}</td>
    </tr>
  `).join('');

  return `
    <div class="header">
      <div>
        <h2>Results and assumptions</h2>
        <p>Export-ready full generator view across A1–A3, B4, C1, C2, C3, C4, and D under EN 15804+A2 + PCR 2019:14 v2.0.1, including indicator matrices and calculation snapshots.</p>
      </div>
      <div class="header-meta">
        ${pill(calc.readinessStatus)}
        ${pill(state.methodology.governingPcr)}
      </div>
    </div>

    <section class="section card">
      <div class="section-title"><div><h3>Export outputs</h3><p>Use these for review packages and downstream checks.</p></div></div>
      <div class="download-links">
        <button data-action="export-epd-summary">Export EPD summary CSV</button>
        <button data-action="export-calculation-json">Export full calculation snapshot JSON</button>
        <button data-action="export-assumptions-log">Export assumptions log CSV</button>
        <button data-action="export-epd-report">Export EPD report HTML</button>
      </div>
    </section>

    <section class="section grid grid-2">
      <div class="card">
        <div class="section-title"><div><h3>Lifecycle summary</h3><p>All active modules and current rollups.</p></div></div>
        ${smallTable(['Module', 'Label', 'Value', 'Status', 'Result type', 'Methodology note'], resultRows(calc.activeResults))}
      </div>
      <div class="card">
        <div class="section-title"><div><h3>EN 15804+A2 climate indicator matrix</h3><p>Climate indicator rollups from the stored run. GWP-GHG is retained only as a supporting factor field where the source dataset uses it, not as a primary reported EN 15804+A2 result column.</p></div></div>
        ${smallTable(['Indicator', 'Product stage', 'Use stage', 'End-of-life', 'Module D', 'Total excl. D'], indicatorRows)}
      </div>
    </section>

    <section class="section grid grid-3">
      <div class="card">${[ ['Total A1–A3', calc.totalA1A3], ['Lifecycle excl. D', calc.totalLifecycleExcludingD], ['Lifecycle incl. D', calc.totalLifecycleIncludingD] ].map(([label, value]) => `<div class="metric-row"><span>${label}</span><strong>${formatKgCo2(value)}</strong></div>`).join('')}</div>
      <div class="card">${[ ['B4 interval', `${b4.replacementIntervalYears} years`], ['B4 factor', b4.replacementFactorSource], ['C2 total distance', `${state.scenarios.C2.totalTransportDistanceKm} km`] ].map(([label, value]) => `<div class="metric-row"><span>${label}</span><strong>${value}</strong></div>`).join('')}</div>
      <div class="card">${[ ['Library fingerprint', calc.libraryMeta.versionFingerprint], ['Factor usage entries', calc.factorUsage.length], ['Run snapshot', calc.runId] ].map(([label, value]) => `<div class="metric-row"><span>${label}</span><strong>${value}</strong></div>`).join('')}</div>
    </section>

    <section class="section card">
      <div class="section-title"><div><h3>Factor usage and version tracking</h3><p>Each run stores the exact factor versions used.</p></div></div>
      ${smallTable(['Factor ID', 'Factor', 'Version', 'Status', 'Type', 'Unit', 'Uses', 'Used in'], factorUsageRows)}
    </section>

    <section class="section grid grid-2">
      <div class="card">
        <div class="section-title"><div><h3>End-of-life routing table</h3><p>Material-category route split for C3 plus transport assumptions from C2.</p></div></div>
        ${smallTable(['Material', 'Route', 'Share', 'Transport assumption', 'Note'], c3Routes)}
      </div>
      <div class="card">
        <div class="section-title"><div><h3>Module D table</h3><p>Recovered flows and substitution assumptions are stored separately from product-stage impacts.</p></div></div>
        ${smallTable(['Material', 'Recovered flow', 'Substitution assumption', 'Credit factor', 'Note'], dRows)}
      </div>
    </section>

    <section class="section card">
      <div class="section-title"><div><h3>Assumptions log</h3><p>Methodology and data assumptions from the current run.</p></div></div>
      ${smallTable(['Category', 'Key', 'Value'], assumptionsRows)}
    </section>
  `;
}
