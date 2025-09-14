'use client';

import type React from 'react';
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from 'react';

import { useTransactionUsWiresSearch } from '@/domains/payment-health/hooks/use-get-splunk-us-wires/use-transaction-us-wires-search';
import { SplunkTransactionDetails } from '@/domains/payment-health/types/splunk-transaction';
import { ApiError } from '@/domains/payment-health/types/api-error';

interface SearchParams {
  transactionId?: string;
  transactionAmount?: string;
  dateStart?: string;
  dateEnd?: string;
}

type TransactionUsWiresSearchContextValue = {
  active: boolean;
  id: string;
  searchParams: SearchParams;
  results?: SplunkTransactionDetails;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error?: ApiError | null;
  invalidId: boolean;
  notFound: boolean;
  search: (id: string) => void;
  searchByAll: (params: SearchParams) => void;
  clear: () => void;
  // New: the set of AIT IDs that have data for the active transaction
  matchedAitIds: Set<string>;
  showTableView: boolean;
  selectedAitId: string | null;
  showTable: (aitId: string) => void;
  hideTable: () => void;
  showAmountSearchResults: boolean;
  amountSearchParams: {
    amount: string;
    dateStart?: string;
    dateEnd?: string;
  } | null;
  showAmountResults: (
    amount: string,
    dateStart?: string,
    dateEnd?: string
  ) => void;
  hideAmountResults: () => void;
  isTableLoading: boolean;
};

const TransactionUsWiresSearchContext =
  createContext<TransactionUsWiresSearchContextValue | null>(null);

export function TransactionUsWiresSearchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showTableView, setShowTableView] = useState(false);
  const [selectedAitId, setSelectedAitId] = useState<string | null>(null);
  const [showAmountSearchResults, setShowAmountSearchResults] = useState(false);
  const [amountSearchParams, setAmountSearchParams] = useState<{
    amount: string;
    dateStart?: string;
    dateEnd?: string;
  } | null>(null);

  const [isTableLoading, setIsTableLoading] = useState(false);

  const tx = useTransactionUsWiresSearch({});

  const search = useCallback(
    (id: string) => {
      if (!id) return;
      setShowAmountSearchResults(false);
      setAmountSearchParams(null);
      tx.searchById(id);
    },
    [tx]
  );

  const searchByAll = useCallback(
    (params: SearchParams) => {
      if (params.transactionAmount && !params.transactionId) {
        setShowAmountSearchResults(true);
        setAmountSearchParams({
          amount: params.transactionAmount,
          dateStart: params.dateStart,
          dateEnd: params.dateEnd,
        });
        setShowTableView(false);
        setSelectedAitId(null);
      } else {
        setShowAmountSearchResults(false);
        setAmountSearchParams(null);
      }

      tx.searchByAll(params);
    },
    [tx]
  );

  const clear = useCallback(() => {
    setShowTableView(false);
    setSelectedAitId(null);
    setIsTableLoading(false);
    tx.reset();
  }, [tx]);

  const active = useMemo(() => {
    const hasSearchParams = !!(
      tx.searchParams.transactionId ||
      tx.searchParams.transactionAmount ||
      tx.searchParams.dateStart ||
      tx.searchParams.dateEnd
    );
    return (
      hasSearchParams && (tx.isLoading || tx.isFetching || !!tx.results?.length)
    );
  }, [tx.searchParams, tx.isLoading, tx.isFetching, tx.results]);

  const showTable = useCallback((aitId: string) => {
    setIsTableLoading(true);
    setSelectedAitId(aitId);

    setShowAmountSearchResults(false);

    // Use requestAnimationFrame to ensure smooth transition
    requestAnimationFrame(() => {
      setShowTableView(true);
      // Small delay to allow table to render before removing loading state
      setTimeout(() => {
        setIsTableLoading(false);
      }, 100);
    });
  }, []);

  const hideTable = useCallback(() => {
    setIsTableLoading(false);
    setShowTableView(false);
    setSelectedAitId(null);
  }, []);

  const showAmountResults = useCallback(
    (amount: string, dateStart?: string, dateEnd?: string) => {
      setAmountSearchParams({ amount, dateStart, dateEnd });
      setShowAmountSearchResults(true);
      setShowTableView(false);
      setSelectedAitId(null);
    },
    []
  );

  const hideAmountResults = useCallback(() => {
    setShowAmountSearchResults(false);
    setAmountSearchParams(null);
  }, []);

  const matchedAitIds = useMemo(() => {
    const set = new Set<string>();
    if (!active || !tx.results?.length) {
      return set;
    }

    for (const detail of tx.results) {
      if (detail?.aitNumber) {
        set.add(detail.aitNumber);
      }
      // if (detail?._raw?.AIT_NUMBER) {
      //   set.add(detail._raw.AIT_NUMBER);
      // }
    }

    return set;
  }, [active, tx.results]);

  const value = useMemo<TransactionUsWiresSearchContextValue>(() => {
    return {
      active,
      id: tx.id,
      searchParams: tx.searchParams,
      results: tx.results,
      isLoading: tx.isLoading,
      isFetching: tx.isFetching,
      isError: tx.isError,
      error: tx.error,
      invalidId: tx.invalidId,
      notFound: tx.notFound,
      search,
      searchByAll,
      clear,
      matchedAitIds,
      showTableView,
      selectedAitId,
      showTable,
      hideTable,
      showAmountSearchResults,
      amountSearchParams,
      showAmountResults,
      hideAmountResults,
      isTableLoading,
    };
  }, [
    active,
    tx,
    search,
    searchByAll,
    clear,
    matchedAitIds,
    showTableView,
    selectedAitId,
    showTable,
    hideTable,
    showAmountSearchResults,
    amountSearchParams,
    showAmountResults,
    hideAmountResults,
    isTableLoading,
  ]);

  return (
    <TransactionUsWiresSearchContext.Provider value={value}>
      {children}
    </TransactionUsWiresSearchContext.Provider>
  );
}

export function useTransactionSearchUsWiresContext() {
  const ctx = useContext(TransactionUsWiresSearchContext);
  if (!ctx) {
    throw new Error(
      'useTransactionSearchContext must be used within TransactionSearchProvider'
    );
  }
  return ctx;
}
