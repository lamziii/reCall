import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const textVariants = cva('', {
  variants: {
    variant: {
      display: 'text-display font-semibold tracking-tight text-foreground',
      h1: 'text-h1 font-semibold tracking-tight text-foreground',
      h2: 'text-h2 font-semibold tracking-tight text-foreground',
      h3: 'text-h3 font-semibold text-foreground',
      title: 'text-title font-semibold text-foreground',
      subtitle: 'text-subtitle font-medium text-muted-foreground',
      'body-lg': 'text-body-lg font-normal text-foreground',
      body: 'text-body font-normal text-foreground',
      small: 'text-small font-normal text-muted-foreground',
      caption: 'text-caption font-normal text-subtle-foreground',
      label: 'text-label font-medium uppercase tracking-wide text-muted-foreground',
      code: 'text-code font-mono text-foreground',
    },
    weight: {
      regular: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    color: {
      primary: 'text-foreground',
      secondary: 'text-muted-foreground',
      tertiary: 'text-subtle-foreground',
      disabled: 'text-disabled-foreground',
      inverse: 'text-inverse-foreground',
      accent: 'text-accent',
      danger: 'text-danger',
      success: 'text-success',
      warning: 'text-warning',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
    mono: {
      true: 'font-mono',
      false: '',
    },
    truncate: {
      true: 'truncate',
      false: '',
    },
    muted: {
      true: 'text-muted-foreground',
      false: '',
    },
  },
  defaultVariants: { variant: 'body' },
})

const LINE_CLAMP: Record<number, string> = {
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
  5: 'line-clamp-5',
  6: 'line-clamp-6',
}

type TextVariant = NonNullable<VariantProps<typeof textVariants>['variant']>

const DEFAULT_TAG: Record<TextVariant, ElementType> = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  title: 'h4',
  subtitle: 'p',
  'body-lg': 'p',
  body: 'p',
  small: 'p',
  caption: 'span',
  label: 'label',
  code: 'code',
}

export interface TextProps extends VariantProps<typeof textVariants>, Omit<HTMLAttributes<HTMLElement>, 'color'> {
  as?: ElementType
  children: ReactNode
  lineClamp?: number
}

/** Polymorphic typography primitive. Prefer the named exports (H1, Body, Caption, ...) below. */
export function Text({ variant = 'body', weight, color, align, mono, truncate, muted, lineClamp, as, className, children, ...rest }: TextProps) {
  const Tag = as ?? DEFAULT_TAG[variant ?? 'body']
  return (
    <Tag
      className={cn(
        textVariants({ variant, weight, color, align, mono, truncate, muted }),
        lineClamp && LINE_CLAMP[lineClamp],
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}

type NamedTextProps = Omit<TextProps, 'variant'>

export const Display = (props: NamedTextProps) => <Text variant="display" {...props} />
export const H1 = (props: NamedTextProps) => <Text variant="h1" {...props} />
export const H2 = (props: NamedTextProps) => <Text variant="h2" {...props} />
export const H3 = (props: NamedTextProps) => <Text variant="h3" {...props} />
export const Title = (props: NamedTextProps) => <Text variant="title" {...props} />
export const Subtitle = (props: NamedTextProps) => <Text variant="subtitle" {...props} />
export const BodyLarge = (props: NamedTextProps) => <Text variant="body-lg" {...props} />
export const Body = (props: NamedTextProps) => <Text variant="body" {...props} />
export const Small = (props: NamedTextProps) => <Text variant="small" {...props} />
export const Caption = (props: NamedTextProps) => <Text variant="caption" {...props} />
export const Label = (props: NamedTextProps) => <Text variant="label" {...props} />
export const Code = (props: NamedTextProps) => <Text variant="code" {...props} />

/** Convenience alias for H1-weight section headings where the semantic level varies by context. */
export const Heading = ({ level = 2, ...props }: NamedTextProps & { level?: 1 | 2 | 3 }) => (
  <Text variant={level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3'} {...props} />
)

/** CodeText: inline code convenience, distinct from the block-level CodeBlock in data-display. */
export const CodeText = (props: NamedTextProps) => <Text variant="code" as="code" {...props} />
