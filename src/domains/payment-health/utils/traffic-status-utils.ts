import type { SplunkDataItem } from '../types/splunk-data-item';

export type TrafficStatusColor = 'green' | 'red' | 'grey';

export interface TrafficStatusMapping {
  [aitNum: string]: TrafficStatusColor;
}

/**
 * Computes traffic status colors for all AITs based on Splunk data
 * Logic:
 * - If any entry has "iS_TRAFFIC_FLOWING": "No", set to red
 * - If all entries have "iS_TRAFFIC_FLOWING": "Yes", set to green
 * - If all entries are null or field is missing, set to grey
 */
export function computeTrafficStatusColors(
  splunkData: SplunkDataItem[]
): TrafficStatusMapping {
  const aitTrafficData: { [aitNum: string]: (boolean | null)[] } = {};

  // Group data by aiT_NUM and collect iS_TRAFFIC_FLOWING values
  splunkData.forEach((item) => {
    const aitNum = item.aiT_NUM;
    const trafficFlowing = item.iS_TRAFFIC_FLOWING;

    if (!aitTrafficData[aitNum]) {
      aitTrafficData[aitNum] = [];
    }

    // Convert string values to boolean/null
    let trafficValue: boolean | null = null;
    if (trafficFlowing === 'Yes') {
      trafficValue = true;
    } else if (trafficFlowing === 'No') {
      trafficValue = false;
    }
    // If trafficFlowing is null or any other value, trafficValue remains null

    aitTrafficData[aitNum].push(trafficValue);
  });

  // Determine color for each AIT based on aggregation logic
  const trafficStatusMapping: TrafficStatusMapping = {};

  Object.keys(aitTrafficData).forEach((aitNum) => {
    const trafficValues = aitTrafficData[aitNum];

    // Check if any entry has false (red condition)
    const hasFalse = trafficValues.some((value) => value === false);

    // Check if all entries are true (green condition)
    const allTrue =
      trafficValues.length > 0 &&
      trafficValues.every((value) => value === true);

    // Check if all entries are null (grey condition)
    const allNull = trafficValues.every((value) => value === null);

    if (hasFalse) {
      trafficStatusMapping[aitNum] = 'red';
    } else if (allTrue) {
      trafficStatusMapping[aitNum] = 'green';
    } else if (allNull || trafficValues.length === 0) {
      trafficStatusMapping[aitNum] = 'grey';
    } else {
      // Mixed true/null values - default to grey
      trafficStatusMapping[aitNum] = 'grey';
    }
  });

  return trafficStatusMapping;
}

/**
 * Gets the Tailwind CSS class for a traffic status color
 */
export function getTrafficStatusColorClass(
  statusColor: TrafficStatusColor
): string {
  switch (statusColor) {
    case 'green':
      return 'bg-green-500';
    case 'red':
      return 'bg-red-500';
    case 'grey':
    default:
      return 'bg-gray-400';
  }
}
