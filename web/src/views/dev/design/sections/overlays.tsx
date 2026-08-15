import { useState } from 'react'
import { Copy, FileText, Folder, Pencil, Search as SearchIcon, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { CommandMenu } from '@/components/navigation/command-menu'
import { SearchOverlay } from '@/components/navigation/search-overlay'
import { KeyboardShortcut } from '@/components/ui/keyboard-shortcut'
import { useToast } from '@/components/feedback'
import { PlaygroundSection, PlaygroundRow } from '../playground-section'

const SEARCH_RESULTS = [
  { id: '1', title: 'Q3 Product Strategy Sync', description: 'Session · 2h ago', icon: <FileText /> },
  { id: '2', title: 'Apollo Launch', description: 'Project', icon: <Folder /> },
  { id: '3', title: 'Review onboarding flow', description: 'Task · Due Friday', icon: <Sparkles /> },
]

export function OverlaysSection() {
  const [commandOpen, setCommandOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const { toast } = useToast()

  const filteredResults = SEARCH_RESULTS.filter((r) => r.title.toLowerCase().includes(searchQuery.toLowerCase()))

  function handleConfirmDelete() {
    setConfirmLoading(true)
    setTimeout(() => {
      setConfirmLoading(false)
      setConfirmOpen(false)
      toast({ title: 'Session deleted', variant: 'danger' })
    }, 1200)
  }

  return (
    <PlaygroundSection
      id="overlays"
      title="Overlays"
      description="Tooltip, dropdown, popover, context menu, dialog, confirm dialog, sheet, command menu, search — all built on one Popover/Portal engine. Escape, outside-click, and focus return work the same way everywhere."
    >
      <PlaygroundRow label="Tooltip">
        <Tooltip content="Saved automatically">
          <Button variant="secondary">Hover me</Button>
        </Tooltip>
      </PlaygroundRow>

      <PlaygroundRow label="Popover">
        <Popover>
          <PopoverTrigger>
            <Button variant="secondary">Open popover</Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4">
            <p className="text-small font-medium text-foreground">Quick note</p>
            <p className="mt-1 text-small text-muted-foreground">Popovers hold light-weight contextual content, not full forms.</p>
          </PopoverContent>
        </Popover>
      </PlaygroundRow>

      <PlaygroundRow label="Interactive: Dropdown menu">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="secondary">Session actions</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Q3 Product Strategy Sync</DropdownMenuLabel>
            <DropdownMenuItem icon={<Pencil />}>Rename</DropdownMenuItem>
            <DropdownMenuItem icon={<Copy />}>Duplicate</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              icon={<Trash2 />}
              danger
              onSelect={() => setConfirmOpen(true)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          variant="danger"
          title="Delete this session?"
          description="This can't be undone. The recording and summary will be permanently removed."
          confirmLabel="Delete session"
          onConfirm={handleConfirmDelete}
          loading={confirmLoading}
        />
      </PlaygroundRow>

      <PlaygroundRow label="Interactive: Context menu (right-click)">
        <ContextMenu>
          <ContextMenuTrigger>
            <div className="flex h-24 w-64 items-center justify-center rounded-lg border border-dashed border-border text-small text-muted-foreground">
              Right-click this area
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem icon={<Pencil />}>Rename</ContextMenuItem>
            <ContextMenuItem icon={<Copy />}>Duplicate</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem icon={<Trash2 />} danger>
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </PlaygroundRow>

      <PlaygroundRow label="Interactive: Dialog">
        <Dialog>
          <DialogTrigger>
            <Button>Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename session</DialogTitle>
              <DialogDescription>Give this session a title your team will recognize later.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary">Cancel</Button>
              <Button onClick={() => toast({ title: 'Session renamed', variant: 'success' })}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PlaygroundRow>

      <PlaygroundRow label="Interactive: Sheet (Drawer)">
        <Sheet>
          <SheetTrigger>
            <Button variant="secondary">Open sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Session details</SheetTitle>
              <SheetDescription>Sheets hold heavier content than a popover without leaving the current page.</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <Button variant="secondary">Close</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </PlaygroundRow>

      <PlaygroundRow label="Interactive: Command menu">
        <Button leftIcon={<SearchIcon />} variant="secondary" onClick={() => setCommandOpen(true)}>
          Open command menu
          <KeyboardShortcut keys={['⌘', 'K']} className="ml-2" />
        </Button>
        <CommandMenu
          open={commandOpen}
          onOpenChange={setCommandOpen}
          items={[
            { id: 'new-session', label: 'Start new session', group: 'Actions', icon: <Sparkles />, onSelect: () => toast({ title: 'New session started' }) },
            { id: 'search-sessions', label: 'Search sessions', group: 'Navigate', icon: <FileText />, onSelect: () => {} },
            { id: 'open-projects', label: 'Go to Projects', group: 'Navigate', icon: <Folder />, onSelect: () => {} },
          ]}
        />
      </PlaygroundRow>

      <PlaygroundRow label="Interactive: Search overlay">
        <Button leftIcon={<SearchIcon />} variant="secondary" onClick={() => setSearchOpen(true)}>
          Open search
        </Button>
        <SearchOverlay
          open={searchOpen}
          onOpenChange={setSearchOpen}
          query={searchQuery}
          onQueryChange={setSearchQuery}
          results={filteredResults}
          onSelect={() => {}}
        />
      </PlaygroundRow>
    </PlaygroundSection>
  )
}
