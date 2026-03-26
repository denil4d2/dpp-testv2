import { INDICATOR_ORDER } from './indicators.js';
const REPORTED_INDICATORS = ['GWP-total', 'GWP-fossil', 'GWP-biogenic', 'GWP-luluc'];

function esc(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function fmt(value) {
  const num = Number(value || 0);
  return num.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 });
}

export function buildEpdReportHtml(state) {
  const calc = state.calculation;
  const product = state.product;
  const moduleRows = calc.activeResults.map((result) => `
    <tr>
      <td>${esc(result.moduleId)}</td>
      <td>${esc(result.label)}</td>
      <td>${fmt(result.value)}</td>
      <td>${esc(result.status)}</td>
      <td>${esc(result.methodologyNote)}</td>
    </tr>`).join('');
  const indicatorRows = REPORTED_INDICATORS.map((name) => `
    <tr>
      <td>${esc(name)}</td>
      <td>${fmt(calc.indicatorTotals.productStage[name])}</td>
      <td>${fmt(calc.indicatorTotals.useStage[name])}</td>
      <td>${fmt(calc.indicatorTotals.endOfLife[name])}</td>
      <td>${fmt(calc.indicatorTotals.moduleD[name])}</td>
      <td>${fmt(calc.indicatorTotals.totalExcludingD[name])}</td>
    </tr>`).join('');
  const factorRows = calc.factorUsage.map((factor) => `
    <tr>
      <td>${esc(factor.factorId)}</td>
      <td>${esc(factor.factorName)}</td>
      <td>${esc(factor.version || '1.0')}</td>
      <td>${esc(factor.sourceStatus)}</td>
      <td>${esc(factor.unit)}</td>
      <td>${esc(factor.useCount)}</td>
    </tr>`).join('');
  const assumptionRows = calc.assumptionsLog.map((item) => `
    <tr>
      <td>${esc(item.category)}</td>
      <td>${esc(item.key)}</td>
      <td>${esc(item.value)}</td>
    </tr>`).join('');
  const validationRows = calc.issues.map((issue) => `
    <tr>
      <td>${esc(issue.moduleId)}</td>
      <td>${esc(issue.severity)}</td>
      <td>${esc(issue.message)}</td>
    </tr>`).join('');
  return `<!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${esc(product.productName)} - EPD report</title>
    <style>
      body{font-family:Inter,Arial,sans-serif;background:#f5f7f9;color:#1b2733;padding:24px;line-height:1.4}
      h1,h2,h3{margin:0 0 8px} .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:16px}
      .card{background:#fff;border:1px solid #d7dfe5;border-radius:14px;padding:16px;margin-bottom:16px}
      table{width:100%;border-collapse:collapse;font-size:13px} th,td{border:1px solid #d7dfe5;padding:8px;text-align:left;vertical-align:top}
      th{background:#f9fbfc} .muted{color:#617182} .pill{display:inline-block;border:1px solid #d7dfe5;border-radius:999px;padding:3px 8px;font-size:12px}
    </style>
  </head>
  <body>
    <div class="card">
      <h1>DOVISTA EPD Generator — report pack</h1>
      <div class="muted">Generated from the local full-generator prototype aligned to EN 15804+A2 + PCR 2019:14 v2.0.1.</div>
      <p><strong>Product:</strong> ${esc(product.productName)}<br>
      <strong>Product ID:</strong> ${esc(product.productId)}<br>
      <strong>Governing standard:</strong> ${esc(state.methodology.governingStandard)}<br>
      <strong>Governing PCR:</strong> ${esc(state.methodology.governingPcr)}<br>
      <strong>Declared unit:</strong> ${esc(product.declaredUnit)}<br>
      <strong>Run ID:</strong> ${esc(calc.runId)}<br>
      <strong>Timestamp:</strong> ${esc(calc.timestamp)}</p>
      <span class="pill">${esc(calc.readinessStatus)}</span>
      <span class="pill">${esc(calc.calculationEngineMode)}</span>
    </div>
    <div class="grid">
      <div class="card"><h3>Lifecycle totals</h3>
        <p><strong>A1-A3:</strong> ${fmt(calc.totalA1A3)} kg CO2e<br>
        <strong>Lifecycle excl. D:</strong> ${fmt(calc.totalLifecycleExcludingD)} kg CO2e<br>
        <strong>Lifecycle incl. D:</strong> ${fmt(calc.totalLifecycleIncludingD)} kg CO2e</p>
      </div>
      <div class="card"><h3>Normalization</h3>
        <p><strong>Conversion factor:</strong> ${esc(product.conversionFactorKgPerM2)} kg/m²<br>
        <strong>Normalization basis:</strong> ${esc(calc.normalization.declaredUnitText)}<br>
        <strong>Total adjusted mass:</strong> ${fmt(calc.totalMassKg)} kg</p>
      </div>
    </div>
    <div class="card"><h3>Module results</h3><table><thead><tr><th>Module</th><th>Label</th><th>Value</th><th>Status</th><th>Methodology note</th></tr></thead><tbody>${moduleRows}</tbody></table></div>
    <div class="card"><h3>EN 15804+A2 climate indicator summary</h3><table><thead><tr><th>Indicator</th><th>Product stage</th><th>Use stage</th><th>End-of-life</th><th>Module D</th><th>Total excl. D</th></tr></thead><tbody>${indicatorRows}</tbody></table></div>
    <div class="card"><h3>Factor usage snapshot</h3><table><thead><tr><th>Factor ID</th><th>Name</th><th>Version</th><th>Status</th><th>Unit</th><th>Uses</th></tr></thead><tbody>${factorRows}</tbody></table></div>
    <div class="card"><h3>Assumptions log</h3><table><thead><tr><th>Category</th><th>Key</th><th>Value</th></tr></thead><tbody>${assumptionRows}</tbody></table></div>
    <div class="card"><h3>Validation issues</h3><table><thead><tr><th>Module</th><th>Severity</th><th>Message</th></tr></thead><tbody>${validationRows || '<tr><td colspan="3">None</td></tr>'}</tbody></table></div>
  </body></html>`;
}
