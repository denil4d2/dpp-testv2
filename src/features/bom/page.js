import { factorOptions, pill, smallTable, formatKgCo2 } from '../helpers.js';

export function renderBom(state) {
  const calc = state.calculation;
  const breakdownA1 = new Map((calc.activeResults.find((r) => r.moduleId === 'A1')?.breakdown || []).map((item) => [item.componentId, item.value]));
  const rows = calc.bomRows.map((row) => `
    <tr>
      <td><strong>${row.componentId}</strong></td>
      <td>${row.partName}</td>
      <td>${row.materialCategory}</td>
      <td>${row.supplier || '<span class="muted">Missing</span>'}</td>
      <td>${row.totalWeight}</td>
      <td>${(row.totalWeight * (1 + (Number(row.wasteRatePct || 0) / 100))).toFixed(2)}</td>
      <td>${row.resolvedFactor ? row.resolvedFactor.factorName : '<span class="muted">No match</span>'}</td>
      <td>${pill(row.mappingStatus)}</td>
      <td>${row.resolvedFactor ? row.resolvedFactor.indicatorFramework : '—'}</td>
      <td>${formatKgCo2(breakdownA1.get(row.componentId) || 0)}</td>
      <td>
        <select data-action="manual-factor" data-component-id="${row.componentId}">
          <option value="">Auto</option>
          ${factorOptions(calc.factors, row)}
        </select>
      </td>
      <td><input data-action="audit-note" data-component-id="${row.componentId}" value="${row.auditNote || ''}" placeholder="Audit note"></td>
    </tr>
  `).join('');

  const headerMapRows = (state.lastBomImport?.headerMap || []).map((item) => `
    <tr><td>${item.sourceHeader}</td><td>${item.targetField}</td><td>${item.matched ? 'Matched' : 'Unmapped'}</td></tr>
  `).join('');

  const validation = state.lastBomImport?.validation || { errors: [], warnings: [], infos: [] };

  return `
    <div class="header">
      <div>
        <h2>BOM import and mapping</h2>
        <p>Import template → header mapping → validation → factor resolution → manual overrides.</p>
      </div>
      <div class="header-meta">
        ${pill(`${calc.mappingCoverage}% mapping coverage`)}
        ${pill(calc.readinessStatus)}
      </div>
    </div>

    <section class="section grid grid-2">
      <div class="card stack">
        <div class="section-title"><div><h3>BOM import actions</h3><p>Import template supports core BOM fields and optional transport/mapping hints.</p></div></div>
        <div class="download-links">
          <button data-action="download-bom-template">Download blank BOM template CSV</button>
          <button data-action="download-bom-example">Download populated example CSV</button>
          <button data-action="export-current-bom">Export current BOM CSV</button>
        </div>
        <label class="notice">
          <strong>Import BOM CSV</strong>
          <div class="small muted">CSV only in this local prototype. A stricter XLSX importer can be added later without changing the engine.</div>
          <input id="bom-import-input" type="file" accept=".csv" />
        </label>
        <div class="toolbar">
          <button data-action="auto-map-all">Auto-map all possible rows</button>
          <button data-action="clear-manual-overrides">Clear manual overrides</button>
        </div>
        <div class="notice small">
          <strong>Workflow footer</strong><br>
          BOM imported → Mapping reviewed → Manufacturing check pending → Ready for calculation
        </div>
      </div>
      <div class="card stack">
        <div class="section-title"><div><h3>Import summary</h3><p>Structured checks before data enters the calculation engine.</p></div></div>
        <div class="list">
          <div class="list-item"><span>Rows imported</span><strong>${state.lastBomImport ? state.lastBomImport.records.length : calc.bomRows.length}</strong></div>
          <div class="list-item"><span>Rows auto-mapped confirmed</span><strong>${calc.bomRows.filter((row) => row.mappingStatus === 'Auto-mapped confirmed').length}</strong></div>
          <div class="list-item"><span>Rows auto-mapped provisional</span><strong>${calc.bomRows.filter((row) => row.mappingStatus === 'Auto-mapped provisional').length}</strong></div>
          <div class="list-item"><span>Rows missing mapping</span><strong>${calc.bomRows.filter((row) => !row.resolvedFactor).length}</strong></div>
          <div class="list-item"><span>Rows with warnings</span><strong>${validation.warnings.length}</strong></div>
        </div>
      </div>
    </section>

    <section class="section grid grid-2">
      <div class="card">
        <div class="section-title"><div><h3>Field mapping</h3><p>Header inspection from the latest BOM import.</p></div></div>
        ${headerMapRows ? smallTable(['Source header', 'Target field', 'Status'], headerMapRows) : '<div class="notice small">No BOM import performed yet in this session. Seeded demo rows are loaded by default.</div>'}
      </div>
      <div class="card stack">
        <div class="section-title"><div><h3>Validation summary</h3><p>Blocking errors stop import. Warnings can pass with review.</p></div></div>
        <div class="notice ${validation.errors.length ? 'bad' : 'warn'} small"><strong>Errors</strong><br>${validation.errors.length ? validation.errors.join('<br>') : 'None'}</div>
        <div class="notice warn small"><strong>Warnings</strong><br>${validation.warnings.length ? validation.warnings.join('<br>') : 'None'}</div>
        <div class="notice small"><strong>Informational</strong><br>${validation.infos.length ? validation.infos.join('<br>') : 'None'}</div>
      </div>
    </section>

    <section class="section card">
      <div class="section-title"><div><h3>Mapping workspace</h3><p>Confirmed factors are preferred in automatic mapping. Manual overrides should include an audit note.</p></div></div>
      ${smallTable(['Component ID', 'Part name', 'Category', 'Supplier', 'Total weight', 'Adjusted mass', 'Suggested factor', 'Mapping status', 'Framework', 'Est. A1 contribution', 'Manual override', 'Audit note'], rows)}
    </section>
  `;
}
