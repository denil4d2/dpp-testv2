import { pill, smallTable } from '../helpers.js';

export function renderFactors(state) {
  const factors = state.calculation.factors;
  const rows = factors.map((factor) => `
    <tr>
      <td><strong>${factor.factorId}</strong><br><span class="small muted">${factor.factorVersionKey || `${factor.factorId}@${factor.version || '1.0'}`}</span></td>
      <td>${factor.factorName}</td>
      <td>${factor.materialCategory}</td>
      <td>${factor.indicatorFramework || 'EN 15804+A2'}</td>
      <td>${factor.indicatorName}</td>
      <td>${factor.unit}</td>
      <td>${factor.factorValue}</td>
      <td>${factor.version || '1.0'}</td>
      <td>${factor.approvalStatus || 'approved'}</td>
      <td>${pill(factor.sourceStatus)}</td>
      <td>${factor.priority}</td>
      <td>${factor.sourceReference || '—'}</td>
    </tr>
  `).join('');
  const confirmed = factors.filter((factor) => factor.sourceStatus === 'confirmed').length;
  const provisional = factors.filter((factor) => factor.sourceStatus === 'provisional').length;
  const custom = state.customFactors.length;

  return `
    <div class="header">
      <div>
        <h2>Factor library</h2>
        <p>Managed factor master data with EN 15804+A2-oriented fields, versioning, governance, and custom-library layering.</p>
      </div>
      <div class="header-meta">
        ${pill(`${confirmed} confirmed`)}
        ${pill(`${provisional} provisional`)}
        ${pill(`Library ${state.calculation.libraryMeta.versionFingerprint}`)}
      </div>
    </div>

    <section class="section grid grid-4">
      <div class="card"><div class="muted small">All factors</div><div class="kpi-value">${factors.length}</div></div>
      <div class="card"><div class="muted small">Confirmed factors</div><div class="kpi-value">${confirmed}</div></div>
      <div class="card"><div class="muted small">Provisional factors</div><div class="kpi-value">${provisional}</div></div>
      <div class="card"><div class="muted small">Custom library entries</div><div class="kpi-value">${custom}</div></div>
    </section>

    <section class="section grid grid-2">
      <div class="card stack">
        <div class="section-title"><div><h3>Import / export</h3><p>Use templates first, then load supplier-specific or project-level overrides.</p></div></div>
        <div class="download-links">
          <button data-action="download-factor-template">Download blank factor template CSV</button>
          <button data-action="download-factor-example">Download populated factor example CSV</button>
          <button data-action="export-custom-factors">Export current custom factors CSV</button>
        </div>
        <label class="notice">
          <strong>Import custom factor library</strong>
          <div class="small muted">CSV only in this local prototype. Imported factors are merged above the base library and can outrank generic placeholders.</div>
          <input id="factor-import-input" type="file" accept=".csv" />
        </label>
        ${state.lastFactorImport ? `
          <div class="notice ${state.lastFactorImport.validation.errors.length ? 'bad' : 'warn'} small">
            <strong>Latest factor import</strong><br>
            Rows: ${state.lastFactorImport.records.length}<br>
            Errors: ${state.lastFactorImport.validation.errors.length}<br>
            Warnings: ${state.lastFactorImport.validation.warnings.length}
          </div>
        ` : '<div class="notice small">No factor CSV imported yet in this session.</div>'}
      </div>
      <div class="card stack">
        <div class="section-title"><div><h3>Quick custom factor</h3><p>Fast way to add a project-specific override without editing CSV first.</p></div></div>
        <div class="form-grid">
          <label>Factor ID<input id="cf-factorId" placeholder="FAC-CUSTOM-001"></label>
          <label>Name<input id="cf-factorName" placeholder="Custom wood factor"></label>
          <label>Material category<input id="cf-materialCategory" placeholder="wood"></label>
          <label>Material subtype<input id="cf-materialSubtype" placeholder="profile/frame"></label>
          <label>Unit<select id="cf-unit"><option>kg</option><option>tkm</option><option>kWh</option><option>MJ</option><option>item</option><option>lump_sum</option></select></label>
          <label>Factor value<input id="cf-factorValue" type="number" step="0.01" value="0"></label>
          <label>Source status<select id="cf-sourceStatus"><option>provisional</option><option>confirmed</option><option>missing_verification</option></select></label>
          <label>Priority<input id="cf-priority" type="number" value="95"></label>
        </div>
        <button class="primary" data-action="add-custom-factor">Add custom factor</button>
      </div>
    </section>

    <section class="section card">
      <div class="section-title"><div><h3>Factor table</h3><p>Confirmed factors are preferred during automatic mapping. Provisional factors may be used for prototype calculations but should be reviewed.</p></div></div>
      ${smallTable(['Factor ID', 'Name', 'Category', 'Method basis', 'Indicator', 'Unit', 'Value', 'Version', 'Approval', 'Status', 'Priority', 'Source reference'], rows)}
    </section>
  `;
}
