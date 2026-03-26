import { pill, smallTable, formatKgCo2, formatNumber } from '../helpers.js';

export function renderCalculations(state) {
  const calc = state.calculation;
  const rows = calc.results.map((result) => `
    <tr>
      <td><strong>${result.moduleId}</strong></td>
      <td>${result.label}</td>
      <td>${result.group || '—'}</td>
      <td>${pill('Active')}</td>
      <td>${formatKgCo2(result.value)}</td>
      <td>${formatNumber(result.indicators?.['GWP-total'])}</td>
      <td>${formatNumber(result.indicators?.['GWP-fossil'])}</td>
      <td>${formatNumber(result.indicators?.['GWP-GHG'])}</td>
      <td>${pill(result.status)}</td>
      <td>${result.factorIdsUsed?.length || 0}</td>
    </tr>
  `).join('');

  const validationRows = calc.issues.map((issue) => `
    <tr>
      <td>${issue.moduleId}</td>
      <td>${issue.severity}</td>
      <td>${issue.message}</td>
      <td>${issue.moduleStatus || 'active'}</td>
    </tr>
  `).join('');

  const historyRows = (state.calculationHistory || [])
    .filter((run) => run.product?.productId === state.product.productId)
    .slice(-8)
    .reverse()
    .map((run) => `
      <tr>
        <td>${run.runId}</td>
        <td>${new Date(run.timestamp).toLocaleString()}</td>
        <td>${run.summary.libraryVersionFingerprint || '—'}</td>
        <td>${formatKgCo2(run.summary.stageTotals.productStage)}</td>
        <td>${formatKgCo2(run.summary.stageTotals.totalExcludingD)}</td>
        <td>${run.summary.issueCount}</td>
      </tr>
    `).join('');

  return `
    <div class="header">
      <div>
        <h2>Calculation engine</h2>
        <p>Full generator orchestration: factor resolution, validation, module execution, EN 15804+A2 climate-indicator matrices, stage totals, and export-ready calculation snapshots.</p>
      </div>
      <div class="header-meta">
        ${pill(calc.calculationEngineMode)}
        ${pill(calc.readinessStatus)}
      </div>
    </div>

    <section class="section card">
      <div class="section-title"><div><h3>Current run</h3><p>The current run is recalculated from the active product, active factor libraries, scenario set, and declared-unit normalization.</p></div></div>
      <div class="download-links">
        <button data-action="save-run-snapshot">Save run snapshot</button>
        <button data-action="export-calculation-json">Export full calculation package JSON</button>
      </div>
      <div class="list" style="margin-top:12px;">
        <div class="list-item"><span>Run ID</span><strong>${calc.runId}</strong></div>
        <div class="list-item"><span>Working climate indicator</span><strong>${state.methodology.workingIndicatorName}</strong></div>
        <div class="list-item"><span>Library fingerprint</span><strong>${calc.libraryMeta.versionFingerprint}</strong></div>
        <div class="list-item"><span>Normalization</span><strong>${calc.normalization.declaredUnitText}</strong></div>
      </div>
    </section>

    <section class="section card">
      <div class="section-title"><div><h3>Module registry execution</h3><p>A1, A2, A3, B4, C1, C2, C3, C4, and D are active calculations in this version.</p></div></div>
      ${smallTable(['Module', 'Label', 'Group', 'Mode', 'Value', 'GWP-total', 'GWP-fossil', 'Support GWP-GHG', 'Status', 'Factors used'], rows)}
    </section>

    <section class="section grid grid-3">
      <div class="card"><div class="section-title"><div><h3>Rollups</h3></div></div>
        <div class="list">
          <div class="list-item"><span>Total A1–A3</span><strong>${formatKgCo2(calc.totalA1A3)}</strong></div>
          <div class="list-item"><span>Total lifecycle excl. D</span><strong>${formatKgCo2(calc.totalLifecycleExcludingD)}</strong></div>
          <div class="list-item"><span>Total lifecycle incl. D</span><strong>${formatKgCo2(calc.totalLifecycleIncludingD)}</strong></div>
        </div>
      </div>
      <div class="card"><div class="section-title"><div><h3>Stage totals</h3></div></div>
        <div class="list">
          <div class="list-item"><span>Product stage</span><strong>${formatKgCo2(calc.stageTotals.productStage)}</strong></div>
          <div class="list-item"><span>Use stage</span><strong>${formatKgCo2(calc.stageTotals.useStage)}</strong></div>
          <div class="list-item"><span>End-of-life</span><strong>${formatKgCo2(calc.stageTotals.endOfLife)}</strong></div>
          <div class="list-item"><span>Module D</span><strong>${formatKgCo2(calc.stageTotals.moduleD)}</strong></div>
        </div>
      </div>
      <div class="card"><div class="section-title"><div><h3>Quality summary</h3></div></div>
        <div class="list">
          <div class="list-item"><span>Warnings</span><strong>${calc.qualitySummary.warningCount}</strong></div>
          <div class="list-item"><span>Errors</span><strong>${calc.qualitySummary.errorCount}</strong></div>
          <div class="list-item"><span>Infos</span><strong>${calc.qualitySummary.infoCount}</strong></div>
          <div class="list-item"><span>Mapping coverage</span><strong>${calc.qualitySummary.mappingCoverage}%</strong></div>
        </div>
      </div>
    </section>

    <section class="section card">
      <div class="section-title"><div><h3>Validation summary</h3><p>Warnings do not stop the engine, but they should stop you from trusting the output blindly.</p></div></div>
      ${validationRows ? smallTable(['Module', 'Severity', 'Message', 'Module status'], validationRows) : '<div class="notice small">No validation issues in current state.</div>'}
    </section>

    <section class="section card">
      <div class="section-title"><div><h3>Saved run history</h3><p>Snapshots capture factor-library fingerprint, scenario state, and module outputs so you can compare versions later.</p></div></div>
      ${historyRows ? smallTable(['Run ID', 'Timestamp', 'Library fingerprint', 'Product stage', 'Lifecycle excl. D', 'Issues'], historyRows) : '<div class="notice small">No saved snapshots yet. Save the current run when you want a checkpoint.</div>'}
    </section>
  `;
}
