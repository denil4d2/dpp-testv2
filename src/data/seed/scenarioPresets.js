export const scenarioPresetLibrary = {
  B4: [
    {
      presetId: 'B4-STD-25',
      label: 'Standard 25-year replacement',
      description: 'Replacement at year 25 with full share.',
      values: { replacementIntervalYears: 25, replacementSharePct: 100, replacementTransportMode: 'road', replacementVehicleSpec: 'EURO 5 truck' },
    },
    {
      presetId: 'B4-LONG-40',
      label: 'Long-life 40-year replacement',
      description: 'Lower replacement frequency over 50-year RSL.',
      values: { replacementIntervalYears: 40, replacementSharePct: 100, replacementTransportMode: 'road', replacementVehicleSpec: 'EURO 5 truck' },
    },
  ],
  C: [
    {
      presetId: 'C-DK-MIX',
      label: 'Denmark mixed end-of-life',
      description: 'Two-leg transport with mixed recycling, recovery, and landfill routes.',
      values: {
        C2: { collectionSortingDistanceKm: 30, treatmentDistanceKm: 60, totalTransportDistanceKm: 90, mode: 'road', vehicleSpec: 'EURO 5 truck', transportFactorId: 'FAC-TR-EU5-001' },
        C3: {
          routes: [
            { materialCategory: 'wood', treatmentRoute: 'incineration with energy recovery', sharePct: 80, processingFactorId: 'FAC-C3-REC-001', note: 'Preset route.' },
            { materialCategory: 'wood', treatmentRoute: 'landfill', sharePct: 20, processingFactorId: 'FAC-C4-LND-001', note: 'Preset route.' },
            { materialCategory: 'aluminium', treatmentRoute: 'recycling', sharePct: 95, processingFactorId: 'FAC-C3-REC-001', note: 'Preset route.' },
            { materialCategory: 'aluminium', treatmentRoute: 'landfill', sharePct: 5, processingFactorId: 'FAC-C4-LND-001', note: 'Preset route.' },
            { materialCategory: 'glass', treatmentRoute: 'recycling', sharePct: 70, processingFactorId: 'FAC-C3-REC-001', note: 'Preset route.' },
            { materialCategory: 'glass', treatmentRoute: 'landfill', sharePct: 30, processingFactorId: 'FAC-C4-LND-001', note: 'Preset route.' },
          ],
        },
        C4: { disposalFactorId: 'FAC-C4-LND-001' },
      },
    },
    {
      presetId: 'C-RECOVERY-HEAVY',
      label: 'Recovery-heavy end-of-life',
      description: 'Higher recovery share and slightly longer transport.',
      values: {
        C2: { collectionSortingDistanceKm: 35, treatmentDistanceKm: 75, totalTransportDistanceKm: 110, mode: 'road', vehicleSpec: 'EURO 5 truck', transportFactorId: 'FAC-TR-EU5-001' },
        C3: {
          routes: [
            { materialCategory: 'wood', treatmentRoute: 'incineration with energy recovery', sharePct: 90, processingFactorId: 'FAC-C3-REC-001', note: 'Preset route.' },
            { materialCategory: 'wood', treatmentRoute: 'landfill', sharePct: 10, processingFactorId: 'FAC-C4-LND-001', note: 'Preset route.' },
            { materialCategory: 'aluminium', treatmentRoute: 'recycling', sharePct: 98, processingFactorId: 'FAC-C3-REC-001', note: 'Preset route.' },
            { materialCategory: 'aluminium', treatmentRoute: 'landfill', sharePct: 2, processingFactorId: 'FAC-C4-LND-001', note: 'Preset route.' },
            { materialCategory: 'glass', treatmentRoute: 'recycling', sharePct: 80, processingFactorId: 'FAC-C3-REC-001', note: 'Preset route.' },
            { materialCategory: 'glass', treatmentRoute: 'landfill', sharePct: 20, processingFactorId: 'FAC-C4-LND-001', note: 'Preset route.' },
          ],
        },
        C4: { disposalFactorId: 'FAC-C4-LND-001' },
      },
    },
  ],
  D: [
    {
      presetId: 'D-DEFAULT',
      label: 'Default recovery credit',
      description: 'Generic secondary material substitution credits.',
      values: {
        recoveredFlows: [
          { materialCategory: 'aluminium', outputFlowMassKg: 5.9, creditFactorId: 'FAC-D-CRD-001', substitutionAssumption: 'Secondary aluminium substitution', note: 'Preset flow.' },
          { materialCategory: 'glass', outputFlowMassKg: 10.4, creditFactorId: 'FAC-D-CRD-001', substitutionAssumption: 'Recycled glass substitution', note: 'Preset flow.' },
        ],
      },
    },
    {
      presetId: 'D-CONSERVATIVE',
      label: 'Conservative credit',
      description: 'Lower recovered output flows for cautious reporting.',
      values: {
        recoveredFlows: [
          { materialCategory: 'aluminium', outputFlowMassKg: 5.2, creditFactorId: 'FAC-D-CRD-001', substitutionAssumption: 'Secondary aluminium substitution', note: 'Preset flow.' },
          { materialCategory: 'glass', outputFlowMassKg: 8.7, creditFactorId: 'FAC-D-CRD-001', substitutionAssumption: 'Recycled glass substitution', note: 'Preset flow.' },
        ],
      },
    },
  ],
};

export function applyScenarioPreset(scenarioSet, moduleKey, presetId) {
  const preset = (scenarioPresetLibrary[moduleKey] || []).find((item) => item.presetId === presetId);
  if (!preset) return scenarioSet;
  const next = JSON.parse(JSON.stringify(scenarioSet));
  if (moduleKey === 'B4') next.B4 = { ...next.B4, ...preset.values, scenarioPresetName: preset.label, presetId };
  if (moduleKey === 'C') {
    next.C2 = { ...next.C2, ...(preset.values.C2 || {}) };
    next.C3 = { ...next.C3, ...(preset.values.C3 || {}) };
    next.C4 = { ...next.C4, ...(preset.values.C4 || {}) };
    next.C3.scenarioPresetName = preset.label;
    next.C2.scenarioPresetName = preset.label;
    next.C4.scenarioPresetName = preset.label;
    next.C2.presetId = presetId;
    next.C3.presetId = presetId;
    next.C4.presetId = presetId;
  }
  if (moduleKey === 'D') next.D = { ...next.D, ...preset.values, scenarioPresetName: preset.label, presetId };
  return next;
}
