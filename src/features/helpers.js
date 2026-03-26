import { formatKgCo2, formatNumber, statusTone } from '../utils/format.js';

export function pill(text) {
  return `<span class="pill ${statusTone(text)}">${text}</span>`;
}

export function metricRow(label, value) {
  return `<div class="metric-row"><span>${label}</span><strong>${value}</strong></div>`;
}

export function kpiCard(label, value, note = '') {
  return `<div class="card"><div class="muted small">${label}</div><div class="kpi-value">${value}</div>${note ? `<div class="small muted">${note}</div>` : ''}</div>`;
}

export function resultRows(results) {
  return results.map((result) => `
    <tr>
      <td><strong>${result.moduleId}</strong></td>
      <td>${result.label}</td>
      <td>${formatKgCo2(result.value)}</td>
      <td>${pill(result.status)}</td>
      <td>${result.resultType === 'active_calculation' ? 'Active calculation' : 'Scenario preview'}</td>
      <td>${result.methodologyNote}</td>
    </tr>
  `).join('');
}

export function topEntries(obj, count = 5) {
  return Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([key, value]) => ({ key, value }));
}

export function contributionList(obj, count = 5) {
  const rows = topEntries(obj, count);
  return rows.length ? rows.map(({ key, value }) => `<div class="list-item"><span>${key}</span><strong>${formatKgCo2(value)}</strong></div>`).join('') : '<div class="muted small">No contribution data.</div>';
}

export function factorOptions(factors, row) {
  return factors
    .filter((factor) => factor.materialCategory === row.materialCategory || factor.materialCategory === 'transport' || factor.materialCategory === 'energy')
    .map((factor) => `<option value="${factor.factorId}" ${row.manualFactorId === factor.factorId ? 'selected' : ''}>${factor.factorName} (${factor.sourceStatus})</option>`)
    .join('');
}

export function smallTable(headers, rows) {
  return `
    <div class="table-wrap">
      <table class="table">
        <thead><tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

export function barComparison(label, leftValue, rightValue, leftLabel = 'Left', rightLabel = 'Right') {
  const max = Math.max(Math.abs(Number(leftValue || 0)), Math.abs(Number(rightValue || 0)), 1);
  const leftPct = Math.abs(Number(leftValue || 0)) / max * 100;
  const rightPct = Math.abs(Number(rightValue || 0)) / max * 100;
  return `
    <div class="bar-compare-item">
      <div class="small muted">${label}</div>
      <div class="bar-row"><span>${leftLabel}</span><div class="bar-track"><div class="bar-fill left" style="width:${leftPct}%"></div></div><strong>${formatNumber(leftValue)}</strong></div>
      <div class="bar-row"><span>${rightLabel}</span><div class="bar-track"><div class="bar-fill right" style="width:${rightPct}%"></div></div><strong>${formatNumber(rightValue)}</strong></div>
    </div>
  `;
}

export { formatKgCo2, formatNumber };
