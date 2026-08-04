import type { SelectOption } from '@/components/forms'

/**
 * Static option lists for onboarding. Kept out of the Firestore layer so they can be unit-tested
 * and reused. Values are stable machine codes we persist; labels are display-only.
 */

export interface OnboardingOption {
  value: string
  label: string
}

// ---- Step: Use cases ---------------------------------------------------------

export const USE_CASE_OPTIONS: OnboardingOption[] = [
  { value: 'meeting-notes', label: 'Meeting notes' },
  { value: 'project-management', label: 'Project management' },
  { value: 'sales-calls', label: 'Sales calls' },
  { value: 'recruiting', label: 'Recruiting interviews' },
  { value: 'client-meetings', label: 'Client meetings' },
  { value: 'team-ops', label: 'Team operations' },
  { value: 'product-research', label: 'Product research' },
  { value: 'customer-success', label: 'Customer success' },
  { value: 'education', label: 'Education & lectures' },
  { value: 'personal', label: 'Personal productivity' },
  { value: 'other', label: 'Other' },
]

// ---- Step: Workspace ---------------------------------------------------------

export const WORKSPACE_TYPE_OPTIONS: SelectOption[] = [
  { value: 'company', label: 'Company' },
  { value: 'startup', label: 'Startup' },
  { value: 'agency', label: 'Agency' },
  { value: 'nonprofit', label: 'Nonprofit' },
  { value: 'school', label: 'School or university' },
  { value: 'government', label: 'Government or public organization' },
  { value: 'freelance', label: 'Freelance or independent' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Other' },
]

export const TEAM_SIZE_OPTIONS: SelectOption[] = [
  { value: 'solo', label: 'Just me' },
  { value: '2-5', label: '2–5' },
  { value: '6-15', label: '6–15' },
  { value: '16-50', label: '16–50' },
  { value: '51-200', label: '51–200' },
  { value: '201-500', label: '201–500' },
  { value: '500+', label: '500+' },
]

export const INDUSTRY_OPTIONS: SelectOption[] = [
  { value: 'software', label: 'Software and technology' },
  { value: 'aec', label: 'Architecture, engineering and construction' },
  { value: 'professional-services', label: 'Professional services' },
  { value: 'finance', label: 'Finance and insurance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'government', label: 'Government and public sector' },
  { value: 'media', label: 'Media and creative' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail and e-commerce' },
  { value: 'real-estate', label: 'Real estate' },
  { value: 'hospitality', label: 'Hospitality and travel' },
  { value: 'nonprofit', label: 'Nonprofit' },
  { value: 'legal', label: 'Legal' },
  { value: 'hr', label: 'Recruiting and human resources' },
  { value: 'sales-marketing', label: 'Sales and marketing' },
  { value: 'other', label: 'Other' },
]

/** Workspace types that read as an individual, so we default the workspace name to the user's name. */
export const PERSONAL_WORKSPACE_TYPES = new Set(['personal', 'freelance'])

// ---- Step: Regional ----------------------------------------------------------

/**
 * The four languages Recall officially supports (mirror of
 * firebase/functions/src/transcription/supported-languages.ts and
 * frontend/src/data/live/transcription-languages.ts). Do NOT add a fifth — transcription only
 * supports these four. Labels are native names.
 */
export const LANGUAGE_OPTIONS: OnboardingOption[] = [
  { value: 'en', label: 'English' },
  { value: 'sq', label: 'Shqip' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
]

export const SUPPORTED_LANGUAGE_CODES = LANGUAGE_OPTIONS.map((o) => o.value)

export function languageLabel(code: string): string {
  return LANGUAGE_OPTIONS.find((o) => o.value === code)?.label ?? code
}

export const DATE_FORMAT_OPTIONS: OnboardingOption[] = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
]

export const TIME_FORMAT_OPTIONS: OnboardingOption[] = [
  { value: '24h', label: '24-hour' },
  { value: '12h', label: '12-hour' },
]

// ---- Step: Invite ------------------------------------------------------------

export const INVITE_ROLE_OPTIONS: SelectOption[] = [
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Admin' },
]

export type InviteRole = 'admin' | 'member'
