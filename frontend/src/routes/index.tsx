import { Route, Routes } from 'react-router-dom'
import { HomePage } from '@/pages/home'
import { LoginPage } from '@/pages/login'
import { OnboardingPage } from '@/pages/onboarding'
import { DesignSystemPage } from '@/pages/dev/design'
import { RecallShell } from '@/app/shell/recall-shell'
import { ForceTheme } from '@/app/theme/force-theme'
import { AppHomePage } from '@/pages/app/home'
import { SessionsPage } from '@/pages/app/sessions'
import { SessionReviewPage } from '@/pages/app/session-detail'
import { RecordSessionPage } from '@/pages/app/record'
import { ProjectsPage } from '@/pages/app/projects'
import { ProjectDetailPage } from '@/pages/app/project-detail'
import { TasksPage } from '@/pages/app/tasks'
import { CalendarPage } from '@/pages/app/calendar'
import { SearchPage } from '@/pages/app/search'
import { ReviewsPage } from '@/pages/app/reviews'
import { PeoplePage } from '@/pages/app/people'
import { PersonDetailPage } from '@/pages/app/person-detail'
import { TeamsPage } from '@/pages/app/teams'
import { TeamDetailPage } from '@/pages/app/team-detail'
import { NotificationsPage } from '@/pages/app/notifications'
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
        <Route path="sessions/:sessionId" element={<SessionReviewPage />} />
        <Route path="record" element={<RecordSessionPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="people" element={<PeoplePage />} />
        <Route path="people/:personId" element={<PersonDetailPage />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="teams/:teamId" element={<TeamDetailPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
