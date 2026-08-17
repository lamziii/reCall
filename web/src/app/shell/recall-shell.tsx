import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Outlet, useLocation, useNavigate } from "@/lib/router-compat";
import { AnimatePresence, motion } from "framer-motion";
import { useResolvedPreferences } from "@/settings/use-resolved-preferences";
import { Video, CheckSquare, FolderKanban, NotebookText, Plus, PanelLeftOpen, ArrowLeft } from "lucide-react";
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
import { NotesSidebar } from "./notes-sidebar";
import { ALL_NAV_ITEMS, APP_BASE } from "./nav-config";

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
    const actions: CommandItem[] = [
      { id: "action-new-note", label: "New note", icon: <Plus />, group: "Actions", onSelect: () => navigate("/app/notes/new") },
      { id: "action-search-notes", label: "Search notes", icon: <NotebookText />, group: "Actions", onSelect: () => navigate("/app/notes") },
    ];
    return [...actions, ...content, ...nav];
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

/** The slim rail shown when the Notes sidebar is collapsed for max writing space: expand, back to
 *  Recall, and a quick new-note. ⌘N/⌘P bind on the full sidebar, so expand to search. */
function NotesCollapsedRail({ onExpand, onBack }: { onExpand: () => void; onBack: () => void }) {
  const navigate = useNavigate();
  const btn =
    "focus-ring flex size-9 items-center justify-center rounded-md text-subtle-foreground transition-fast hover:bg-surface-hover hover:text-foreground";
  return (
    <aside className="flex h-full w-12 flex-col items-center gap-1 border-r border-border-subtle bg-surface py-2">
      <button type="button" aria-label="Back to Recall" onClick={onBack} className={btn}>
        <ArrowLeft className="size-4" />
      </button>
      <button type="button" aria-label="Expand notes sidebar" onClick={onExpand} className={btn}>
        <PanelLeftOpen className="size-4" />
      </button>
      <button type="button" aria-label="New note" onClick={() => navigate(`${APP_BASE}/notes/new`)} className={btn}>
        <Plus className="size-4" />
      </button>
    </aside>
  );
}

const COLLAPSED_STORAGE_KEY = "recall:sidebar-collapsed";
// Notes mode keeps its OWN collapse preference so hiding the Notes rail never touches the global
// Recall sidebar state (or vice-versa).
const NOTES_COLLAPSED_STORAGE_KEY = "recall:notes-sidebar-collapsed";

/** The permanent shell every authenticated Recall page renders inside. Mount once above the /app route tree. */
export function RecallShell() {
  const location = useLocation();
  const navigate = useNavigate();
  // Page transitions honor the resolved preference: Animations off, Page-transitions off, or OS/user
  // reduced-motion all suppress the route crossfade.
  const { pageTransitions } = useResolvedPreferences();
  const reduceMotion = !pageTransitions;

  // Settings has its own in-page tab navigation (nested route <Outlet/>). Collapse every
  // /app/settings/* path to one transition key so switching tabs doesn't remount the shared
  // settings header + nav — only the inner section content swaps.
  const settingsBase = `${APP_BASE}/settings`;
  const transitionKey = location.pathname.startsWith(settingsBase)
    ? settingsBase
    : location.pathname;

  const isTabletUp = useMediaQuery("(min-width: 768px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  useMeetingReminders();

  const [userCollapsed, setUserCollapsed] = useState(
    () => localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true",
  );
  const [notesCollapsed, setNotesCollapsed] = useState(
    () => localStorage.getItem(NOTES_COLLAPSED_STORAGE_KEY) === "true",
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  // Notes is a MODE for the SIDEBAR: while under /app/notes the global Recall nav rail is replaced by
  // the dedicated NotesSidebar (never both at once). The global header stays in every mode.
  const notesMode = location.pathname.startsWith(`${APP_BASE}/notes`);

  useEffect(() => {
    if (isDesktop)
      localStorage.setItem(COLLAPSED_STORAGE_KEY, String(userCollapsed));
  }, [userCollapsed, isDesktop]);

  useEffect(() => {
    localStorage.setItem(NOTES_COLLAPSED_STORAGE_KEY, String(notesCollapsed));
  }, [notesCollapsed]);

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
            !isTabletUp ? (
              <div className="hidden" />
            ) : notesMode ? (
              notesCollapsed ? (
                <NotesCollapsedRail onExpand={() => setNotesCollapsed(false)} onBack={() => navigate(APP_BASE)} />
              ) : (
                <NotesSidebar onCollapse={() => setNotesCollapsed(true)} />
              )
            ) : (
              <RecallSidebar
                collapsed={collapsed}
                onToggleCollapsed={
                  isDesktop ? () => setUserCollapsed((v) => !v) : undefined
                }
                showCollapseToggle={isDesktop}
              />
            )
          }
          // Notes is a MODE for the SIDEBAR only (dedicated NotesSidebar, never the global nav rail).
          // The global Recall header stays in every mode so theme, Recall AI, notifications, profile,
          // and the create + menu are always reachable — including while editing a note.
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
                key={transitionKey}
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
              className="w-[17.5rem] max-w-none border-none bg-transparent p-0"
            >
              {notesMode ? <NotesSidebar /> : <RecallSidebar collapsed={false} showCollapseToggle={false} />}
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
