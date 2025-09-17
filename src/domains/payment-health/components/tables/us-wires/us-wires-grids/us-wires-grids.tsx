"use client"

import { useMemo, useState } from "react"
import { Loader2, X } from "lucide-react"

import { AgGridReact } from "@ag-grid-community/react"
import "@ag-grid-community/styles/ag-grid.css"
import "@ag-grid-community/styles/ag-theme-quartz.css"

import usWiresData from "../../../../assets/flow-data-us-wires/us-wires-data.json"

import { useGetSplunkUsWires } from "../../../../hooks/use-get-splunk-us-wires/use-get-splunk-us-wires"

import { directionFormatter, formatNumber, formatPercent } from "../../../../utils/formatters"

const AIT_URL_MAPPING: Record<string, string> = {
  "48581": "https://splunk.bankofamerica.com/en-US/app/gbam_home/us_wire_trend_dashboard_-_origination",
  "41107": "https://splunk.bankofamerica.com/en-US/app/gbam_home/us_wire_trend_dashboard_-_origination",
  "71800": "https://splunk.bankofamerica.com/en-US/app/gbam_home/us_wire_trend_dashboard_-_origination",
  "54071": "https://splunk.bankofamerica.com/en-US/app/gbam_home/us_wire_trend_dashboard_-_swift",
  "2119":
    "https://splunk.bankofamerica.com/en-US/app/gbam_home/us_wire_trend_dashboard_-_payment_validation_and_routing",
  "79109":
    "https://splunk.bankofamerica.com/en-US/app/gbam_home/us_wire_trend_dashboard_-_payment_validation_cashpro_payments_v2",
  "34257":
    "https://splunk.bankofamerica.com/en-US/app/gbam_home/us_wire_trend_dashboard_-_payment_validation_and_routing",
  "31427": "https://splunk.bankofamerica.com/en-US/app/gbam_home/e2e_mrp_rpi_trend",
  "5679": "https://splunk.bankofamerica.com/en-US/app/gbam_home/e2e_mrp_rpi_trend",
  "20473": "https://splunk.bankofamerica.com/en-US/app/gbam_home/us_wire_trend_dashboard_-_payment_processing",
  "46951": "https://splunk.bankofamerica.com/en-US/app/gbam_home/us_wire_trend_dashboard_-_payment_processing",
  "63591": "https://splunk.bankofamerica.com/en-US/app/gbam_home/us_wire_trend_dashboard_-_payment_processing",
  "1921": "https://splunk.bankofamerica.com/en-US/app/gbam_home/e2e_wtx_trend_dashboard",
  "882": "https://splunk.bankofamerica.com/en-US/app/gbam_home/e2e_wtx_trend_dashboard",
}

