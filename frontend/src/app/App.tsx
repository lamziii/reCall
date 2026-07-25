import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/feedback'
import { AppRoutes } from '@/routes'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  )
}
