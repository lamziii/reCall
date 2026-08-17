'use client'

/**
 * Callout — a restrained highlighted box: an icon + rich block content. Content is real editor blocks
 * (paragraphs, lists…) so it persists like any other. Icon is a small emoji chooser; styling is
 * deliberately quiet (one neutral surface, no rainbow palette).
 */
import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, type NodeViewProps, type Editor } from '@tiptap/react'
import { EmojiPopover } from '@/components/notes/emoji-popover'
import { useEditorSurface } from './editor-surface'

export const CalloutBlock = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  addAttributes() {
    return { icon: { default: '💡' } }
  },
  parseHTML() {
    return [{ tag: 'div[data-callout]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', { ...HTMLAttributes, 'data-callout': '' }, 0]
  },
  addNodeView() {
    return ReactNodeViewRenderer(CalloutView)
  },
})

export function insertCallout(editor: Editor, range: { from: number; to: number }) {
  editor.chain().focus().deleteRange(range).insertContent({ type: 'callout', attrs: { icon: '💡' }, content: [{ type: 'paragraph' }] }).run()
}

function CalloutView({ node, updateAttributes, editor }: NodeViewProps) {
  const surface = useEditorSurface()
  const editable = editor.isEditable && !surface.compact
  const icon = (node.attrs.icon as string) || '💡'
  const trigger = (
    <button type="button" contentEditable={false} className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded text-[1.1rem] leading-none" aria-label="Callout icon">
      {icon}
    </button>
  )
  return (
    <NodeViewWrapper className="recall-callout">
      <div className="flex gap-2.5 rounded-lg border border-border-subtle bg-surface p-3">
        {editable ? <EmojiPopover value={icon} onPick={(e) => updateAttributes({ icon: e ?? '💡' })} trigger={trigger} /> : <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center text-[1.1rem] leading-none">{icon}</span>}
        <NodeViewContent className="min-w-0 flex-1" />
      </div>
    </NodeViewWrapper>
  )
}
