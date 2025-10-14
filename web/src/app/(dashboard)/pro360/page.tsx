"use client"

import { useState, useEffect, useMemo, type CSSProperties, useCallback } from "react"
import {
  DataGrid,
  type Column,
  type SortColumn,
  type RenderGroupCellProps,
  SelectColumn,
  SELECT_COLUMN_KEY,
  TreeDataGrid,
  renderToggleGroup,
} from "react-data-grid"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { RotateCcw, Download } from "lucide-react"
import "react-data-grid/lib/styles.css"

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

// Number formatter
const numberFormatter = new Intl.NumberFormat("en-US")

// Custom filter function
function getComparator(sortColumn: string) {
  return (a: Pro360Data, b: Pro360Data) => {
    const aValue = a[sortColumn as keyof Pro360Data]
    const bValue = b[sortColumn as keyof Pro360Data]

    if (typeof aValue === "number" && typeof bValue === "number") {
      return aValue - bValue
    }

    return String(aValue).localeCompare(String(bValue))
  }
}

export default function Pro360Page() {
  const [data, setData] = useState<Pro360Data[]>([])
  const [loading, setLoading] = useState(true)
  const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([])
  const [groupByColumns, setGroupByColumns] = useState<readonly string[]>([])
  const [selectedRows, setSelectedRows] = useState<ReadonlySet<string>>(() => new Set())
  const [expandedGroupIds, setExpandedGroupIds] = useState<ReadonlySet<unknown>>(
    () => new Set<unknown>()
  )

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

  const groupableColumns = [
    { key: "CustomSolutionID", name: "Custom Solution ID" },
    { key: "TacticKey", name: "Tactic Key" },
    { key: "CampaignNickName", name: "Campaign Nick Name" },
    { key: "TacticType", name: "Tactic Type" },
    { key: "yearmonth", name: "Year Month" },
    { key: "BillingType", name: "Billing Type" },
  ]

  const toggleGroupBy = (columnKey: string) => {
    const newGroupBy = groupByColumns.includes(columnKey)
      ? groupByColumns.filter((key) => key !== columnKey)
      : [...groupByColumns, columnKey]
    setGroupByColumns(newGroupBy)
    setExpandedGroupIds(new Set())
  }

  // Row grouper implementation mirrors react-data-grid RowGrouping demo
  const rowGrouper = (rows: readonly Pro360Data[], columnKey: string) => {
    const groups: Record<string, Pro360Data[]> = {}
    for (const row of rows) {
      const key = String(row[columnKey as keyof Pro360Data] ?? "undefined")
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(row)
    }
    return groups
  }

  const renderGroupToggleCell = useCallback(
    (columnKey: keyof Pro360Data) => (props: RenderGroupCellProps<Pro360Data>) => {
      const groupColumnKey = groupByColumns[props.row.level]
      if (groupColumnKey !== columnKey) return null
      return renderToggleGroup({
        ...props,
        groupKey: `${props.groupKey} (${props.childRows.length.toLocaleString()})`,
      })
    },
    [groupByColumns]
  )

  const columns = useMemo<readonly Column<Pro360Data>[]>(
    () => [
      SelectColumn as Column<Pro360Data>,
      {
        key: "CustomSolutionID",
        name: "Custom Solution ID",
        width: 180,
        resizable: true,
        sortable: true,
        renderGroupCell: renderGroupToggleCell("CustomSolutionID"),
      },
      {
        key: "TacticKey",
        name: "Tactic Key",
        width: 150,
        resizable: true,
        sortable: true,
        renderGroupCell: renderGroupToggleCell("TacticKey"),
      },
      {
        key: "CampaignNickName",
        name: "Campaign Nick Name",
        width: 250,
        resizable: true,
        sortable: true,
        renderGroupCell: renderGroupToggleCell("CampaignNickName"),
      },
      {
        key: "TacticType",
        name: "Tactic Type",
        width: 150,
        resizable: true,
        sortable: true,
        renderGroupCell: renderGroupToggleCell("TacticType"),
      },
      {
        key: "yearmonth",
        name: "Year Month",
        width: 120,
        resizable: true,
        sortable: true,
        renderGroupCell: renderGroupToggleCell("yearmonth"),
      },
      {
        key: "BillingType",
        name: "Billing Type",
        width: 150,
        resizable: true,
        sortable: true,
        renderGroupCell: renderGroupToggleCell("BillingType"),
      },
      {
        key: "lme",
        name: "LME",
        width: 120,
        resizable: true,
        sortable: true,
        renderCell: ({ row }) => numberFormatter.format(row.lme),
        renderGroupCell: ({ childRows }: RenderGroupCellProps<Pro360Data>) => {
          const total = childRows.reduce((sum, row) => sum + row.lme, 0)
          return <strong>{numberFormatter.format(total)}</strong>
        },
      },
      {
        key: "nlme",
        name: "NLME",
        width: 120,
        resizable: true,
        sortable: true,
        renderCell: ({ row }) => numberFormatter.format(row.nlme),
        renderGroupCell: ({ childRows }: RenderGroupCellProps<Pro360Data>) => {
          const total = childRows.reduce((sum, row) => sum + row.nlme, 0)
          return <strong>{numberFormatter.format(total)}</strong>
        },
      },
      {
        key: "lmx",
        name: "LMX",
        width: 120,
        resizable: true,
        sortable: true,
        renderCell: ({ row }) => numberFormatter.format(row.lmx),
        renderGroupCell: ({ childRows }: RenderGroupCellProps<Pro360Data>) => {
          const total = childRows.reduce((sum, row) => sum + row.lmx, 0)
          return <strong>{numberFormatter.format(total)}</strong>
        },
      },
      {
        key: "nlmx",
        name: "NLMX",
        width: 120,
        resizable: true,
        sortable: true,
        renderCell: ({ row }) => numberFormatter.format(row.nlmx),
        renderGroupCell: ({ childRows }: RenderGroupCellProps<Pro360Data>) => {
          const total = childRows.reduce((sum, row) => sum + row.nlmx, 0)
          return <strong>{numberFormatter.format(total)}</strong>
        },
      },
      {
        key: "lmpv",
        name: "LMPV",
        width: 120,
        resizable: true,
        sortable: true,
        renderCell: ({ row }) => numberFormatter.format(row.lmpv),
        renderGroupCell: ({ childRows }: RenderGroupCellProps<Pro360Data>) => {
          const total = childRows.reduce((sum, row) => sum + row.lmpv, 0)
          return <strong>{numberFormatter.format(total)}</strong>
        },
      },
      {
        key: "nlmpv",
        name: "NLMPV",
        width: 120,
        resizable: true,
        sortable: true,
        renderCell: ({ row }) => numberFormatter.format(row.nlmpv),
        renderGroupCell: ({ childRows }: RenderGroupCellProps<Pro360Data>) => {
          const total = childRows.reduce((sum, row) => sum + row.nlmpv, 0)
          return <strong>{numberFormatter.format(total)}</strong>
        },
      },
    ],
    [renderGroupToggleCell]
  )

  const dataColumns = useMemo(
    () => columns.filter((column) => column.key !== SELECT_COLUMN_KEY),
    [columns]
  )

  const rowKeyGetter = (row: Pro360Data) => {
    return `${row.CustomSolutionID}-${row.TacticKey}-${row.yearmonth}`
  }

  const sortedRows = useMemo(() => {
    if (sortColumns.length === 0) return data

    return [...data].sort((a, b) => {
      for (const sort of sortColumns) {
        const comparator = getComparator(sort.columnKey)
        const compResult = comparator(a, b)
        if (compResult !== 0) {
          return sort.direction === "ASC" ? compResult : -compResult
        }
      }
      return 0
    })
  }, [data, sortColumns])

  const clearAllFilters = () => {
    setSortColumns([])
    setGroupByColumns([])
    setSelectedRows(new Set())
    setExpandedGroupIds(new Set())
  }

  const exportToCSV = () => {
    const headers = dataColumns
      .map((col) => (typeof col.name === "string" && col.name.length > 0 ? col.name : col.key))
      .join(",")
    const rows = sortedRows
      .map((row) =>
        dataColumns
          .map((col) => {
            const value = row[col.key as keyof Pro360Data]
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value ?? ""
          })
          .join(",")
      )
      .join("\n")

    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "pro360-data.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

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

      <div className="flex flex-1 flex-col gap-4 p-4 w-full">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Campaign to Date Summary</h1>
          <div className="flex gap-2">
            <Button
              onClick={exportToCSV}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              onClick={clearAllFilters}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset All
            </Button>
          </div>
        </div>

        {/* Group By Controls */}
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="mb-2 text-sm font-semibold">Group by columns:</div>
          <div className="flex flex-wrap gap-4 text-sm">
            {groupableColumns.map((col) => (
              <label
                key={col.key}
                htmlFor={col.key}
                className="inline-flex items-center gap-2 cursor-pointer select-none"
              >
                <Checkbox
                  id={col.key}
                  checked={groupByColumns.includes(col.key)}
                  onCheckedChange={() => toggleGroupBy(col.key)}
                />
                {col.name}
              </label>
            ))}
          </div>
        </div>

        <div
          className="pro360-grid-wrapper rounded-lg border shadow-sm bg-white"
          style={{ height: "calc(100vh - 340px)" }}
        >
          {groupByColumns.length > 0 ? (
            <TreeDataGrid
              columns={columns}
              rows={sortedRows}
              rowKeyGetter={rowKeyGetter}
              sortColumns={sortColumns}
              onSortColumnsChange={setSortColumns}
              groupBy={groupByColumns}
              rowGrouper={rowGrouper}
              expandedGroupIds={expandedGroupIds}
              onExpandedGroupIdsChange={setExpandedGroupIds}
              selectedRows={selectedRows}
              onSelectedRowsChange={setSelectedRows}
              defaultColumnOptions={{
                resizable: true,
                sortable: true,
              }}
              className="rdg-light"
              style={{
                height: "100%",
                width: "100%",
                "--rdg-background-color": "white",
                "--rdg-header-background-color": "#f8f9fa",
                "--rdg-row-hover-background-color": "#f1f3f5"
              } as CSSProperties}
            />
          ) : (
            <DataGrid
              columns={columns}
              rows={sortedRows}
              rowKeyGetter={rowKeyGetter}
              sortColumns={sortColumns}
              onSortColumnsChange={setSortColumns}
              selectedRows={selectedRows}
              onSelectedRowsChange={setSelectedRows}
              defaultColumnOptions={{
                resizable: true,
                sortable: true,
              }}
              className="rdg-light"
              style={{
                height: "100%",
                "--rdg-background-color": "white",
                "--rdg-header-background-color": "#f8f9fa",
                "--rdg-row-hover-background-color": "#f1f3f5"
              } as CSSProperties}
            />
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            {groupByColumns.length > 0 ? (
              <>
                Grouped by: <strong>{groupByColumns.map((key) => groupableColumns.find((c) => c.key === key)?.name).join(", ")}</strong> | Total records: {data.length.toLocaleString()}
              </>
            ) : (
              <>Showing {data.length.toLocaleString()} records</>
            )}
          </div>
          <div>react-data-grid - High-performance data grid with grouping, sorting and resizing</div>
        </div>
      </div>
    </>
  )
}
