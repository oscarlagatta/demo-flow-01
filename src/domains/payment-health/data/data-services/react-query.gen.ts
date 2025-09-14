import { queryOptions } from '@tanstack/react-query';
import type { Options, Client } from '@hey-api/client-axios';
import {
  GetApiV2SplunkDataGetAmountTransactionDetailsDataData,
  GetApiV2SplunkDataGetTransactionDetailsDataData,
} from '@/domains/payment-health/data/data-services/types,gen';
import {
  getApiV2SplunkDataGetAmountTransactionDetailsData,
  getApiV2SplunkDataGetSplunkData,
  getApiV2SplunkDataGetTransactionDetailsData,
} from '@/domains/payment-health/data/data-services/services.gen';
import { client } from './client';

// Create extended options interface with client property
interface ExtendedOptions extends Options {
  client?: Client;
}

type QueryKey<TOptions extends Options> = [
  Pick<TOptions, 'baseURL' | 'body' | 'headers' | 'path' | 'query'> & {
    _id: string;
    _infinite?: boolean;
  },
];

const createQueryKey = <TOptions extends Options>(
  id: string,
  options?: TOptions & { client?: Client },
  infinite?: boolean
): QueryKey<TOptions>[0] => {
  const params: QueryKey<TOptions>[0] = {
    _id: id,
    baseURL: (options?.client ?? client).getConfig().baseURL,
  } as QueryKey<TOptions>[0];

  if (infinite) {
    params._infinite = infinite;
  }
  if (options?.body) {
    params.body = options.body;
  }
  if (options?.headers) {
    params.headers = options.headers;
  }
  if (options?.path) {
    params.path = options.path;
  }
  if (options?.query) {
    params.query = options.query;
  }
  return params;
};

export const getApiV2SplunkDataGetSplunkDataQueryKey = (
  options?: ExtendedOptions
) => [createQueryKey('getApiV2SplunkDataGetSplunkData', options)];

export const getApiV2SplunkDataGetSplunkDataOptions = (
  options?: ExtendedOptions
) => {
  return queryOptions({
    queryFn: async ({ queryKey }) => {
      const { data } = await getApiV2SplunkDataGetSplunkData({
        client: options?.client,
        throwOnError: true,
      });
      return data;
    },
    queryKey: getApiV2SplunkDataGetSplunkDataQueryKey(options),
  });
};

// Extended interfaces for transaction details
interface TransactionDetailsOptions extends ExtendedOptions {
  query?: GetApiV2SplunkDataGetTransactionDetailsDataData['query'];
}

interface AmountTransactionDetailsOptions extends ExtendedOptions {
  query?: GetApiV2SplunkDataGetAmountTransactionDetailsDataData['query'];
}

export const getApiV2SplunkDataGetTransactionDetailsDataQueryKey = (
  options?: TransactionDetailsOptions
) => [createQueryKey('getApiV2SplunkDataGetTransactionDetailsData', options)];

export const getApiV2SplunkDataGetTransactionDetailsDataOptions = (
  options?: TransactionDetailsOptions
) => {
  return queryOptions({
    queryFn: async ({ queryKey }) => {
      const { data } = await getApiV2SplunkDataGetTransactionDetailsData({
        query: options?.query,
        client: options?.client,
        throwOnError: true,
      });
      return data;
    },
    queryKey: getApiV2SplunkDataGetTransactionDetailsDataQueryKey(options),
  });
};

export const getApiV2SplunkDataGetAmountTransactionDetailsDataQueryKey = (
  options?: AmountTransactionDetailsOptions
) => [
  createQueryKey('getApiV2SplunkDataGetAmountTransactionDetailsData', options),
];

export const getApiV2SplunkDataGetAmountTransactionDetailsDataOptions = (
  options?: AmountTransactionDetailsOptions
) => {
  return queryOptions({
    queryFn: async ({ queryKey }) => {
      const { data } = await getApiV2SplunkDataGetAmountTransactionDetailsData({
        query: options?.query,
        client: options?.client,
        throwOnError: true,
      });
      return data;
    },
    queryKey:
      getApiV2SplunkDataGetAmountTransactionDetailsDataQueryKey(options),
  });
};

