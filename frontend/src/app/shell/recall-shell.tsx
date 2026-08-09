import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Video, CheckSquare, FolderKanban } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Content } from "@/components/layout/content";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CommandMenu } from "@/components/navigation/command-menu";
import type { CommandItem } from "@/components/navigation/command-palette";
import { RecallAiPanel } from "@/components/ai/recall-ai-panel";
import { RecallAiProvider, useRecallAiStore } from "@/lib/ai/recall-ai-provider";
import { useMeetingReminders } from "@/data/calendar/use-meeting-reminders";
import { useMediaQuery } from "@/hooks";
import { useSearchIndex, type SearchEntry } from "@/data/live/use-search-index";
import { useToast } from "@/components/feedback/toast";
import { TutorialProvider } from "@/lib/onboarding/use-tutorial";
import { OnboardingDialog } from "@/components/onboarding/onboarding-dialog";
import { RecallSidebar } from "./recall-sidebar";
import { RecallTopbar } from "./recall-topbar";
import { ALL_NAV_ITEMS } from "./nav-config";

const ENTRY_META: Record<
  SearchEntry["type"],
  { group: string; icon: ReactNode }
> = {
  session: { group: "Meetings", icon: <Video /> },
  task: { group: "Tasks", icon: <CheckSquare /> },
  project: { group: "Projects", icon: <FolderKanban /> },
};

/**
 * The global ⌘K palette, mounted inside the AI provider so it can route `/ai` / `/ask` queries to
 * Recall AI. Merges workspace content (meetings, tasks, projects) with navigation, and escalates
 * any query to the assistant.
 */
function ShellCommandMenu({
  open,
  onOpenChange,
  onOpenAiPanel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenAiPanel: () => void;
}) {
  const navigate = useNavigate();
  const ai = useRecallAiStore();
  const entries = useSearchIndex();

  const items = useMemo<CommandItem[]>(() => {
    const content: CommandItem[] = entries.map((e) => ({
      id: e.id,
      label: e.title,
      sublabel: e.subtitle,
      group: ENTRY_META[e.type].group,
      icon: ENTRY_META[e.type].icon,
      onSelect: () => navigate(e.to),
    }));
    const nav: CommandItem[] = ALL_NAV_ITEMS.map((item) => ({
      id: item.to,
      label: item.label,
      icon: <item.icon />,
      group: "Go to",
      onSelect: () => navigate(item.to),
    }));
    return [...content, ...nav];
  }, [entries, navigate]);

  const onAskAi = (q: string) => {
    onOpenAiPanel();
    if (q.trim()) ai.send(q.trim());
  };

  return (
    <CommandMenu
      open={open}
      onOpenChange={onOpenChange}
      items={items}
      onAskAi={onAskAi}
    />
  );
}

const COLLAPSED_STORAGE_KEY = "recall:sidebar-collapsed";

/** The permanent shell every authenticated Recall page renders inside. Mount once above the /app route tree. */
export function RecallShell() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  const isTabletUp = useMediaQuery("(min-width: 768px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  useMeetingReminders();

  const [userCollapsed, setUserCollapsed] = useState(
    () => localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true",
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    if (isDesktop)
      localStorage.setItem(COLLAPSED_STORAGE_KEY, String(userCollapsed));
  }, [userCollapsed, isDesktop]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const collapsed = isDesktop ? userCollapsed : true;
  const { toast } = useToast();
  const onTourSkipped = () =>
    toast({
      title: "Tour skipped",
      description: "You can replay it anytime from Settings.",
    });

  return (
    <RecallAiProvider>
      <TutorialProvider onSkipped={onTourSkipped}>
        <OnboardingDialog />
        <AppShell
          sidebar={
            isTabletUp ? (
              <RecallSidebar
                collapsed={collapsed}
                onToggleCollapsed={
                  isDesktop ? () => setUserCollapsed((v) => !v) : undefined
                }
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
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
                }}
                exit={
                  reduceMotion
                    ? undefined
                    : {
                        opacity: 0,
                        y: -8,
                        transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
                      }
                }
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

        <ShellCommandMenu
          open={searchOpen}
          onOpenChange={setSearchOpen}
          onOpenAiPanel={() => setAiOpen(true)}
        />
      </TutorialProvider>
    </RecallAiProvider>
  );
}
