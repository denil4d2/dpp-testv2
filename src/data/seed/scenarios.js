function createScenarioSet(overrides = {}) {
  return {
    B4: {
      status: 'Active',
      scenarioPresetName: 'Default replacement module',
      methodologyNote: 'Configured as an active B4 module under the local generator.',
      dataCompletenessPct: 85,
      previewEnabled: true,
      reviewNote: 'Replacement remains review-sensitive, but the module is active.',
      replacementIntervalYears: 25,
      replacedMaterialCategory: 'aluminium',
      replacementSharePct: 100,
      replacementMassBasisKg: 6.2,
      replacementTransportMode: 'road',
      replacementVehicleSpec: 'EURO 5 truck',
      replacementDistanceKm: 650,
      replacementFactorSource: 'FAC-ALU-HYDRO-001',
    },
    C1: {
      status: 'Active',
      scenarioPresetName: 'Default demolition module',
      methodologyNote: 'Active C1 module using demolition energy inputs.',
      dataCompletenessPct: 80,
      previewEnabled: true,
      reviewNote: 'Demolition energy factor remains placeholder-backed.',
      demolitionProcessType: 'manual + mechanical mix',
      demolitionEnergyFactorId: 'FAC-C1-DEMO-001',
      demolitionEnergyAmountMj: 18,
    },
    C2: {
      status: 'Active',
      scenarioPresetName: 'Two-leg transport module',
      methodologyNote: 'Active C2 module structured for EN 15804+A2 + PCR 2019:14 v2.0.1 style two-leg route assumptions.',
      dataCompletenessPct: 85,
      previewEnabled: true,
      reviewNote: 'Configured as collection/sorting + treatment legs.',
      collectionSortingDistanceKm: 30,
      treatmentDistanceKm: 60,
      totalTransportDistanceKm: 90,
      mode: 'road',
      vehicleSpec: 'EURO 5 truck',
      transportFactorId: 'FAC-TR-EU5-001',
    },
    C3: {
      status: 'Active',
      scenarioPresetName: 'End-of-life treatment split',
      methodologyNote: 'Active C3 routing model. Shares should still be reviewed before reporting externally.',
      dataCompletenessPct: 82,
      previewEnabled: true,
      reviewNote: 'Glass route remains deliberately conservative in the demo setup.',
      routes: [
        { materialCategory: 'wood', treatmentRoute: 'incineration with energy recovery', sharePct: 80, processingFactorId: 'FAC-C3-REC-001', note: 'Remaining share to landfill/disposal.' },
        { materialCategory: 'wood', treatmentRoute: 'landfill', sharePct: 20, processingFactorId: 'FAC-C4-LND-001', note: 'Residual fraction.' },
        { materialCategory: 'aluminium', treatmentRoute: 'recycling', sharePct: 95, processingFactorId: 'FAC-C3-REC-001', note: 'High recycling route placeholder.' },
        { materialCategory: 'aluminium', treatmentRoute: 'landfill', sharePct: 5, processingFactorId: 'FAC-C4-LND-001', note: 'Residual fraction.' },
        { materialCategory: 'glass', treatmentRoute: 'recycling', sharePct: 70, processingFactorId: 'FAC-C3-REC-001', note: 'Demo assumption only.' },
        { materialCategory: 'glass', treatmentRoute: 'landfill', sharePct: 30, processingFactorId: 'FAC-C4-LND-001', note: 'Demo assumption only.' },
      ],
    },
    C4: {
      status: 'Active',
      scenarioPresetName: 'Residual disposal module',
      methodologyNote: 'Active C4 module derived from routed landfill fractions.',
      dataCompletenessPct: 75,
      previewEnabled: true,
      reviewNote: 'Derived from scenario route splits.',
      disposalFactorId: 'FAC-C4-LND-001',
    },
    D: {
      status: 'Active',
      scenarioPresetName: 'Recovered material credit module',
      methodologyNote: 'Active module D credit structure. Reported separately from product stage impacts.',
      dataCompletenessPct: 78,
      previewEnabled: true,
      reviewNote: 'Scenario-sensitive credits remain review-sensitive, but the module is active.',
      recoveredFlows: [
        { materialCategory: 'aluminium', outputFlowMassKg: 5.9, creditFactorId: 'FAC-D-CRD-001', substitutionAssumption: 'Secondary aluminium substitution', note: 'Placeholder credit.' },
        { materialCategory: 'glass', outputFlowMassKg: 10.4, creditFactorId: 'FAC-D-CRD-001', substitutionAssumption: 'Recycled glass substitution', note: 'Placeholder credit.' },
      ],
    },
    ...overrides,
  };
}

