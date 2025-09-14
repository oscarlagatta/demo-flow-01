export interface TransactionTableData {
  results: any[];
  selectedAitId: string | null;
  hideTable: () => void;
  id: string;
  isTableLoading: boolean;
}

export interface TransactionTableConfig {
  formatColumnName?: (columnName: string) => string;
  formatCellValue?: (value: any, columnName: string) => string;
  getSystemName?: (aitId: string, results: any[]) => string;
  currencyCode?: string;
  dateFormat?: Intl.DateTimeFormatOptions;
}

export interface TransactionTableAdapter {
  getData: () => TransactionTableData;
  getConfig: () => TransactionTableConfig;
}