// import { queryOptions } from '@tanstack/react-query';
// import type { Options } from '@hey-api/client-axios';
//
// import {
//   GetApiV2SplunkDataGetAmountTransactionDetailsDataData,
//   GetApiV2SplunkDataGetTransactionDetailsDataData,
// } from '@/domains/payment-health/data/data-services/types,gen';
// import {
//   getApiV2SplunkDataGetAmountTransactionDetailsData,
//   getApiV2SplunkDataGetSplunkData,
//   getApiV2SplunkDataGetTransactionDetailsData,
// } from '@/domains/payment-health/data/data-services/services.gen';
// import { client } from '@/lib/api/client.gen';
//
// type QueryKey<TOptions extends Options> = [
//   Pick<TOptions, 'baseURL' | 'body' | 'headers' | 'path' | 'query'> & {
//     _id: string;
//     _infinite?: boolean;
//   },
// ];
//
// const createQueryKey = <TOptions extends Options>(
//   id: string,
//   options?: TOptions,
//   infinite?: boolean
// ): QueryKey<TOptions>[0] => {
//   const params: QueryKey<TOptions>[0] = {
//     _id: id,
//     baseURL: (options?.client ?? client).getConfig().baseURL,
//   } as QueryKey<TOptions>[0];
//
//   if (infinite) {
//     params._infinite = infinite;
//   }
//   if (options?.body) {
//     params.body = options.body;
//   }
//   if (options?.headers) {
//     params.headers = options.headers;
//   }
//   if (options?.path) {
//     params.path = options.path;
//   }
//   if (options?.query) {
//     params.query = options.query;
//   }
//   return params;
// };
//
// export const getApiV2SplunkDataGetSplunkDataQueryKey = (options?: Options) => [
//   createQueryKey('getApiV2SplunkDataGetSplunkData', options),
// ];
//
// export const getApiV2SplunkDataGetSplunkDataOptions = (options?: Options) => {
//   return queryOptions({
//     queryFn: async ({ queryKey }) => {
//       const { data } = await getApiV2SplunkDataGetSplunkData({
//         ...options,
//         ...queryKey[0],
//         throwOnError: true,
//       });
//       return data;
//     },
//     queryKey: getApiV2SplunkDataGetSplunkDataQueryKey(options),
//   });
// };
//
// export const getApiV2SplunkDataGetTransactionDetailsDataQueryKey = (
//   options?: Options<GetApiV2SplunkDataGetTransactionDetailsDataData>
// ) => [createQueryKey('getApiV2SplunkDataGetTransactionDetailsData', options)];
//
// export const getApiV2SplunkDataGetTransactionDetailsDataOptions = (
//   options?: Options<GetApiV2SplunkDataGetTransactionDetailsDataData>
// ) => {
//   return queryOptions({
//     queryFn: async ({ queryKey }) => {
//       const { data } = await getApiV2SplunkDataGetTransactionDetailsData({
//         ...options,
//         ...queryKey[0],
//         throwOnError: true,
//       });
//       return data;
//     },
//     queryKey: getApiV2SplunkDataGetTransactionDetailsDataQueryKey(options),
//   });
// };
//
// export const getApiV2SplunkDataGetAmountTransactionDetailsDataQueryKey = (
//   options?: Options<GetApiV2SplunkDataGetAmountTransactionDetailsDataData>
// ) => [
//   createQueryKey('getApiV2SplunkDataGetAmountTransactionDetailsData', options),
// ];
//
// export const getApiV2SplunkDataGetAmountTransactionDetailsDataOptions = (
//   options?: Options<GetApiV2SplunkDataGetAmountTransactionDetailsDataData>
// ) => {
//   return queryOptions({
//     queryFn: async ({ queryKey }) => {
//       const { data } = await getApiV2SplunkDataGetAmountTransactionDetailsData({
//         ...options,
//         ...queryKey[0],
//         throwOnError: true,
//       });
//       return data;
//     },
//     queryKey:
//       getApiV2SplunkDataGetAmountTransactionDetailsDataQueryKey(options),
//   });
// };
