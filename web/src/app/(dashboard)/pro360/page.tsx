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
import {
  RotateCcw,
  Download,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
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
import { cn } from "@/lib/utils"

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
const monthDisplayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
})
const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

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

const dateValuePattern = /^(\d{4})-(\d{2})-(\d{2})$/

function parseDateValue(value: string): Date | null {
  if (!value) return null
  const match = dateValuePattern.exec(value)
  if (!match) return null
  const [, year, month, day] = match
  const y = Number.parseInt(year, 10)
  const m = Number.parseInt(month, 10) - 1
  const d = Number.parseInt(day, 10)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null
  const date = new Date(y, m, d)
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== y ||
    date.getMonth() !== m ||
    date.getDate() !== d
  ) {
    return null
  }
  return date
}

function formatDateValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function startOfMonthDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isWithinRange(date: Date, start: Date, end: Date) {
  const time = date.getTime()
  return time >= start.getTime() && time <= end.getTime()
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

function ActivityDateFilterDropdown({
  column,
  options,
  selectedValues,
  onChange,
}: DimensionFilterDropdownProps) {
  type DateRange = { start: Date | null; end: Date | null }

  const [open, setOpen] = useState(false)

  const parsedOptions = useMemo(
    () =>
      options
        .map((value) => {
          const parsed = parseDateValue(value)
          return parsed ? { raw: value, date: parsed } : null
        })
        .filter(
          (item): item is { raw: string; date: Date } => item !== null
        )
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [options]
  )

  const minDate = parsedOptions[0]?.date ?? null
  const maxDate = parsedOptions[parsedOptions.length - 1]?.date ?? null

  const selectedRange = useMemo<DateRange>(() => {
    if (selectedValues.length === 0) {
      return { start: null, end: null }
    }

    const parsed = selectedValues
      .map((value) => parseDateValue(value))
      .filter((value): value is Date => value !== null)
      .sort((a, b) => a.getTime() - b.getTime())

    if (parsed.length === 0) {
      return { start: null, end: null }
    }

    const start = new Date(parsed[0].getFullYear(), parsed[0].getMonth(), parsed[0].getDate())
    const endValue = parsed[parsed.length - 1]
    const end = new Date(endValue.getFullYear(), endValue.getMonth(), endValue.getDate())

    return { start, end }
  }, [selectedValues])

  const [pendingRange, setPendingRange] = useState<DateRange>(() => ({
    start: selectedRange.start ? new Date(selectedRange.start) : null,
    end: selectedRange.end ? new Date(selectedRange.end) : null,
  }))

  const [currentMonth, setCurrentMonth] = useState<Date>(() =>
    startOfMonthDate(
      selectedRange.end ??
        selectedRange.start ??
        maxDate ??
        minDate ??
        new Date()
    )
  )

  useEffect(() => {
    if (!open) return

    const refreshedRange: DateRange = {
      start: selectedRange.start ? new Date(selectedRange.start) : null,
      end: selectedRange.end ? new Date(selectedRange.end) : null,
    }
    setPendingRange(refreshedRange)

    const initialMonthSource =
      refreshedRange.end ??
      refreshedRange.start ??
      maxDate ??
      minDate ??
      new Date()
    setCurrentMonth(startOfMonthDate(initialMonthSource))
  }, [open, selectedRange, minDate, maxDate])

  const buttonLabel = (() => {
    if (!selectedRange.start || !selectedRange.end) {
      return column.name
    }

    const startValue = formatDateValue(selectedRange.start)
    const endValue = formatDateValue(selectedRange.end)
    const startLabel = formatActivityDate(startValue)
    const endLabel = formatActivityDate(endValue)

    if (startValue === endValue) {
      return `${column.name}: ${startLabel}`
    }

    return `${column.name}: ${startLabel} → ${endLabel}`
  })()

  const clampToAvailableDate = useCallback(
    (date: Date) => {
      if (minDate && date.getTime() < minDate.getTime()) {
        return new Date(minDate)
      }
      if (maxDate && date.getTime() > maxDate.getTime()) {
        return new Date(maxDate)
      }
      return new Date(date.getFullYear(), date.getMonth(), date.getDate())
    },
    [minDate, maxDate]
  )

  const handleDaySelect = useCallback(
    (day: Date) => {
      const clamped = clampToAvailableDate(day)
      setPendingRange((previous) => {
        if (!previous.start || previous.end) {
          return { start: clamped, end: null }
        }

        if (isSameDay(clamped, previous.start)) {
          return { start: clamped, end: clamped }
        }

        if (clamped.getTime() < previous.start.getTime()) {
          return { start: clamped, end: null }
        }

        return { start: previous.start, end: clamped }
      })
    },
    [clampToAvailableDate]
  )

  const handleApply = () => {
    if (!pendingRange.start || !pendingRange.end) return

    const startTime = pendingRange.start.getTime()
    const endTime = pendingRange.end.getTime()

    const nextValues = parsedOptions
      .filter((option) => {
        const time = option.date.getTime()
        return time >= startTime && time <= endTime
      })
      .map((option) => option.raw)

    onChange(nextValues)
    setOpen(false)
  }

  const handleClear = () => {
    setPendingRange({ start: null, end: null })
    onChange([])
    setOpen(false)
  }

  const handleSelectAll = () => {
    if (parsedOptions.length === 0) return
    onChange(parsedOptions.map((option) => option.raw))
    setOpen(false)
  }

  const pendingSummary = (() => {
    if (pendingRange.start && pendingRange.end) {
      const startValue = formatDateValue(pendingRange.start)
      const endValue = formatDateValue(pendingRange.end)
      const sameDay = isSameDay(pendingRange.start, pendingRange.end)
      const formattedStart = formatActivityDate(startValue)
      const formattedEnd = formatActivityDate(endValue)
      if (sameDay) {
        return formattedStart
      }
      return `${formattedStart} → ${formattedEnd}`
    }
    if (pendingRange.start && !pendingRange.end) {
      return "Select an end date"
    }
    return "No dates selected"
  })()

  const pendingRangeLength =
    pendingRange.start && pendingRange.end
      ? Math.floor(
          (pendingRange.end.getTime() - pendingRange.start.getTime()) /
            (24 * 60 * 60 * 1000)
        ) + 1
      : 0

  const displayMonths = [
    currentMonth,
    addMonths(currentMonth, 1),
  ] as const

  const renderMonthGrid = (monthDate: Date) => {
    const firstOfMonth = startOfMonthDate(monthDate)
    const firstDayOfWeek = firstOfMonth.getDay()
    const gridStart = new Date(firstOfMonth)
    gridStart.setDate(firstOfMonth.getDate() - firstDayOfWeek)

    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(gridStart)
      day.setDate(gridStart.getDate() + index)

      const dayTime = day.getTime()
      const isOutsideMonth = day.getMonth() !== monthDate.getMonth()
      const isBeforeMin = minDate ? dayTime < minDate.getTime() : false
      const isAfterMax = maxDate ? dayTime > maxDate.getTime() : false
      const disabled = isBeforeMin || isAfterMax

      const isStart =
        pendingRange.start !== null && isSameDay(day, pendingRange.start)
      const isEnd =
        pendingRange.end !== null && isSameDay(day, pendingRange.end)
      const isBetween =
        pendingRange.start &&
        pendingRange.end &&
        isWithinRange(day, pendingRange.start, pendingRange.end) &&
        !isStart &&
        !isEnd

      return (
        <button
          key={`${monthDate.getTime()}-${day.getTime()}`}
          type="button"
          onClick={() => handleDaySelect(day)}
          disabled={disabled}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
            disabled
              ? "cursor-not-allowed opacity-40"
              : "cursor-pointer hover:bg-primary/10",
            isOutsideMonth && "text-muted-foreground/60",
            isBetween && "bg-primary/10 text-primary",
            (isStart || isEnd) && "bg-primary text-primary-foreground hover:bg-primary",
            !isStart && !isEnd && !isBetween && !disabled && "text-foreground"
          )}
        >
          {day.getDate()}
        </button>
      )
    })
  }

  const canApply = Boolean(
    pendingRange.start &&
      pendingRange.end &&
      pendingRange.start.getTime() <= pendingRange.end.getTime()
  )

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={selectedValues.length > 0 ? "default" : "outline"}
          size="sm"
          className="min-w-[220px] justify-between"
        >
          <span className="truncate">{buttonLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[480px] p-4"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{column.name}</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setCurrentMonth((previous) => addMonths(previous, -1))
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {monthDisplayFormatter.format(currentMonth)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setCurrentMonth((previous) => addMonths(previous, 1))
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {displayMonths.map((monthDate) => (
              <div key={monthDate.getTime()} className="space-y-2">
                <div className="text-center text-sm font-medium">
                  {monthDisplayFormatter.format(monthDate)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground">
                  {weekdayLabels.map((label) => (
                    <div
                      key={label}
                      className="h-6 w-9 text-center leading-6"
                    >
                      {label}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {renderMonthGrid(monthDate)}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2 text-xs">
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{pendingSummary}</span>
              {pendingRangeLength > 0 && (
                <span className="text-muted-foreground">
                  {pendingRangeLength.toLocaleString()} day
                  {pendingRangeLength === 1 ? "" : "s"} selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                disabled={parsedOptions.length === 0}
              >
                Select full range
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={!selectedRange.start && !selectedRange.end}
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!canApply}
              onClick={handleApply}
            >
              Apply
            </Button>
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
                  {dimensionColumns.map((column) => {
                    const FilterComponent =
                      column.key === "ActivityDate"
                        ? ActivityDateFilterDropdown
                        : DimensionFilterDropdown

                    return (
                      <FilterComponent
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
                    )
                  })}
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
