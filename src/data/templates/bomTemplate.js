import { demoBomRows } from '../seed/demoProduct.js';

export const bomTemplateHeaders = [
  'productId',
  'componentId',
  'partName',
  'materialCategory',
  'materialSubtype',
  'materialName',
  'supplier',
  'quantity',
  'unit',
  'unitWeight',
  'totalWeight',
  'recycledContentPct',
  'wasteRatePct',
  'geography',
  'preferredFactorId',
  'openLcaDatasetId',
  'transportMode',
  'transportVehicleSpec',
  'distanceKm',
  'origin',
  'destination',
  'notes',
];

export const bomExampleRows = demoBomRows.map((row) => ({
  ...row,
  preferredFactorId: row.preferredFactorId || '',
  openLcaDatasetId: row.openLcaDatasetId || '',
}));
