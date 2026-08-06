import { useNavigate } from 'react-router-dom'
import { Wordmark } from '@/components/branding/logo'
import { Button } from '@/components/ui/button'

export function PlansHeader() {
  const navigate = useNavigate()

  return (
    <header className="border-b border-transparent">
      <nav aria-label="Primary" className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button onClick={() => navigate('/')} className="focus-ring rounded-md" aria-label="Recall home">
          <Wordmark size="lg" />
        </button>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            Sign in
          </Button>
          <Button size="sm" onClick={() => navigate('/onboarding')}>
            Start free
          </Button>
        </div>
      </nav>
    </header>
  )
}
