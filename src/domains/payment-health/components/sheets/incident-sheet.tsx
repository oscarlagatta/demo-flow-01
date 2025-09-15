"use client"

import type React from "react"

import { useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

import { toast } from "sonner"
import { RefreshCw } from "lucide-react"

import { useGetSplunkUmidbByAitIdUsWires } from "@/domains/payment-health/hooks/use-get-splunk-us-wires/use-get-umidb-by-ait"
import { useIncidents } from "@/domains/payment-health/hooks/use-get-splunk-us-wires/use-raise-incident"

interface IncidentSheetProps {
  isOpen: boolean
  onClose: () => void
  nodeTitle: string
  aitId: string
}

export function IncidentSheet({ isOpen, onClose, nodeTitle, aitId }: IncidentSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    subject: `Issue with ${nodeTitle} (${aitId})`,
    severity: "medium",
    description: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const aitNumber = Number.parseInt(aitId.replace("AIT ", ""), 10)
  const {
    data: umidData,
    isLoading: isLoadingUmid,
    isError: isUmidError,
  } = useGetSplunkUmidbByAitIdUsWires({
    aitID: aitNumber,
    enabled: isOpen && !isNaN(aitNumber),
  })

  const { createIncident } = useIncidents()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required"
    } else if (formData.subject.length > 100) {
      newErrors.subject = "Subject must be less than 100 characters"
    }

    if (!formData.severity) {
      newErrors.severity = "Please select a severity level"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters"
    } else if (formData.description.length > 1000) {
      newErrors.description = "Description must be less than 1000 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!umidData?.umid) {
      // Show a confirmation toast but allow the user to proceed
      toast.warning("Creating ticket without UMID data", {
        description: "The incident ticket will be created without UMID information.",
      })
    }

    setIsSubmitting(true)
    try {
      await createIncident({
        subject: formData.subject,
        severity: formData.severity,
        umid: umidData?.umid || null, // Allow null UMID
        description: formData.description,
      })

      const successMessage = umidData?.umid
        ? `Ticket created for ${nodeTitle} with ${formData.severity} severity. UMID: ${umidData.umid}`
        : `Ticket created for ${nodeTitle} with ${formData.severity} severity.`

      toast.success("Incident Ticket Created!", {
        description: successMessage,
        icon: <RefreshCw className="h-4 w-4 text-green-500" />,
      })

      // Reset form
      setFormData({
        subject: `Issue with ${nodeTitle} (${aitId})`,
        severity: "medium",
        description: "",
      })
      setErrors({})
      onClose()
    } catch (error) {
      toast.error("Failed to create incident ticket. Please try again.", {
        description: "Please check your connection and try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      subject: `Issue with ${nodeTitle} (${aitId})`,
      severity: "medium",
      description: "",
    })
    setErrors({})
    onClose()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[500px] max-w-[800px] sm:w-[700px] sm:max-w-[900px]">
        <SheetHeader>
          <SheetTitle>Create Incident Ticket</SheetTitle>
          <SheetDescription>
            Create an incident ticket for {nodeTitle} ({aitId})
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter incident subject"
              value={formData.subject}
              onChange={(e) => handleInputChange("subject", e.target.value)}
              className={errors.subject ? "border-red-500" : ""}
            />
            {errors.subject && <p className="text-sm font-medium text-red-500">{errors.subject}</p>}
          </div>

          {isLoadingUmid && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                <span className="text-sm text-gray-600">Loading incident details...</span>
              </div>
            </div>
          )}

          {!isLoadingUmid && !isUmidError && umidData && umidData.umid && (
            <div className="space-y-2 rounded-md bg-blue-50 p-3 border border-blue-200">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium text-blue-900">UMID</Label>
                <span className="text-sm font-mono text-blue-800">{umidData.umid}</span>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-blue-900">System Description</Label>
                <p className="text-sm text-blue-700">{umidData.description}</p>
              </div>
            </div>
          )}

          {!isLoadingUmid && !isUmidError && (!umidData || !umidData.umid) && (
            <div className="space-y-3 rounded-md bg-amber-50 p-4 border border-amber-200">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
                  <span className="text-amber-600 text-xs font-medium">!</span>
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-amber-800">No UMID data available</p>
                  <p className="text-sm text-amber-700">
                    The system could not retrieve UMID information for AIT {aitId}. This may occur if the transaction is
                    too recent or not yet processed.
                  </p>
                  <div className="text-xs text-amber-600 space-y-1">
                    <p>
                      <strong>Next steps:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li>Verify the AIT number is correct</li>
                      <li>Wait a few minutes and try again</li>
                      <li>You can still create the incident ticket manually</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isUmidError && (
            <div className="space-y-2 rounded-md bg-red-50 p-3 border border-red-200">
              <p className="text-sm text-red-700">
                Unable to load incident details. You can still create the ticket manually.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <Select value={formData.severity} onValueChange={(value) => handleInputChange("severity", value)}>
              <SelectTrigger className={errors.severity ? "border-red-500" : ""}>
                <SelectValue placeholder="Select severity level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            {errors.severity && <p className="text-sm font-medium text-red-500">{errors.severity}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the incident in detail..."
              className={`min-h-[120px] ${errors.description ? "border-red-500" : ""}`}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
            {errors.description && <p className="text-sm font-medium text-red-500">{errors.description}</p>}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoadingUmid}>
              {isSubmitting ? "Creating..." : "Create Ticket"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
