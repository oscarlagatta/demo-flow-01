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
}

// Mapping of aitNumbers to sections based on the existing flow data
const AIT_TO_SECTION_MAPPING: Record<string, string> = {
  "11554": "bg-origination", // Swift Gateway
  "48581": "bg-origination", // Loan IQ
  "41107": "bg-origination", // CashPro Mobile
  "11697": "bg-origination", // CPO API Gateway
  "54071": "bg-origination", // B2Bi
  "512": "bg-validation", // Swift Alliance
  "70199": "bg-validation", // GPO
  "28960": "bg-validation", // CashPro Payments
  "15227": "bg-validation", // FRP US
  "31427": "bg-validation", // PSR
  "834": "bg-validation", // ECS
  "60745": "bg-middleware", // RPI
  "4679": "bg-middleware", // HRP
  "515": "bg-processing", // GPS Aries
  "62686": "bg-processing", // GTMS (Limits)
  "46951": "bg-processing", // ETS (Sanctions)
  "73929": "bg-processing", // GFD (Fraud)
  "1901": "bg-processing", // WTX
  "882": "bg-processing", // RGBW
  "74014": "bg-processing", // RTPFP
  "999": "bg-origination", // CPD_Strategic - mapping to origination for now
}

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
    }
  >()

  console.log("[v0] Processing timing data for sections:", Object.keys(SECTION_NAMES))
  console.log("[v0] Input timing data entries:", timingData.length)

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
      })
    }

    const sectionData = sectionMap.get(sectionId)!
    sectionData.times.push(time30)
    sectionData.aitNumbers.add(entry.aitNumber)
  })

  // Calculate averages and max values for each section
  const processedSections: ProcessedSectionTiming[] = []

  sectionMap.forEach((data, sectionId) => {
    const averageThruputTime30 = data.times.reduce((sum, time) => sum + time, 0) / data.times.length
    const maxThruputTime30 = Math.max(...data.times)

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
