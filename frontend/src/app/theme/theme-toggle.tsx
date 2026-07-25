import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { IconButton } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import type { ThemePreference } from './theme-provider'
import { useTheme } from './theme-provider'

const PREFERENCE_ICON: Record<ThemePreference, typeof Sun> = { light: Sun, dark: Moon, system: Monitor }
const PREFERENCE_LABEL: Record<ThemePreference, string> = { light: 'Light', dark: 'Dark', system: 'System' }
const OPTIONS: ThemePreference[] = ['light', 'dark', 'system']

/** Top-bar appearance control — Sun/Moon/Monitor icon button opening a Light/Dark/System menu. Shares state with the Settings page via useTheme(). */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme()
  const Icon = PREFERENCE_ICON[preference]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <IconButton icon={<Icon />} label={`Appearance: ${PREFERENCE_LABEL[preference]}`} title="Appearance" variant="ghost" />
      </DropdownMenuTrigger>
      <DropdownMenuContent width={168} placement="bottom-end">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        {OPTIONS.map((option) => {
          const OptionIcon = PREFERENCE_ICON[option]
          const active = preference === option
          return (
            <DropdownMenuItem key={option} icon={<OptionIcon />} onSelect={() => setPreference(option)}>
              <span className="flex items-center justify-between gap-2">
                <span>
                  {PREFERENCE_LABEL[option]}
                  {active && <span className="sr-only"> (current)</span>}
                </span>
                {active && <Check className="size-3.5 text-accent" aria-hidden />}
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
