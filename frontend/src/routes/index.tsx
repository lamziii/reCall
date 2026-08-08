import { Route, Routes } from 'react-router-dom'
import { HomePage } from '@/pages/home'
import { PlansPage } from '@/pages/plans'
import { LoginPage } from '@/pages/login'
import { OnboardingPage } from '@/pages/onboarding'
import { DesignSystemPage } from '@/pages/dev/design'
import { TranscriptionBenchmarkPage } from '@/pages/dev/transcription-benchmark'
import { RecallShell } from '@/app/shell/recall-shell'
import { ForceTheme } from '@/app/theme/force-theme'
import { RequireAuth, RequireOnboarded, RedirectIfAuthed } from '@/lib/auth/require-auth'
import { WorkspaceProvider } from '@/data/live/workspace-context'
import { AppHomePage } from '@/pages/app/home'
import { AssistantPage } from '@/pages/app/assistant'
import { SessionsPage } from '@/pages/app/sessions'
import { SessionReviewPage } from '@/pages/app/session-detail'
import { RecordSessionPage } from '@/pages/app/record'
import { ProjectsPage } from '@/pages/app/projects'
import { ProjectDetailPage } from '@/pages/app/project-detail'
import { TasksPage } from '@/pages/app/tasks'
import { CalendarPage } from '@/pages/app/calendar'
import { UsagePage } from '@/pages/app/usage'
import { ReviewsPage } from '@/pages/app/reviews'
import { PeoplePage } from '@/pages/app/people'
import { PersonDetailPage } from '@/pages/app/person-detail'
import { TeamsPage } from '@/pages/app/teams'
import { TeamDetailPage } from '@/pages/app/team-detail'
import { NotificationsPage } from '@/pages/app/notifications'
import { SettingsPage } from '@/pages/app/settings'
import { DevTaskboardPage } from '@/pages/tasks'

export function AppRoutes() {
  return (
    <Routes>
      {/* Public/pre-auth surfaces are always dark — only the /app dashboard responds to the appearance toggle. */}
      <Route path="/" element={<ForceTheme theme="dark" syncDocument><HomePage /></ForceTheme>} />
      <Route path="/plans" element={<ForceTheme theme="dark" syncDocument><PlansPage /></ForceTheme>} />
      <Route path="/login" element={<ForceTheme theme="dark" syncDocument><RedirectIfAuthed><LoginPage /></RedirectIfAuthed></ForceTheme>} />
      <Route path="/onboarding" element={<ForceTheme theme="dark" syncDocument><OnboardingPage /></ForceTheme>} />
      <Route path="/dev/design" element={<DesignSystemPage />} />
      {/* Internal transcription benchmark tool — auth-gated (needs an ID token to call the function). */}
      <Route path="/dev/transcription-benchmark" element={<RequireAuth><TranscriptionBenchmarkPage /></RequireAuth>} />
      {/* Internal development task board (Uvejs & Lorik) — auth-gated, NOT in the customer sidebar,
          and deliberately NOT behind RequireOnboarded so it's reachable independent of the app shell. */}
      <Route path="/tasks" element={<RequireAuth><DevTaskboardPage /></RequireAuth>} />

      <Route
        path="/app"
        element={
          <RequireAuth>
            <RequireOnboarded>
              <WorkspaceProvider>
                <RecallShell />
              </WorkspaceProvider>
            </RequireOnboarded>
          </RequireAuth>
        }
      >
        <Route index element={<AppHomePage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="sessions/:sessionId" element={<SessionReviewPage />} />
        <Route path="record" element={<RecordSessionPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="usage" element={<UsagePage />} />
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
