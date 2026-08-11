import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/feedback'
import { ThemeProvider } from '@/app/theme/theme-provider'
import { AuthProvider } from '@/lib/auth/auth-context'
import { RecallPreferencesProvider } from '@/settings/settings-context'
import { AppRoutes } from '@/routes'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <RecallPreferencesProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </RecallPreferencesProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
