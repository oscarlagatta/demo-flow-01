export interface BaseSearchParams {
  transactionId?: string
  transactionAmount?: string
  dateStart?: string
  dateEnd?: string
  // Extensible for country-specific parameters
  [key: string]: string | undefined
}

export interface BaseTransactionSearchState<TResult = any, TSearchParams extends BaseSearchParams = BaseSearchParams> {
  // Core search state
  active: boolean
  id: string
  searchParams: TSearchParams
  results?: TResult

  // Async state
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  error?: Error | null

  // Validation state
  invalidId: boolean
  notFound: boolean

  // Core actions
  search: (id: string) => void
  searchByAll: (params: TSearchParams) => void
  clear: () => void
}

export interface BaseUIState {
  // Table management
  showTableView: boolean
  selectedAitId: string | null
  isTableLoading: boolean

  // View state actions
  showTable: (aitId: string) => void
  hideTable: () => void
}

// Country-specific extensions
export interface CountrySearchConfig {
  countryCode: string
  idRegex: RegExp
  searchEndpoints: {
    byId: string
    byAmount: string
  }
  transformers: {
    mapStatus: (code?: string) => string
    buildSummary: (searchKey: string, results: any[]) => any
  }
}
