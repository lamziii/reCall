import { forwardRef } from 'react'
import { Search, X } from 'lucide-react'
import { Input, type InputProps } from './input'

export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'rightIcon' | 'type'> {
  onClear?: () => void
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, value, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="search"
        value={value}
        leftIcon={<Search />}
        rightIcon={
          onClear && value ? (
            <button type="button" aria-label="Clear search" onClick={onClear} className="pointer-events-auto">
              <X className="size-3.5" />
            </button>
          ) : undefined
        }
        placeholder="Search..."
        {...props}
      />
    )
  },
)
SearchInput.displayName = 'SearchInput'
