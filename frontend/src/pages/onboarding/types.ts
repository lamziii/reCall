import type { SelectOption } from '@/components/forms'

export interface OnboardingData {
  workspaceName: string
  companyName: string
  teamSize: string
  industry: string
  language: string
  timezone: string
  country: string
  dateFormat: string
  useCases: string[]
  invites: string[]
}

export const INITIAL_ONBOARDING_DATA: OnboardingData = {
  workspaceName: '',
  companyName: '',
  teamSize: '',
  industry: '',
  language: '',
  timezone: '',
  country: '',
  dateFormat: '',
  useCases: [],
  invites: [''],
}

export const STEP_COUNT = 4

export interface StepMeta {
  title: string
  description?: string
}

export const STEP_META: StepMeta[] = [
  { title: 'Workspace details', description: 'What should we call your workspace?' },
  { title: 'Preferences', description: 'Set your language, timezone, and formats.' },
  { title: 'What will you use Recall for?', description: 'Select as many as apply.' },
  { title: 'Invite your team', description: 'Optional — you can always invite people later.' },
]

export const TEAM_SIZE_OPTIONS: SelectOption[] = [
  { value: '1-10', label: '1–10 people' },
  { value: '11-50', label: '11–50 people' },
  { value: '51-200', label: '51–200 people' },
  { value: '201-500', label: '201–500 people' },
  { value: '500+', label: '500+ people' },
]

export const INDUSTRY_OPTIONS: SelectOption[] = [
  { value: 'software', label: 'Software & technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail & e-commerce' },
  { value: 'other', label: 'Other' },
]

export const LANGUAGE_OPTIONS: SelectOption[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
]

export const TIMEZONE_OPTIONS: SelectOption[] = [
  { value: 'utc-8', label: '(GMT-08:00) Pacific Time (US & Canada)' },
  { value: 'utc-5', label: '(GMT-05:00) Eastern Time (US & Canada)' },
  { value: 'utc+0', label: '(GMT+00:00) London' },
  { value: 'utc+1', label: '(GMT+01:00) Berlin, Paris' },
  { value: 'utc+8', label: '(GMT+08:00) Singapore' },
]

export const COUNTRY_OPTIONS: SelectOption[] = [
  { value: 'us', label: 'United States' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'ca', label: 'Canada' },
  { value: 'other', label: 'Other' },
]

export const DATE_FORMAT_OPTIONS: SelectOption[] = [
  { value: 'mdy', label: 'MM/DD/YYYY' },
  { value: 'dmy', label: 'DD/MM/YYYY' },
  { value: 'ymd', label: 'YYYY-MM-DD' },
]

export interface UseCaseOption {
  value: string
  label: string
}

export const USE_CASE_OPTIONS: UseCaseOption[] = [
  { value: 'meeting-notes', label: 'Meeting notes' },
  { value: 'internal-docs', label: 'Internal documentation' },
  { value: 'sales', label: 'Sales' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'recruiting', label: 'Recruiting' },
  { value: 'education', label: 'Education' },
  { value: 'operations', label: 'Operations' },
]
