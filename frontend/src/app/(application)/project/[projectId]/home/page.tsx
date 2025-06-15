/* eslint-disable import/order */
import { StickiesSection } from "~/components/stickies-section"
import { QuicklinksSection } from "~/components/quicklinks-section"
import { RecentsSection } from "~/components/recents-section"
import PageHeader from "~/components/layout/PageHeader"
// Import the LayoutWrapper
import { LayoutWrapper } from "./layout-wrapper"

export default function Dashboard() {
  const currentDate = new Date()
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(currentDate)

  // Extract just the time portion (HH:MM)
  const timeParts = formattedDate.split(", ")[2]

  // Determine greeting based on time of day
  const hour = currentDate.getHours()
  let greeting = "Good morning"
  if (hour >= 12 && hour < 18) {
    greeting = "Good afternoon"
  } else if (hour >= 18) {
    greeting = "Good evening"
  }

  // Wrap the return statement with LayoutWrapper
  return (
      <div className="min-h-screen text-gray-300">
        {/* Top navigation */}
        <PageHeader breadCrumbs></PageHeader>

        {/* Main content */}
        <main className="p-6">
          {/* Greeting section */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-white">
                {hour >= 18 || hour < 6 ? "🌙️" : "☀️"} {greeting}, Louay Labiadh
              </h1>
              <p className="text-gray-500 mt-1">
                <span className="mr-1">📅</span>
                {formattedDate.split(", ").slice(0, 2).join(", ")} {timeParts}
              </p>
            </div>
          </div>

          {/* Quicklinks section */}
          <QuicklinksSection />

          {/* Stickies section */}
          <StickiesSection />

          {/* Recents section */}
          <RecentsSection />
        </main>
      </div>
  )
}
