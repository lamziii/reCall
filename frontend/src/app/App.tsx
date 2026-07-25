import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/feedback'
import { ThemeProvider } from '@/app/theme/theme-provider'
import { AppRoutes } from '@/routes'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