const UsWiresGrids = () => {
  const { data: splunkData, isLoading, isError } = useGetSplunkUsWires()
  const [iFrameData, setIFrameData] = useState<{ url: string; title: string } | null>(null)

  const groupedNodes = useMemo(() => {
    const nodes = usWiresData.nodes || []
    return nodes.reduce(
      (acc, node) => {
        const group = node.class || "unknown"
        if (!acc[group]) acc[group] = []
        acc[group].push(node.id)
        return acc
      },
      {} as Record<string, string[]>,
    )
  }, [])

  const groupedData = useMemo(() => {
    if (!splunkData) return {}
    return Object.entries(groupedNodes).reduce(
      (acc, [className, ids]) => {
        acc[className] = splunkData.filter((item) => ids.includes(item.aiT_NUM))
        return acc
      },
      {} as Record<string, any[]>,
    )
  }, [splunkData, groupedNodes])

  const columnDefs = useMemo(
    () => [
      {
        headerName: "AIT Number",
        field: "aiT_NUM",
        minWidth: 120,
        cellStyle: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
      },
      {
        headerName: "AIT Name",
        field: "aiT_NAME",
        minWidth: 160,
        cellRenderer: (params: any) => {
          const aitNumber = params.data.aiT_NUM
          const aitName = params.value
          const url = AIT_URL_MAPPING[aitNumber]

          if (url) {
            return (
              <button
                onClick={() => setIFrameData({ url, title: aitName })}
                className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors duration-200 cursor-pointer bg-transparent border-none p-0"
              >
                {aitName}
              </button>
            )
          }

          return <span className="font-medium">{aitName}</span>
        },
        cellStyle: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
      },
      { headerName: "Flow Direction", field: "_normDirection", minWidth: 150 },
      {
        headerName: "Is Traffic Flowing",
        field: "iS_TRAFFIC_FLOWING",
        minWidth: 150,
        cellClassRules: {
          "bg-[rgb(0,146,35)] text-white font-semibold": (params: any) => params.value === "Yes",
          "bg-[rgb(230,22,34)] text-white font-semibold": (params: any) => params.value === "No",
        },
        cellStyle: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
      },
      {
        headerName: "Is Traffic On Trend",
        field: "_balanced",
        minWidth: 150,
        cellClassRules: {
          "bg-[rgb(0,146,35)] text-white font-semibold": (params: any) => /on-trend/i.test(params.value),
          "bg-[rgb(230,22,34)] text-white font-semibold": (params: any) => /off-trend/i.test(params.value),
          "bg-[rgb(234,118,0)] text-white font-semibold": (params: any) => /approaching-trend/i.test(params.value),
        } as Record<string, (params: any) => boolean>,
      },
      {
        headerName: "Current Transaction Count",
        field: "currenT_TRANSACTION_COUNT",
        minWidth: 200,
        valueFormatter: (p: { value: any }) => formatNumber(p.value),
      },
      {
        headerName: "Average Transaction Count",
        field: "averagE_TRANSACTION_COUNT",
        minWidth: 200,
        valueFormatter: (p: { value: any }) => formatNumber(p.value),
      },
      {
        headerName: "Average Transaction Delta",
        field: "_deltaPct",
        minWidth: 190,
        valueFormatter: (p: { value: any }) => formatPercent(p.value),
      },
      {
        headerName: "Analytics Context",
        field: "_analytics",
        minWidth: 220,
      },
    ],
    [],
  )

  const closeIFrame = () => {
    setIFrameData(null)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Loading data, please wait...</p>
      </div>
    )
  }

  if (isError) {
    return <p>Error loading data.</p>
  }

  return (
    <div className="space-y-6">
      {iFrameData && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">{iFrameData.title}</h2>
              <button
                onClick={closeIFrame}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 p-4">
              <iframe
                src={iFrameData.url}
                className="w-full h-full border-0 rounded"
                title={iFrameData.title}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          </div>
        </div>
      )}

      {Object.entries(groupedData).map(([className, data]: [string, any[]]) => {
        return (
          <div key={className}>
            <h3 className="mb-2 text-lg font-semibold">
              {className
                .toLowerCase()
                .split(" ")
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </h3>

            <div className="ag-theme-quartz w-full shadow-md">
              <AgGridReact
                rowData={data.map((r: any) => ({
                  ...r,
                  _deltaPct:
                    Number.isFinite(r.averagE_TRANSACTION_COUNT) && r.averagE_TRANSACTION_COUNT !== 0
                      ? ((r.currenT_TRANSACTION_COUNT - r.averagE_TRANSACTION_COUNT) / r.averagE_TRANSACTION_COUNT) *
                        100
                      : 0,
                  _balanced: /on-trend/i.test(r.iS_TRAFFIC_ON_TREND || "")
                    ? "On-Trend"
                    : /approaching-trend/i.test(r.iS_TRAFFIC_ON_TREND || "")
                      ? "Approaching-Trend"
                      : "Off-Trend",
                  _analytics: /on-trend/i.test(r.iS_TRAFFIC_ON_TREND || "")
                    ? ""
                    : "Current Volume is Statistically Low",
                  _normDirection: directionFormatter(r.floW_DIRECTION),
                }))}
                columnDefs={columnDefs}
                defaultColDef={{
                  sortable: true,
                  filter: true,
                  resizable: true,
                  flex: 1,
                  minWidth: 120,
                }}
                domLayout="autoHeight"
                pagination={true}
                paginationPageSize={10}
                paginationPageSizeSelector={[10, 20, 50]}
                animateRows={true}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default UsWiresGrids
