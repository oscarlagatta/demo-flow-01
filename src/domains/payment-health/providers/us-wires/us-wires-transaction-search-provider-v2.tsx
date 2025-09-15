"use client"

import React from "react"

import { createTransactionSearchProvider } from "@/domains/payment-health/providers/base/base-transaction-search-provider"
import { useTransactionUsWiresSearch } from "@/domains/payment-health/hooks/use-get-splunk-us-wires/use-transaction-us-wires-search"
import { extractUsWiresAitIds } from "@/domains/payment-health/providers/country-configs/us-wires-config"
import type { SplunkTransactionDetails } from "@/domains/payment-health/types/splunk-transaction"
import type { BaseSearchParams } from "@/domains/payment-health/types/base-transaction-search"

// US Wires specific search parameters
interface UsWiresSearchParams extends BaseSearchParams {
  transactionId?: string
  transactionAmount?: string
  dateStart?: string
  dateEnd?: string
}

// Enhanced context value with US Wires specific features
export interface UsWiresSearchContextValue {
  // Amount search specific state
  showAmountSearchResults: boolean
  amountSearchParams: {
    amount: string
    dateStart?: string
    dateEnd?: string
  } | null
  showAmountResults: (amount: string, dateStart?: string, dateEnd?: string) => void
  hideAmountResults: () => void
}

// Create the base provider
const { Provider: BaseProvider, useContext: useBaseContext } = createTransactionSearchProvider<
  SplunkTransactionDetails,
  UsWiresSearchParams
>("TransactionUsWiresSearch", useTransactionUsWiresSearch, extractUsWiresAitIds)

// Enhanced provider with US Wires specific features
export function TransactionUsWiresSearchProviderV2({ children }: { children: React.ReactNode }) {
  return (
    <BaseProvider>
      <UsWiresEnhancedProvider>{children}</UsWiresEnhancedProvider>
    </BaseProvider>
  )
}

// Internal provider for US Wires specific enhancements
function UsWiresEnhancedProvider({ children }: { children: React.ReactNode }) {
  const baseContext = useBaseContext()

  // US Wires specific state would be managed here
  // For now, we'll extend the base context

  return (
    <UsWiresEnhancedContext.Provider
      value={{
        ...baseContext,
        // Add US Wires specific methods here
      }}
    >
      {children}
    </UsWiresEnhancedContext.Provider>
  )
}

// Enhanced context for US Wires
const UsWiresEnhancedContext = React.createContext<any>(null)

// Export the enhanced hook
export function useTransactionSearchUsWiresContextV2() {
  const ctx = React.useContext(UsWiresEnhancedContext)
  if (!ctx) {
    throw new Error("useTransactionSearchUsWiresContextV2 must be used within TransactionUsWiresSearchProviderV2")
  }
  return ctx
}

// Keep the original hook for backward compatibility
export const useTransactionSearchUsWiresContext = useBaseContext
