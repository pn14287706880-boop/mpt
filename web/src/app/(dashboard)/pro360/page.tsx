"use client"

import {
  useState,
  useEffect,
  useMemo,
  type CSSProperties,
  useCallback,
  type ChangeEvent,
} from "react"
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
import { RotateCcw, Download, Filter, ChevronDown } from "lucide-react"
import "react-data-grid/lib/styles.css"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"

interface Pro360Data {
  rowId: string
  CustomSolutionID: string
  TacticKey: string
  CampaignNickName: string
  TacticType: string
  yearmonth: string
  ActivityDate: string
  BillingType: string
  lme: number
  nlme: number
  lmx: number
  nlmx: number
  lmpv: number
  nlmpv: number
}

type Pro360ApiRow = {
  CustomSolutionID?: string
  TacticKey?: string
  CampaignNickName?: string
  TacticType?: string
  yearmonth?: string
  ActivityDate?: string | { value?: string }
  BillingType?: string
  lme?: number | string
  nlme?: number | string
  lmx?: number | string
  nlmx?: number | string
  lmpv?: number | string
  nlmpv?: number | string
}

type DimensionKey =
  | "CustomSolutionID"
  | "TacticKey"
  | "CampaignNickName"
  | "TacticType"
  | "yearmonth"
  | "ActivityDate"
  | "BillingType"

type MeasureKey = "lme" | "nlme" | "lmx" | "nlmx" | "lmpv" | "nlmpv"

interface MeasureFilterValue {
  min: number | null
  max: number | null
}

const dimensionColumns: { key: DimensionKey; name: string }[] = [
  { key: "CustomSolutionID", name: "Custom Solution ID" },
  { key: "TacticKey", name: "Tactic Key" },
  { key: "CampaignNickName", name: "Campaign Nick Name" },
  { key: "TacticType", name: "Tactic Type" },
  { key: "yearmonth", name: "Year Month" },
  { key: "ActivityDate", name: "Activity Date" },
  { key: "BillingType", name: "Billing Type" },
]

const measureColumns: { key: MeasureKey; name: string }[] = [
  { key: "lme", name: "LME" },
  { key: "nlme", name: "NLME" },
  { key: "lmx", name: "LMX" },
  { key: "nlmx", name: "NLMX" },
  { key: "lmpv", name: "LMPV" },
  { key: "nlmpv", name: "NLMPV" },
]

const createEmptyDimensionFilters = (): Record<DimensionKey, string[]> =>
  dimensionColumns.reduce(
    (acc, column) => {
      acc[column.key] = []
      return acc
    },
    {} as Record<DimensionKey, string[]>
  )

const createEmptyMeasureFilters = (): Record<MeasureKey, MeasureFilterValue> =>
  measureColumns.reduce(
    (acc, column) => {
      acc[column.key] = { min: null, max: null }
      return acc
    },
    {} as Record<MeasureKey, MeasureFilterValue>
  )

// Number formatter
const numberFormatter = new Intl.NumberFormat("en-US")
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "2-digit",
})

const displayValue = (value: string) => (value === "" ? "—" : value)

function normalizeActivityDate(value: unknown): string {
  if (typeof value === "string") return value
  if (
    value &&
    typeof value === "object" &&
    "value" in value &&
    typeof (value as { value?: unknown }).value === "string"
  ) {
    return (value as { value: string }).value
  }
  return ""
}

const toNumber = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatActivityDate = (value: string) => {
  const parts = value.split("-").map((part) => Number.parseInt(part, 10))
  if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
    const [year, month, day] = parts
    const date = new Date(year, month - 1, day)
    return dateFormatter.format(date)
  }
  return displayValue(value)
}

const formatDimensionValue = (key: DimensionKey, value: string) => {
  if (key === "ActivityDate") {
    return formatActivityDate(value)
  }
  return displayValue(value)
}

const summariseSelection = (values: string[], key: DimensionKey) => {
  if (values.length <= 3) {
    return values.map((value) => formatDimensionValue(key, value)).join(", ")
  }

  const visible = values
    .slice(0, 3)
    .map((value) => formatDimensionValue(key, value))
    .join(", ")
  return `${visible} +${values.length - 3}`
}

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

interface DimensionFilterDropdownProps {
  column: { key: DimensionKey; name: string }
  options: string[]
  selectedValues: string[]
  onChange: (values: string[]) => void
}

