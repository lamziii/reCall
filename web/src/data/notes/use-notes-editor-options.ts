'use client'

/** Bridges Notes preferences → RichNotesEditor options + the editor-width container class. */
import { useRecallPreferences } from '@/settings/settings-context'
import type { NotesEditorOptions } from '@/components/recording/rich-notes-editor'
import type { NotesEditorWidth } from '@/settings/types'

export function useNotesEditorOptions(): NotesEditorOptions {
  const { preferences } = useRecallPreferences()
  const n = preferences.notes
  return {
    slashCommands: n.slashCommands,
    markdownShortcuts: n.markdownShortcuts,
    spellcheck: n.spellcheck,
    showCodeLanguageSelector: n.showCodeLanguageSelector,
    showCopyButton: n.showCopyButton,
    defaultTableSize: n.defaultTableSize,
    codeTheme: n.codeTheme,
    textSize: n.textSize,
    lineHeight: n.lineHeight,
  }
}

/** Max-width utility for the note editor column, per the Editor width preference. */
export function notesWidthClass(width: NotesEditorWidth): string {
  switch (width) {
    case 'narrow':
      return 'max-w-xl'
    case 'wide':
      return 'max-w-4xl'
    case 'full':
      return 'max-w-none'
    case 'default':
    default:
      return 'max-w-2xl'
  }
}
