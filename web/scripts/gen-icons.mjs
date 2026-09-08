// Generator: builds src/components/icons/index.tsx from the SVG icon pack in src/svg/icons.
// Maps lucide-react export names -> pack file names so component imports stay drop-in.
// Run with `node scripts/gen-icons.mjs` from web/ after adding icons or editing the map below.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SVG = (variant, name) => path.join(ROOT, 'src/svg/icons', variant, `${name}.svg`)

// lucide name -> new-pack line icon. All line variant.
const MAP = {
  AlertCircle: 'exclamation-circle', AlertTriangle: 'exclamation-triangle', Archive: 'archive',
  ArrowDown: 'arrow-down', ArrowDownToLine: 'arrow-to-bracket-down', ArrowLeft: 'arrow-left',
  ArrowRight: 'arrow-right', ArrowRightToLine: 'arrow-to-bracket-right', ArrowUp: 'arrow-up',
  ArrowUpDown: 'arrows-up-down', BarChart3: 'chart-bar', Bell: 'bell', Calendar: 'calendar',
  CalendarDays: 'calendar', Check: 'check', CheckCheck: 'checks', CheckCircle2: 'check-circle',
  CheckSquare: 'check-square', ChevronDown: 'chevron-small-down', ChevronLeft: 'chevron-small-left',
  ChevronRight: 'chevron-small-right', ChevronUp: 'chevron-small-up', Circle: 'circle',
  CircleQuestionMark: 'question-circle', ClipboardCheck: 'clipboard', Clock: 'clock-3h', Code: 'code',
  Copy: 'copy', CreditCard: 'credit-card', Database: 'database', DollarSign: 'dollar',
  Download: 'arrow-to-bracket-down', ExternalLink: 'arrow-from-square-up-right', Eye: 'eye', EyeOff: 'eye-slash',
  FileIcon: 'file', FileText: 'file', Film: 'film-strip', Flag: 'flag', Folder: 'folder',
  FolderKanban: 'folder', Globe: 'globe', GripVertical: 'grip-vertical', HelpCircle: 'question-circle',
  History: 'history', Home: 'home', Image: 'image', ImageIcon: 'image', Inbox: 'inbox', Info: 'text-i-circle',
  KeyRound: 'key', Languages: 'translate', Layers: 'layers', LayoutGrid: 'grid-2x2', Link2: 'link',
  List: 'list', Lock: 'lock-locked', LogOut: 'arrow-from-bracket-right', Mail: 'envelope',
  Menu: 'menu', MessageSquare: 'chat-bubble', Mic: 'mic', Minus: 'minus',
  MoreHorizontal: 'dots-three-horizontal', Music: 'musical-note', NotebookText: 'book',
  Paperclip: 'paperclip', Pause: 'pause', PenLine: 'pencil', Pencil: 'pencil', Pin: 'thumbtack', Play: 'play',
  PlayCircle: 'play-circle', Plus: 'plus', Receipt: 'receipt', RefreshCw: 'arrows-rotate-cw-horizontal',
  Rocket: 'rocket-launch', RotateCcw: 'arrow-rotate-ccw-up', RotateCw: 'arrow-rotate-cw-up',
  Search: 'magnifying-glass', Settings: 'gear', Share2: 'share-network', Sparkle: 'sparkles',
  Sparkles: 'sparkles', Square: 'square', SquarePen: 'pencil-square', Star: 'star', Table: 'table',
  Target: 'bullseye', Trash2: 'bin', Undo2: 'arrow-u-up-left', Upload: 'arrow-from-bracket-up',
  User: 'person', UserPlus: 'person-plus', Users: 'people', UsersRound: 'people', Video: 'video-camera', X: 'x',
}

// Solid variants exported under distinct names (used for filled/selected states and the
// primary sidebar nav, where line icons read too faint against the muted foreground).
const SOLID = {
  StarSolid: 'star', SquareSolid: 'square', FlagSolid: 'flag', PinSolid: 'thumbtack',
  // Sidebar nav set — same lucide names + `Solid` suffix.
  HomeSolid: 'home', SparklesSolid: 'sparkles', MicSolid: 'mic', NotebookTextSolid: 'book',
  FolderKanbanSolid: 'folder', CheckSquareSolid: 'check-square', CalendarSolid: 'calendar',
  BarChart3Solid: 'chart-bar', UsersSolid: 'people', UsersRoundSolid: 'people',
  ClipboardCheckSolid: 'clipboard', SettingsSolid: 'gear', BellSolid: 'bell',
  CircleQuestionMarkSolid: 'question-circle', UserSolid: 'person',
}

function inner(variant, name) {
  const raw = fs.readFileSync(SVG(variant, name), 'utf8').trim()
  const gt = raw.indexOf('>')
  const close = raw.lastIndexOf('</svg>')
  return raw.slice(gt + 1, close).trim().replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
}

const header = `// AUTO-GENERATED from src/svg/icons by scripts/gen-icons.mjs. Do not edit by hand.
// Line/solid icon pack wrapped as lucide-compatible React components (currentColor + 1em sizing).
import type { ComponentType, SVGProps } from 'react'

export type IconProps = SVGProps<SVGSVGElement>
/** Shared type for an icon component — satisfied by both these icons and lucide-react icons. */
export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

function make(inner: string) {
  return function Icon(props: IconProps) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="none" {...props} dangerouslySetInnerHTML={{ __html: inner }} />
    )
  }
}
`

let body = ''
for (const [name, file] of Object.entries(MAP)) {
  body += `export const ${name} = /*#__PURE__*/ make(\`${inner('line', file)}\`)\n`
}
for (const [name, file] of Object.entries(SOLID)) {
  body += `export const ${name} = /*#__PURE__*/ make(\`${inner('solid', file)}\`)\n`
}

const out = path.join(ROOT, 'src/components/icons/index.tsx')
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, header + '\n' + body)
console.log(`wrote ${out}: ${Object.keys(MAP).length} line + ${Object.keys(SOLID).length} solid`)
