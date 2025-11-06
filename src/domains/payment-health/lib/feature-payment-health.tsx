"use client"
import { useState } from "react"
import PaymentHealthDashboard from "@/domains/payment-health/containers/payment-health-dashboard/payment-health-dashboard"
import UsWires from "@/domains/payment-health/containers/us-wires/us-wires"
import { TransactionUsWiresSearchProvider } from "@/domains/payment-health/providers/us-wires/us-wires-transaction-search-provider"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  type LucideIcon,
  Home,
  NotebookText,
  DollarSign,
  JapaneseYen,
  IndianRupee,
  Banknote,
  Coins,
  CircleDollarSign,
  PanelLeftOpen,
  PanelRightOpen,
  Search,
  Activity,
  Globe,
  ChevronDown,
  ChevronRight,
  MapPin,
  Zap,
  Building2,
} from "lucide-react"

const mainPageItems: {
  id: string
  title: string
  subtitle: string
  Icon: LucideIcon
}[] = [
  {
    id: "payment-health",
    title: "Payment Health Services",
    subtitle: "Health monitoring",
    Icon: Home,
  },
  {
    id: "intix-payment-tracker",
    title: "INTIX Payment Tracker",
    subtitle: "Tool for correlation and reporting",
    Icon: NotebookText,
  },
]

const amrsRegions: {
  id: string
  title: string
  subtitle: string
  Icon: LucideIcon
}[] = [
  {
    id: "us-wires",
    title: "US Wires",
    subtitle: "US Wire Transfer FLOW",
    Icon: DollarSign,
  },
  {
    id: "us-rtp",
    title: "US RTP",
    subtitle: "Real-Time Payments FLOW",
    Icon: Zap,
  },
  {
    id: "us-ach",
    title: "US ACH",
    subtitle: "Automated Clearing House FLOW",
    Icon: Building2,
  },
  {
    id: "canada",
    title: "Canada",
    subtitle: "Canadian Payment FLOW",
    Icon: MapPin,
  },
]

const latamCountries: {
  id: string
  title: string
  subtitle: string
  Icon: LucideIcon
}[] = [
  {
    id: "brazil",
    title: "Brazil",
    subtitle: "Brazil Payment FLOW",
    Icon: Banknote,
  },
  {
    id: "mexico",
    title: "Mexico",
    subtitle: "Mexico Payment FLOW",
    Icon: Coins,
  },
  {
    id: "argentina",
    title: "Argentina",
    subtitle: "Argentina Payment FLOW",
    Icon: CircleDollarSign,
  },
  {
    id: "chile",
    title: "Chile",
    subtitle: "Chile Payment FLOW",
    Icon: DollarSign,
  },
]

const apacCountries: {
  id: string
  title: string
  subtitle: string
  Icon: LucideIcon
}[] = [
  {
    id: "china",
    title: "China",
    subtitle: "China Payment FLOW",
    Icon: JapaneseYen,
  },
  {
    id: "india",
    title: "India",
    subtitle: "India Payment Flow",
    Icon: IndianRupee,
  },
  {
    id: "taiwan",
    title: "Taiwan",
    subtitle: "Taiwan Payment FLOW",
    Icon: Banknote,
  },
  {
    id: "malaysia",
    title: "Malaysia",
    subtitle: "Malaysia Payment FLOW",
    Icon: Coins,
  },
  {
    id: "korea",
    title: "Korea",
    subtitle: "Korea Payment FLOW",
    Icon: CircleDollarSign,
  },
]

type SecondaryBarProps = {
  selectedSubItem: string
  onSubItemSelected: (subItem: string) => void
  isVisible: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
  usWiresMode: "track-trace" | "observability"
  onUSWiresModeChange: (mode: "track-trace" | "observability") => void
}

