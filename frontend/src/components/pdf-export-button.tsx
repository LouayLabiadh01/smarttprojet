/* eslint-disable import/order */
"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { generateSimplePdf } from "~/lib/simple-pdf-generator"

interface Project {
  id: number
  name: string
  description?: string
  color: string
  sprint_duration: number
  sprint_start: string
  image?: string
  is_ai_enabled: boolean
  is_archived: boolean
  tasks_summary: {
    total: number
    done: number
    in_progress: number
  }
  charts: {
    by_week: { name: string; value: number }[]
    by_sprint: { name: string; value: number }[]
    status: { name: string; value: number }[]
  }
}

interface PdfExportButtonProps {
  project: Project
  fullWidth?: boolean
}

export default function PdfExportButton({ project, fullWidth }: PdfExportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleExport = async () => {
    setIsGenerating(true)
    try {
      await generateSimplePdf(project)
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error)
      alert("Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button onClick={handleExport} disabled={isGenerating} className={fullWidth ? "w-full" : ""}>
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Génération...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Exporter en PDF
        </>
      )}
    </Button>
  )
}
