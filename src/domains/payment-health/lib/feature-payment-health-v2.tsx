"use client"
import { useState } from "react"
import { useMemo } from "react"

import PaymentHealthDashboard from "@/domains/payment-health/containers/payment-health-dashboard/payment-health-dashboard"
import UsWires from "@/domains/payment-health/containers/us-wires/us-wires"
import { PaymentHealthProviderRegistry } from "@/domains/payment-health/providers/provider-registry"

export function FeaturePaymentHealthV2() {
  const [selectedMainItem] = useState("e2e-monitor")
  const [selectedSubItem, setSelectedSubItem] = useState("e2e-monitor-us-wires")
  const [secondarySidebarCollapsed, setSecondarySidebarCollapsed] = useState(false)
  const [useWiresMode, setUSWiresMode] = useState<"track-trace" | "observability">("track-trace")

  // Determine which countries to enable based on selected features
  const enabledCountries = useMemo(() => {
    const countries = ["us-wires"] // Always include US Wires

    // Add other countries based on selection
    if (["india", "china", "taiwan", "malaysia", "korea"].includes(selectedSubItem)) {
      countries.push("india") // Example: enable India provider when APAC countries are selected
    }

    return countries
  }, [selectedSubItem])

  const renderContent = () => {
    switch (selectedSubItem) {
      case "payment-health":
        return <PaymentHealthDashboard />
      case "us-wires":
        return <UsWires isMonitorMode={useWiresMode === "observability"} />
      case "india":
        // Future: return <IndiaPayments />
        return (
          <div className="p-6">
            <p className="text-muted-foreground">India payment flow coming soon.</p>
          </div>
        )
      default:
        return (
          <div className="p-6">
            <p className="text-muted-foreground">Content for this section is coming soon.</p>
          </div>
        )
    }
  }

  return (
    <PaymentHealthProviderRegistry enabledCountries={enabledCountries}>
      <div className="flex min-h-screen w-full">
        <div className="flex flex-col">{/* ... existing SecondaryBar code ... */}</div>
        <main className="bg-background flex flex-1 flex-col">{renderContent()}</main>
      </div>
    </PaymentHealthProviderRegistry>
  )
}
