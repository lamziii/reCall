'use client'

/**
 * React NodeView for CodeBlockLowlight — adds the subtle chrome (language selector + Copy button)
 * around the highlighted <pre><code>. lowlight applies the token decorations to NodeViewContent.
 */
import { createContext, useContext, useState } from 'react'
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { Check, Copy } from 'lucide-react'

/** Editor-level toggles for the code block chrome (driven by Notes preferences). Defaults show both. */
export const CodeBlockChromeContext = createContext<{ showLanguageSelector: boolean; showCopyButton: boolean }>({
  showLanguageSelector: true,
  showCopyButton: true,
})

// Curated from lowlight's `common` bundle. JSX/TSX are covered by javascript/typescript.
const LANGUAGES: [value: string, label: string][] = [
  ['plaintext', 'Plain text'],
  ['javascript', 'JavaScript'],
  ['typescript', 'TypeScript'],
  ['json', 'JSON'],
  ['xml', 'HTML'],
  ['css', 'CSS'],
  ['python', 'Python'],
  ['java', 'Java'],
  ['c', 'C'],
  ['cpp', 'C++'],
  ['csharp', 'C#'],
  ['bash', 'Bash'],
  ['sql', 'SQL'],
  ['markdown', 'Markdown'],
]

export function CodeBlockView({ node, updateAttributes, editor }: NodeViewProps) {
  const [copied, setCopied] = useState(false)
  const chrome = useContext(CodeBlockChromeContext)
  const language = (node.attrs.language as string | null) || 'plaintext'
  // A markdown fence can set a language (e.g. `js`, `py`) that isn't one of our curated options —
  // surface it as an extra option so the selector label stays truthful instead of falling back to Plain text.
  const options = LANGUAGES.some(([v]) => v === language) ? LANGUAGES : [[language, language], ...LANGUAGES]

  async function copy() {
    try {
      await navigator.clipboard.writeText(node.textContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  }

  return (
    <NodeViewWrapper className="recall-codeblock">
      <div className="recall-codeblock__bar" contentEditable={false}>
        {chrome.showLanguageSelector ? (
          <select
            className="recall-codeblock__lang"
            value={language}
            disabled={!editor.isEditable}
            onChange={(e) => updateAttributes({ language: e.target.value })}
            aria-label="Code language"
          >
            {options.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        ) : (
          <span />
        )}
        {chrome.showCopyButton && (
          <button type="button" className="recall-codeblock__copy" onClick={copy} aria-label="Copy code">
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
      <pre>
        <NodeViewContent<'code'> as="code" />
      </pre>
    </NodeViewWrapper>
  )
}
