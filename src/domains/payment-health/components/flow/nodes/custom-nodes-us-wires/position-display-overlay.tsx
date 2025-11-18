import type React from "react"

interface PositionDisplayOverlayProps {
  x: number
  y: number
  width: number
  height?: number
  isVisible: boolean
}

/**
 * Overlay component that displays real-time position and size information
 * during node drag and resize operations
 */
export function PositionDisplayOverlay({
  x,
  y,
  width,
  height,
  isVisible,
}: PositionDisplayOverlayProps) {
  if (!isVisible) return null

  return (
    <div
      className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg shadow-lg z-50 pointer-events-none"
      style={{
        fontSize: "11px",
        fontFamily: "monospace",
        whiteSpace: "nowrap",
      }}
    >
      <div className="flex gap-3 items-center">
        <span className="text-blue-300">
          X: <span className="font-bold">{Math.round(x)}</span>
        </span>
        <span className="text-green-300">
          Y: <span className="font-bold">{Math.round(y)}</span>
        </span>
        <span className="text-purple-300">
          W: <span className="font-bold">{Math.round(width)}</span>
        </span>
        {height !== undefined && (
          <span className="text-orange-300">
            H: <span className="font-bold">{Math.round(height)}</span>
          </span>
        )}
      </div>
      {/* Small arrow pointing down to node */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
    </div>
  )
}
