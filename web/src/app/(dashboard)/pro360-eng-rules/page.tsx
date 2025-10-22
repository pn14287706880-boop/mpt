"use client"

import { useState, useEffect, useMemo, useCallback, type CSSProperties } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Plus, Edit, Power, PowerOff, Trash2 } from "lucide-react"
import { DataGrid, type Column, SelectColumn } from "react-data-grid"
import "react-data-grid/lib/styles.css"
import { EngRulesForm } from "@/components/pro360-eng-rules/EngRulesForm"
import { useToast } from "@/hooks/use-toast"

interface EngRule {
  id: string
  eventName: string
  billingType: string
  tacticField: string | null
  isEngagement: number
  isExposure: number
  isActive: number
  isLatest: number
  version: number
  validFrom: string
  validTo: string | null
  createdAt: string
  updatedAt: string
  modifiedBy: string
  inactivatedAt: string | null
  inactivatedBy: string | null
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
})

export default function Pro360EngRulesPage() {
  const { toast } = useToast()
  const [data, setData] = useState<EngRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [showOnlyActive, setShowOnlyActive] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<EngRule | null>(null)
  const [selectedRows, setSelectedRows] = useState<ReadonlySet<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")

  const fetchRules = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (showHistory) {
        params.set("history", "true")
      } else {
        params.set("latest", "true")
        if (showOnlyActive) {
          params.set("active", "true")
        }
      }

      const response = await fetch(`/api/pro360-eng-rules?${params}`)
      if (!response.ok) throw new Error("Failed to fetch rules")
      
      const rules = await response.json()
      setData(rules)
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch rules",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [showHistory, showOnlyActive, toast])

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  const handleAdd = () => {
    setSelectedRule(null)
    setSelectedRows(new Set())
    setFormOpen(true)
  }

  const handleEdit = () => {
    const selectedId = Array.from(selectedRows)[0]
    const rule = filteredData.find((r) => r.id === selectedId)
    if (rule && rule.isLatest === 1) {
      setSelectedRule(rule)
      setFormOpen(true)
    } else {
      toast({
        title: "Cannot Edit",
        description: "Only the latest version of a rule can be edited",
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async () => {
    const selectedId = Array.from(selectedRows)[0]
    const rule = filteredData.find((r) => r.id === selectedId)
    
    if (!rule || rule.isLatest !== 1) {
      toast({
        title: "Error",
        description: "Only the latest version can have its status changed",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/pro360-eng-rules/toggle-active", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: rule.eventName,
          isActive: rule.isActive === 1 ? 0 : 1,
        }),
      })

      if (!response.ok) throw new Error("Failed to toggle status")

      toast({
        title: "Success",
        description: `Rule ${rule.isActive === 1 ? "inactivated" : "activated"} successfully`,
      })

      fetchRules()
      setSelectedRows(new Set())
    } catch {
      toast({
        title: "Error",
        description: "Failed to toggle rule status",
        variant: "destructive",
      })
    }
  }

  // Filter data by search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data
    
    const query = searchQuery.toLowerCase()
    return data.filter((rule) => 
      rule.eventName.toLowerCase().includes(query)
    )
  }, [data, searchQuery])

  const handleDelete = async () => {
    const selectedId = Array.from(selectedRows)[0]
    const rule = filteredData.find((r) => r.id === selectedId)
    
    if (!rule) return

    if (!confirm(`Are you sure you want to delete all versions of "${rule.eventName}"? This cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(
        `/api/pro360-eng-rules?eventName=${encodeURIComponent(rule.eventName)}`,
        { method: "DELETE" }
      )

      if (!response.ok) throw new Error("Failed to delete rule")

      toast({
        title: "Success",
        description: "Rule deleted successfully",
      })

      fetchRules()
      setSelectedRows(new Set())
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete rule",
        variant: "destructive",
      })
    }
  }

  const columns = useMemo<readonly Column<EngRule>[]>(
    () => [
      SelectColumn,
      {
        key: "eventName",
        name: "Event Name",
        width: 200,
        resizable: true,
        sortable: true,
      },
      {
        key: "billingType",
        name: "Billing Type",
        width: 120,
        resizable: true,
        sortable: true,
      },
      {
        key: "tacticField",
        name: "Tactic Field",
        width: 150,
        resizable: true,
        sortable: true,
        renderCell: ({ row }) => row.tacticField || "—",
      },
      {
        key: "isEngagement",
        name: "Is Engagement",
        width: 130,
        resizable: true,
        sortable: true,
        renderCell: ({ row }) => (
          <span className={row.isEngagement === 1 ? "text-green-600 font-medium" : "text-gray-500"}>
            {row.isEngagement === 1 ? "Yes" : "No"}
          </span>
        ),
      },
      {
        key: "isExposure",
        name: "Is Exposure",
        width: 120,
        resizable: true,
        sortable: true,
        renderCell: ({ row }) => (
          <span className={row.isExposure === 1 ? "text-green-600 font-medium" : "text-gray-500"}>
            {row.isExposure === 1 ? "Yes" : "No"}
          </span>
        ),
      },
      {
        key: "isActive",
        name: "Status",
        width: 150,
        resizable: true,
        sortable: true,
        renderCell: ({ row }) => {
          if (row.isLatest === 0) {
            return (
              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700">
                Historical (v{row.version})
              </span>
            )
          }
          return (
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                row.isActive === 1
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {row.isActive === 1 ? "Active" : "Inactive"} (v{row.version})
            </span>
          )
        },
      },
      {
        key: "version",
        name: "Version",
        width: 90,
        resizable: true,
        sortable: true,
      },
      {
        key: "modifiedBy",
        name: "Modified By",
        width: 200,
        resizable: true,
        sortable: true,
      },
      {
        key: "updatedAt",
        name: "Updated At",
        width: 180,
        resizable: true,
        sortable: true,
        renderCell: ({ row }) => dateFormatter.format(new Date(row.updatedAt)),
      },
      {
        key: "inactivatedBy",
        name: "Inactivated By",
        width: 200,
        resizable: true,
        sortable: true,
        renderCell: ({ row }) => row.inactivatedBy || "—",
      },
    ],
    []
  )

  const rowKeyGetter = (row: EngRule) => row.id

  const selectedCount = selectedRows.size
  const canEdit = selectedCount === 1 && 
    filteredData.find((r) => r.id === Array.from(selectedRows)[0])?.isLatest === 1
  const canToggleActive = selectedCount === 1 && 
    filteredData.find((r) => r.id === Array.from(selectedRows)[0])?.isLatest === 1
  const selectedRuleForToggle = selectedCount === 1 
    ? filteredData.find((r) => r.id === Array.from(selectedRows)[0]) 
    : null

  if (loading && data.length === 0) {
    return (
      <>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Settings</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Pro360 Eng Rules</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center p-4">
          <p className="text-muted-foreground">Loading rules...</p>
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
                <BreadcrumbLink href="/dashboard">Settings</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Pro360 Eng Rules</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Header with Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Pro360 Engagement Rules</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage engagement and exposure rules for Pro360 campaigns. Select a row to edit, activate/inactivate, or view history.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Rule
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <Input
                placeholder="Search by Event Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showHistory"
                  checked={showHistory}
                  onCheckedChange={(checked) => {
                    setShowHistory(Boolean(checked))
                    setSelectedRows(new Set())
                  }}
                />
                <label
                  htmlFor="showHistory"
                  className="text-sm font-medium cursor-pointer select-none"
                >
                  Show History
                </label>
              </div>
              {!showHistory && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="showOnlyActive"
                    checked={showOnlyActive}
                    onCheckedChange={(checked) => {
                      setShowOnlyActive(Boolean(checked))
                      setSelectedRows(new Set())
                    }}
                  />
                  <label
                    htmlFor="showOnlyActive"
                    className="text-sm font-medium cursor-pointer select-none"
                  >
                    Active Only
                  </label>
                </div>
              )}
            </div>

            {selectedCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedCount} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  disabled={!canEdit}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                {canToggleActive && selectedRuleForToggle && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleActive}
                    className="gap-2"
                  >
                    {selectedRuleForToggle.isActive === 1 ? (
                      <>
                        <PowerOff className="h-4 w-4" />
                        Inactivate
                      </>
                    ) : (
                      <>
                        <Power className="h-4 w-4" />
                        Activate
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Data Grid */}
        <div
          className="rounded-lg border shadow-sm bg-white pro360-eng-rules-grid"
          style={{ height: "calc(100vh - 360px)" }}
        >
          <DataGrid
            columns={columns}
            rows={filteredData}
            rowKeyGetter={rowKeyGetter}
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
              "--rdg-row-hover-background-color": "#f1f3f5",
              "--rdg-selection-color": "#e0f2fe",
            } as CSSProperties}
          />
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {filteredData.length} rule{filteredData.length !== 1 ? "s" : ""}
            {searchQuery && ` (filtered from ${data.length} total)`}
            {showHistory ? " (including history)" : " (current versions only)"}
          </div>
        </div>
        
        <style jsx global>{`
          .pro360-eng-rules-grid .rdg-row:nth-child(even) {
            background-color: #fafafa;
          }
          .pro360-eng-rules-grid .rdg-row[aria-selected="true"] {
            background-color: #e0f2fe !important;
          }
          .pro360-eng-rules-grid .rdg-row[aria-selected="true"]:hover {
            background-color: #bae6fd !important;
          }
        `}</style>
      </div>

      <EngRulesForm
        open={formOpen}
        onOpenChange={setFormOpen}
        rule={selectedRule}
        onSuccess={() => {
          fetchRules()
          setSelectedRows(new Set())
        }}
      />
    </>
  )
}

