import { pill, metricRow, barComparison, smallTable, formatKgCo2 } from '../helpers.js';

function getSnapshot(state, runId) {
  return (state.calculationHistory || []).find((run) => run.runId === runId) || null;
}

export function renderCompare(state) {
  const leftCalc = state.getCalculationForProduct(state.compare.leftProductId);
  const rightCalc = state.getCalculationForProduct(state.compare.rightProductId);
  const leftProduct = state.products.find((product) => product.productId === state.compare.leftProductId) || state.product;
  const rightProduct = state.products.find((product) => product.productId === state.compare.rightProductId) || state.product;
  const snapshotOptions = (state.calculationHistory || []).slice().reverse().map((run) => `<option value="${run.runId}">${run.product.productName} — ${new Date(run.timestamp).toLocaleString()}</option>`).join('');
  const leftSnapshot = getSnapshot(state, state.compare.leftSnapshotId);
  const rightSnapshot = getSnapshot(state, state.compare.rightSnapshotId);

  const snapshotRows = leftSnapshot && rightSnapshot ? `
    <tr><td>Product stage</td><td>${formatKgCo2(leftSnapshot.summary.stageTotals.productStage)}</td><td>${formatKgCo2(rightSnapshot.summary.stageTotals.productStage)}</td></tr>
    <tr><td>Lifecycle excl. D</td><td>${formatKgCo2(leftSnapshot.summary.stageTotals.totalExcludingD)}</td><td>${formatKgCo2(rightSnapshot.summary.stageTotals.totalExcludingD)}</td></tr>
    <tr><td>Library fingerprint</td><td>${leftSnapshot.summary.libraryVersionFingerprint || '—'}</td><td>${rightSnapshot.summary.libraryVersionFingerprint || '—'}</td></tr>
  ` : '';

  return `
    <div class="header">
      <div>
        <h2>Comparison dashboard</h2>
        <p>Compare products or saved run versions with lifecycle rollups, stage totals, and indicator-oriented views.</p>
      </div>
      <div class="header-meta">${pill('Product comparison')} ${pill('Version comparison')}</div>
    </div>

    <section class="section grid grid-2">
      <div class="card stack">
        <div class="section-title"><div><h3>Compare current products</h3><p>Select two products and compare live calculations.</p></div></div>
        <label>Left product<select data-compare="leftProductId">${state.products.map((product) => `<option value="${product.productId}" ${product.productId === state.compare.leftProductId ? 'selected' : ''}>${product.productName}</option>`).join('')}</select></label>
        <label>Right product<select data-compare="rightProductId">${state.products.map((product) => `<option value="${product.productId}" ${product.productId === state.compare.rightProductId ? 'selected' : ''}>${product.productName}</option>`).join('')}</select></label>
      </div>
      <div class="card stack">
        <div class="section-title"><div><h3>Compare saved versions</h3><p>Compare two saved run snapshots for version-over-version review.</p></div></div>
        <label>Left snapshot<select data-compare="leftSnapshotId"><option value="">Select snapshot</option>${snapshotOptions}</select></label>
        <label>Right snapshot<select data-compare="rightSnapshotId"><option value="">Select snapshot</option>${snapshotOptions}</select></label>
      </div>
    </section>

    <section class="section grid grid-2">
      <div class="card">
        <div class="section-title"><div><h3>Current product rollups</h3></div></div>
        ${metricRow(leftProduct.productName, formatKgCo2(leftCalc.totalLifecycleExcludingD))}
        ${metricRow(rightProduct.productName, formatKgCo2(rightCalc.totalLifecycleExcludingD))}
        <div class="bar-compare">
          ${barComparison('A1–A3', leftCalc.totalA1A3, rightCalc.totalA1A3, leftProduct.productName, rightProduct.productName)}
          ${barComparison('Use stage (B4)', leftCalc.stageTotals.useStage, rightCalc.stageTotals.useStage, leftProduct.productName, rightProduct.productName)}
          ${barComparison('End-of-life', leftCalc.stageTotals.endOfLife, rightCalc.stageTotals.endOfLife, leftProduct.productName, rightProduct.productName)}
          ${barComparison('Lifecycle excl. D', leftCalc.totalLifecycleExcludingD, rightCalc.totalLifecycleExcludingD, leftProduct.productName, rightProduct.productName)}
        </div>
      </div>
      <div class="card">
        <div class="section-title"><div><h3>Product comparison table</h3></div></div>
        ${smallTable(['Metric', leftProduct.productName, rightProduct.productName], `
          <tr><td>Adjusted mass</td><td>${leftCalc.totalMassKg.toFixed(2)} kg</td><td>${rightCalc.totalMassKg.toFixed(2)} kg</td></tr>
          <tr><td>A1-A3</td><td>${formatKgCo2(leftCalc.totalA1A3)}</td><td>${formatKgCo2(rightCalc.totalA1A3)}</td></tr>
          <tr><td>Lifecycle excl. D</td><td>${formatKgCo2(leftCalc.totalLifecycleExcludingD)}</td><td>${formatKgCo2(rightCalc.totalLifecycleExcludingD)}</td></tr>
          <tr><td>Library fingerprint</td><td>${leftCalc.libraryMeta.versionFingerprint}</td><td>${rightCalc.libraryMeta.versionFingerprint}</td></tr>
          <tr><td>Readiness</td><td>${pill(leftCalc.readinessStatus)}</td><td>${pill(rightCalc.readinessStatus)}</td></tr>
        `)}
      </div>
    </section>

    <section class="section card">
      <div class="section-title"><div><h3>Saved version comparison</h3><p>Snapshot comparisons let you review product or library changes over time.</p></div></div>
      ${snapshotRows ? smallTable(['Metric', 'Left snapshot', 'Right snapshot'], snapshotRows) : '<div class="notice small">Select two saved snapshots to compare versions.</div>'}
    </section>
  `;
}
