// checked
import type { Node, NodeProps } from "@xyflow/react"
import SectionDurationBadge from "@/domains/payment-health/components/badges/section-duration-badge"

type SectionBackgroundNodeProps = {
  title: string
  color: string
  isDimmed?: boolean
  duration?: number
  trend?: "up" | "down" | "stable"
  isMonitorMode?: boolean
  maxDuration?: number
  entryCount?: number
  aitNumbers?: string[]
  aitTimingData?: Array<{
    aitNumber: string
    aitName: string
    averageThruputTime30: number
  }>
}

type SectionBackgroundNodeType = Node<SectionBackgroundNodeProps>

const SectionBackgroundNode = ({ data }: NodeProps<SectionBackgroundNodeType>) => {
  return (
    <div
      className={`h-full w-full rounded-lg bg-white shadow-xl transition-all duration-200 ${
        data.isDimmed ? "opacity-60" : ""
      }`}
    >
      <div className="p-4">
        <h2 className="mb-3 text-center text-lg font-bold text-gray-700">{data.title}</h2>
        {data.isMonitorMode && data.duration && (
          <div className="flex flex-col items-center gap-2 mb-6">
            <SectionDurationBadge
              duration={data.duration}
              maxDuration={data.maxDuration}
              sectionName={data.title}
              trend={data.trend || "stable"}
              entryCount={data.entryCount}
              showDetails={true}
              className="shadow-sm"
            />
            {data.duration && (
              <div className="text-center">
                <div className="text-sm text-gray-600 font-medium">
                  Avg:{" "}
                  {data.duration < 1
                    ? `${Math.round(data.duration * 1000)}ms`
                    : data.duration < 60
                      ? `${data.duration.toFixed(1)}s`
                      : `${Math.floor(data.duration / 60)}m ${(data.duration % 60).toFixed(1)}s`}
                </div>
                {data.entryCount && <div className="text-xs text-gray-500">{data.entryCount} data points</div>}
              </div>
            )}
            {data.aitTimingData && data.aitTimingData.length > 0 && (
              <div className="w-full mt-4 space-y-2">
                <div className="text-xs font-medium text-gray-600 text-center">Individual AIT Timings:</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {data.aitTimingData.map((ait) => (
                    <div
                      key={ait.aitNumber}
                      className="flex justify-between items-center text-xs bg-gray-50 rounded px-2 py-1"
                    >
                      <span className="font-medium text-gray-700">AIT {ait.aitNumber}</span>
                      <span className="text-gray-600">
                        {ait.averageThruputTime30 < 1
                          ? `${Math.round(ait.averageThruputTime30 * 1000)}ms`
                          : ait.averageThruputTime30 < 60
                            ? `${ait.averageThruputTime30.toFixed(1)}s`
                            : `${Math.floor(ait.averageThruputTime30 / 60)}m ${(ait.averageThruputTime30 % 60).toFixed(1)}s`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SectionBackgroundNode
