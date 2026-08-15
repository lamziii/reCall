'use client'

/**
 * react-router-dom → Next.js App Router compatibility shim.
 *
 * The migration keeps the copied Vite components' call sites intact and only rewrites their IMPORT
 * source: `from '@/lib/router-compat'` → `from '@/lib/router-compat'`. This maps the handful of
 * react-router APIs the app uses onto `next/navigation` + `next/link`, so ~55 files migrate without
 * touching their bodies.
 *
 * Intentional differences (documented in docs/NEXTJS_MIGRATION.md):
 *  - Location/navigate `state` is dropped (App Router has no history state). The only consumer was
 *    RequireAuth stashing `{ from }`, which is non-essential for parity.
 *  - <Outlet/> reads children from OutletProvider (the layout supplies them) instead of the router.
 */
import NextLink from 'next/link'
import { useRouter, usePathname, useSearchParams as useNextSearchParams, useParams as useNextParams } from 'next/navigation'
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  type AnchorHTMLAttributes,
  type ReactNode,
} from 'react'

type To = string | { pathname?: string; search?: string; hash?: string }

function toHref(to: To): string {
  if (typeof to === 'string') return to
  return `${to.pathname ?? ''}${to.search ?? ''}${to.hash ?? ''}`
}

// ---- useNavigate ----------------------------------------------------------
export interface NavigateOptions {
  replace?: boolean
  state?: unknown
}
export function useNavigate() {
  const router = useRouter()
  return useMemo(
    () =>
      (to: To | number, opts?: NavigateOptions) => {
        if (typeof to === 'number') {
          if (to < 0) router.back()
          else router.forward()
          return
        }
        const href = toHref(to)
        if (opts?.replace) router.replace(href)
        else router.push(href)
      },
    [router],
  )
}

// ---- useLocation ----------------------------------------------------------
export function useLocation() {
  const pathname = usePathname()
  const searchParams = useNextSearchParams()
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : ''
  return { pathname: pathname ?? '', search, hash: '', state: null as unknown, key: 'default' }
}

// ---- useParams ------------------------------------------------------------
export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T {
  return (useNextParams() ?? {}) as T
}

// ---- useSearchParams ------------------------------------------------------
export function useSearchParams(): [URLSearchParams, (next: URLSearchParams | Record<string, string>) => void] {
  const router = useRouter()
  const pathname = usePathname()
  const current = useNextSearchParams()
  const params = useMemo(() => new URLSearchParams(current?.toString() ?? ''), [current])
  const setSearchParams = (next: URLSearchParams | Record<string, string>) => {
    const usp = next instanceof URLSearchParams ? next : new URLSearchParams(next)
    const qs = usp.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }
  return [params, setSearchParams]
}

// ---- Link -----------------------------------------------------------------
export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: To
  replace?: boolean
  state?: unknown
  children?: ReactNode
}
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, replace, state: _state, children, ...rest },
  ref,
) {
  return (
    <NextLink ref={ref} href={toHref(to)} replace={replace} {...rest}>
      {children}
    </NextLink>
  )
})

// ---- NavLink --------------------------------------------------------------
interface NavRenderState {
  isActive: boolean
  isPending: boolean
  isTransitioning: boolean
}
export interface NavLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className' | 'children' | 'style'> {
  to: To
  end?: boolean
  replace?: boolean
  className?: string | ((state: NavRenderState) => string)
  style?: React.CSSProperties | ((state: NavRenderState) => React.CSSProperties)
  children?: ReactNode | ((state: NavRenderState) => ReactNode)
}
export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { to, end, replace, className, style, children, ...rest },
  ref,
) {
  const pathname = usePathname() ?? ''
  const href = toHref(to)
  const isActive = end ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
  const state: NavRenderState = { isActive, isPending: false, isTransitioning: false }
  const resolvedClassName = typeof className === 'function' ? className(state) : className
  const resolvedStyle = typeof style === 'function' ? style(state) : style
  const resolvedChildren = typeof children === 'function' ? children(state) : children
  return (
    <NextLink
      ref={ref}
      href={href}
      replace={replace}
      className={resolvedClassName}
      style={resolvedStyle}
      aria-current={isActive ? 'page' : undefined}
      {...rest}
    >
      {resolvedChildren}
    </NextLink>
  )
})

// ---- Navigate (declarative redirect) --------------------------------------
export function Navigate({ to, replace = true }: { to: To; replace?: boolean; state?: unknown }) {
  const router = useRouter()
  const href = toHref(to)
  useEffect(() => {
    if (replace) router.replace(href)
    else router.push(href)
  }, [router, href, replace])
  return null
}

// ---- Outlet ---------------------------------------------------------------
const OutletContext = createContext<ReactNode>(null)
export function OutletProvider({ value, children }: { value: ReactNode; children: ReactNode }) {
  return <OutletContext.Provider value={value}>{children}</OutletContext.Provider>
}
export function Outlet() {
  return <>{useContext(OutletContext)}</>
}
