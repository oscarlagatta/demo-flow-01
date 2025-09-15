import type { CountrySearchConfig } from "@/domains/payment-health/types/base-transaction-search"

const INDIA_ID_REGEX = /^[A-Z0-9]{12}$/ // Example: India might use 12-character IDs

function mapIndiaStatus(code?: string): string {
  switch ((code || "").toUpperCase()) {
    case "S":
      return "Success"
    case "F":
      return "Failed"
    case "P":
      return "Processing"
    default:
      return "Processing"
  }
}

function buildIndiaSummary(searchKey: string, results: any[]): any {
  // India-specific summary building logic
  const first = results[0]
  return {
    id: searchKey,
    status: mapIndiaStatus(first?.status_code),
    amount: Number.parseFloat(first?.amount || "0"),
    currency: first?.currency || "INR",
    date: first?.transaction_date || new Date().toISOString(),
    reference: first?.reference_number || searchKey,
    source: first?.source_system || "UPI",
    counterpartyCountry: "IN",
    metadata: {
      upiId: first?.upi_id || "",
      bankCode: first?.bank_code || "",
      merchantId: first?.merchant_id || "",
    },
  }
}

export const indiaConfig: CountrySearchConfig = {
  countryCode: "IN",
  idRegex: INDIA_ID_REGEX,
  searchEndpoints: {
    byId: "/api/v2/india-payments/get-transaction-details",
    byAmount: "/api/v2/india-payments/get-transaction-details-by-amount",
  },
  transformers: {
    mapStatus: mapIndiaStatus,
    buildSummary: buildIndiaSummary,
  },
}

// Helper function to extract relevant IDs from India results
export function extractIndiaAitIds(results?: any[]): Set<string> {
  const set = new Set<string>()
  if (!results?.length) return set

  for (const detail of results) {
    if (detail?.system_id) {
      set.add(detail.system_id)
    }
  }
  return set
}
