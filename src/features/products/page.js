import { metricRow, pill, smallTable } from '../helpers.js';

export function renderProducts(state) {
  const product = state.product;
  const calc = state.calculation;
  const activeProductId = product.productId;
  const scenarioRows = Object.entries(state.scenarios).map(([moduleId, scenario]) => `
    <tr>
      <td><strong>${moduleId}</strong></td>
      <td>${scenario.scenarioPresetName}</td>
      <td>${pill(scenario.status)}</td>
      <td>${scenario.dataCompletenessPct}%</td>
      <td>${scenario.methodologyNote}</td>
    </tr>
  `).join('');

  const productRows = state.products.map((item) => {
    const bomCount = state.bomRows.filter((row) => row.productId === item.productId).length;
    return `
      <tr>
        <td><strong>${item.productId}</strong></td>
        <td>${item.productName}</td>
        <td>${item.platform}</td>
        <td>${item.configurationCode}</td>
        <td>${item.country}</td>
        <td>${bomCount}</td>
        <td>${pill(item.status)}</td>
        <td><button class="small-btn" data-switch-product="${item.productId}" data-next-page="products">${item.productId === activeProductId ? 'Active' : 'Switch'}</button></td>
      </tr>
    `;
  }).join('');

  const productValidation = state.lastProductImport?.validation || { errors: [], warnings: [], infos: [] };
  const productHeaderMapRows = (state.lastProductImport?.headerMap || []).map((item) => `
    <tr><td>${item.sourceHeader}</td><td>${item.targetField}</td><td>${item.matched ? 'Matched' : 'Unmapped'}</td></tr>
  `).join('');

  return `
    <div class="header">
      <div>
        <h2>Products</h2>
        <p>Maintain a product catalog, import more product records, and switch the active product without overwriting Aura.</p>
      </div>
      <div class="header-meta">
        ${pill(product.status)}
        ${pill(product.pcrVersion)}
        ${pill(`${state.products.length} products loaded`)}
      </div>
    </div>

    <section class="section grid grid-2">
      <div class="card stack">
        <div class="section-title"><div><h3>Product catalog actions</h3><p>Import products first, then import matching BOM rows and switch between them.</p></div></div>
        <div class="download-links">
          <button data-action="download-product-template">Download blank product template CSV</button>
          <button data-action="download-product-example">Download populated product example CSV</button>
          <button data-action="export-products">Export current product catalog CSV</button>
        </div>
        <label class="notice">
          <strong>Import product CSV</strong>
          <div class="small muted">Create or update products with manufacturing profile fields. Imported products automatically get a default lifecycle scenario set.</div>
          <input id="product-import-input" type="file" accept=".csv" />
        </label>
        <div class="notice small">
          <strong>Current active product</strong><br>
          ${product.productName}<br>
          ${product.productId} · ${product.configurationCode}
        </div>
      </div>
      <div class="card stack">
        <div class="section-title"><div><h3>Product import summary</h3><p>Header mapping and validation for the latest product import.</p></div></div>
        <div class="notice ${productValidation.errors.length ? 'bad' : 'warn'} small"><strong>Errors</strong><br>${productValidation.errors.length ? productValidation.errors.join('<br>') : 'None'}</div>
        <div class="notice warn small"><strong>Warnings</strong><br>${productValidation.warnings.length ? productValidation.warnings.join('<br>') : 'None'}</div>
        <div class="notice small"><strong>Informational</strong><br>${productValidation.infos.length ? productValidation.infos.join('<br>') : 'None'}</div>
      </div>
    </section>

    <section class="section card">
      <div class="section-title"><div><h3>Loaded product catalog</h3><p>Each product carries its own BOM rows, manufacturing profile, and lifecycle scenario set.</p></div></div>
      ${smallTable(['Product ID', 'Product name', 'Platform', 'Configuration', 'Country', 'BOM rows', 'Status', 'Action'], productRows)}
    </section>

    <section class="section grid grid-2">
      <div class="card">
        <div class="section-title"><div><h3>Product summary</h3><p>Global metadata used by the calculation engine for the active product.</p></div></div>
        ${metricRow('Product ID', product.productId)}
        ${metricRow('Product name', product.productName)}
        ${metricRow('Platform', product.platform)}
        ${metricRow('Configuration code', product.configurationCode)}
        ${metricRow('Declared unit', product.declaredUnit)}
        ${metricRow('Conversion factor', `${product.conversionFactorKgPerM2} kg/m²`)}
        ${metricRow('Reference service life', `${product.referenceServiceLifeYears} years`)}
        ${metricRow('Production site', product.productionSite)}
        ${metricRow('Methodology basis', product.standardMethodology)}
      </div>
      <div class="card">
        <div class="section-title"><div><h3>Latest active product snapshot</h3><p>Summary card aligned to the dashboard totals for the selected product.</p></div></div>
        ${metricRow('Total mass', `${calc.totalMassKg.toFixed(2)} kg adjusted`)}
        ${metricRow('Total components', String(calc.bomRows.length))}
        ${metricRow('Mapped components', `${calc.bomRows.filter((row) => row.resolvedFactor).length} / ${calc.bomRows.length}`)}
        ${metricRow('A1–A3 latest total', `${calc.totalA1A3.toFixed(2)} kg CO₂e`)}
        ${metricRow('Lifecycle total incl. D', `${calc.totalLifecycleIncludingD.toFixed(2)} kg CO₂e`)}
        ${metricRow('Last run date', new Date(calc.timestamp).toLocaleString())}
      </div>
    </section>

    <section class="section grid grid-2">
      <div class="card">
        <div class="section-title"><div><h3>Imported product field mapping</h3><p>Header inspection from the latest product import.</p></div></div>
        ${productHeaderMapRows ? smallTable(['Source header', 'Target field', 'Status'], productHeaderMapRows) : '<div class="notice small">No product import performed yet in this session. Two seeded demo products are loaded by default.</div>'}
      </div>
      <div class="card">
        <div class="section-title"><div><h3>Manufacturing profile</h3><p>Centralized A3 infrastructure per product.</p></div></div>
        ${metricRow('Electricity', `${product.manufacturingProfile.electricityKwhPerDeclaredUnit} kWh / DU`)}
        ${metricRow('Heat', `${product.manufacturingProfile.heatMjPerDeclaredUnit} MJ / DU`)}
        ${metricRow('Consumables', `${product.manufacturingProfile.consumablesImpact} kg CO₂e`)}
        ${metricRow('Wood waste', `${product.manufacturingProfile.woodWasteRate * 100}%`)}
        ${metricRow('Aluminium waste', `${product.manufacturingProfile.aluminiumWasteRate * 100}%`)}
      </div>
    </section>

    <section class="section card">
      <div class="section-title"><div><h3>Scenario configuration status</h3><p>Lifecycle modules are stored per product, so switching products changes the scenario context too.</p></div></div>
      ${smallTable(['Module', 'Scenario preset', 'Status', 'Completeness', 'Methodology basis note'], scenarioRows)}
    </section>
  `;
}
