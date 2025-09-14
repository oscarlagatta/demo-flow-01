import { BaseEdge, EdgeProps, getSmoothStepPath} from "@xyflow/react";

export function CustomEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
                           }: EdgeProps) {
    const [edgePath ] = getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition
    });

    return <BaseEdge id={id} path={edgePath} />
}
