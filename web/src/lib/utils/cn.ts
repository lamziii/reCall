import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Our type scale (styles/tokens/typography.css) uses semantic names — text-h1, text-label, etc.
// — instead of Tailwind's default text-sm/text-lg scale. Without registering them, tailwind-merge
// doesn't recognize them as font-size utilities and conflates them with text-color utilities
// (both are `text-*`), silently dropping the size class whenever a color class follows it.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        { text: ['display', 'h1', 'h2', 'h3', 'title', 'subtitle', 'body-lg', 'body', 'small', 'caption', 'label', 'code'] },
      ],
    },
  },
})

/** Merge conditional class names and resolve conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