function SecondaryBar({
  selectedSubItem,
  onSubItemSelected,
  isVisible,
  isCollapsed,
  onToggleCollapse,
  usWiresMode,
  onUSWiresModeChange,
}: SecondaryBarProps) {
  const [isAmrsExpanded, setIsAmrsExpanded] = useState(false)
  const [isLatamExpanded, setIsLatamExpanded] = useState(false)
  const [isApacExpanded, setIsApacExpanded] = useState(false)

  if (!isVisible) {
    return null
  }

  return (
    <div
      className={cn(
        "border-border flex flex-col border border-r transition-all duration-300",
        "bg-white",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="border-border border-b p-4" data-tour="sidebar-navigation">
        <div className="flex items-center justify-between">
          {!isCollapsed && <h2 className="text-foreground text-lg font-semibold">Navigation</h2>}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="text-muted-foreground hover:bg-accent p-1"
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation Content */}
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {!isCollapsed && (
          <div>
            <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">MAIN PAGES</h3>
            <nav className="space-y-1">
              {mainPageItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSubItemSelected(item.id)}
                  className={`flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                    selectedSubItem === item.id ? "text-white shadow-md" : "text-foreground hover:bg-accent"
                  }`}
                  style={selectedSubItem === item.id ? { backgroundColor: "#104de8" } : undefined}
                >
                  <item.Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="mt-0.5 text-xs opacity-75">{item.subtitle}</div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        )}

        {!isCollapsed && (
          <div className="mb-3 space-y-3" data-tour="flow-diagrams">
            <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
              REGIONAL FLOWS
            </h3>
            <div className="mb-2 text-xs font-medium text-gray-700">View Mode</div>
            <div className="flex items-center rounded-md border bg-white p-0.5 shadow-sm">
              <button
                onClick={() => onUSWiresModeChange("track-trace")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-sm px-3 py-2 text-xs font-medium whitespace-nowrap transition-all ${
                  usWiresMode === "track-trace"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Search className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">Track</span>
              </button>
              <button
                onClick={() => onUSWiresModeChange("observability")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-sm px-3 py-2 text-xs font-medium whitespace-nowrap transition-all ${
                  usWiresMode === "observability"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Activity className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">Monitor</span>
              </button>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setIsAmrsExpanded(!isAmrsExpanded)}
                className="text-foreground hover:bg-accent flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors"
              >
                <Globe className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">AMRS</div>
                  <div className="mt-0.5 text-xs opacity-75">Americas Payment Flows</div>
                </div>
                {isAmrsExpanded ? (
                  <ChevronDown className="mt-1 h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0" />
                )}
              </button>

              {isAmrsExpanded && (
                <nav className="ml-4 space-y-1 border-l-2 border-gray-200 pl-2">
                  {amrsRegions.map((region) => (
                    <button
                      key={region.id}
                      onClick={() => onSubItemSelected(region.id)}
                      className={`flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                        selectedSubItem === region.id ? "text-white shadow-md" : "text-foreground hover:bg-accent"
                      }`}
                      style={selectedSubItem === region.id ? { backgroundColor: "#104de8" } : undefined}
                    >
                      <region.Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{region.title}</div>
                        <div className="mt-0.5 text-xs opacity-75">{region.subtitle}</div>
                      </div>
                    </button>
                  ))}

                  <div className="space-y-1">
                    <button
                      onClick={() => setIsLatamExpanded(!isLatamExpanded)}
                      className="text-foreground hover:bg-accent flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors"
                    >
                      <Globe className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">LATAM</div>
                        <div className="mt-0.5 text-xs opacity-75">Latin America</div>
                      </div>
                      {isLatamExpanded ? (
                        <ChevronDown className="mt-0.5 h-3 w-3 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0" />
                      )}
                    </button>

                    {isLatamExpanded && (
                      <nav className="ml-4 space-y-1 border-l-2 border-gray-200 pl-2">
                        {latamCountries.map((country) => (
                          <button
                            key={country.id}
                            onClick={() => onSubItemSelected(country.id)}
                            className={`flex w-full items-start gap-3 rounded-lg px-2 py-1.5 text-left transition-colors ${
                              selectedSubItem === country.id
                                ? "text-white shadow-md"
                                : "text-foreground hover:bg-accent"
                            }`}
                            style={selectedSubItem === country.id ? { backgroundColor: "#104de8" } : undefined}
                          >
                            <country.Icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium">{country.title}</div>
                              <div className="mt-0.5 text-[10px] opacity-75">{country.subtitle}</div>
                            </div>
                          </button>
                        ))}
                      </nav>
                    )}
                  </div>
                </nav>
              )}
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setIsApacExpanded(!isApacExpanded)}
                className="text-foreground hover:bg-accent flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors"
              >
                <Globe className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">APAC</div>
                  <div className="mt-0.5 text-xs opacity-75">Asia Pacific Payment Flows</div>
                </div>
                {isApacExpanded ? (
                  <ChevronDown className="mt-1 h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0" />
                )}
              </button>

              {isApacExpanded && (
                <nav className="ml-4 space-y-1 border-l-2 border-gray-200 pl-2">
                  {apacCountries.map((country) => (
                    <button
                      key={country.id}
                      onClick={() => onSubItemSelected(country.id)}
                      className={`flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                        selectedSubItem === country.id ? "text-white shadow-md" : "text-foreground hover:bg-accent"
                      }`}
                      style={selectedSubItem === country.id ? { backgroundColor: "#104de8" } : undefined}
                    >
                      <country.Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{country.title}</div>
                        <div className="mt-0.5 text-xs opacity-75">{country.subtitle}</div>
                      </div>
                    </button>
                  ))}
                </nav>
              )}
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="space-y-2">
            <button
              onClick={() => setIsAmrsExpanded(!isAmrsExpanded)}
              className="text-foreground hover:bg-accent flex w-full items-center justify-center rounded-lg px-3 py-2"
              title="AMRS"
            >
              <Globe className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsApacExpanded(!isApacExpanded)}
              className="text-foreground hover:bg-accent flex w-full items-center justify-center rounded-lg px-3 py-2"
              title="APAC"
            >
              <Globe className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function FeaturePaymentHealth() {
  const [selectedMainItem] = useState("e2e-monitor")
  const [selectedSubItem, setSelectedSubItem] = useState("e2e-monitor-us-wires")
  const [secondarySidebarCollapsed, setSecondarySidebarCollapsed] = useState(false)
  const [useWiresMode, setUSWiresMode] = useState<"track-trace" | "observability">("track-trace")

  const renderContent = () => {
    switch (selectedSubItem) {
      case "payment-health":
        return <PaymentHealthDashboard />
      case "us-wires":
        return <UsWires isMonitorMode={useWiresMode === "observability"} />
      case "us-rtp":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-4">US RTP Payment Flow</h2>
            <p className="text-muted-foreground">Real-Time Payments flow content is coming soon.</p>
          </div>
        )
      case "us-ach":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-4">US ACH Payment Flow</h2>
            <p className="text-muted-foreground">Automated Clearing House flow content is coming soon.</p>
          </div>
        )
      case "canada":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Canada Payment Flow</h2>
            <p className="text-muted-foreground">Canadian payment flow content is coming soon.</p>
          </div>
        )
      case "brazil":
      case "mexico":
      case "argentina":
      case "chile":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-4 capitalize">{selectedSubItem} Payment Flow</h2>
            <p className="text-muted-foreground">LATAM payment flow content is coming soon.</p>
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
    <TransactionUsWiresSearchProvider>
      <div className="flex min-h-screen w-full">
        <div className="flex flex-col">
          <SecondaryBar
            selectedSubItem={selectedSubItem}
            onSubItemSelected={setSelectedSubItem}
            isVisible={true}
            isCollapsed={secondarySidebarCollapsed}
            onToggleCollapse={() => setSecondarySidebarCollapsed(!secondarySidebarCollapsed)}
            usWiresMode={useWiresMode}
            onUSWiresModeChange={setUSWiresMode}
          />
        </div>
        <main className="bg-background flex flex-1 flex-col">{renderContent()}</main>
      </div>
    </TransactionUsWiresSearchProvider>
  )
}
