import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Home } from 'lucide-react'
import { PageContainer } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/feedback/empty-state'
import {
  HomeHeader,
  AttentionCard,
  TodaySchedule,
  AttentionList,
  RecentSessions,
  ActiveProjects,
  RecentActivity,
  HomeSkeleton,
  homeContainerVariants,
  homeItemVariants,
} from '@/components/home'
import { useHomeDashboardData } from '@/data/home/use-home-dashboard-data'
import { seedDummyData } from '@/data/sample/sample-data-service'

export function AppHomePage() {
  const navigate = useNavigate()
  const { state, refetch } = useHomeDashboardData()
  const reduceMotion = useReducedMotion()
  const [generating, setGenerating] = useState(false)

  async function handleGenerateSample() {
    setGenerating(true)
    try {
      await seedDummyData()
      refetch()
    } finally {
      setGenerating(false)
    }
  }

  if (state.status === 'loading') {
    return (
      <PageContainer>
        <HomeSkeleton />
      </PageContainer>
    )
  }

  if (state.status === 'error') {
    return (
      <PageContainer>
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            icon={<Home />}
            title="We couldn't load your workspace overview"
            action={
              <Button variant="secondary" onClick={refetch}>
                Try again
              </Button>
            }
          />
        </div>
      </PageContainer>
    )
  }

  if (state.status === 'empty') {
    return (
      <PageContainer>
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            icon={<Home />}
            title="Start building your team's memory"
            description="Record your first session or generate sample data to see how Recall organizes decisions, tasks, and knowledge."
            action={
              <div className="flex items-center gap-2">
                <Button onClick={() => navigate('/app/sessions')}>Record a session</Button>
                {import.meta.env.DEV && (
                  <Button variant="secondary" loading={generating} onClick={handleGenerateSample}>
                    Generate sample data
                  </Button>
                )}
              </div>
            }
          />
        </div>
      </PageContainer>
    )
  }

  const { data } = state

  return (
    <PageContainer className="gap-10">
      <motion.div
        className="flex flex-col gap-10"
        variants={reduceMotion ? undefined : homeContainerVariants}
        initial={reduceMotion ? undefined : 'initial'}
        animate={reduceMotion ? undefined : 'animate'}
      >
        <motion.div variants={reduceMotion ? undefined : homeItemVariants}>
          <HomeHeader
            greeting={data.greeting}
            onRecordSession={() => navigate('/app/sessions')}
            onImportRecording={() => navigate('/app/sessions')}
          />
        </motion.div>

        <motion.div variants={reduceMotion ? undefined : homeItemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-[65fr_35fr]">
          <AttentionCard item={data.primaryAttention} />
          <TodaySchedule sessions={data.todaySchedule} />
        </motion.div>

        <motion.div variants={reduceMotion ? undefined : homeItemVariants}>
          <AttentionList items={data.needsAttention} />
        </motion.div>

        <motion.div variants={reduceMotion ? undefined : homeItemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-[62fr_38fr]">
          <RecentSessions sessions={data.recentSessions} />
          <ActiveProjects projects={data.activeProjects} />
        </motion.div>

        <motion.div variants={reduceMotion ? undefined : homeItemVariants}>
          <RecentActivity items={data.recentActivity} />
        </motion.div>
      </motion.div>
    </PageContainer>
  )
}
