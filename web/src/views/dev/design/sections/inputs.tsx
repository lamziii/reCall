import { useState } from 'react'
import { Mail } from 'lucide-react'
import { Input } from '@/components/forms/input'
import { SearchInput } from '@/components/forms/search-input'
import { PasswordInput } from '@/components/forms/password-input'
import { NumberInput } from '@/components/forms/number-input'
import { Textarea } from '@/components/forms/textarea'
import { FormField } from '@/components/forms/form-field'
import { Button } from '@/components/ui/button'
import { PlaygroundSection, PlaygroundRow } from '../playground-section'

function FormValidationPlayground() {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const error = touched && !email.includes('@') ? 'Enter a valid email address' : undefined

  return (
    <form
      className="flex w-72 flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        setTouched(true)
      }}
    >
      <FormField label="Work email" required error={error} description="We'll send the session summary here.">
        {(field) => (
          <Input
            {...field}
            type="email"
            error={Boolean(error)}
            placeholder="sarah@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
          />
        )}
      </FormField>
      <Button type="submit" size="sm" className="self-start">
        Validate
      </Button>
    </form>
  )
}

export function InputsSection() {
  const [search, setSearch] = useState('')
  const [count, setCount] = useState(3)

  return (
    <PlaygroundSection
      id="inputs"
      title="Inputs"
      description="Text, password, number, search, and textarea fields — every one integrates with FormField for label/error/description wiring."
    >
      <PlaygroundRow label="Text input">
        <Input placeholder="Session title" className="w-56" />
        <Input placeholder="With icon" leftIcon={<Mail />} className="w-56" />
        <Input placeholder="Error" error className="w-56" />
        <Input placeholder="Success" className="w-56" />
        <Input placeholder="Disabled" disabled className="w-56" />
        <Input placeholder="Read-only" readOnly value="Q3 Product Strategy Sync" className="w-56" />
      </PlaygroundRow>

      <PlaygroundRow label="Prefix / suffix (via leftIcon / rightIcon slots)">
        <Input placeholder="0.00" leftIcon={<span className="text-small">$</span>} className="w-40" />
        <Input placeholder="username" rightIcon={<span className="text-small">@recall.dev</span>} className="w-56" />
      </PlaygroundRow>

      <PlaygroundRow label="Password">
        <PasswordInput placeholder="Enter password" className="w-56" />
      </PlaygroundRow>

      <PlaygroundRow label="Number">
        <NumberInput value={count} onChange={setCount} min={0} max={10} />
      </PlaygroundRow>

      <PlaygroundRow label="Search">
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} className="w-64" />
        <SearchInput value="" placeholder="Compact" className="w-40" size="sm" />
      </PlaygroundRow>

      <PlaygroundRow label="Textarea (auto-resize, character count)">
        <Textarea placeholder="Add a note about this decision..." autoResize showCount maxLength={280} className="w-80" />
      </PlaygroundRow>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">
          Interactive: FormField + validation
        </span>
        <FormValidationPlayground />
      </div>
    </PlaygroundSection>
  )
}
