"use client"

import { useState, useEffect, useMemo } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { TrendingUp, TrendingDown } from "lucide-react"

interface UsageData {
  year: string
  year_mon: string
  yyyymm: string
  bu: string
  usage_amount: number
}

export default function DatabricksUsagePage() {
  const [data, setData] = useState<UsageData[]>([])
  const [selectedBU, setSelectedBU] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/data/databricks-usage.json")
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

  // Get current year
  const currentYear = new Date().getFullYear().toString()
  const lastYear = (new Date().getFullYear() - 1).toString()
  const currentMonth = new Date().getMonth() + 1 // 1-12

  // Get unique BUs
  const uniqueBUs = useMemo(() => {
    const bus = Array.from(new Set(data.map((d) => d.bu))).sort()
    return bus
  }, [data])

  // Filter data based on selected BU and current year
  const filteredData = useMemo(() => {
    let filtered = data.filter((d) => d.year === currentYear)
    if (selectedBU !== "all") {
      filtered = filtered.filter((d) => d.bu === selectedBU)
    }
    return filtered
  }, [data, selectedBU, currentYear])

  // Calculate KPI metrics
  const kpiMetrics = useMemo(() => {
    // Current year total
    const currentYearTotal = filteredData.reduce((sum, d) => sum + d.usage_amount, 0)

    // Last year total (same period)
    let lastYearData = data.filter((d) => {
      if (d.year !== lastYear) return false
      const monthNum = parseInt(d.yyyymm.slice(4, 6))
      return monthNum <= currentMonth
    })

    if (selectedBU !== "all") {
      lastYearData = lastYearData.filter((d) => d.bu === selectedBU)
    }

    const lastYearTotal = lastYearData.reduce((sum, d) => sum + d.usage_amount, 0)

    // Calculate percentage change
    const percentChange = lastYearTotal > 0 
      ? ((currentYearTotal - lastYearTotal) / lastYearTotal) * 100 
      : 0

    return {
      currentYearTotal,
      lastYearTotal,
      percentChange,
      isIncrease: percentChange > 0,
    }
  }, [filteredData, data, selectedBU, lastYear, currentMonth])

  // Prepare chart data
  const chartData = useMemo(() => {
    const currentYearData = data.filter((d) => d.year === currentYear)
    
    // Get all unique months for current year
    const months = Array.from(new Set(currentYearData.map((d) => d.year_mon))).sort(
      (a, b) => {
        const aMonth = a.split("-")[1]
        const bMonth = b.split("-")[1]
        const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return monthOrder.indexOf(aMonth) - monthOrder.indexOf(bMonth)
      }
    )

    // Get BUs to display
    const busToDisplay = selectedBU === "all" ? uniqueBUs : [selectedBU]

    // Create chart data structure
    const chartDataMap = months.map((month) => {
      const dataPoint: { year_mon: string; [key: string]: string | number } = { year_mon: month }
      
      busToDisplay.forEach((bu) => {
        const values = currentYearData.filter((d) => d.year_mon === month && d.bu === bu)
        dataPoint[bu] = values.reduce((sum, v) => sum + v.usage_amount, 0)
      })
      
      return dataPoint
    })

    return { data: chartDataMap, bus: busToDisplay }
  }, [data, currentYear, selectedBU, uniqueBUs])

  // Prepare cumulative chart data
  const cumulativeChartData = useMemo(() => {
    const currentYearData = data.filter((d) => d.year === currentYear)
    
    // Get all unique months for current year
    const months = Array.from(new Set(currentYearData.map((d) => d.year_mon))).sort(
      (a, b) => {
        const aMonth = a.split("-")[1]
        const bMonth = b.split("-")[1]
        const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return monthOrder.indexOf(aMonth) - monthOrder.indexOf(bMonth)
      }
    )

    // Get BUs to display
    const busToDisplay = selectedBU === "all" ? uniqueBUs : [selectedBU]

    // Create cumulative totals for each BU
    const cumulativeTotals: { [key: string]: number } = {}
    busToDisplay.forEach((bu) => {
      cumulativeTotals[bu] = 0
    })

    // Create chart data structure with cumulative values
    const chartDataMap = months.map((month) => {
      const dataPoint: { year_mon: string; [key: string]: string | number } = { year_mon: month }
      
      busToDisplay.forEach((bu) => {
        const values = currentYearData.filter((d) => d.year_mon === month && d.bu === bu)
        cumulativeTotals[bu] += values.reduce((sum, v) => sum + v.usage_amount, 0)
        dataPoint[bu] = cumulativeTotals[bu]
      })
      
      return dataPoint
    })

    return { data: chartDataMap, bus: busToDisplay }
  }, [data, currentYear, selectedBU, uniqueBUs])

  // Colors for BU lines
  const buColors = [
    "#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#a78bfa", 
    "#f472b6", "#fb923c", "#34d399", "#60a5fa", "#c084fc"
  ]

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
                  <BreadcrumbPage>DatabricksUsage</BreadcrumbPage>
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
                <BreadcrumbPage>DatabricksUsage</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Header with Filter */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Databricks Usage Dashboard</h1>
          <div className="w-[200px]">
            <Select value={selectedBU} onValueChange={setSelectedBU}>
              <SelectTrigger>
                <SelectValue placeholder="Select BU" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All BUs</SelectItem>
                {uniqueBUs.map((bu) => (
                  <SelectItem key={bu} value={bu}>
                    {bu}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Current Year Usage ({currentYear})
            </h3>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">
                ${kpiMetrics.currentYearTotal.toLocaleString("en-US", { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className={`flex items-center gap-1 ${
                kpiMetrics.isIncrease ? "text-red-600" : "text-green-600"
              }`}>
                {kpiMetrics.isIncrease ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {Math.abs(kpiMetrics.percentChange).toFixed(1)}%
                </span>
              </div>
              <span className="text-muted-foreground">
                vs last year (${kpiMetrics.lastYearTotal.toLocaleString("en-US", { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })})
              </span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Usage Trend ({currentYear})</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year_mon" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `$${value.toLocaleString("en-US", { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}`,
                    name
                  ]}
                  itemSorter={(item: { value?: number }) => -(item.value ?? 0)}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '8px'
                  }}
                  wrapperStyle={{
                    zIndex: 1000
                  }}
                />
                <Legend 
                  wrapperStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '8px'
                  }}
                />
                {chartData.bus.map((bu, index) => (
                  <Line
                    key={bu}
                    type="monotone"
                    dataKey={bu}
                    stroke={buColors[index % buColors.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cumulative Chart */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Cumulative Usage Trend ({currentYear})</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumulativeChartData.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year_mon" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `$${value.toLocaleString("en-US", { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}`,
                    name
                  ]}
                  itemSorter={(item: { value?: number }) => -(item.value ?? 0)}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '8px'
                  }}
                  wrapperStyle={{
                    zIndex: 1000
                  }}
                />
                <Legend 
                  wrapperStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '8px'
                  }}
                />
                {cumulativeChartData.bus.map((bu, index) => (
                  <Line
                    key={bu}
                    type="monotone"
                    dataKey={bu}
                    stroke={buColors[index % buColors.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  )
}

