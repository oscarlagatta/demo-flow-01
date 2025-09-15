"use client"

import type React from "react"
import { createContext, useContext, useMemo } from "react"
import { TransactionUsWiresSearchProvider } from "./us-wires/us-wires-transaction-search-provider"

// Registry of available country providers
export interface CountryProvider {
  countryCode: string
  name: string
  Provider: React.ComponentType<{ children: React.ReactNode }>
  useContext: () => any
}

// Registry configuration
const COUNTRY_PROVIDERS: Record<string, CountryProvider> = {
  "us-wires": {
    countryCode: "US",
    name: "US Wires",
    Provider: TransactionUsWiresSearchProvider,
    useContext: () => {
      // Dynamic import to avoid circular dependencies
      const { useTransactionSearchUsWiresContext } = require("./us-wires/us-wires-transaction-search-provider")
      return useTransactionSearchUsWiresContext()
    },
  },
  // Future providers can be added here
  // 'india': {
  //   countryCode: 'IN',
  //   name: 'India Payments',
  //   Provider: TransactionIndiaSearchProvider,
  //   useContext: useTransactionSearchIndiaContext,
  // },
}

// Provider registry context
interface ProviderRegistryContextValue {
  availableProviders: CountryProvider[]
  getProvider: (countryCode: string) => CountryProvider | undefined
  isProviderAvailable: (countryCode: string) => boolean
}

const ProviderRegistryContext = createContext<ProviderRegistryContextValue | null>(null)

// Multi-provider wrapper that can compose multiple country providers
export function PaymentHealthProviderRegistry({
  children,
  enabledCountries = ["us-wires"], // Default to US Wires only
}: {
  children: React.ReactNode
  enabledCountries?: string[]
}) {
  const registryValue = useMemo<ProviderRegistryContextValue>(
    () => ({
      availableProviders: enabledCountries.map((code) => COUNTRY_PROVIDERS[code]).filter(Boolean),
      getProvider: (countryCode: string) =>
        COUNTRY_PROVIDERS[enabledCountries.find((code) => COUNTRY_PROVIDERS[code]?.countryCode === countryCode) || ""],
      isProviderAvailable: (countryCode: string) =>
        enabledCountries.some((code) => COUNTRY_PROVIDERS[code]?.countryCode === countryCode),
    }),
    [enabledCountries],
  )

  // Compose all enabled providers
  const ComposedProviders = useMemo(() => {
    return registryValue.availableProviders.reduce(
      (AccumulatedProvider, { Provider }) =>
        ({ children }: { children: React.ReactNode }) => (
          <AccumulatedProvider>
            <Provider>{children}</Provider>
          </AccumulatedProvider>
        ),
      ({ children }: { children: React.ReactNode }) => <>{children}</>,
    )
  }, [registryValue.availableProviders])

  return (
    <ProviderRegistryContext.Provider value={registryValue}>
      <ComposedProviders>{children}</ComposedProviders>
    </ProviderRegistryContext.Provider>
  )
}

// Hook to access the provider registry
export function useProviderRegistry() {
  const context = useContext(ProviderRegistryContext)
  if (!context) {
    throw new Error("useProviderRegistry must be used within PaymentHealthProviderRegistry")
  }
  return context
}

// Hook to get a specific country's transaction search context
export function useCountryTransactionSearch(countryCode: string) {
  const registry = useProviderRegistry()
  const provider = registry.getProvider(countryCode)

  if (!provider) {
    throw new Error(`No provider available for country: ${countryCode}`)
  }

  return provider.useContext()
}
