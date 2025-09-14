// Checked
import { type AppNode } from '../../types/app-node';
import { classToParentId } from '@/domains/payment-health/utils/shared-mappings';
import { transformApiData } from '@/domains/payment-health/utils/transform-utils';

import apiData from './us-wires-data.json';

// --- Static Section Definitions ---
const backgroundNodes: AppNode[] = [
  {
    id: 'bg-origination',
    type: 'background',
    position: { x: 0, y: 0 },
    data: { title: 'Origination' },
    draggable: false,
    selectable: false,
    zIndex: -1,
    style: { width: '350px', height: '960px' },
  },
  {
    id: 'bg-validation',
    type: 'background',
    position: { x: 350, y: 0 },
    data: { title: 'Payment Validation and Routing' },
    draggable: false,
    selectable: false,
    zIndex: -1,
    style: { width: '350px', height: '960px' },
  },
  {
    id: 'bg-middleware',
    type: 'background',
    position: { x: 700, y: 0 },
    data: { title: 'Middleware' },
    draggable: false,
    selectable: false,
    zIndex: -1,
    style: { width: '450px', height: '960px' },
  },
  {
    id: 'bg-processing',
    type: 'background',
    position: { x: 1150, y: 0 },
    data: { title: 'Payment Processing, Sanctions & Investigation' },
    draggable: false,
    selectable: false,
    zIndex: -1,
    style: { width: '500px', height: '960px' },
  },
];

const sectionPositions: Record<
  string,
  { baseX: number; positions: { x: number; y: number }[] }
> = {
  'bg-origination': {
    baseX: 50,
    positions: [
      { x: 50, y: 100 },
      { x: 50, y: 220 },
      { x: 50, y: 340 },
      { x: 50, y: 460 },
      { x: 50, y: 580 },
      { x: 50, y: 700 },
    ],
  },
  'bg-validation': {
    baseX: 425,
    positions: [
      { x: 425, y: 100 },
      { x: 425, y: 220 },
      { x: 425, y: 340 },
      { x: 425, y: 480 },
      { x: 425, y: 590 },
      { x: 425, y: 700 },
    ],
  },
  'bg-middleware': {
    baseX: 750,
    positions: [
      { x: 750, y: 220 },
      { x: 950, y: 400 },
    ],
  },
  'bg-processing': {
    baseX: 1200,
    positions: [
      { x: 1200, y: 160 },
      { x: 1420, y: 160 },
      { x: 1310, y: 300 },
      { x: 1310, y: 420 },
      { x: 1200, y: 580 },
      { x: 1200, y: 700 },
      { x: 1200, y: 820 },
    ],
  },
};

export const { nodes: initialNodes, edges: initialEdges } = transformApiData(
  apiData,
  backgroundNodes,
  classToParentId,
  sectionPositions
);
