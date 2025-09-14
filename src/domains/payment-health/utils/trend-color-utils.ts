import { SplunkDataItem } from '@/domains/payment-health/types/splunk-data-item';

export type TrendColor = 'green' | 'yellow' | 'red' | 'grey';

export interface TrendColorMapping {
  [aitNum: string]: TrendColor;
}

/**
 * Classifies a single STD variation value according to the criteria:
 * - Green: STD between -20 and -6 (inclusive)
 * - Yellow: STD over 30 OR STD between -6 and -10 (inclusive)
 * - Red: STD less than -10
 */
function classifyStdVariation(
  stdVariation: number
): 'green' | 'yellow' | 'red' {
  if (stdVariation >= -20 && stdVariation <= -6) {
    return 'green';
  }
  if (stdVariation > 30 || (stdVariation >= -10 && stdVariation <= -6)) {
    return 'yellow';
  }
  if (stdVariation < -10) {
    return 'red';
  }
  // Default fallback (though this shouldn't happen based on the criteria)
  return 'yellow';
}

/**
 * Aggregates classifications for a single AIT:
 * - If all values are Green, set trendColor to Green
 * - If any value is Red, set trendColor to Red
 * - If there is one or more Yellow values and no Red, set trendColor to Yellow
 * - If no data exists, set trendColor to Grey
 */
function aggregateClassifications(
  classifications: ('green' | 'yellow' | 'red')[]
): TrendColor {
  if (classifications.length === 0) {
    return 'grey';
  }

  const hasRed = classifications.includes('red');
  const hasYellow = classifications.includes('yellow');
  const allGreen = classifications.every((c) => c === 'green');

  if (hasRed) {
    return 'red';
  }
  if (hasYellow) {
    return 'yellow';
  }
  if (allGreen) {
    return 'green';
  }

  return 'grey';
}

/**
 * Computes trend colors for all AITs based on Splunk data
 */
export function computeTrendColors(
  splunkData: SplunkDataItem[]
): TrendColorMapping {
  const aitClassifications: {
    [aitNum: string]: ('green' | 'yellow' | 'red')[];
  } = {};

  // Group data by aiT_NUM and classify each STD variation
  splunkData.forEach((item) => {
    const aitNum = item.aiT_NUM;
    const stdVariation = parseFloat(item.currenT_STD_VARIATION);

    if (!aitClassifications[aitNum]) {
      aitClassifications[aitNum] = [];
    }

    if (!isNaN(stdVariation)) {
      const classification = classifyStdVariation(stdVariation);
      aitClassifications[aitNum].push(classification);
    }
  });

  // Aggregate classifications for each AIT
  const trendColorMapping: TrendColorMapping = {};
  Object.keys(aitClassifications).forEach((aitNum) => {
    trendColorMapping[aitNum] = aggregateClassifications(
      aitClassifications[aitNum]
    );
  });

  return trendColorMapping;
}

/**
 * Gets the Tailwind CSS class for a trend color
 */
export function getTrendColorClass(trendColor: TrendColor): string {
  switch (trendColor) {
    case 'green':
      return 'bg-green-500';
    case 'yellow':
      return 'bg-yellow-500';
    case 'red':
      return 'bg-red-500';
    case 'grey':
    default:
      return 'bg-gray-400';
  }
}
