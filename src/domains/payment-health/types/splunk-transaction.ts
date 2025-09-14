export type SplunkTransactionDetails = SplunkTransactionDetail[];

export interface SplunkTransactionDetail {
  source: string;
  sourceType: string;
  aitNumber: string;
  aitName: string;
  _raw: Raw;
}

export interface Raw {
  WTX_GFD_ID: string;
  SMH_SOURCE: string;
  SMH_DEST: string;
  RQO_TRAN_DATE: string;
  RQO_TRAN_TIME: string;
  RQO_TRAN_DATE_ALT: string;
  RQO_TRAN_TIME_ALT: string;
  XQO_CUST_CNTRY_CODE: string;
  AQQ_CUST_A_NUM: string;
  AQQ_BILLING_CURR_CODE: string;
  TBT_TRAN_TYPE: string;
  TBT_REF_NUM: string;
  TBT_BILLING_AMT: string;
  TBT_MOD_AMT: string;
  TBT_SCH_REF_NUM: string;
  TPP_CNTRY_CODE: string;
  TPP_BANK_CNTRY_CODE: string;
  TPP_CUST_A_NUM: string;
  TPP_CURR_CODE: string;
  TPP_TRAN_AMT: string;
  DBA_ENTRY_METHOD: string;
  DBA_APPROVAL_TYPE_REQ: string;
  RUA_20BYTE_STRING_001: string; // transaction id
  RRR_ACTION_CODE: string;
  RRR_SCORE: string;
  BCC_CPS_CORRELATION: string; // transaction id
  REC_CRT_TS: string;
  DBA_APPROVED_BY_USERID2: string;
}

// A lightweight normalized summary shape the hook exposes
export interface TransactionSummary {
  id: string;
  status: 'Approved' | 'Rejected' | 'Pending';
  amount: number;
  currency: string;
  date: string; // ISO string
  reference: string;
  source: string;
  counterpartyCountry: string;
  score?: number;
  metadata: Record<string, string | number | boolean>;
}

// API response shape
export interface TransactionApiResponse {
  id: string;
  results: SplunkTransactionDetails;
  summary: TransactionSummary;
}
