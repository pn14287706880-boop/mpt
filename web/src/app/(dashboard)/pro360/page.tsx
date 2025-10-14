"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { AgGridReact } from "ag-grid-react"
import type {
  ColDef,
  GridReadyEvent,
  GridApi,
  ValueFormatterParams,
} from "ag-grid-community"
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community"
import { RotateCcw } from "lucide-react"

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule])

interface Pro360Data {
  CustomSolutionID: string
  TacticKey: string
  CampaignNickName: string
  TacticType: string
  yearmonth: string
  BillingType: string
  lme: number
  nlme: number
  lmx: number
  nlmx: number
  lmpv: number
  nlmpv: number
}

export default function Pro360Page() {
  const [data, setData] = useState<Pro360Data[]>([])
  const [loading, setLoading] = useState(true)
  const gridRef = useRef<AgGridReact<Pro360Data>>(null)
  const [gridApi, setGridApi] = useState<GridApi | null>(null)

  useEffect(() => {
    fetch("/data/pro360-data.json")
      .then((res) => res.json())
      .then((jsonData) => {
        setData(jsonData)
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error loading data:", error)
        setLoading(false)
      })
  }, [])

  // Number formatter for numeric columns
  const numberFormatter = (params: ValueFormatterParams) => {
    if (params.value === null || params.value === undefined) return ""
    return params.value.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  }

  // Column definitions with enhanced features
  const columnDefs = useMemo<ColDef<Pro360Data>[]>(
    () => [
      {
        field: "CustomSolutionID",
        headerName: "Custom Solution ID",
        filter: "agTextColumnFilter",
        sortable: true,
        resizable: true,
        minWidth: 180,
        filterParams: {
          buttons: ["reset", "apply"],
          closeOnApply: true,
        },
      },
      {
        field: "TacticKey",
        headerName: "Tactic Key",
        filter: "agTextColumnFilter",
        sortable: true,
        resizable: true,
        minWidth: 150,
        filterParams: {
          buttons: ["reset", "apply"],
          closeOnApply: true,
        },
      },
      {
        field: "CampaignNickName",
        headerName: "Campaign Nick Name",
        filter: "agTextColumnFilter",
        sortable: true,
        resizable: true,
        minWidth: 250,
        filterParams: {
          buttons: ["reset", "apply"],
          closeOnApply: true,
        },
      },
      {
        field: "TacticType",
        headerName: "Tactic Type",
        filter: "agTextColumnFilter",
        sortable: true,
        resizable: true,
        minWidth: 150,
        filterParams: {
          buttons: ["reset", "apply"],
          closeOnApply: true,
        },
      },
      {
        field: "yearmonth",
        headerName: "Year Month",
        filter: "agTextColumnFilter",
        sortable: true,
        resizable: true,
        minWidth: 120,
        filterParams: {
          buttons: ["reset", "apply"],
          closeOnApply: true,
        },
      },
      {
        field: "BillingType",
        headerName: "Billing Type",
        filter: "agTextColumnFilter",
        sortable: true,
        resizable: true,
        minWidth: 150,
        filterParams: {
          buttons: ["reset", "apply"],
          closeOnApply: true,
        },
      },
      {
        field: "lme",
        headerName: "LME",
        filter: "agNumberColumnFilter",
        sortable: true,
        resizable: true,
        valueFormatter: numberFormatter,
        minWidth: 120,
        type: "numericColumn",
        filterParams: {
          buttons: ["reset", "apply"],
          closeOnApply: true,
        },
      },
      {
        field: "nlme",
        headerName: "NLME",
        filter: "agNumberColumnFilter",
        sortable: true,
        resizable: true,
        valueFormatter: numberFormatter,
        minWidth: 120,
        type: "numericColumn",
        filterParams: {
          buttons: ["reset", "apply"],
          closeOnApply: true,
        },
      },
      {
        field: "lmx",
        headerName: "LMX",
        filter: "agNumberColumnFilter",
        sortable: true,
        resizable: true,
        valueFormatter: numberFormatter,
        minWidth: 120,
        type: "numericColumn",
        filterParams: {
          buttons: ["reset", "apply"],
          closeOnApply: true,
        },
      },
      {
        field: "nlmx",
        headerName: "NLMX",
        filter: "agNumberColumnFilter",
        sortable: true,
        resizable: true,
        valueFormatter: numberFormatter,
        minWidth: 120,
        type: "numericColumn",
        filterParams: {
          buttons: ["reset", "apply"],
          closeOnApply: true,
        },
      },
      {
        field: "lmpv",
        headerName: "LMPV",
        filter: "agNumberColumnFilter",
        sortable: true,
        resizable: true,
        valueFormatter: numberFormatter,
        minWidth: 120,
        type: "numericColumn",
        filterParams: {
          buttons: ["reset", "apply"],
          closeOnApply: true,
        },
      },
      {
        field: "nlmpv",
        headerName: "NLMPV",
        filter: "agNumberColumnFilter",
        sortable: true,
        resizable: true,
        valueFormatter: numberFormatter,
        minWidth: 120,
        type: "numericColumn",
        filterParams: {
          buttons: ["reset", "apply"],
          closeOnApply: true,
        },
      },
    ],
    []
  )

  const defaultColDef = useMemo<ColDef>(
    () => ({
      flex: 1,
      minWidth: 100,
      resizable: true,
      filter: true,
      sortable: true,
      floatingFilter: true,
    }),
    []
  )

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api)
  }, [])

  const clearAllFilters = useCallback(() => {
    if (gridApi) {
      gridApi.setFilterModel(null)
    }
  }, [gridApi])

  const autoSizeAll = useCallback(() => {
    if (gridApi) {
      const allColumnIds: string[] = []
      gridApi.getColumns()?.forEach((column) => {
        allColumnIds.push(column.getId())
      })
      gridApi.autoSizeColumns(allColumnIds, false)
    }
  }, [gridApi])

  const exportToCSV = useCallback(() => {
    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: `pro360_data_${new Date().toISOString().split("T")[0]}.csv`,
      })
    }
  }, [gridApi])

  // Auto-size columns when data is loaded
  useEffect(() => {
    if (gridApi && data.length > 0) {
      setTimeout(() => {
        autoSizeAll()
      }, 100)
    }
  }, [gridApi, data, autoSizeAll])

  if (loading) {
    return (
      <>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Platform</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Pro360</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center p-4">
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Platform</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Pro360</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Campaign to Date Summary</h1>
          <div className="flex gap-2">
            <Button
              onClick={autoSizeAll}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              Auto Size
            </Button>
            <Button
              onClick={exportToCSV}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              Export CSV
            </Button>
            <Button
              onClick={clearAllFilters}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Filters
            </Button>
          </div>
        </div>

        <div
          className="ag-theme-alpine rounded-lg border bg-card shadow-sm"
          style={{ height: "calc(100vh - 220px)", width: "100%" }}
        >
          <AgGridReact<Pro360Data>
            ref={gridRef}
            rowData={data}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            animateRows={true}
            rowSelection="multiple"
            suppressRowClickSelection={true}
            pagination={true}
            paginationPageSize={50}
            paginationPageSizeSelector={[50, 100, 200, 500, 1000]}
            enableCellTextSelection={true}
            ensureDomOrder={true}
            theme="legacy"
          />
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>Total Records: {data.length.toLocaleString()}</div>
          <div>Use column headers to sort and filter data</div>
        </div>
      </div>
    </>
  )
}
