import type { SectionProcessingTime } from "../hooks/use-get-splunk-us-wires/use-get-splunk-timings-us-wires"

export interface Ait999Summary {
  totalEntries: number
  averageProcessingTime: number
  maxProcessingTime: number
  sectionsAffected: string[]
  lastUpdated: Date
}

export function calculateAit999Summary(data: SectionProcessingTime[]): Ait999Summary | null {
  if (!data || data.length === 0) {
    return null
  }

  // Find all sections that have AIT 999 data
  const sectionsWithAit999 = data.filter((section) => section.aitTimingData?.some((ait) => ait.aitNumber === "999"))

  if (sectionsWithAit999.length === 0) {
    return null
  }

  let totalEntries = 0
  let totalProcessingTime = 0
  let maxProcessingTime = 0
  const sectionsAffected: string[] = []

  sectionsWithAit999.forEach((section) => {
    const ait999Data = section.aitTimingData?.filter((ait) => ait.aitNumber === "999") || []

    ait999Data.forEach((ait) => {
      totalEntries++
      totalProcessingTime += ait.averageThruputTime30
      maxProcessingTime = Math.max(maxProcessingTime, ait.averageThruputTime30)
    })

    if (ait999Data.length > 0) {
      sectionsAffected.push(section.sectionName)
    }
  })

  const averageProcessingTime = totalEntries > 0 ? totalProcessingTime / totalEntries : 0

  return {
    totalEntries,
    averageProcessingTime: Math.round(averageProcessingTime * 100) / 100, // Round to 2 decimal places
    maxProcessingTime: Math.round(maxProcessingTime * 100) / 100,
    sectionsAffected: [...new Set(sectionsAffected)], // Remove duplicates
    lastUpdated: new Date(),
  }
}
