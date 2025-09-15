'use client';

import type React from 'react';
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from 'react';

import { BaseSearchParams, BaseTransactionSearchState, BaseUIState } from '@/domains/payment-health/types/base-transaction-search';
import { ApiError } from '@/domains/payment-health/types/api-error';

export interface BaseTransactionSearchContextValue<TResult = any, TSearchParams extends BaseSearchParams = BaseSearchParams> 
  extends BaseTransactionSearchState<TResult, TSearchParams>, BaseUIState {
  // Additional derived state
  matchedAitIds: Set<string>;
}

export function createTransactionSearchProvider<TResult = any, TSearchParams extends BaseSearchParams = BaseSearchParams>(
  contextName: string,
  useSearchHook: (params: TSearchParams) => {
    id: string;
    searchParams: TSearchParams;
    results?: TResult;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    error?: ApiError | null;
    invalidId: boolean;
    notFound: boolean;
    searchById: (id: string) => void;
    searchByAll: (params: TSearchParams) => void;
    reset: () => void;
  },
  extractAitIds: (results?: TResult) => Set<string> = () => new Set()
) {
  const Context = createContext<BaseTransactionSearchContextValue<TResult, TSearchParams> | null>(null);

  function Provider({ children }: { children: React.ReactNode }) {
    // UI state management
    const [showTableView, setShowTableView] = useState(false);
    const [selectedAitId, setSelectedAitId] = useState<string | null>(null);
    const [isTableLoading, setIsTableLoading] = useState(false);

    // Use the provided search hook
    const searchHook = useSearchHook({} as TSearchParams);

    // Core search actions
    const search = useCallback(
      (id: string) => {
        if (!id) return;
        searchHook.searchById(id);
      },
      [searchHook]
    );

    const searchByAll = useCallback(
      (params: TSearchParams) => {
        searchHook.searchByAll(params);
      },
      [searchHook]
    );

    const clear = useCallback(() => {
      setShowTableView(false);
      setSelectedAitId(null);
      setIsTableLoading(false);
      searchHook.reset();
    }, [searchHook]);

    // Derived state
    const active = useMemo(() => {
      const hasSearchParams = Object.values(searchHook.searchParams).some(value => !!value);
      return hasSearchParams && (searchHook.isLoading || searchHook.isFetching || !!searchHook.results);
    }, [searchHook.searchParams, searchHook.isLoading, searchHook.isFetching, searchHook.results]);

    const matchedAitIds = useMemo(() => {
      if (!active || !searchHook.results) return new Set<string>();
      return extractAitIds(searchHook.results);
    }, [active, searchHook.results, extractAitIds]);

    // UI actions
    const showTable = useCallback((aitId: string) => {
      setIsTableLoading(true);
      setSelectedAitId(aitId);

      requestAnimationFrame(() => {
        setShowTableView(true);
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

    const value = useMemo<BaseTransactionSearchContextValue<TResult, TSearchParams>>(() => ({
      // Core search state
      active,
      id: searchHook.id,
      searchParams: searchHook.searchParams,
      results: searchHook.results,
      isLoading: searchHook.isLoading,
      isFetching: searchHook.isFetching,
      isError: searchHook.isError,
      error: searchHook.error,
      invalidId: searchHook.invalidId,
      notFound: searchHook.notFound,
      search,
      searchByAll,
      clear,
      
      // UI state
      showTableView,
      selectedAitId,
      isTableLoading,
      showTable,
      hideTable,
      
      // Derived state
      matchedAitIds,
    }), [
      active,
      searchHook,
      search,
      searchByAll,
      clear,
      showTableView,
      selectedAitId,
      isTableLoading,
      showTable,
      hideTable,
      matchedAitIds,
    ]);

    return (
      <Context.Provider value={value}>
        {children}
      </Context.Provider>
    );
  }

  function useContext() {
    const ctx = useContext(Context);
    if (!ctx) {
      throw new Error(`useContext must be used within ${contextName}Provider`);
    }
    return ctx;
  }

  return { Provider, useContext };
}
