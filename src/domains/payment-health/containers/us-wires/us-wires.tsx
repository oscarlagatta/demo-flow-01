import { TransactionUsWiresSearchProvider } from "@/domains/payment-health/providers/us-wires/us-wires-transaction-search-provider"
import { FlowDiagramUsWires } from "@/domains/payment-health/components/flow/diagrams/flow-diagrams/flow-diagram-us-wires/flow-diagram-us-wires"

interface UsWiresProps {
  isMonitorMode?: boolean
}

function UsWires({ isMonitorMode = false }: UsWiresProps) {
  return (
    <TransactionUsWiresSearchProvider>
      <div className="flow-compact flex h-full min-h-0 w-full flex-col space-y-6 pt-0 pl-4 shadow-sm">
        <FlowDiagramUsWires isMonitorMode={isMonitorMode} />
      </div>
    </TransactionUsWiresSearchProvider>
  )
}

export default UsWires
