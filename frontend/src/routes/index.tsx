import { Route, Routes } from 'react-router-dom'
import { HomePage } from '@/pages/home'
import { OnboardingPage } from '@/pages/onboarding'
import { DesignSystemPage } from '@/pages/dev/design'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/dev/design" element={<DesignSystemPage />} />
    </Routes>
  )
}
