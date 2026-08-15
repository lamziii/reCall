import { motion, useReducedMotion } from 'framer-motion'

type NodeType = 'project' | 'meeting' | 'person' | 'decision'

interface GraphNode {
  id: string
  label: string
  type: NodeType
  x: number
  y: number
}

// Hand-placed layout — a "Pricing" project at the centre, with the meetings,
// people, and decisions that feed into it orbiting around it.
const NODES: GraphNode[] = [
  { id: 'pricing', label: 'Pricing', type: 'project', x: 300, y: 210 },
  { id: 'm1', label: 'Product sync', type: 'meeting', x: 108, y: 96 },
  { id: 'm2', label: 'Pricing review', type: 'meeting', x: 486, y: 120 },
  { id: 'm3', label: 'GTM standup', type: 'meeting', x: 150, y: 330 },
  { id: 'sarah', label: 'Sarah', type: 'person', x: 470, y: 300 },
  { id: 'marcus', label: 'Marcus', type: 'person', x: 300, y: 44 },
  { id: 'd1', label: '$20 Pro tier', type: 'decision', x: 96, y: 210 },
  { id: 'd2', label: 'Annual only', type: 'decision', x: 512, y: 224 },
]

const EDGES: [string, string][] = [
  ['pricing', 'm1'],
  ['pricing', 'm2'],
  ['pricing', 'm3'],
  ['pricing', 'sarah'],
  ['pricing', 'marcus'],
  ['pricing', 'd1'],
  ['pricing', 'd2'],
  ['m2', 'sarah'],
  ['m2', 'd2'],
  ['m1', 'd1'],
  ['m1', 'marcus'],
]

const TYPE_STYLE: Record<NodeType, { dot: string; ring: string; r: number }> = {
  project: { dot: 'var(--color-accent-500)', ring: 'var(--color-accent-400)', r: 9 },
  meeting: { dot: 'var(--color-neutral-300)', ring: 'var(--color-neutral-500)', r: 6 },
  person: { dot: 'var(--color-neutral-400)', ring: 'var(--color-neutral-600)', r: 6 },
  decision: { dot: 'var(--color-green-500)', ring: 'var(--color-green-400)', r: 6 },
}

const byId = (id: string) => NODES.find((n) => n.id === id)!

export function KnowledgeGraph() {
  const reduce = useReducedMotion()
  return (
    <svg
      viewBox="0 0 600 420"
      className="h-auto w-full"
      role="img"
      aria-label="Knowledge graph: a Pricing project linked to the meetings, people, and decisions that shaped it."
    >
      <g stroke="var(--color-border-strong)" strokeWidth={1}>
        {EDGES.map(([a, b], i) => {
          const from = byId(a)
          const to = byId(b)
          return (
            <motion.line
              key={`${a}-${b}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              initial={reduce ? undefined : { pathLength: 0, opacity: 0 }}
              whileInView={reduce ? undefined : { pathLength: 1, opacity: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.8, delay: 0.1 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            />
          )
        })}
      </g>

      {NODES.map((n, i) => {
        const s = TYPE_STYLE[n.type]
        const isCenter = n.type === 'project'
        return (
          <motion.g
            key={n.id}
            initial={reduce ? undefined : { opacity: 0, scale: 0.6 }}
            whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.2 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: `${n.x}px ${n.y}px` }}
          >
            {isCenter && (
              <circle cx={n.x} cy={n.y} r={22} fill="var(--color-accent-500)" opacity={0.12} />
            )}
            <circle cx={n.x} cy={n.y} r={s.r + 3} fill="var(--color-bg)" />
            <circle cx={n.x} cy={n.y} r={s.r} fill={s.dot} stroke={s.ring} strokeWidth={1} />
            <text
              x={n.x}
              y={n.y + s.r + 15}
              textAnchor="middle"
              fontSize={isCenter ? 13 : 11}
              fontWeight={isCenter ? 600 : 500}
              fill={isCenter ? 'var(--color-foreground)' : 'var(--color-muted-foreground)'}
              fontFamily="var(--font-sans)"
            >
              {n.label}
            </text>
          </motion.g>
        )
      })}
    </svg>
  )
}
