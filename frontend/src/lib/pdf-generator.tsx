/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable import/order */
"use client"


import { useState } from "react"

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

// Fonction pour générer et télécharger le PDF
export const generatePdf = async (project: Project) => {
  try {
    // Importation dynamique pour éviter les problèmes de SSR
    const { pdf } = await import("@react-pdf/renderer")
    const FileSaver = await import("file-saver")

    // Importation dynamique des styles et composants PDF
    const { default: PDFDocument } = await import("~/components/pdf-document")

    const blob = await pdf(<PDFDocument project={project} />).toBlob()
    FileSaver.default.saveAs(blob, `rapport-projet-${project.name.toLowerCase().replace(/\s+/g, "-")}.pdf`)
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error)
    alert("Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.")
  }
}

// Composant pour le lien de téléchargement PDF
export const PdfDownloadButton = ({ project }: { project: Project }) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleDownload = async () => {
    setIsLoading(true)
    try {
      await generatePdf(project)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button onClick={handleDownload} disabled={isLoading}>
      {isLoading ? "Génération..." : "Télécharger le PDF"}
    </button>
  )
}
