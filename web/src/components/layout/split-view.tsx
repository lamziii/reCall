import { ResizablePanelGroup } from '@/components/ui/resizable'
import type { ResizablePanelGroupProps } from '@/components/ui/resizable'

export type SplitViewProps = Partial<Pick<ResizablePanelGroupProps, 'direction' | 'className'>> &
  Pick<ResizablePanelGroupProps, 'children'>

/** Sidebar-detail preset over ResizablePanelGroup — a narrower default range than a general split. */
export function SplitView({ direction = 'horizontal', className, children }: SplitViewProps) {
  return (
    <ResizablePanelGroup direction={direction} defaultSize={30} minSize={20} maxSize={45} className={className}>
      {children}
    </ResizablePanelGroup>
  )
}
