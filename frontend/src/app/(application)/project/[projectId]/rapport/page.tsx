/* eslint-disable import/order */
import type { Metadata } from "next"
import ProjectReportPage from "~/components/project-report-page"

export const metadata: Metadata = {
  title: "Rapport de Projet | Admin Dashboard",
  description: "Interface administrateur pour générer des rapports détaillés de projet",
}

export default function Page() {
  return <ProjectReportPage />
}
