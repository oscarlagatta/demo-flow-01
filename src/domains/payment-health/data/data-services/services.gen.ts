import {
  createClient,
  createConfig,
  type Options,
} from '@hey-api/client-axios';
import {
  GetApiV2SplunkDataGetAmountTransactionDetailsDataData,
  GetApiV2SplunkDataGetAmountTransactionDetailsDataError,
  GetApiV2SplunkDataGetAmountTransactionDetailsDataResponse,
  GetApiV2SplunkDataGetSplunkDataResponse,
  GetApiV2SplunkDataGetTransactionDetailsDataData,
  GetApiV2SplunkDataGetTransactionDetailsDataError,
  GetApiV3SplunkDataGetSplunkDataError,
} from '@/domains/payment-health/data/data-services/types,gen';
import { GetApiV2SplunkDataGetTransactionDetailsDataResponse } from '@/domains/payment-health/types/transaction-details-data-response';
// Import the local JSON data
import splunkUsWiresData from '@/domains/payment-health/assets/flow-data-us-wires/get-splunk-us-wires-data.json';

export const client = createClient(createConfig());

// Modified function to read from local JSON file
export const getApiV2SplunkDataGetSplunkData = <
  ThrowOnError extends boolean = false,
>(options?: {
  client?: typeof client;
  throwOnError?: ThrowOnError;
}) => {
  // Return a Promise that resolves with the local JSON data
  return Promise.resolve({
    data: splunkUsWiresData as GetApiV2SplunkDataGetSplunkDataResponse,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
    request: {},
  });
};

export const getApiV2SplunkDataGetAmountTransactionDetailsData = <
  ThrowOnError extends boolean = false,
>(options?: {
  query?: GetApiV2SplunkDataGetAmountTransactionDetailsDataData['query'];
  client?: typeof client;
  throwOnError?: ThrowOnError;
}) => {
  return (options?.client ?? client).get<
    GetApiV2SplunkDataGetAmountTransactionDetailsDataResponse,
    GetApiV2SplunkDataGetAmountTransactionDetailsDataError,
    ThrowOnError
  >({
    url: `/api/v2/splunk/data/getAmountTransactionDetailsData`,
    query: options?.query,
    throwOnError: options?.throwOnError,
  });
};

export const getApiV2SplunkDataGetTransactionDetailsData = <
  ThrowOnError extends boolean = false,
>(options?: {
  query?: GetApiV2SplunkDataGetTransactionDetailsDataData['query'];
  client?: typeof client;
  throwOnError?: ThrowOnError;
}) => {
  return (options?.client ?? client).get<
    GetApiV2SplunkDataGetTransactionDetailsDataResponse,
    GetApiV2SplunkDataGetTransactionDetailsDataError,
    ThrowOnError
  >({
    url: `/api/v2/splunk/data/getTransactionDetailsData`,
    query: options?.query,
    throwOnError: options?.throwOnError,
  });
};

// import {
//   createClient,
//   createConfig,
//   type Options,
// } from '@hey-api/client-axios';
//
// import {
//   GetApiV2SplunkDataGetAmountTransactionDetailsDataData,
//   GetApiV2SplunkDataGetAmountTransactionDetailsDataError,
//   GetApiV2SplunkDataGetAmountTransactionDetailsDataResponse,
//   GetApiV2SplunkDataGetSplunkDataResponse,
//   GetApiV2SplunkDataGetTransactionDetailsDataData,
//   GetApiV2SplunkDataGetTransactionDetailsDataError,
//   GetApiV3SplunkDataGetSplunkDataError,
// } from '@/domains/payment-health/data/data-services/types,gen';
// import { GetApiV2SplunkDataGetTransactionDetailsDataResponse } from '@/domains/payment-health/types/transaction-details-data-response';
// import { ThrowOnError } from '@tanstack/query-core';
//
// export const client = createClient(createConfig());
//
// export const getApiV2SplunkDataGetSplunkData = <
//   ThrowOnError extends boolean = false,
// >(
//   options?: Options<unknown, ThrowOnError>
// ) => {
//   return (options?.client ?? client).get<
//     GetApiV2SplunkDataGetSplunkDataResponse,
//     GetApiV3SplunkDataGetSplunkDataError,
//     ThrowOnError
//   >({
//     ...options,
//     url: `/api/v2/splunk/data/GetSplunkData`,
//   });
// };
//
// export const getApiV2SplunkDataGetAmountTransactionDetailsData = <
//   ThrowOnError extends boolean = false,
// >(
//   options?: Options<
//     GetApiV2SplunkDataGetAmountTransactionDetailsDataData,
//     ThrowOnError
//   >
// ) => {
//   return (options?.client ?? client).get<
//     GetApiV2SplunkDataGetAmountTransactionDetailsDataResponse,
//     GetApiV2SplunkDataGetAmountTransactionDetailsDataError,
//     ThrowOnError
//   >({
//     ...options,
//     url: `/api/v2/splunk/data/getAmountTransactionDetailsData`,
//   });
// };
//
// export const getApiV2SplunkDataGetTransactionDetailsData = <
//   ThrowOnError extends boolean = false,
// >(
//   options?: Options<
//     GetApiV2SplunkDataGetTransactionDetailsDataData,
//     ThrowOnError
//   >
// ) => {
//   return (options?.client ?? client).get<
//     GetApiV2SplunkDataGetTransactionDetailsDataResponse,
//     GetApiV2SplunkDataGetTransactionDetailsDataError,
//     ThrowOnError
//   >({
//     ...options,
//     url: `/api/v2/splunk/data/getTransactionDetailsData`,
//   });
// };
