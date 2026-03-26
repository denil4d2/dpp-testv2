import { calculateA1, validateA1 } from '../modules/A1.js';
import { calculateA2, validateA2 } from '../modules/A2.js';
import { calculateA3, validateA3 } from '../modules/A3.js';
import { calculateB4, validateB4 } from '../modules/B4.js';
import { calculateC1, validateC1 } from '../modules/C1.js';
import { calculateC2, validateC2 } from '../modules/C2.js';
import { calculateC3, validateC3 } from '../modules/C3.js';
import { calculateC4, validateC4 } from '../modules/C4.js';
import { calculateD, validateD } from '../modules/D.js';

export const moduleRegistry = [
  { id: 'A1', group: 'Product stage', order: 10, status: 'active', expectedUnit: 'kg', indicatorName: 'GWP-total', calculate: calculateA1, validate: validateA1 },
  { id: 'A2', group: 'Product stage', order: 20, status: 'active', expectedUnit: 'tkm', indicatorName: 'Transport', calculate: calculateA2, validate: validateA2 },
  { id: 'A3', group: 'Product stage', order: 30, status: 'active', expectedUnit: 'kWh/MJ/lump_sum', indicatorName: 'GWP-GHG', calculate: calculateA3, validate: validateA3 },
  { id: 'B4', group: 'Use stage', order: 40, status: 'active', expectedUnit: 'kg/tkm', indicatorName: 'GWP-total', calculate: calculateB4, validate: validateB4 },
  { id: 'C1', group: 'End-of-life', order: 50, status: 'active', expectedUnit: 'MJ', indicatorName: 'Energy', calculate: calculateC1, validate: validateC1 },
  { id: 'C2', group: 'End-of-life', order: 60, status: 'active', expectedUnit: 'tkm', indicatorName: 'Transport', calculate: calculateC2, validate: validateC2 },
  { id: 'C3', group: 'End-of-life', order: 70, status: 'active', expectedUnit: 'kg', indicatorName: 'GWP-total', calculate: calculateC3, validate: validateC3 },
  { id: 'C4', group: 'End-of-life', order: 80, status: 'active', expectedUnit: 'kg', indicatorName: 'GWP-total', calculate: calculateC4, validate: validateC4 },
  { id: 'D', group: 'Beyond system boundary', order: 90, status: 'active', expectedUnit: 'kg', indicatorName: 'GWP-total', calculate: calculateD, validate: validateD },
].sort((a, b) => a.order - b.order);
