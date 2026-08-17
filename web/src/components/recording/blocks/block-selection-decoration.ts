/**
 * Notion-style multi-block selection. ProseMirror's native selection only paints the text glyphs; when
 * a mouse-drag selection spans MORE THAN ONE block we instead paint each spanned block full-width via
 * node decorations (`.recall-block-selected`). Single-block selections fall through to the normal
 * native text highlight (partial-line selection must stay possible). List items / atoms are decorated
 * as whole rows; containers (lists, callouts, tabs) are descended into so their children get the row.
 */
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export const BlockSelectionHighlight = Extension.create({
  name: 'blockSelectionHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('blockSelectionHighlight'),
        props: {
          decorations(state) {
            const { selection } = state
            // Only for a text selection that crosses block boundaries — single-block stays native.
            if (selection.empty || selection.$from.sameParent(selection.$to)) return null
            const decos: Decoration[] = []
            state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
              const name = node.type.name
              if (name === 'listItem' || name === 'taskItem' || node.isTextblock || node.isAtom) {
                decos.push(Decoration.node(pos, pos + node.nodeSize, { class: 'recall-block-selected' }))
                return false // don't also decorate this block's inner content
              }
              return true // descend into list / callout / tabs wrappers
            })
            return decos.length ? DecorationSet.create(state.doc, decos) : null
          },
        },
      }),
    ]
  },
})
