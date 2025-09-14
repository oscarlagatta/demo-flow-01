// checked
import { MarkerType } from '@xyflow/react';

import { type AppNode } from '../types/app-node';

export const edgeStyle = { stroke: '#6b7280', strokeWidth: 2 };
export const marker = { type: MarkerType.ArrowClosed, color: '#6b7280' };

export function transformApiData(
  apiData: { nodes: any[]; edges: any[] },
  backgroundNodes: AppNode[],
  classToParentId: Record<string, string>,
  sectionPositions: Record<
    string,
    { baseX: number; positions: { x: number; y: number }[] }
  >
) {
  const sectionCounters: Record<string, number> = Object.keys(
    sectionPositions
  ).reduce((acc, key: string) => ({ ...acc, [key]: 0 }), {});

  const transformedNodes: AppNode[] = apiData.nodes
    .map((apiNode): AppNode | null => {
      const parentId = classToParentId[apiNode.class];
      if (!parentId) return null;

      const sectionConfig = sectionPositions[parentId];
      const positionIndex = sectionCounters[parentId]++;
      const position = sectionConfig.positions[positionIndex] || {
        x: sectionConfig.baseX,
        y: 100 + positionIndex * 120,
      };

      return {
        id: apiNode.id,
        type: 'custom' as const,
        position,
        data: {
          title: apiNode.data.label,
          subtext: `AIT ${apiNode.id}`,
        },
        parentId: parentId,
        extent: 'parent' as const,
      };
    })
    .filter((n): n is AppNode => n !== null);

  const transformedEdges = apiData.edges.flatMap((apiEdge) => {
    const { source, target } = apiEdge;
    if (Array.isArray(target)) {
      return target.map((t) => ({
        id: `${source}-${t}`,
        source,
        target: t,
        type: 'smoothstep',
        style: edgeStyle,
        markerStart: marker,
        markerEnd: marker,
      }));
    } else {
      return [
        {
          ...apiEdge,
          target: target,
          type: 'smoothstep',
          style: edgeStyle,
          markerStart: marker,
          markerEnd: marker,
        },
      ];
    }
  });

  return {
    nodes: [...backgroundNodes, ...transformedNodes],
    edges: transformedEdges,
  };
}
