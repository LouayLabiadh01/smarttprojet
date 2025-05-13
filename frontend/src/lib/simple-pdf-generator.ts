/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client"

export interface Project {
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

import { formatDate, calculateProjectProgress } from "./utils"

export async function generateSimplePdf(project: Project) {
  try {
    const jsPDFModule = await import("jspdf")
    const jsPDF = jsPDFModule.default

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    doc.text("Rapport de Projet", 20, 20)

    doc.setFontSize(18)
    doc.text(project.name, 20, 30)

    doc.setDrawColor(200, 200, 200)
    doc.line(20, 35, 190, 35)

    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("Informations du Projet", 20, 45)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(12)

    doc.text(`Description: ${project.description ?? "Aucune description"}`, 20, 55)
    doc.text(`Date de début: ${formatDate(project.sprint_start)}`, 20, 62)
    doc.text(`Durée des sprints: ${project.sprint_duration} jours`, 20, 69)
    doc.text(`État: ${project.is_archived ? "Archivé" : "Actif"}`, 20, 76)

    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("Progression Globale", 20, 90)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(12)

    const progress = calculateProjectProgress(project)
    doc.text(`${progress}% des tâches complétées`, 20, 100)

    doc.setDrawColor(220, 220, 220)
    doc.setFillColor(220, 220, 220)
    doc.rect(20, 105, 150, 5, "F")

    doc.setDrawColor(79, 70, 229)
    doc.setFillColor(79, 70, 229)
    doc.rect(20, 105, 150 * (progress / 100), 5, "F")

    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("Résumé des Tâches", 20, 120)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(12)
    doc.text(`Total: ${project.tasks_summary.total}`, 20, 130)
    doc.text(`Terminées: ${project.tasks_summary.done}`, 20, 137)
    doc.text(`En cours: ${project.tasks_summary.in_progress}`, 20, 144)

    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(10)
      doc.text(`Rapport généré le ${new Date().toLocaleDateString("fr-FR")} - Page ${i} sur ${pageCount}`, 20, 285)
    }

    doc.save(`rapport-projet-${project.name.toLowerCase().replace(/\s+/g, "-")}.pdf`)
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error)
    throw error
  }
}
