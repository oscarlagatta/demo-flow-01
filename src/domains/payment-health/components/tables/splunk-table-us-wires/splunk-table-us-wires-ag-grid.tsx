// checked
'use client';
import { useEffect, useMemo, useRef } from 'react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import type {
  ColDef,
  GridApi,
  ICellRendererParams,
  GridReadyEvent,
  ValueFormatterParams,
  CellClassParams,
} from '@ag-grid-community/core';
import { ModuleRegistry } from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { ColumnsToolPanelModule } from '@ag-grid-enterprise/column-tool-panel';
import { MenuModule } from '@ag-grid-enterprise/menu';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { ArrowLeft } from 'lucide-react';
// import { useAuthzRoles } from '@/0fo/auth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetSplunkUsWires } from '@/domains/payment-health/hooks/use-get-splunk-us-wires/use-get-splunk-us-wires';
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  SetFilterModule,
  ColumnsToolPanelModule,
  MenuModule,
]);
type ActionType = 'flow' | 'trend' | 'balanced';
interface SplunkAgGridProps {
  aitNum: string;
  action: ActionType;
  onBack: () => void;
}
function formatNumber(value: string | number | null | undefined, decimals = 0) {
  if (value === null || value === undefined) return '';
  const num = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (Number.isNaN(num)) return '';
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
function formatPercent(num: number, decimals = 2) {
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(decimals)}%`;
}
function directionFormatter(direction: string) {
  if (!direction) return '';
  return direction
    .toLowerCase()
    .split('_')
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}
function Pill({ ok, neutral }: { ok?: boolean; neutral?: boolean }) {
  const color = neutral ? 'bg-gray-400' : ok ? 'bg-green-600' : 'bg-red-500';
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${color}`}
      aria-hidden="true"
    />
  );
}
function TrafficCellRenderer(props: ICellRendererParams) {
  const v = props.value as 'Yes' | 'No' | null;
  if (v === 'Yes') {
    return (
      <div className="flex items-center gap-2">
        <Pill ok />
        <span className="text-foreground text-xs">Yes</span>
      </div>
    );
  }
  if (v === 'No') {
    return (
      <div className="flex items-center gap-2">
        <Pill />
        <span className="text-foreground text-xs">No</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Pill neutral />
      <span className="text-muted-foreground text-xs">N/A</span>
    </div>
  );
}
function OnTrendCellRenderer(props: ICellRendererParams) {
  const txt: string = String(props.value ?? '');
  const isOn = /on-trend/i.test(txt);
  const isOff = /off-trend/i.test(txt);
  if (isOn || isOff) {
    return (
      <div className="flex items-center gap-2">
        <Pill ok={isOn} />
        <span
          className={`text-xs ${isOn ? 'text-foreground' : 'text-foreground'}`}
        >
          {txt}
        </span>
      </div>
    );
  }
  return <span className="text-muted-foreground text-xs">{txt || '-'}</span>;
}
function AnalyticsContextRenderer(props: ICellRendererParams) {
  const txt: string = String(props.value ?? '');
  return <span className="text-xs text-red-600">{txt}</span>;
}
export default function SplunkTableUsWires({
  aitNum,
  action,
  onBack,
}: SplunkAgGridProps) {
  // const { hasRequiredRole } = useAuthzRoles();
  const isAuthorized: boolean = true; //hasRequiredRole();
  const { data, isLoading, isError } = useGetSplunkUsWires({
    enabled: false,
  });
  const quickFilter = '';
  const gridApiRef = useRef<GridApi | null>(null);
  const rows = useMemo(() => {
    if (!data) return [];
    return data.filter((r) => r.aiT_NUM === aitNum);
  }, [data, aitNum]);
  const rowData = useMemo(() => {
    return rows.map((r) => {
      const avg = Number.parseFloat(r.averagE_TRANSACTION_COUNT);
      const curr = Number.parseFloat(r.currenT_TRANSACTION_COUNT);
      const deltaPct =
        Number.isFinite(avg) && avg !== 0 ? ((curr - avg) / avg) * 100 : 0;
      const isOn = /on-trend/i.test(r.iS_TRAFFIC_ON_TREND || '');
      let analytics = '';
      if (!isOn && deltaPct < -10) {
        analytics = 'Current Volume is Statistically Low';
      }
      return {
        ...r,
        _deltaPct: deltaPct,
        _balanced: isOn,
        _onTrend: isOn
          ? `On-Trend (${formatPercent(Math.abs(deltaPct))})`
          : r.iS_TRAFFIC_ON_TREND || '',
        _analytics: analytics,
        _normDirection: directionFormatter(r.floW_DIRECTION),
      };
    });
  }, [rows]);
  const actionHighlightCols = useMemo(() => {
    if (action === 'flow')
      return new Set(['iS_TRAFFIC_FLOWING', 'currenT_TRANSACTION_COUNT']);
    if (action === 'trend')
      return new Set(['iS_TRAFFIC_ON_TREND', '_deltaPct']);
    return new Set<string>(['_balanced']);
  }, [action]);
  const numberCellClass = 'text-xs tabular-nums';
  const emphasized = 'bg-blue-50/60';
  const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
    const em = (field: string) => ({
      cellClass: (params: CellClassParams) =>
        actionHighlightCols.has(field)
          ? `${numberCellClass} ${emphasized}`
          : numberCellClass,
      headerClass: actionHighlightCols.has(field) ? emphasized : '',
    });
    return [
      {
        headerName: 'AIT Number',
        field: 'aIT_NUM',
        pinned: 'left',
        minWidth: 120,
        sortable: true,
        filter: false,
        cellStyle: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        },
      },
      {
        headerName: 'AIT Name',
        field: 'aIT_NAME',
        pinned: 'left',
        minWidth: 160,
        sortable: true,
        filter: false,
      },
      {
        headerName: 'Flow Direction',
        field: '_normDirection',
        minWidth: 150,
        sortable: true,
        filter: false,
      },
      {
        headerName: 'Flow AIT Number',
        field: 'floW_AIT_NUM',
        minWidth: 140,
        sortable: true,
        filter: false,
        cellStyle: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        },
      },
      {
        headerName: 'Flow AIT Name',
        field: 'flowW_AIT_NAME',
        minWidth: 160,
        sortable: true,
        filter: false,
      },
      {
        headerName: 'Is Traffic Flowing',
        field: 'iS_TRAFFIC_FLOWING',
        minWidth: 150,
        sortable: true,
        filter: false,
        cellRenderer: TrafficCellRenderer,
        headerClass: actionHighlightCols.has('iS_TRAFFIC_FLOWING')
          ? emphasized
          : '',
        cellStyle: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        },
      },
      {
        headerName: 'Is Traffic On Trend',
        field: 'iS_TRAFFIC_ON_TREND',
        minWidth: 170,
        sortable: true,
        filter: false,
        cellRenderer: OnTrendCellRenderer,
        headerClass: actionHighlightCols.has('iS_TRAFFIC_ON_TREND')
          ? emphasized
          : '',
        cellStyle: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        },
      },
      {
        headerName: 'Current Std Variation',
        field: 'currentT_STD_VARIATION',
        minWidth: 170,
        sortable: true,
        filter: false,
        ...em('currentT_STD_VARIATION'),
        valueFormatter: (params: ValueFormatterParams) =>
          formatNumber(params.value, 2),
        cellStyle: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        },
      },
      {
        headerName: 'Historic Mean',
        field: 'historiC_MEAN',
        minWidth: 140,
        sortable: true,
        filter: false,
        ...em('historiC_MEAN'),
        valueFormatter: (params: ValueFormatterParams) =>
          formatNumber(params.value, 2),
        cellStyle: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        },
      },
      {
        headerName: 'Historic Std Dev',
        field: 'historiC_STD',
        minWidth: 160,
        sortable: true,
        filter: false,
        ...em('historiC_STD'),
        valueFormatter: (params: ValueFormatterParams) =>
          formatNumber(params.value, 2),
        cellStyle: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        },
      },
      {
        headerName: 'Current Transaction Count',
        field: 'currenT_TRANSACTION_COUNT',
        minWidth: 200,
        sortable: true,
        filter: false,
        ...em('currenT_TRANSACTION_COUNT'),
        valueFormatter: (params: ValueFormatterParams) =>
          formatNumber(params.value),
        cellStyle: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        },
      },
      {
        headerName: 'Average Transaction Count',
        field: 'averagE_TRANSACTION_COUNT',
        minWidth: 200,
        sortable: true,
        filter: false,
        ...em('averagE_TRANSACTION_COUNT'),
        valueFormatter: (params: ValueFormatterParams) =>
          formatNumber(params.value, 2),
        cellStyle: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        },
      },
      {
        headerName: 'Average Transaction Delta',
        field: '_deltaPct',
        minWidth: 190,
        sortable: true,
        filter: false,
        ...em('_deltaPct'),
        valueFormatter: (params: ValueFormatterParams) =>
          formatPercent(params.value),
        cellStyle: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        },
      },
      {
        headerName: 'Balanced',
        field: '_balanced',
        minWidth: 150,
        sortable: true,
        filter: false,
        headerClass: actionHighlightCols.has('_balanced') ? emphasized : '',
      },
      {
        headerName: 'Analytics Context',
        field: '_analytics',
        minWidth: 220,
        sortable: true,
        filter: false,
        cellRenderer: AnalyticsContextRenderer,
      },
    ];
  }, [actionHighlightCols]);
  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: false,
      filter: true,
      resizable: true,
      flex: 1,
      minWidth: 120,
      suppressMenu: true,
    }),
    []
  );
  // ESC to go back
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack]);
  const onGridReady = (params: GridReadyEvent) => {
    gridApiRef.current = params.api;
    params.api.setGridOption('quickFilterText', quickFilter);
    // Fit columns after initial render
    setTimeout(() => {
      try {
        params.api.sizeColumnsToFit();
      } catch (error) {
        console.log(
          'Column fitting failed, will retry on grid size change',
          error
        );
      }
    }, 0);
  };
  const onGridSizeChanged = () => {
    gridApiRef.current?.sizeColumnsToFit();
  };
  // Keep quick filter in sync (if you later add a search box)
  useEffect(() => {
    gridApiRef.current?.setGridOption('quickFilterText', quickFilter);
  }, [quickFilter]);
  return (
    <div className="flex h-full w-full flex-col">
      <Card className="rounded-none border-b">
        <CardHeader className="px-4 py-3">
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={onBack}
                aria-label="Back to Flow Graph"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      <div className="ag-theme-quartz ag-grid-centered-headers w-full shadow-md">
        {isLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-6 w-60" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : isError ? (
          <div className="p-6">
            <p className="text-sm text-red-600">
              Failed to load data. Please try refreshing.
            </p>
          </div>
        ) : rowData.length === 0 ? (
          <div className="p-6">
            <p className="text-muted-foreground text-sm">
              No rows found for AIT {aitNum}.
            </p>
          </div>
        ) : (
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            onGridSizeChanged={onGridSizeChanged}
            suppressRowClickSelection
            suppressCellFocus
            tooltipShowDelay={300}
            domLayout="autoHeight"
            suppressColumnVirtualisation={true}
            tooltipMouseTrack
            pagination={true}
            paginationPageSize={10}
            paginationPageSizeSelector={[10, 20, 50, 200]}
            animateRows={true}
            onPaginationChanged={(params) => {
              const gridApi = params.api;
              const pageSize = gridApi.paginationGetPageSize();
              if (!pageSize) {
                gridApi.paginationGoToFirstPage(); // Ensure it starts with 10
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
// // checked

// 'use client';
// import { useEffect, useMemo, useRef } from 'react';
// import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
// import type {
//   ColDef,
//   GridApi,
//   ICellRendererParams,
// } from '@ag-grid-community/core';
// import { ModuleRegistry } from '@ag-grid-community/core';
// import { AgGridReact } from '@ag-grid-community/react';
// import 'ag-grid-community/styles/ag-grid.css';
// import 'ag-grid-community/styles/ag-theme-quartz.css';
// import { ColumnsToolPanelModule } from '@ag-grid-enterprise/column-tool-panel';
// import { MenuModule } from '@ag-grid-enterprise/menu';
// import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
// import { ArrowLeft } from 'lucide-react';
//
// // import { useAuthzRoles } from '@/0fo/auth';
//
// import { Button } from '@/components/ui/button';
// import { Card, CardHeader } from '@/components/ui/card';
// import { Skeleton } from '@/components/ui/skeleton';
//
// import { useGetSplunkUsWires } from '@/domains/payment-health/hooks/use-get-splunk-us-wires/use-get-splunk-us-wires';
//
// ModuleRegistry.registerModules([
//   ClientSideRowModelModule,
//   SetFilterModule,
//   ColumnsToolPanelModule,
//   MenuModule,
// ]);
//
// type ActionType = 'flow' | 'trend' | 'balanced';
//
// interface SplunkAgGridProps {
//   aitNum: string;
//   action: ActionType;
//   onBack: () => void;
// }
//
// function formatNumber(value: string | number | null | undefined, decimals = 0) {
//   if (value === null || value === undefined) return '';
//   const num = typeof value === 'string' ? Number.parseFloat(value) : value;
//   if (Number.isNaN(num)) return '';
//   return num.toLocaleString(undefined, {
//     minimumFractionDigits: decimals,
//     maximumFractionDigits: decimals,
//   });
// }
//
// function formatPercent(num: number, decimals = 2) {
//   const sign = num > 0 ? '+' : '';
//   return `${sign}${num.toFixed(decimals)}%`;
// }
//
// function directionFormatter(direction: string) {
//   if (!direction) return '';
//   return direction
//     .toLowerCase()
//     .split('_')
//     .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
//     .join(' ');
// }
//
// function Pill({ ok, neutral }: { ok?: boolean; neutral?: boolean }) {
//   const color = neutral ? 'bg-gray-400' : ok ? 'bg-green-600' : 'bg-red-500';
//   return (
//     <span
//       className={`inline-block h-2 w-2 rounded-full ${color}`}
//       aria-hidden="true"
//     />
//   );
// }
//
// function TrafficCellRenderer(props: ICellRendererParams) {
//   const v = props.value as 'Yes' | 'No' | null;
//   if (v === 'Yes') {
//     return (
//       <div className="flex items-center gap-2">
//         <Pill ok />
//         <span className="text-foreground text-xs">Yes</span>
//       </div>
//     );
//   }
//   if (v === 'No') {
//     return (
//       <div className="flex items-center gap-2">
//         <Pill />
//         <span className="text-foreground text-xs">No</span>
//       </div>
//     );
//   }
//   return (
//     <div className="flex items-center gap-2">
//       <Pill neutral />
//       <span className="text-muted-foreground text-xs">N/A</span>
//     </div>
//   );
// }
//
// function OnTrendCellRenderer(props: ICellRendererParams) {
//   const txt: string = String(props.value ?? '');
//   const isOn = /on-trend/i.test(txt);
//   const isOff = /off-trend/i.test(txt);
//   if (isOn || isOff) {
//     return (
//       <div className="flex items-center gap-2">
//         <Pill ok={isOn} />
//         <span
//           className={`text-xs ${isOn ? 'text-foreground' : 'text-foreground'}`}
//         >
//           {txt}
//         </span>
//       </div>
//     );
//   }
//   return <span className="text-muted-foreground text-xs">{txt || '-'}</span>;
// }
//
// function AnalyticsContextRenderer(props: ICellRendererParams) {
//   const txt: string = String(props.value ?? '');
//   return <span className="text-xs text-red-600">{txt}</span>;
// }
//
// export default function SplunkTableUsWires({
//   aitNum,
//   action,
//   onBack,
// }: SplunkAgGridProps) {
//   // const { hasRequiredRole } = useAuthzRoles();
//   const isAuthorized: boolean = true; //hasRequiredRole();
//
//   const { data, isLoading, isError } = useGetSplunkUsWires({
//     enabled: false,
//   });
//   const quickFilter = '';
//
//   const gridApiRef = useRef<GridApi | null>(null);
//
//   const rows = useMemo(() => {
//     if (!data) return [];
//     return data.filter((r) => r.aiT_NUM === aitNum);
//   }, [data, aitNum]);
//
//   const rowData = useMemo(() => {
//     return rows.map((r) => {
//       const avg = Number.parseFloat(r.averagE_TRANSACTION_COUNT);
//       const curr = Number.parseFloat(r.currenT_TRANSACTION_COUNT);
//       const deltaPct =
//         Number.isFinite(avg) && avg !== 0 ? ((curr - avg) / avg) * 100 : 0;
//       const isOn = /on-trend/i.test(r.iS_TRAFFIC_ON_TREND || '');
//       let analytics = '';
//       if (!isOn && deltaPct < -10) {
//         analytics = 'Current Volume is Statistically Low';
//       }
//       return {
//         ...r,
//         _deltaPct: deltaPct,
//         _balanced: isOn,
//         _onTrend: isOn
//           ? `On-Trend (${formatPercent(Math.abs(deltaPct))})`
//           : r.iS_TRAFFIC_ON_TREND || '',
//         _analytics: analytics,
//         _normDirection: directionFormatter(r.floW_DIRECTION),
//       };
//     });
//   }, [rows]);
//
//   const actionHighlightCols = useMemo(() => {
//     if (action === 'flow')
//       return new Set(['iS_TRAFFIC_FLOWING', 'currenT_TRANSACTION_COUNT']);
//     if (action === 'trend')
//       return new Set(['iS_TRAFFIC_ON_TREND', '_deltaPct']);
//     return new Set<string>(['_balanced']);
//   }, [action]);
//
//   const numberCellClass = 'text-xs tabular-nums';
//   const emphasized = 'bg-blue-50/60';
//
//   const columnDefs: ColDef[] = useMemo<ColDef[]>(() => {
//     const em = (field: string) => ({
//       cellClass: (p: any) =>
//         actionHighlightCols.has(field)
//           ? `${numberCellClass} ${emphasized}`
//           : numberCellClass,
//       headerClass: actionHighlightCols.has(field) ? emphasized : '',
//     });
//
//     return [
//       {
//         headerName: 'AIT Number',
//         field: 'aIT_NUM',
//         pinned: 'left',
//         minWidth: 120,
//         sortable: true,
//         filter: false,
//         cellStyle: {
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//         },
//       },
//       {
//         headerName: 'AIT Name',
//         field: 'aIT_NAME',
//         pinned: 'left',
//         minWidth: 160,
//         sortable: true,
//         filter: false,
//       },
//       {
//         headerName: 'Flow Direction',
//         field: '_normDirection',
//         minWidth: 150,
//         sortable: true,
//         filter: false,
//       },
//       {
//         headerName: 'Flow AIT Number',
//         field: 'floW_AIT_NUM',
//         minWidth: 140,
//         sortable: true,
//         filter: false,
//         cellStyle: {
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//         },
//       },
//       {
//         headerName: 'Flow AIT Name',
//         field: 'flowW_AIT_NAME',
//         minWidth: 160,
//         sortable: true,
//         filter: false,
//       },
//       {
//         headerName: 'Is Traffic Flowing',
//         field: 'iS_TRAFFIC_FLOWING',
//         minWidth: 150,
//         sortable: true,
//         filter: false,
//         cellRenderer: TrafficCellRenderer,
//         headerClass: actionHighlightCols.has('iS_TRAFFIC_FLOWING')
//           ? emphasized
//           : '',
//         cellStyle: {
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//         },
//       },
//       {
//         headerName: 'Is Traffic On Trend',
//         field: 'iS_TRAFFIC_ON_TREND',
//         minWidth: 170,
//         sortable: true,
//         filter: false,
//         cellRenderer: OnTrendCellRenderer,
//         headerClass: actionHighlightCols.has('iS_TRAFFIC_ON_TREND')
//           ? emphasized
//           : '',
//         cellStyle: {
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//         },
//       },
//       {
//         headerName: 'Current Std Variation',
//         field: 'currentT_STD_VARIATION',
//         minWidth: 170,
//         sortable: true,
//         filter: false,
//         ...em('currentT_STD_VARIATION'),
//         valueFormatter: (p: any) => formatNumber(p.value, 2),
//         cellStyle: {
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//         },
//       },
//       {
//         headerName: 'Historic Mean',
//         field: 'historiC_MEAN',
//         minWidth: 140,
//         sortable: true,
//         filter: false,
//         ...em('historiC_MEAN'),
//         valueFormatter: (p: any) => formatNumber(p.value, 2),
//         cellStyle: {
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//         },
//       },
//       {
//         headerName: 'Historic Std Dev',
//         field: 'historiC_STD',
//         minWidth: 160,
//         sortable: true,
//         filter: false,
//         ...em('historiC_STD'),
//         valueFormatter: (p: any) => formatNumber(p.value, 2),
//         cellStyle: {
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//         },
//       },
//       {
//         headerName: 'Current Transaction Count',
//         field: 'currenT_TRANSACTION_COUNT',
//         minWidth: 200,
//         sortable: true,
//         filter: false,
//         ...em('currenT_TRANSACTION_COUNT'),
//         valueFormatter: (p: any) => formatNumber(p.value),
//         cellStyle: {
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//         },
//       },
//       {
//         headerName: 'Average Transaction Count',
//         field: 'averagE_TRANSACTION_COUNT',
//         minWidth: 200,
//         sortable: true,
//         filter: false,
//         ...em('averagE_TRANSACTION_COUNT'),
//         valueFormatter: (p: any) => formatPercent(p.value),
//         cellStyle: {
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//         },
//       },
//       {
//         headerName: 'Average Transaction Delta',
//         field: '_deltaPct',
//         minWidth: 190,
//         sortable: true,
//         filter: false,
//         ...em('_deltaPct'),
//         valueFormatter: (p: any) => formatPercent(p.value),
//         cellStyle: {
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//         },
//       },
//       {
//         headerName: 'Balanced',
//         field: '_balanced',
//         minWidth: 150,
//         sortable: true,
//         filter: false,
//         headerClass: actionHighlightCols.has('_balanced') ? emphasized : '',
//       },
//       {
//         headerName: 'Analytics Context',
//         field: '_analytics',
//         minWidth: 220,
//         sortable: true,
//         filter: false,
//         cellRenderer: AnalyticsContextRenderer,
//       },
//     ];
//   }, [actionHighlightCols]);
//
//   const defaultColDef = useMemo<ColDef>(
//     () => ({
//       sortable: false,
//       filter: true,
//       resizable: true,
//       flex: 1,
//       minWidth: 120,
//       suppressMenu: true,
//     }),
//     []
//   );
//
//   // ESC to go back
//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if (e.key === 'Escape') onBack();
//     };
//     window.addEventListener('keydown', onKey);
//     return () => window.removeEventListener('keydown', onKey);
//   }, [onBack]);
//
//   const onGridReady = (params: any) => {
//     gridApiRef.current = params.api;
//     params.api.setGridOption('quickFilterText', quickFilter);
//     // Fit columns after initial render
//     setTimeout(() => {
//       try {
//         params.api.sizeColumnsToFit();
//       } catch (error) {
//         console.log(
//           'Column fitting failed, will retyr on grid size change',
//           error
//         );
//       }
//     }, 0);
//   };
//
//   const onGridSizeChanged = () => {
//     gridApiRef.current?.sizeColumnsToFit();
//   };
//
//   // Keep quick filter in sync (if you later add a search box)
//   useEffect(() => {
//     gridApiRef.current?.setGridOption('quickFilterText', quickFilter);
//   }, [quickFilter]);
//
//   return (
//     <div className="flex h-full w-full flex-col">
//       <Card className="rounded-none border-b">
//         <CardHeader className="px-4 py-3">
//           <div className="flex w-full items-center justify-between gap-3">
//             <div className="flex items-center gap-2">
//               <Button
//                 size="sm"
//                 onClick={onBack}
//                 aria-label="Back to Flow Graph"
//               >
//                 <ArrowLeft className="mr-1 h-4 w-4" />
//                 Back
//               </Button>
//             </div>
//           </div>
//         </CardHeader>
//       </Card>
//
//       <div className="ag-theme-quartz ag-grid-centered-headers w-full shadow-md">
//         {isLoading ? (
//           <div className="space-y-2 p-4">
//             <Skeleton className="h-6 w-60" />
//             <Skeleton className="h-96 w-full" />
//           </div>
//         ) : isError ? (
//           <div className="p-6">
//             <p className="text-sm text-red-600">
//               Failed to load data. Please try refreshing.
//             </p>
//           </div>
//         ) : rowData.length === 0 ? (
//           <div className="p-6">
//             <p className="text-muted-foreground text-sm">
//               No rows found for AIT {aitNum}.
//             </p>
//           </div>
//         ) : (
//           <AgGridReact
//             rowData={rowData}
//             columnDefs={columnDefs}
//             defaultColDef={defaultColDef}
//             onGridReady={onGridReady}
//             onGridSizeChanged={onGridSizeChanged}
//             suppressRowClickSelection
//             suppressCellFocus
//             tooltipShowDelay={300}
//             domLayout="autoHeight"
//             suppressColumnVirtualisation={true}
//             tooltipMouseTrack
//             pagination={true}
//             paginationPageSize={10}
//             paginationPageSizeSelector={[10, 20, 50, 200]}
//             animateRows={true}
//             onPaginationChanged={(params) => {
//               const gridApi = params.api;
//               const pageSize = gridApi.paginationGetPageSize();
//               if (!pageSize) {
//                 gridApi.paginationGoToFirstPage(); // Ensure it starts with 10
//               }
//             }}
//           />
//         )}
//       </div>
//     </div>
//   );
// }
