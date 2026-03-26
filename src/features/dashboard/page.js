import { contributionList, kpiCard, metricRow, pill, resultRows, smallTable, formatKgCo2, formatNumber } from '../helpers.js';

export function renderDashboard(state) {
  const calc = state.calculation;
  const issues = calc.issues;
  const issueCounts = {
    missingFactors: calc.bomRows.filter((row) => !row.resolvedFactor).length,
    provisionalFactors: calc.bomRows.filter((row) => row.resolvedFactor?.sourceStatus === 'provisional').length,
    missingSuppliers: calc.bomRows.filter((row) => !row.supplier).length,
    missingDistances: calc.bomRows.filter((row) => !row.distanceKm).length,
    manufacturingWarnings: issues.filter((item) => item.moduleId === 'A3').length,
    lifecycleWarnings: issues.filter((item) => ['B4', 'C1', 'C2', 'C3', 'C4', 'D'].includes(item.moduleId)).length,
  };

  const workflow = [
    ['Product created', true],
    ['BOM imported', calc.bomRows.length > 0],
    ['Factors mapped', calc.mappingCoverage === 100],
    ['Manufacturing completed', !!state.product.manufacturingProfile],
    ['Lifecycle modules configured', calc.extensionResults.length === 6],
    ['Validation reviewed', calc.errorCount === 0],
    ['Calculation run', true],
    ['Results reviewed', calc.readinessStatus !== 'Incomplete'],
  ];

  const reportedIndicators = ['GWP-total', 'GWP-fossil', 'GWP-biogenic', 'GWP-luluc'];
  const indicatorRows = reportedIndicators.map((name) => `
    <tr>
      <td>${name}</td>
      <td>${formatNumber(calc.indicatorTotals.productStage[name])}</td>
      <td>${formatNumber(calc.indicatorTotals.useStage[name])}</td>
      <td>${formatNumber(calc.indicatorTotals.endOfLife[name])}</td>
      <td>${formatNumber(calc.indicatorTotals.totalExcludingD[name])}</td>
    </tr>
  `).join('');

  return `
    <div class="header">
      <div>
        <h2>Dashboard</h2>
        <p>Full local EPD generator command center for EN 15804+A2 + PCR 2019:14 VERSION 2.0.1.</p>
      </div>
      <div class="header-meta">
        ${pill(calc.readinessStatus)}
        ${pill(state.methodology.governingPcr)}
        ${pill(calc.calculationEngineMode)}
      </div>
    </div>

    <section class="section grid grid-4">
      ${kpiCard('Products', String(state.products.length), `Active: ${state.product.productName}`)}
      ${kpiCard('Components', String(calc.bomRows.length), `${formatNumber(calc.totalMassKg)} kg adjusted mass`)}
      ${kpiCard('Factors', String(calc.factors.length), `${calc.factorUsage.length} actually used in latest run`)}
      ${kpiCard('Mapping coverage', `${calc.mappingCoverage}%`, `${calc.provisionalFactorCount} provisional mappings in use`)}
      ${kpiCard('Completed calculations', String(calc.activeResults.length), 'A1–A3 + B4 + C1–C4 + D active')}
      ${kpiCard('Methodology', 'EN 15804+A2 + PCR 2019:14 v2.0.1', `Engine ${state.methodology.calculationEngineVersion}`)}
      ${kpiCard('Declared unit', state.methodology.declaredUnit, `${state.methodology.conversionFactorKgPerM2} kg/m²`)}
      ${kpiCard('Library fingerprint', calc.libraryMeta.versionFingerprint, `${calc.libraryMeta.confirmedCount} confirmed / ${calc.libraryMeta.provisionalCount} provisional`)}
    </section>

    <section class="section two-col">
      <div class="card">
        <div class="section-title"><div><h3>Current calculation snapshot</h3><p>The dashboard shows the latest stored product snapshot and lifecycle rollups.</p></div></div>
        ${metricRow('Run ID', calc.runId)}
        ${metricRow('Run name', calc.runName)}
        ${metricRow('Latest product', state.product.productName)}
        ${metricRow('Declared unit', state.product.declaredUnit)}
        ${metricRow('Latest run timestamp', new Date(calc.timestamp).toLocaleString())}
        ${metricRow('A1', formatKgCo2(calc.coreResults.find((r) => r.moduleId === 'A1')?.value || 0))}
        ${metricRow('A2', formatKgCo2(calc.coreResults.find((r) => r.moduleId === 'A2')?.value || 0))}
        ${metricRow('A3', formatKgCo2(calc.coreResults.find((r) => r.moduleId === 'A3')?.value || 0))}
        ${metricRow('Total A1–A3', formatKgCo2(calc.totalA1A3))}
        ${metricRow('Lifecycle total excl. D', formatKgCo2(calc.totalLifecycleExcludingD))}
        ${metricRow('Lifecycle total incl. D', formatKgCo2(calc.totalLifecycleIncludingD))}
      </div>
      <div class="card">
        <div class="section-title"><div><h3>Lifecycle stage totals</h3><p>The engine aggregates totals by stage and indicator.</p></div></div>
        ${metricRow('Product stage (A1–A3)', formatKgCo2(calc.stageTotals.productStage))}
        ${metricRow('Use stage (B4)', formatKgCo2(calc.stageTotals.useStage))}
        ${metricRow('End-of-life (C1–C4)', formatKgCo2(calc.stageTotals.endOfLife))}
        ${metricRow('Module D', formatKgCo2(calc.stageTotals.moduleD))}
        <div class="notice small">Module D remains reported separately in interpretation even though it is part of the active generator run.</div>
      </div>
    </section>

    <section class="section card">
      <div class="section-title"><div><h3>Workflow progress</h3><p>Data in → mapping → validation → calculation → exportable EPD package.</p></div></div>
      <div class="progress">${workflow.map(([label, done]) => `<div class="progress-step ${done ? 'done' : ''}"><strong>${label}</strong><div class="small muted">${done ? 'Configured' : 'Pending'}</div></div>`).join('')}</div>
    </section>

    <section class="section grid grid-2">
      <div class="card">
        <div class="section-title"><div><h3>Module results</h3><p>All lifecycle modules run through the active registry.</p></div></div>
        ${smallTable(['Module', 'Label', 'Value', 'Status', 'Result type', 'Methodology note'], resultRows(calc.activeResults))}
      </div>
      <div class="stack">
        <div class="card">
          <div class="section-title"><div><h3>Data quality issues</h3><p>Counts and examples from the latest run.</p></div></div>
          <div class="list">
            <div class="list-item"><span>Missing factors</span><strong>${issueCounts.missingFactors}</strong></div>
            <div class="list-item"><span>Provisional factors used</span><strong>${issueCounts.provisionalFactors}</strong></div>
            <div class="list-item"><span>Missing supplier names</span><strong>${issueCounts.missingSuppliers}</strong></div>
            <div class="list-item"><span>Missing transport distances</span><strong>${issueCounts.missingDistances}</strong></div>
            <div class="list-item"><span>Manufacturing warnings</span><strong>${issueCounts.manufacturingWarnings}</strong></div>
            <div class="list-item"><span>Lifecycle module warnings</span><strong>${issueCounts.lifecycleWarnings}</strong></div>
          </div>
        </div>
        <div class="card">
          <div class="section-title"><div><h3>Latest calculation package</h3><p>The JSON export is structured as an EPD-ready calculation record.</p></div></div>
          ${smallTable(['Run ID', 'Product', 'Timestamp', 'A1–A3', 'Lifecycle excl. D', 'Lifecycle incl. D', 'Warnings', 'Status'], `
            <tr>
              <td>${calc.runId}</td>
              <td>${state.product.productName}</td>
              <td>${new Date(calc.timestamp).toLocaleString()}</td>
              <td>${formatKgCo2(calc.totalA1A3)}</td>
              <td>${formatKgCo2(calc.totalLifecycleExcludingD)}</td>
              <td>${formatKgCo2(calc.totalLifecycleIncludingD)}</td>
              <td>${issues.length}</td>
              <td>${pill(calc.readinessStatus)}</td>
            </tr>
          `)}
        </div>
      </div>
    </section>

    <section class="section grid grid-2">
      <div class="card">
        <div class="section-title"><div><h3>EN 15804+A2 climate indicator summary</h3><p>EN 15804+A2 climate-indicator rollups are calculated and stored per run. GWP-GHG is retained only as an optional supporting factor field behind specific datasets, not as a primary reported result column.</p></div></div>
        ${smallTable(['Indicator', 'Product stage', 'Use stage', 'End-of-life', 'Total excl. D'], indicatorRows)}
      </div>
      <div class="card"><div class="section-title"><div><h3>Factor usage</h3></div></div><div class="list">${calc.factorUsage.slice(0, 6).map((factor) => `<div class="list-item"><span>${factor.factorName} <span class="small muted">${factor.version}</span></span><strong>${factor.useCount} uses</strong></div>`).join('')}</div></div>
    </section>

    <section class="section grid grid-3">
      <div class="card"><div class="section-title"><div><h3>Contribution by material category</h3></div></div><div class="list">${contributionList(calc.contributions.byMaterial)}</div></div>
      <div class="card"><div class="section-title"><div><h3>Top 5 components</h3></div></div><div class="list">${contributionList(calc.contributions.byComponent)}</div></div>
      <div class="card"><div class="section-title"><div><h3>Supplier contribution</h3></div></div><div class="list">${contributionList(calc.contributions.bySupplier)}</div></div>
    </section>
  `;
}
