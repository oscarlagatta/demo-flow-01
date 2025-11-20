import { BaseEdge, type EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from "@xyflow/react"

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  labelStyle,
  labelBgStyle,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  const showLabel = label && String(label).trim().length > 0

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} />
      {showLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
              ...labelBgStyle,
            }}
            className="nodrag nopan"
          >
            <div
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                backgroundColor: "white",
                border: "1px solid #cbd5e0",
                fontSize: "11px",
                fontWeight: 600,
                color: "#2d3748",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                ...labelStyle,
              }}
            >
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
