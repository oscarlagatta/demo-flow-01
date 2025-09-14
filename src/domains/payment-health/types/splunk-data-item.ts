//checked
export interface SplunkDataItem {
  aiT_NUM: string;
  aiT_NAME: string;
  floW_DIRECTION: string;
  floW_AIT_NUM: string;
  floW_AIT_NAME: string;
  iS_TRAFFIC_FLOWING: 'Yes' | 'No' | null;
  iS_TRAFFIC_ON_TREND: string;
  averagE_TRANSACTION_COUNT: string;
  currenT_TRANSACTION_COUNT: string;
  historiC_STD: string;
  historiC_MEAN: string;
  currenT_STD_VARIATION: string;
}
