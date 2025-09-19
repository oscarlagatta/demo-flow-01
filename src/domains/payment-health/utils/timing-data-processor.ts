import usWiresData from "../assets/flow-data-us-wires/us-wires-data.json"

export interface TimingDataEntry {
  aitNumber: string
  aitName: string
  healthstatusDateTime: string
  averageThruputTime: string
  averageThruputTime30: string
}

export interface ProcessedSectionTiming {
  sectionId: string
  sectionName: string
  averageThruputTime30: number
  maxThruputTime30: number
  entryCount: number
  aitNumbers: string[]
  aitTimingData: Array<{
    aitNumber: string
    aitName: string
    averageThruputTime30: number
  }>
}

function createAitToSectionMapping(): Record<string, string> {
  const mapping: Record<string, string> = {}

  // Map class names to section IDs
  const classToSectionId: Record<string, string> = {
    origination: "bg-origination",
    "payment validation and routing": "bg-validation",
    middleware: "bg-middleware",
    "payment processing, sanctions and investigation": "bg-processing",
  }

  // Process nodes from us-wires-data.json
  usWiresData.nodes.forEach((node) => {
    if (node.class && node.id && !node.type) {
      // Only process AIT nodes (not background nodes)
      const sectionId = classToSectionId[node.class.toLowerCase()]
      if (sectionId) {
        mapping[node.id] = sectionId
      }
    }
  })

  console.log("[v0] Dynamic AIT_TO_SECTION_MAPPING created:", mapping)
  return mapping
}

const AIT_TO_SECTION_MAPPING = createAitToSectionMapping()

const SECTION_NAMES: Record<string, string> = {
  "bg-origination": "Origination",
  "bg-validation": "Payment Validation and Routing",
  "bg-middleware": "Middleware",
  "bg-processing": "Payment Processing, Sanctions & Investigation",
}

export function processTimingData(timingData: TimingDataEntry[]): ProcessedSectionTiming[] {
  const sectionMap = new Map<
    string,
    {
      times: number[]
      aitNumbers: Set<string>
      aitData: Map<string, { name: string; times: number[] }>
    }
  >()

  console.log("[v0] Processing timing data for sections:", Object.keys(SECTION_NAMES))
  console.log("[v0] Input timing data entries:", timingData.length)
  console.log("[v0] Section mappings:", AIT_TO_SECTION_MAPPING)

  // Group timing data by section
  timingData.forEach((entry) => {
    const sectionId = AIT_TO_SECTION_MAPPING[entry.aitNumber]
    if (!sectionId) {
      console.warn(`[v0] Unknown aitNumber: ${entry.aitNumber}, skipping`)
      return
    }

    const time30 = Number.parseFloat(entry.averageThruputTime30)
    if (isNaN(time30)) {
      console.warn(`[v0] Invalid averageThruputTime30 for aitNumber ${entry.aitNumber}: ${entry.averageThruputTime30}`)
      return
    }

    if (!sectionMap.has(sectionId)) {
      sectionMap.set(sectionId, {
        times: [],
        aitNumbers: new Set(),
        aitData: new Map(),
      })
    }

    const sectionData = sectionMap.get(sectionId)!
    sectionData.times.push(time30)
    sectionData.aitNumbers.add(entry.aitNumber)

    if (!sectionData.aitData.has(entry.aitNumber)) {
      sectionData.aitData.set(entry.aitNumber, {
        name: entry.aitName,
        times: [],
      })
    }
    sectionData.aitData.get(entry.aitNumber)!.times.push(time30)
  })

  // Calculate averages and max values for each section
  const processedSections: ProcessedSectionTiming[] = []

  sectionMap.forEach((data, sectionId) => {
    const averageThruputTime30 = data.times.reduce((sum, time) => sum + time, 0) / data.times.length
    const maxThruputTime30 = Math.max(...data.times)

    const aitTimingData = Array.from(data.aitData.entries()).map(([aitNumber, aitInfo]) => ({
      aitNumber,
      aitName: aitInfo.name,
      averageThruputTime30:
        Math.round((aitInfo.times.reduce((sum, time) => sum + time, 0) / aitInfo.times.length) * 100) / 100,
    }))

    console.log(
      `[v0] Section ${sectionId} (${SECTION_NAMES[sectionId]}): avg=${averageThruputTime30.toFixed(2)}s, max=${maxThruputTime30.toFixed(2)}s, entries=${data.times.length}`,
    )

    processedSections.push({
      sectionId,
      sectionName: SECTION_NAMES[sectionId] || sectionId,
      averageThruputTime30: Math.round(averageThruputTime30 * 100) / 100, // Round to 2 decimal places
      maxThruputTime30: Math.round(maxThruputTime30 * 100) / 100,
      entryCount: data.times.length,
      aitNumbers: Array.from(data.aitNumbers),
      aitTimingData,
    })
  })

  const sortedSections = processedSections.sort((a, b) => {
    const order = ["bg-origination", "bg-validation", "bg-middleware", "bg-processing"]
    return order.indexOf(a.sectionId) - order.indexOf(b.sectionId)
  })

  console.log(
    "[v0] Final processed sections:",
    sortedSections.map((s) => `${s.sectionName}: ${s.averageThruputTime30}s avg, ${s.maxThruputTime30}s max`),
  )

  return sortedSections
}

export function formatTimingValue(seconds: number): string {
  if (seconds < 1) {
    return `${Math.round(seconds * 1000)}ms`
  }
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds.toFixed(1)}s`
}
