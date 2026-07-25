import { Route, Routes } from 'react-router-dom'
import { HomePage } from '@/pages/home'
import { LoginPage } from '@/pages/login'
import { OnboardingPage } from '@/pages/onboarding'
import { DesignSystemPage } from '@/pages/dev/design'
import { RecallShell } from '@/app/shell/recall-shell'
import { ForceTheme } from '@/app/theme/force-theme'
import { AppHomePage } from '@/pages/app/home'
import { SessionsPage } from '@/pages/app/sessions'
import { ProjectsPage } from '@/pages/app/projects'
import { TasksPage } from '@/pages/app/tasks'
import { CalendarPage } from '@/pages/app/calendar'
import { SearchPage } from '@/pages/app/search'
import { ReviewsPage } from '@/pages/app/reviews'
import { PeoplePage } from '@/pages/app/people'
import { TeamsPage } from '@/pages/app/teams'
import { SettingsPage } from '@/pages/app/settings'

export function AppRoutes() {
  return (
    <Routes>
      {/* Public/pre-auth surfaces are always dark — only the /app dashboard responds to the appearance toggle. */}
      <Route path="/" element={<ForceTheme theme="dark"><HomePage /></ForceTheme>} />
      <Route path="/login" element={<ForceTheme theme="dark"><LoginPage /></ForceTheme>} />
      <Route path="/onboarding" element={<ForceTheme theme="dark"><OnboardingPage /></ForceTheme>} />
      <Route path="/dev/design" element={<DesignSystemPage />} />

      <Route path="/app" element={<RecallShell />}>
        <Route index element={<AppHomePage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="people" element={<PeoplePage />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