function DimensionFilterDropdown({
  column,
  options,
  selectedValues,
  onChange,
}: DimensionFilterDropdownProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredOptions = useMemo(() => {
    const lowerTerm = searchTerm.trim().toLowerCase()
    if (lowerTerm.length === 0) return options

    return options.filter((option) => {
      const optionLabel = formatDimensionValue(column.key, option)
      return (
        option.toLowerCase().includes(lowerTerm) ||
        optionLabel.toLowerCase().includes(lowerTerm)
      )
    })
  }, [column.key, options, searchTerm])

  const active = selectedValues.length > 0
  const labelText = active ? `${column.name} (${selectedValues.length})` : column.name

  const toggleValue = (value: string, checked: boolean) => {
    onChange(
      checked
        ? Array.from(new Set([...selectedValues, value]))
        : selectedValues.filter((selected) => selected !== value)
    )
  }

  const handleSelectAll = () => {
    onChange(filteredOptions)
  }

  const handleClear = () => {
    onChange([])
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={active ? "default" : "outline"}
          size="sm"
          className="min-w-[200px] justify-between"
        >
          <span className="truncate">{labelText}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-2">
        <div className="space-y-2">
          <div className="space-y-1 px-1">
            <DropdownMenuLabel className="px-0">{column.name}</DropdownMenuLabel>
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={`Search ${column.name.toLowerCase()}`}
              className="h-8"
              onKeyDown={(event) => event.stopPropagation()}
            />
          </div>
          <div className="flex justify-between px-1 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={handleSelectAll}
              className="font-medium hover:text-foreground"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="font-medium hover:text-foreground"
            >
              Clear
            </button>
          </div>
          <DropdownMenuSeparator />
          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const optionKey = option === "" ? "__EMPTY__" : option
                const optionLabel = formatDimensionValue(column.key, option)
                return (
                  <DropdownMenuCheckboxItem
                    key={optionKey}
                    checked={selectedValues.includes(option)}
                    onCheckedChange={(checked) => toggleValue(option, Boolean(checked))}
                    onSelect={(event) => event.preventDefault()}
                  >
                    {optionLabel}
                  </DropdownMenuCheckboxItem>
                )
              })
            ) : (
              <DropdownMenuItem disabled>No matches found</DropdownMenuItem>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface MeasureFilterDropdownProps {
  column: { key: MeasureKey; name: string }
  value: MeasureFilterValue
  onChange: (value: MeasureFilterValue) => void
}

function MeasureFilterDropdown({ column, value, onChange }: MeasureFilterDropdownProps) {
  const summaryParts: string[] = []
  if (value.min !== null) summaryParts.push(`≥ ${numberFormatter.format(value.min)}`)
  if (value.max !== null) summaryParts.push(`≤ ${numberFormatter.format(value.max)}`)
  const activeSummary = summaryParts.join(" • ")
  const isActive = summaryParts.length > 0
  const buttonLabel = isActive ? `${column.name} (${activeSummary})` : column.name

  const handleMinChange = (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value
    const parsedValue = rawValue === "" ? null : Number(rawValue)
    const sanitizedMin =
      parsedValue === null || Number.isNaN(parsedValue) ? null : parsedValue
    const adjustedMax =
      sanitizedMin !== null && value.max !== null && sanitizedMin > value.max
        ? sanitizedMin
        : value.max
    onChange({
      min: sanitizedMin,
      max: adjustedMax,
    })
  }

  const handleMaxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value
    const parsedValue = rawValue === "" ? null : Number(rawValue)
    const sanitizedMax =
      parsedValue === null || Number.isNaN(parsedValue) ? null : parsedValue
    const adjustedMin =
      sanitizedMax !== null && value.min !== null && sanitizedMax < value.min
        ? sanitizedMax
        : value.min
    onChange({
      min: adjustedMin,
      max: sanitizedMax,
    })
  }

  const handleClear = () => {
    onChange({ min: null, max: null })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isActive ? "default" : "outline"}
          size="sm"
          className="min-w-[220px] justify-between"
        >
          <span className="truncate">{buttonLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 p-3">
        <div className="space-y-3">
          <DropdownMenuLabel className="px-0">{column.name}</DropdownMenuLabel>
          <div className="space-y-2">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Minimum</span>
              <Input
                type="number"
                inputMode="decimal"
                value={value.min ?? ""}
                placeholder="No minimum"
                onChange={handleMinChange}
                onKeyDown={(event) => event.stopPropagation()}
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Maximum</span>
              <Input
                type="number"
                inputMode="decimal"
                value={value.max ?? ""}
                placeholder="No maximum"
                onChange={handleMaxChange}
                onKeyDown={(event) => event.stopPropagation()}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
            >
              Clear
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function Pro360Page() {
  const [data, setData] = useState<Pro360Data[]>([])
  const [loading, setLoading] = useState(true)
  const [dimensionFilters, setDimensionFilters] = useState<Record<DimensionKey, string[]>>(
    () => createEmptyDimensionFilters()
  )
  const [measureFilters, setMeasureFilters] = useState<Record<MeasureKey, MeasureFilterValue>>(
    () => createEmptyMeasureFilters()
  )
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([])
  const [groupByColumns, setGroupByColumns] = useState<readonly string[]>([])
  const [selectedRows, setSelectedRows] = useState<ReadonlySet<string>>(
    () => new Set<string>()
  )
  const [expandedGroupIds, setExpandedGroupIds] = useState<ReadonlySet<unknown>>(
    () => new Set<unknown>()
  )

  useEffect(() => {
    fetch("/data/pro360-data.json")
      .then((res) => res.json())
      .then((jsonData) => {
        const normalizedData: Pro360Data[] = Array.isArray(jsonData)
          ? jsonData.reduce<Pro360Data[]>((acc, item, index) => {
              if (!item || typeof item !== "object") {
                return acc
              }

              const record = item as Pro360ApiRow
              const customSolutionId =
                typeof record.CustomSolutionID === "string" ? record.CustomSolutionID : ""
              const tacticKey = typeof record.TacticKey === "string" ? record.TacticKey : ""
              const campaignNickName =
                typeof record.CampaignNickName === "string" ? record.CampaignNickName : ""
              const tacticType =
                typeof record.TacticType === "string" ? record.TacticType : ""
              const yearmonth = typeof record.yearmonth === "string" ? record.yearmonth : ""
              const activityDate = normalizeActivityDate(record.ActivityDate)
              const billingType =
                typeof record.BillingType === "string" ? record.BillingType : ""

              acc.push({
                rowId: [
                  customSolutionId,
                  tacticKey,
                  activityDate,
                  yearmonth,
                  billingType,
                  index,
                ].join("|"),
                CustomSolutionID: customSolutionId,
                TacticKey: tacticKey,
                CampaignNickName: campaignNickName,
                TacticType: tacticType,
                yearmonth,
                ActivityDate: activityDate,
                BillingType: billingType,
                lme: toNumber(record.lme),
                nlme: toNumber(record.nlme),
                lmx: toNumber(record.lmx),
                nlmx: toNumber(record.nlmx),
                lmpv: toNumber(record.lmpv),
                nlmpv: toNumber(record.nlmpv),
              })

              return acc
            }, [])
          : []

        setData(normalizedData)
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error loading data:", error)
        setLoading(false)
      })
  }, [])

  const dimensionOptions = useMemo(
    () =>
      dimensionColumns.reduce(
        (acc, column) => {
          const values = Array.from(
            new Set(data.map((row) => String(row[column.key] ?? "")))
          ).sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
          )
          acc[column.key] = values
          return acc
        },
        {} as Record<DimensionKey, string[]>
      ),
    [data]
  )

  useEffect(() => {
    setDimensionFilters((previous) => {
      let hasChanges = false
      const updated: Record<DimensionKey, string[]> = { ...previous }

      for (const column of dimensionColumns) {
        const availableValues = new Set(dimensionOptions[column.key] ?? [])
        const trimmedValues = previous[column.key].filter((value) =>
          availableValues.has(value)
        )

        if (trimmedValues.length !== previous[column.key].length) {
          hasChanges = true
        }

        updated[column.key] = trimmedValues
      }

      return hasChanges ? updated : previous
    })
  }, [dimensionOptions])

  const filteredRows = useMemo(() => {
    return data.filter((row) => {
      for (const column of dimensionColumns) {
        const activeValues = dimensionFilters[column.key]
        if (activeValues.length > 0) {
          const rowValue = String(row[column.key] ?? "")
          if (!activeValues.includes(rowValue)) {
            return false
          }
        }
      }

      for (const column of measureColumns) {
        const { min, max } = measureFilters[column.key]
        const value = row[column.key]
        if (min !== null && value < min) {
          return false
        }
        if (max !== null && value > max) {
          return false
        }
      }

      return true
    })
  }, [data, dimensionFilters, measureFilters])

  const activeDimensionFilters = useMemo(
    () =>
      dimensionColumns
        .filter((column) => dimensionFilters[column.key].length > 0)
        .map((column) => ({
          column,
          values: dimensionFilters[column.key],
        })),
    [dimensionFilters]
  )

  const activeMeasureFilters = useMemo(
    () =>
      measureColumns
        .filter((column) => {
          const filter = measureFilters[column.key]
          return filter.min !== null || filter.max !== null
        })
        .map((column) => ({
          column,
          value: measureFilters[column.key],
        })),
    [measureFilters]
  )

  const hasActiveFilters = activeDimensionFilters.length > 0 || activeMeasureFilters.length > 0
  const activeFilterCount = activeDimensionFilters.length + activeMeasureFilters.length

  const groupableColumns = dimensionColumns

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
      const rawGroupKey = String(props.groupKey ?? "")
      const isDimensionKey = dimensionColumns.some((column) => column.key === columnKey)
      const formattedGroupKey = isDimensionKey
        ? formatDimensionValue(columnKey as DimensionKey, rawGroupKey)
        : rawGroupKey
      return renderToggleGroup({
        ...props,
        groupKey: `${formattedGroupKey} (${props.childRows.length.toLocaleString()})`,
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
        key: "ActivityDate",
        name: "Activity Date",
        width: 160,
        resizable: true,
        sortable: true,
        renderGroupCell: renderGroupToggleCell("ActivityDate"),
        renderCell: ({ row }) => (
          <span>{formatDimensionValue("ActivityDate", row.ActivityDate ?? "")}</span>
        ),
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
        cellClass: "pro360-numeric-cell",
        headerCellClass: "pro360-numeric-header",
        renderCell: ({ row }) => <span className="pro360-numeric-value">{numberFormatter.format(row.lme)}</span>,
        renderGroupCell: ({ childRows }: RenderGroupCellProps<Pro360Data>) => {
          const total = childRows.reduce((sum, row) => sum + row.lme, 0)
          return <strong className="pro360-numeric-value">{numberFormatter.format(total)}</strong>
        },
      },
      {
        key: "nlme",
        name: "NLME",
        width: 120,
        resizable: true,
        sortable: true,
        cellClass: "pro360-numeric-cell",
        headerCellClass: "pro360-numeric-header",
        renderCell: ({ row }) => <span className="pro360-numeric-value">{numberFormatter.format(row.nlme)}</span>,
        renderGroupCell: ({ childRows }: RenderGroupCellProps<Pro360Data>) => {
          const total = childRows.reduce((sum, row) => sum + row.nlme, 0)
          return <strong className="pro360-numeric-value">{numberFormatter.format(total)}</strong>
        },
      },
      {
        key: "lmx",
        name: "LMX",
        width: 120,
        resizable: true,
        sortable: true,
        cellClass: "pro360-numeric-cell",
        headerCellClass: "pro360-numeric-header",
        renderCell: ({ row }) => <span className="pro360-numeric-value">{numberFormatter.format(row.lmx)}</span>,
        renderGroupCell: ({ childRows }: RenderGroupCellProps<Pro360Data>) => {
          const total = childRows.reduce((sum, row) => sum + row.lmx, 0)
          return <strong className="pro360-numeric-value">{numberFormatter.format(total)}</strong>
        },
      },
      {
        key: "nlmx",
        name: "NLMX",
        width: 120,
        resizable: true,
        sortable: true,
        cellClass: "pro360-numeric-cell",
        headerCellClass: "pro360-numeric-header",
        renderCell: ({ row }) => <span className="pro360-numeric-value">{numberFormatter.format(row.nlmx)}</span>,
        renderGroupCell: ({ childRows }: RenderGroupCellProps<Pro360Data>) => {
          const total = childRows.reduce((sum, row) => sum + row.nlmx, 0)
          return <strong className="pro360-numeric-value">{numberFormatter.format(total)}</strong>
        },
      },
      {
        key: "lmpv",
        name: "LMPV",
        width: 120,
        resizable: true,
        sortable: true,
        cellClass: "pro360-numeric-cell",
        headerCellClass: "pro360-numeric-header",
        renderCell: ({ row }) => <span className="pro360-numeric-value">{numberFormatter.format(row.lmpv)}</span>,
        renderGroupCell: ({ childRows }: RenderGroupCellProps<Pro360Data>) => {
          const total = childRows.reduce((sum, row) => sum + row.lmpv, 0)
          return <strong className="pro360-numeric-value">{numberFormatter.format(total)}</strong>
        },
      },
      {
        key: "nlmpv",
        name: "NLMPV",
        width: 120,
        resizable: true,
        sortable: true,
        cellClass: "pro360-numeric-cell",
        headerCellClass: "pro360-numeric-header",
        renderCell: ({ row }) => <span className="pro360-numeric-value">{numberFormatter.format(row.nlmpv)}</span>,
        renderGroupCell: ({ childRows }: RenderGroupCellProps<Pro360Data>) => {
          const total = childRows.reduce((sum, row) => sum + row.nlmpv, 0)
          return <strong className="pro360-numeric-value">{numberFormatter.format(total)}</strong>
        },
      },
    ],
    [renderGroupToggleCell]
  )

  const dataColumns = useMemo(
    () => columns.filter((column) => column.key !== SELECT_COLUMN_KEY),
    [columns]
  )

  const rowKeyGetter = (row: Pro360Data) => row.rowId

  const sortedRows = useMemo(() => {
    if (sortColumns.length === 0) return filteredRows

    return [...filteredRows].sort((a, b) => {
      for (const sort of sortColumns) {
        const comparator = getComparator(sort.columnKey)
        const compResult = comparator(a, b)
        if (compResult !== 0) {
          return sort.direction === "ASC" ? compResult : -compResult
        }
      }
      return 0
    })
  }, [filteredRows, sortColumns])

  const totalRowCount = data.length
  const filteredRowCount = filteredRows.length
  const recordSummary =
    filteredRowCount === totalRowCount
      ? `Showing ${filteredRowCount.toLocaleString()} records`
      : `Showing ${filteredRowCount.toLocaleString()} of ${totalRowCount.toLocaleString()} records`

  const clearAllFilters = () => {
    setSortColumns([])
    setGroupByColumns([])
    setDimensionFilters(createEmptyDimensionFilters())
    setMeasureFilters(createEmptyMeasureFilters())
    setSelectedRows(new Set<string>())
    setExpandedGroupIds(new Set<unknown>())
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

        {/* Filters */}
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  Filters
                </span>
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {activeFilterCount} active
                  </span>
                )}
              </div>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                >
                  {filtersOpen ? "Hide" : "Show"}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <div className="space-y-4 border-t px-4 pb-4 pt-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Dimensions
                  </span>
                  {dimensionColumns.map((column) => (
                    <DimensionFilterDropdown
                      key={column.key}
                      column={column}
                      options={dimensionOptions[column.key] ?? []}
                      selectedValues={dimensionFilters[column.key]}
                      onChange={(values) =>
                        setDimensionFilters((previous) => ({
                          ...previous,
                          [column.key]: values,
                        }))
                      }
                    />
                  ))}
                </div>
                <Separator />
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Measures
                  </span>
                  {measureColumns.map((column) => (
                    <MeasureFilterDropdown
                      key={column.key}
                      column={column}
                      value={measureFilters[column.key]}
                      onChange={(nextValue) =>
                        setMeasureFilters((previous) => ({
                          ...previous,
                          [column.key]: nextValue,
                        }))
                      }
                    />
                  ))}
                </div>
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                    <span className="text-[0.65rem] font-semibold uppercase tracking-wide">
                      Active
                    </span>
                    {activeDimensionFilters.map(({ column, values }) => (
                      <span
                        key={`dimension-${column.key}`}
                        className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-foreground"
                      >
                        {column.name}: {summariseSelection(values, column.key)}
                      </span>
                    ))}
                    {activeMeasureFilters.map(({ column, value }) => {
                      const parts: string[] = []
                      if (value.min !== null) parts.push(`≥ ${numberFormatter.format(value.min)}`)
                      if (value.max !== null) parts.push(`≤ ${numberFormatter.format(value.max)}`)
                      return (
                        <span
                          key={`measure-${column.key}`}
                          className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-foreground"
                        >
                          {column.name}: {parts.join(" • ")}
                        </span>
                      )
                    })}
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto px-0 font-semibold"
                      onClick={() => {
                        setDimensionFilters(createEmptyDimensionFilters())
                        setMeasureFilters(createEmptyMeasureFilters())
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Group By Controls */}
        <div className="rounded-lg border bg-card px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-semibold">Group By:</span>
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
                Grouped by:{" "}
                <strong>
                  {groupByColumns
                    .map((key) => groupableColumns.find((c) => c.key === key)?.name)
                    .filter(Boolean)
                    .join(", ")}
                </strong>{" "}
                | {recordSummary}
              </>
            ) : (
              <>{recordSummary}</>
            )}
          </div>
          <div>react-data-grid - High-performance data grid with grouping, sorting and resizing</div>
        </div>
      </div>
    </>
  )
}