export function cloneScenarioSet(baseScenarioSet) {
  return JSON.parse(JSON.stringify(baseScenarioSet));
}

export function createDefaultScenarioSetForProduct(product = {}) {
  const aluminiumMass = product.productId === 'PRD-NORD-001' ? 4.9 : 6.2;
  const routes = [
    { materialCategory: 'wood', treatmentRoute: 'incineration with energy recovery', sharePct: 80, processingFactorId: 'FAC-C3-REC-001', note: 'Remaining share to landfill/disposal.' },
    { materialCategory: 'wood', treatmentRoute: 'landfill', sharePct: 20, processingFactorId: 'FAC-C4-LND-001', note: 'Residual fraction.' },
    { materialCategory: 'aluminium', treatmentRoute: 'recycling', sharePct: 95, processingFactorId: 'FAC-C3-REC-001', note: 'High recycling route placeholder.' },
    { materialCategory: 'aluminium', treatmentRoute: 'landfill', sharePct: 5, processingFactorId: 'FAC-C4-LND-001', note: 'Residual fraction.' },
    { materialCategory: 'glass', treatmentRoute: 'recycling', sharePct: 70, processingFactorId: 'FAC-C3-REC-001', note: 'Demo assumption only.' },
    { materialCategory: 'glass', treatmentRoute: 'landfill', sharePct: 30, processingFactorId: 'FAC-C4-LND-001', note: 'Demo assumption only.' },
  ];
  return createScenarioSet({
    B4: {
      status: 'Active',
      scenarioPresetName: `${product.platform || 'Default'} replacement module`,
      methodologyNote: 'Configured as an active B4 module under the local generator.',
      dataCompletenessPct: 85,
      previewEnabled: true,
      reviewNote: 'Replacement remains review-sensitive, but the module is active.',
      replacementIntervalYears: 25,
      replacedMaterialCategory: 'aluminium',
      replacementSharePct: 100,
      replacementMassBasisKg: aluminiumMass,
      replacementTransportMode: 'road',
      replacementVehicleSpec: 'EURO 5 truck',
      replacementDistanceKm: product.productId === 'PRD-NORD-001' ? 610 : 650,
      replacementFactorSource: 'FAC-ALU-HYDRO-001',
    },
    D: {
      status: 'Active',
      scenarioPresetName: 'Recovered material credit module',
      methodologyNote: 'Active module D credit structure. Reported separately from product stage impacts.',
      dataCompletenessPct: 78,
      previewEnabled: true,
      reviewNote: 'Scenario-sensitive credits remain review-sensitive, but the module is active.',
      recoveredFlows: [
        { materialCategory: 'aluminium', outputFlowMassKg: Math.max(0, +(aluminiumMass - 0.3).toFixed(2)), creditFactorId: 'FAC-D-CRD-001', substitutionAssumption: 'Secondary aluminium substitution', note: 'Placeholder credit.' },
        { materialCategory: 'glass', outputFlowMassKg: product.productId === 'PRD-NORD-001' ? 9.1 : 10.4, creditFactorId: 'FAC-D-CRD-001', substitutionAssumption: 'Recycled glass substitution', note: 'Placeholder credit.' },
      ],
    },
    C3: {
      status: 'Active',
      scenarioPresetName: 'End-of-life treatment split',
      methodologyNote: 'Active C3 routing model. Shares should still be reviewed before reporting externally.',
      dataCompletenessPct: 82,
      previewEnabled: true,
      reviewNote: 'Glass route remains deliberately conservative in the demo setup.',
      routes,
    },
  });
}

export const demoScenariosByProduct = {
  'PRD-AURA-001': createDefaultScenarioSetForProduct({ productId: 'PRD-AURA-001', platform: 'AuraPlus / FormaPlus' }),
  'PRD-NORD-001': createDefaultScenarioSetForProduct({ productId: 'PRD-NORD-001', platform: 'NordLine' }),
};

export const demoScenarios = demoScenariosByProduct['PRD-AURA-001'];
