/* eslint-disable @typescript-eslint/prefer-optional-chain */
/* eslint-disable import/order */
"use client"

import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer"
import { formatDate } from "~/lib/utils"
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
// Enregistrer les polices
Font.register({
  family: "Roboto",
  fonts: [
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular.ttf", fontWeight: 400 },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium.ttf", fontWeight: 500 },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold.ttf", fontWeight: 700 },
  ],
})

// Styles pour le PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Roboto",
    fontSize: 12,
    color: "#333",
  },
  section: {
    marginBottom: 20,
  },
  header: {
    marginBottom: 20,
    borderBottom: "1px solid #eee",
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 500,
    marginBottom: 15,
    color: "#666",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 10,
    color: "#333",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  infoLabel: {
    width: 120,
    fontWeight: 500,
  },
  infoValue: {
    flex: 1,
  },
  progressBar: {
    height: 10,
    marginTop: 5,
    marginBottom: 15,
    backgroundColor: "#eee",
    borderRadius: 5,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4f46e5",
    borderRadius: 5,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statItem: {
    alignItems: "center",
    width: "30%",
  },
  statValue: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: "#666",
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    minHeight: 30,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#f9fafb",
    fontWeight: 700,
  },
  tableCell: {
    padding: 5,
    flex: 1,
  },
  statusCell: {
    padding: 5,
    width: 80,
  },
  assigneeCell: {
    padding: 5,
    width: 100,
  },
  statusBadge: {
    padding: 3,
    borderRadius: 4,
    fontSize: 10,
    textAlign: "center",
    color: "white",
  },
  statusTodo: {
    backgroundColor: "#f97316",
  },
  statusInProgress: {
    backgroundColor: "#3b82f6",
  },
  statusCompleted: {
    backgroundColor: "#22c55e",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 10,
    color: "#666",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
})

// Composant pour le badge de statut
const StatusBadge = ({ status }: { status: string }) => {
  let badgeStyle
  let label

  switch (status) {
    case "todo":
      badgeStyle = { ...styles.statusBadge, ...styles.statusTodo }
      label = "À faire"
      break
    case "in-progress":
      badgeStyle = { ...styles.statusBadge, ...styles.statusInProgress }
      label = "En cours"
      break
    case "completed":
      badgeStyle = { ...styles.statusBadge, ...styles.statusCompleted }
      label = "Terminé"
      break
    default:
      badgeStyle = styles.statusBadge
      label = status
  }

  return <Text style={badgeStyle}>{label}</Text>
}

// Composant pour le rapport PDF
const PDFDocument = ({ project }: { project: Project }) => {
  // Calculer la progression
  const progress = project.tasks_summary.total > 0 ? Math.round((project.tasks_summary.done / project.tasks_summary.total) * 100) : 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.title}>Rapport de Projet</Text>
          <Text style={styles.subtitle}>{project.name}</Text>
        </View>

        {/* Informations de base */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations du Projet</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Description:</Text>
            <Text style={styles.infoValue}>{project.description}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date de début:</Text>
            <Text style={styles.infoValue}>{formatDate(project.sprint_start)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Durée des sprints:</Text>
            <Text style={styles.infoValue}>{project.sprint_duration} jours</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>État:</Text>
            <Text style={styles.infoValue}>{project.is_archived ? "Archivé" : "Actif"}</Text>
          </View>
        </View>

        {/* Progression */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progression Globale</Text>
          <Text>{progress}% des tâches complétées</Text>
          <View style={styles.progressBar}>
            <View style={{ ...styles.progressFill, width: `${progress}%` }} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{project.tasks_summary.total}</Text>
              <Text style={styles.statLabel}>Tâches totales</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{project.tasks_summary.done}</Text>
              <Text style={styles.statLabel}>Tâches terminées</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{project.tasks_summary.in_progress}</Text>
              <Text style={styles.statLabel}>Tâches en cours</Text>
            </View>
          </View>
        </View>

        {/* Graphiques */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Graphiques</Text>
          {/* Graphiques à ajouter ici si nécessaire */}
        </View>

        {/* Pied de page */}
        <View style={styles.footer}>
          <Text>Rapport généré le {new Date().toLocaleDateString("fr-FR")}</Text>
        </View>
      </Page>
    </Document>
  )
}

export default PDFDocument
