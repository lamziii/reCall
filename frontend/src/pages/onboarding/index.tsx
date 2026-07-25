import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Caption } from '@/components/typography'
import { useToast } from '@/components/feedback'
import { DURATION, EASE_STANDARD } from '@/styles/animations/presets'
import { OnboardingLayout } from './onboarding-layout'
import { OnboardingHeader } from './onboarding-header'
import { OnboardingProgress } from './onboarding-progress'
import { OnboardingStep } from './onboarding-step'
import { WorkspaceForm } from './workspace-form'
import { PreferencesForm } from './preferences-form'
import { UseCaseSelection } from './use-case-selection'
import { InviteMembers } from './invite-members'
import { INITIAL_ONBOARDING_DATA, STEP_COUNT, type OnboardingData } from './types'

const containerVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_STANDARD } },
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const reduceMotion = useReducedMotion()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING_DATA)

  function patch(update: Partial<OnboardingData>) {
    setData((current) => ({ ...current, ...update }))
  }

  function finish() {
    toast({ title: 'Workspace created', description: `${data.workspaceName || 'Your workspace'} is ready to go.`, variant: 'success' })
    navigate('/')
  }

  function handleBack() {
    if (step === 1) {
      navigate('/')
      return
    }
    setStep((current) => current - 1)
  }

  function handleContinue() {
    if (step === STEP_COUNT) {
      finish()
      return
    }
    setStep((current) => current + 1)
  }

  return (
    <OnboardingLayout>
      <Button
        variant="text"
        size="sm"
        leftIcon={<ArrowLeft />}
        onClick={handleBack}
        className="fixed left-6 top-6 md:left-10 md:top-10"
      >
        Back
      </Button>

      <motion.div
        variants={reduceMotion ? undefined : containerVariants}
        initial={reduceMotion ? undefined : 'initial'}
        animate={reduceMotion ? undefined : 'animate'}
      >
        <motion.div variants={reduceMotion ? undefined : itemVariants}>
          <OnboardingHeader />
        </motion.div>

        <motion.div variants={reduceMotion ? undefined : itemVariants} className="mt-14">
          <OnboardingProgress step={step} />
        </motion.div>

        <motion.div variants={reduceMotion ? undefined : itemVariants} className="mt-10">
          <OnboardingStep step={step}>
            {step === 1 && <WorkspaceForm data={data} onChange={patch} />}
            {step === 2 && <PreferencesForm data={data} onChange={patch} />}
            {step === 3 && <UseCaseSelection data={data} onChange={patch} />}
            {step === 4 && <InviteMembers data={data} onChange={patch} />}
          </OnboardingStep>
        </motion.div>

        <motion.div variants={reduceMotion ? undefined : itemVariants} className="mt-10 flex flex-col items-center gap-4">
          <Button size="lg" fullWidth onClick={handleContinue}>
            Continue
          </Button>

          {step === STEP_COUNT && (
            <Button variant="text" size="sm" onClick={finish}>
              Skip for now
            </Button>
          )}

          <Caption className="text-subtle-foreground">You can change these anytime.</Caption>
        </motion.div>
      </motion.div>
    </OnboardingLayout>
  )
}
