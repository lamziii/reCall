export * from './box'
export * from './inline'
export * from './spacer'
export * from './aspect-ratio'
export * from './visually-hidden'

// Re-exported for the primitives/ taxonomy — these live in layout/ and
// data-display/ where they were first built; see components/README.md.
export { Stack } from '@/components/layout/stack'
export { Grid } from '@/components/layout/grid'
export { Container } from '@/components/layout/container'
export { Surface } from '@/components/layout/surface'
export { Divider } from '@/components/data-display/divider'
