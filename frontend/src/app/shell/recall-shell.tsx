import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AppShell } from '@/components/layout/app-shell'
import { Content } from '@/components/layout/content'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { CommandMenu } from '@/components/navigation/command-menu'
import { RecallAiPanel } from '@/components/ai/recall-ai-panel'
import { RecallAiProvider } from '@/lib/ai/recall-ai-provider'
import { useMeetingReminders } from '@/data/calendar/use-meeting-reminders'
import { useMediaQuery } from '@/hooks'
import { RecallSidebar } from './recall-sidebar'
import { RecallTopbar } from './recall-topbar'
import { ALL_NAV_ITEMS } from './nav-config'

const COLLAPSED_STORAGE_KEY = 'recall:sidebar-collapsed'

/** The permanent shell every authenticated Recall page renders inside. Mount once above the /app route tree. */
export function RecallShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const reduceMotion = useReducedMotion()

  const isTabletUp = useMediaQuery('(min-width: 768px)')
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  useMeetingReminders()

  const [userCollapsed, setUserCollapsed] = useState(() => localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)

  useEffect(() => {
    if (isDesktop) localStorage.setItem(COLLAPSED_STORAGE_KEY, String(userCollapsed))
  }, [userCollapsed, isDesktop])

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  const collapsed = isDesktop ? userCollapsed : true

  return (
    <RecallAiProvider>
      <AppShell
        sidebar={
          isTabletUp ? (
            <RecallSidebar
              collapsed={collapsed}
              onToggleCollapsed={isDesktop ? () => setUserCollapsed((v) => !v) : undefined}
              showCollapseToggle={isDesktop}
            />
          ) : (
            <div className="hidden" />
          )
        }
        header={
          <RecallTopbar
            onOpenSearch={() => setSearchOpen(true)}
            onOpenMobileNav={() => setMobileNavOpen(true)}
            showMobileMenuButton={!isTabletUp}
            aiOpen={aiOpen}
            onToggleAi={() => setAiOpen((v) => !v)}
          />
        }
      >
        <Content>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              className="flex h-full flex-1 flex-col"
              initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8, transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] } }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Content>
      </AppShell>

      {!isTabletUp && (
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent
            side="left"
            aria-label="Navigation"
            className="w-[var(--sidebar-width)] max-w-none border-none bg-transparent p-0"
          >
            <RecallSidebar collapsed={false} showCollapseToggle={false} />
          </SheetContent>
        </Sheet>
      )}

      <RecallAiPanel open={aiOpen} onClose={() => setAiOpen(false)} />

      <CommandMenu
        open={searchOpen}
        onOpenChange={setSearchOpen}
        placeholder="Search Recall or jump to..."
        items={ALL_NAV_ITEMS.map((item) => ({
          id: item.to,
          label: item.label,
          icon: <item.icon />,
          group: 'Go to',
          onSelect: () => navigate(item.to),
        }))}
      />
    </RecallAiProvider>
  )
}
