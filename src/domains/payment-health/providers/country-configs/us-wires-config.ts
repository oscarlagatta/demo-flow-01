import type { CountrySearchConfig } from "@/domains/payment-health/types/base-transaction-search"
import type {
  SplunkTransactionDetails,
  TransactionSummary,
  Raw,
} from "@/domains/payment-health/types/splunk-transaction"

const ID_REGEX = /^[A-Z0-9]{16}$/

function mapStatus(code?: string): TransactionSummary["status"] {
  switch ((code || "").toUpperCase()) {
    case "A":
      return "Approved"
    case "R":
      return "Rejected"
    case "P":
      return "Pending"
    default:
      return "Pending"
  }
}

function toNumber(value?: string): number {
  const n = Number.parseFloat((value || "").replace(/,/g, ""))
  return Number.isFinite(n) ? n : 0
}

function toIsoDate(raw: Raw): string {
  if (raw.REC_CRT_TS && !Number.isNaN(Date.parse(raw.REC_CRT_TS))) {
    return new Date(raw.REC_CRT_TS).toISOString()
  }
  const dateAlt = (raw.RQO_TRAN_DATE_ALT || "").trim()
  const timeAlt = (raw.RQO_TRAN_TIME_ALT || "").trim()
  const combined = `${dateAlt.split(" ")[0]}T${timeAlt}Z`
  if (!Number.isNaN(Date.parse(combined))) return new Date(combined).toISOString()

  const date = (raw.RQO_TRAN_DATE || "").trim().split(" ")[0]
  const time = (raw.RQO_TRAN_TIME || "").trim()
  const fallback = `${date}T${time}Z`
  return !Number.isNaN(Date.parse(fallback)) ? new Date(fallback).toISOString() : new Date().toISOString()
}

function buildSummary(searchKey: string, results: SplunkTransactionDetails): TransactionSummary {
  const first = results[0]?._raw as Raw | undefined
  const action = first?.RRR_ACTION_CODE
  const status = mapStatus(action)

  const currency = first?.AQQ_BILLING_CURR_CODE || first?.TPP_CURR_CODE || "USD"
  const amount = toNumber(first?.TBT_BILLING_AMT || first?.TPP_TRAN_AMT)

  const date = first ? toIsoDate(first) : new Date().toISOString()
  const reference = first?.TBT_REF_NUM || searchKey
  const source = first?.SMH_SOURCE || "Unknown"
  const counterpartyCountry = first?.TPP_CNTRY_CODE || first?.TPP_BANK_CNTRY_CODE || first?.XQO_CUST_CNTRY_CODE || "US"
  const score = first?.RRR_SCORE ? Number.parseInt(first.RRR_SCORE, 10) : undefined

  const metadata: Record<string, string | number | boolean> = {
    destination: first?.SMH_DEST || "",
    entryMethod: first?.DBA_ENTRY_METHOD || "",
    approvalType: first?.DBA_APPROVAL_TYPE_REQ || "",
    transactionType: first?.TBT_TRAN_TYPE || "",
    scheduleRef: first?.TBT_SCH_REF_NUM || "",
    approvedBy: first?.DBA_APPROVED_BY_USERID2 || "",
    correlationId: first?.BCC_CPS_CORRELATION || "",
    customerAccount: first?.AQQ_CUST_A_NUM || "",
  }

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
  }
}

export const usWiresConfig: CountrySearchConfig = {
  countryCode: "US",
  idRegex: ID_REGEX,
  searchEndpoints: {
    byId: "/api/v2/splunk-data/get-transaction-details",
    byAmount: "/api/v2/splunk-data/get-transaction-details-by-amount",
  },
  transformers: {
    mapStatus,
    buildSummary,
  },
}

// Helper function to extract AIT IDs from US Wires results
export function extractUsWiresAitIds(results?: SplunkTransactionDetails): Set<string> {
  const set = new Set<string>()
  if (!results?.length) return set

  for (const detail of results) {
    if (detail?.aitNumber) {
      set.add(detail.aitNumber)
    }
  }
  return set
}
