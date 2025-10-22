"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface EngRule {
  id: string
  eventName: string
  billingType: string
  tacticField: string | null
  isEngagement: number
  isExposure: number
  isActive: number
  version: number
}

interface EngRulesFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule?: EngRule | null
  onSuccess: () => void
}

export function EngRulesForm({
  open,
  onOpenChange,
  rule,
  onSuccess,
}: EngRulesFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    eventName: "",
    billingType: "CPX",
    tacticField: "",
    isEngagement: 0,
    isExposure: 0,
  })

  const isEditMode = !!rule

  useEffect(() => {
    if (rule) {
      setFormData({
        eventName: rule.eventName,
        billingType: rule.billingType,
        tacticField: rule.tacticField || "",
        isEngagement: rule.isEngagement,
        isExposure: rule.isExposure,
      })
    } else {
      setFormData({
        eventName: "",
        billingType: "CPX",
        tacticField: "",
        isEngagement: 0,
        isExposure: 0,
      })
    }
  }, [rule, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const endpoint = "/api/pro360-eng-rules"
      const method = isEditMode ? "PUT" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save rule")
      }

      toast({
        title: isEditMode ? "Rule Updated" : "Rule Created",
        description: isEditMode
          ? `Successfully created version ${data.version} of ${formData.eventName}`
          : `Successfully created ${formData.eventName}`,
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save rule",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? `Edit Rule: ${rule.eventName}` : "Create New Rule"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? `Editing will create version ${rule.version + 1}. The current status (${rule.isActive === 1 ? "Active" : "Inactive"}) will be preserved.`
                : "Fill in the details below to create a new engagement rule."}
            </DialogDescription>
            {isEditMode && rule.isActive === 0 && (
              <div className="mt-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
                ⚠️ This rule is currently inactive. The new version will remain
                inactive. You&apos;ll need to activate it separately after saving.
              </div>
            )}
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="eventName">
                Event Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="eventName"
                value={formData.eventName}
                onChange={(e) =>
                  setFormData({ ...formData, eventName: e.target.value })
                }
                placeholder="e.g., bcc_impression"
                required
                disabled={isEditMode}
                className={isEditMode ? "bg-gray-100 cursor-not-allowed" : ""}
              />
              {isEditMode && (
                <p className="text-xs text-muted-foreground">
                  Event name cannot be changed
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="billingType">
                Billing Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.billingType}
                onValueChange={(value) =>
                  setFormData({ ...formData, billingType: value })
                }
                required
              >
                <SelectTrigger id="billingType">
                  <SelectValue placeholder="Select billing type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CPX">CPX</SelectItem>
                  <SelectItem value="CPE">CPE</SelectItem>
                  <SelectItem value="CPVS">CPVS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tacticField">Tactic Field</Label>
              <Input
                id="tacticField"
                value={formData.tacticField}
                onChange={(e) =>
                  setFormData({ ...formData, tacticField: e.target.value })
                }
                placeholder="e.g., zone"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="isEngagement">
                  Is Engagement <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={String(formData.isEngagement)}
                  onValueChange={(value) =>
                    setFormData({ ...formData, isEngagement: Number(value) })
                  }
                  required
                >
                  <SelectTrigger id="isEngagement">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No (0)</SelectItem>
                    <SelectItem value="1">Yes (1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="isExposure">
                  Is Exposure <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={String(formData.isExposure)}
                  onValueChange={(value) =>
                    setFormData({ ...formData, isExposure: Number(value) })
                  }
                  required
                >
                  <SelectTrigger id="isExposure">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No (0)</SelectItem>
                    <SelectItem value="1">Yes (1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditMode ? "Update Rule" : "Create Rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

