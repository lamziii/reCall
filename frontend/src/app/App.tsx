import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/feedback'
import { ThemeProvider } from '@/app/theme/theme-provider'
import { AuthProvider } from '@/lib/auth/auth-context'
import { AppRoutes } from '@/routes'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
