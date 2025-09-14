// checked
'use client';
import { useState, useMemo } from 'react';

import {
  Raw,
  TransactionSummary,
  SplunkTransactionDetails,
  TransactionApiResponse,
} from '@/domains/payment-health/types/splunk-transaction';
import { GetApiV2SplunkDataGetTransactionDetailsDataResponse } from '@/domains/payment-health/types/transaction-details-data-response';

import {
  useGetSplunkUsWiresTransactionDetails,
  useGetSplunkUsWiresTransactionDetailsByAmount,
} from '@/domains/payment-health/hooks/use-get-splunk-us-wires/use-get-splunk-us-wires-tx-by-id';

const ID_REGEX = /^[A-Z0-9]{16}$/;

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface SearchParams {
  transactionId?: string;
  transactionAmount?: string;
  dateStart?: string;
  dateEnd?: string;
}

function mapStatus(code?: string): TransactionSummary['status'] {
  switch ((code || '').toUpperCase()) {
    case 'A':
      return 'Approved';
    case 'R':
      return 'Rejected';
    case 'P':
      return 'Pending';
    default:
      return 'Pending';
  }
}

function toNumber(value?: string): number {
  const n = Number.parseFloat((value || '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function toIsoDate(raw: Raw): string {
  if (raw.REC_CRT_TS && !Number.isNaN(Date.parse(raw.REC_CRT_TS))) {
    return new Date(raw.REC_CRT_TS).toISOString();
  }
  const dateAlt = (raw.RQO_TRAN_DATE_ALT || '').trim();
  const timeAlt = (raw.RQO_TRAN_TIME_ALT || '').trim();
  const combined = `${dateAlt.split(' ')[0]}T${timeAlt}Z`;
  if (!Number.isNaN(Date.parse(combined)))
    return new Date(combined).toISOString();

  const date = (raw.RQO_TRAN_DATE || '').trim().split(' ')[0];
  const time = (raw.RQO_TRAN_TIME || '').trim();
  const fallback = `${date}T${time}Z`;
  return !Number.isNaN(Date.parse(fallback))
    ? new Date(fallback).toISOString()
    : new Date().toISOString();
}

function buildSummary(
  searchKey: string,
  results: SplunkTransactionDetails
): TransactionSummary {
  const first = results[0]?._raw as Raw | undefined;
  const action = first?.RRR_ACTION_CODE;
  const status = mapStatus(action);

  const currency =
    first?.AQQ_BILLING_CURR_CODE || first?.TPP_CURR_CODE || 'USD';
  const amount = toNumber(first?.TBT_BILLING_AMT || first?.TPP_TRAN_AMT);

  const date = first ? toIsoDate(first) : new Date().toISOString();
  const reference = first?.TBT_REF_NUM || searchKey;
  const source = first?.SMH_SOURCE || 'Unknown';
  const counterpartyCountry =
    first?.TPP_CNTRY_CODE ||
    first?.TPP_BANK_CNTRY_CODE ||
    first?.XQO_CUST_CNTRY_CODE ||
    'US';
  const score = first?.RRR_SCORE
    ? Number.parseInt(first.RRR_SCORE, 10)
    : undefined;

  const metadata: Record<string, string | number | boolean> = {
    destination: first?.SMH_DEST || '',
    entryMethod: first?.DBA_ENTRY_METHOD || '',
    approvalType: first?.DBA_APPROVAL_TYPE_REQ || '',
    transactionType: first?.TBT_TRAN_TYPE || '',
    scheduleRef: first?.TBT_SCH_REF_NUM || '',
    approvedBy: first?.DBA_APPROVED_BY_USERID2 || '',
    correlationId: first?.BCC_CPS_CORRELATION || '',
    customerAccount: first?.AQQ_CUST_A_NUM || '',
  };

  return {
    id: searchKey,
    status,
    amount,
    currency,
    date,
    reference,
    source,
    counterpartyCountry,
    score,
    metadata,
  };
}

function transformApiResponse(
  searchKey: string,
  apiResponse: GetApiV2SplunkDataGetTransactionDetailsDataResponse
): TransactionApiResponse {
  console.log('Raw API response:', apiResponse);

  // Handle both single object and array responses
  const responseArray = Array.isArray(apiResponse)
    ? apiResponse
    : [apiResponse];

  console.log('Response array after normalization:', responseArray);

  if (!responseArray.length || !responseArray[0]) {
    console.log('No response data available');
    return {
      id: searchKey,
      results: [],
      summary: buildSummary(searchKey, []),
    };
  }

  // Transform all transaction records, not just the first one
  const results: SplunkTransactionDetails = responseArray
    .filter((item) => item) // Remove any null/undefined items
    .map((item) => ({
      source: item.source,
      sourceType: item.sourceType,
      aitNumber: item.aitNumber,
      aitName: item.aitName,
      _raw: item._raw,
    }));

  console.log('[v0] Transformed results (all records):', results);

  const summary = buildSummary(searchKey, results);

  return {
    id: searchKey,
    results,
    summary,
  };
}

export function useTransactionUsWiresSearch(defaultParams: SearchParams = {}) {
  const [searchParams, setSearchParams] = useState<SearchParams>(defaultParams);

  const enabled = useMemo(() => {
    const hasValidId =
      searchParams.transactionId && ID_REGEX.test(searchParams.transactionId);
    const hasAmount =
      searchParams.transactionAmount &&
      searchParams.transactionAmount.trim() !== '';
    const hasDateRange = searchParams.dateStart || searchParams.dateEnd;
    return !!(hasValidId || hasAmount || hasDateRange);
  }, [searchParams]);

  const useAmountSearch = !!(
    searchParams.transactionAmount &&
    searchParams.transactionAmount.trim() !== ''
  );

  const idBasedQuery = useGetSplunkUsWiresTransactionDetails(
    searchParams.transactionId || '',
    searchParams.dateStart,
    searchParams.dateEnd,
    enabled && !useAmountSearch // Only enable if not using amount search
  );

  const amountBasedQuery = useGetSplunkUsWiresTransactionDetailsByAmount(
    searchParams.transactionAmount || '',
    searchParams.dateStart,
    searchParams.dateEnd,
    enabled && useAmountSearch // Only enable if using amount search
  );

  // Select the appropriate query based on search type
  // const heyApiQuery = useAmountSearch ? amountBasedQuery : idBasedQuery;

  const { data, isLoading, isFetching, isError, error, refetch } =
    useAmountSearch ? amountBasedQuery : idBasedQuery;

  console.log('Search hook state:', {
    searchParams,
    enabled,
    useAmountSearch,
    hasData: !!data,
    isLoading: isLoading,
    isFetching: isFetching,
    isError: isError,
    error: error,
    rawApiResponse: data,
  });

  const searchKey = useMemo(() => {
    if (searchParams.transactionId) return searchParams.transactionId;
    if (searchParams.transactionAmount)
      return `amount_${searchParams.transactionAmount}`;
    if (searchParams.dateStart || searchParams.dateEnd) {
      return `${searchParams.dateStart || 'any'}_to_${searchParams.dateEnd || 'any'}`;
    }
    return '';
  }, [searchParams]);

  const transformedData = useMemo(() => {
    if (!data) return undefined;
    const transformed = transformApiResponse(searchKey, data as any);
    console.log('Transformed data:', transformed);
    return transformed;
  }, [data, searchKey]);

  const query = {
    data: transformedData,
    isLoading: isLoading,
    isFetching: isFetching,
    isError: isError,
    error: error ? new ApiError(error.message, 500) : null,
    refetch: refetch,
  };

  const invalidId = useMemo(() => {
    if (
      searchParams.transactionId &&
      !ID_REGEX.test(searchParams.transactionId)
    )
      return true;
    return query.error?.status === 400;
  }, [searchParams.transactionId, query.error]);

  const notFound = useMemo(() => query.error?.status === 404, [query.error]);

  function searchById(transactionId: string) {
    setSearchParams({ transactionId: transactionId.toUpperCase() });
  }

  function searchByDateRange(dateStart?: string, dateEnd?: string) {
    setSearchParams({ dateStart, dateEnd });
  }

  function searchByAll(params: SearchParams) {
    setSearchParams({
      transactionId: params.transactionId?.toUpperCase(),
      transactionAmount: params.transactionAmount,
      dateStart: params.dateStart,
      dateEnd: params.dateEnd,
    });
  }

  function reset() {
    setSearchParams({});
  }

  const results: SplunkTransactionDetails | undefined = query.data?.results;
  const summary: TransactionSummary | undefined = query.data?.summary;

  return {
    id: searchKey,
    searchParams,
    results,
    summary,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    invalidId,
    notFound,
    refetch: query.refetch,
    searchById,
    searchByDateRange,
    searchByAll,
    reset,
    // Legacy compatibility
    search: searchById,
  };
}
