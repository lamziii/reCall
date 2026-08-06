import type { DevCategory, DevPriority } from './types'

/**
 * The initial development backlog, seeded once from docs/PROJECT_STATUS.md's remaining work.
 * Bump SEED_VERSION when adding a new batch (the seeder only writes tasks whose deterministic id
 * doesn't already exist, so bumps are additive and never clobber manual edits or completed tasks).
 *
 * NOTE: onboarding is COMPLETE as of the account-creation → workspace-setup build, so its tasks are
 * intentionally NOT seeded here — only the genuinely-remaining onboarding-adjacent items (invite
 * email delivery, invite acceptance page, enabling real 2FA in the console) appear, under their
 * natural categories.
 */
export const SEED_VERSION = 1

export interface SeedTask {
  slug: string
  title: string
  description: string | null
  category: DevCategory
  priority: DevPriority
}

/** Deterministic doc id for a seed task, so re-seeding never duplicates. */
export function seedTaskId(slug: string): string {
  return `dev-${slug}`
}

export const SEED_TASKS: SeedTask[] = [
  // ---- Foundation & Firestore migration ----
  { slug: 'migrate-projects', title: 'Migrate Projects from localStorage to Firestore', description: 'The projects Firestore schema exists; the pages still read the sample layer.', category: 'foundation', priority: 'critical' },
  { slug: 'migrate-reviews', title: 'Migrate Reviews from localStorage to Firestore', description: 'Reviews page reads the sample layer instead of live session_reviews.', category: 'foundation', priority: 'high' },
  { slug: 'migrate-notifications', title: 'Migrate Notifications from localStorage to Firestore', description: 'The notifications schema exists; the page reads the sample layer.', category: 'foundation', priority: 'high' },
  { slug: 'remove-workspace-repository-dep', title: 'Remove production dependency on workspace-repository.ts', description: 'Per-feature services still read/write localStorage in the live app.', category: 'foundation', priority: 'high' },
  { slug: 'retire-localstorage-layer', title: 'Retire the half-migrated localStorage data layer', description: 'Once features are live, delete the dual data path.', category: 'foundation', priority: 'medium' },
  { slug: 'decide-sample-workspace', title: 'Decide sample workspace: explicit demo mode vs test-only utility', description: 'generateSampleWorkspace is only called by tests + the Settings dev button today.', category: 'foundation', priority: 'low' },

  // ---- Onboarding (remaining only — core flow is done) ----
  { slug: 'invite-acceptance-page', title: 'Build the invite acceptance page (/join?invite=…)', description: 'workspace_invites model + rules exist; no acceptance UI yet.', category: 'onboarding', priority: 'high' },
  { slug: 'enable-real-2fa', title: 'Enable real TOTP 2FA (Firebase Identity Platform / MFA)', description: 'Console/GCP change; UI already stores enabled|skipped|unavailable honestly.', category: 'onboarding', priority: 'medium' },

  // ---- Projects ----
  { slug: 'projects-list-live', title: 'Connect Projects list to live Firestore', description: null, category: 'projects', priority: 'high' },
  { slug: 'project-detail-live', title: 'Connect Project detail to live Firestore', description: null, category: 'projects', priority: 'high' },
  { slug: 'project-create', title: 'Add project creation', description: null, category: 'projects', priority: 'high' },
  { slug: 'project-edit', title: 'Add project editing', description: null, category: 'projects', priority: 'medium' },
  { slug: 'project-archive', title: 'Add project deletion or archiving', description: 'Prefer archiving over hard delete.', category: 'projects', priority: 'medium' },
  { slug: 'project-link-sessions-tasks', title: 'Link sessions and tasks to projects', description: null, category: 'projects', priority: 'medium' },

  // ---- Reviews ----
  { slug: 'reviews-live', title: 'Connect Reviews page to live session reviews', description: null, category: 'reviews', priority: 'high' },
  { slug: 'reviews-filter-sort', title: 'Add review filtering and sorting', description: null, category: 'reviews', priority: 'low' },
  { slug: 'reviews-nav-to-session', title: 'Add navigation from Reviews to Session Review', description: null, category: 'reviews', priority: 'medium' },

  // ---- Notifications ----
  { slug: 'notifications-live', title: 'Connect Notifications page to Firestore', description: null, category: 'notifications', priority: 'high' },
  { slug: 'notifications-read-state', title: 'Add read and unread state', description: null, category: 'notifications', priority: 'medium' },
  { slug: 'notifications-generation', title: 'Add notification generation rules', description: 'e.g. task assigned, review ready.', category: 'notifications', priority: 'medium' },
  { slug: 'notifications-preferences', title: 'Add notification preferences', description: null, category: 'notifications', priority: 'low' },
  { slug: 'notifications-delivery', title: 'Plan email or push delivery integration', description: null, category: 'notifications', priority: 'low' },

  // ---- Search ----
  { slug: 'search-replace-placeholder', title: 'Replace the static Search placeholder', description: 'The /app/search page is a static empty state today.', category: 'search', priority: 'high' },
  { slug: 'search-sessions', title: 'Add global search across sessions', description: null, category: 'search', priority: 'high' },
  { slug: 'search-tasks', title: 'Add search across tasks', description: null, category: 'search', priority: 'medium' },
  { slug: 'search-projects', title: 'Add search across projects', description: null, category: 'search', priority: 'medium' },
  { slug: 'search-filters', title: 'Add search result filters', description: null, category: 'search', priority: 'low' },
  { slug: 'search-reconcile-command', title: 'Reconcile duplicate command and search components', description: 'command-menu vs command-palette; search-overlay vs search-shell.', category: 'search', priority: 'low' },

  // ---- Documents ----
  { slug: 'documents-upload-ui', title: 'Build document upload UI', description: 'Schema + Storage paths + rules already exist; no UI.', category: 'documents', priority: 'medium' },
  { slug: 'documents-review-tab', title: 'Add Documents tab to Session Review', description: null, category: 'documents', priority: 'medium' },
  { slug: 'documents-metadata', title: 'Connect document metadata to Firestore', description: null, category: 'documents', priority: 'medium' },
  { slug: 'documents-storage', title: 'Connect files to Firebase Storage', description: null, category: 'documents', priority: 'medium' },
  { slug: 'documents-delete-download', title: 'Add document delete and download behavior', description: null, category: 'documents', priority: 'low' },
  { slug: 'documents-permissions', title: 'Add document permissions', description: null, category: 'documents', priority: 'low' },

  // ---- People & Teams ----
  { slug: 'people-model', title: 'Decide the final People data model', description: 'No backend collection today — frontend concept only.', category: 'people', priority: 'medium' },
  { slug: 'people-backend', title: 'Create People backend', description: null, category: 'people', priority: 'medium' },
  { slug: 'people-live', title: 'Connect People pages to live data', description: null, category: 'people', priority: 'medium' },
  { slug: 'teams-model', title: 'Decide the final Teams data model', description: 'No backend collection today — frontend concept only.', category: 'teams', priority: 'medium' },
  { slug: 'teams-backend', title: 'Create Teams backend', description: null, category: 'teams', priority: 'medium' },
  { slug: 'teams-live', title: 'Connect Teams pages to live data', description: null, category: 'teams', priority: 'medium' },
  { slug: 'member-roles', title: 'Add workspace member roles', description: null, category: 'collaboration', priority: 'medium' },
  { slug: 'member-invitations-functional', title: 'Make member invitations functional end-to-end', description: 'Invites persist + are secured; delivery + acceptance still pending.', category: 'collaboration', priority: 'high' },

  // ---- Settings ----
  { slug: 'settings-account-editable', title: 'Make account information editable', description: 'Currently read-only except theme.', category: 'settings', priority: 'medium' },
  { slug: 'settings-workspace-editable', title: 'Make workspace information editable', description: null, category: 'settings', priority: 'medium' },
  { slug: 'settings-member-management', title: 'Add member management to Settings', description: null, category: 'settings', priority: 'medium' },
  { slug: 'settings-notification-prefs', title: 'Add notification preferences to Settings', description: null, category: 'settings', priority: 'low' },
  { slug: 'settings-security-2fa', title: 'Add security and 2FA settings', description: 'Let users manage 2FA post-onboarding.', category: 'settings', priority: 'medium' },

  // ---- Recording & Transcription ----
  { slug: 'merge-recording-uis', title: 'Merge the two diverged recording interfaces', description: 'record.tsx (demo audio) vs record-live.tsx (live paste/transcribe).', category: 'recording', priority: 'medium' },
  { slug: 'safari-recording-fallback', title: 'Improve the Safari recording fallback', description: 'Web Speech is unreliable on Safari.', category: 'recording', priority: 'medium' },
  { slug: 'empty-transcript-handling', title: 'Add proper empty-transcript handling', description: null, category: 'recording', priority: 'medium' },
  { slug: 'diarization-provider', title: 'Enable a production diarization provider', description: 'Seam exists (Deepgram/AssemblyAI/Speechmatics); none enabled.', category: 'transcription', priority: 'high' },
  { slug: 'test-multilingual-transcription', title: 'Test multilingual transcription', description: null, category: 'transcription', priority: 'medium' },
  { slug: 'test-albanian-quality', title: 'Test Albanian transcription quality', description: null, category: 'transcription', priority: 'medium' },
  { slug: 'improve-speaker-mapping', title: 'Improve speaker-name mapping', description: null, category: 'transcription', priority: 'low' },

  // ---- Integrations ----
  { slug: 'integration-calendar', title: 'Add external calendar integration', description: null, category: 'integrations', priority: 'low' },
  { slug: 'integration-notification-email', title: 'Add a notification email provider', description: null, category: 'integrations', priority: 'low' },
  { slug: 'integration-invite-email', title: 'Add invitation email delivery', description: 'onInviteCreated seam exists; wire SendGrid/Resend/Postmark.', category: 'integrations', priority: 'high' },
  { slug: 'integration-sharing', title: 'Add sharing architecture', description: null, category: 'integrations', priority: 'low' },
  { slug: 'billing-plans', title: 'Add billing and plans', description: null, category: 'billing', priority: 'low' },

  // ---- Cleanup & technical debt ----
  { slug: 'cleanup-api-dir', title: 'Remove the legacy api/ directory if no longer needed', description: null, category: 'cleanup', priority: 'low' },
  { slug: 'cleanup-database-dir', title: 'Remove the legacy database/ directory if no longer needed', description: null, category: 'cleanup', priority: 'low' },
  { slug: 'cleanup-supabase', title: 'Remove dead Supabase code', description: 'supabase/functions/extract-session-review is dead.', category: 'cleanup', priority: 'low' },
  { slug: 'cleanup-firebase-debug-log', title: 'Remove committed Firebase debug logs', description: 'firebase/firebase-debug.log is checked in.', category: 'cleanup', priority: 'low' },
  { slug: 'cleanup-functions-build-artifacts', title: 'Review committed Cloud Functions build artifacts', description: 'firebase/functions/lib/** compiled JS is committed.', category: 'cleanup', priority: 'low' },
  { slug: 'cleanup-command-palette', title: 'Reconcile duplicate command palette components', description: null, category: 'cleanup', priority: 'low' },
  { slug: 'cleanup-search-components', title: 'Reconcile duplicate search components', description: null, category: 'cleanup', priority: 'low' },
  { slug: 'cleanup-stale-docs', title: 'Remove stale documentation', description: 'e.g. RECALL_CONTEXT "not connected" claim, stub notes.', category: 'cleanup', priority: 'low' },
  { slug: 'cleanup-update-project-status', title: 'Keep docs/PROJECT_STATUS.md up to date', description: null, category: 'cleanup', priority: 'low' },

  // ---- Testing & production readiness ----
  { slug: 'test-firestore-rules', title: 'Add Firestore rules tests', description: null, category: 'testing', priority: 'high' },
  { slug: 'test-workspace-access', title: 'Add workspace access tests', description: null, category: 'testing', priority: 'medium' },
  { slug: 'test-onboarding-integration', title: 'Expand onboarding integration tests', description: 'Pure-logic tests exist; add flow/component coverage.', category: 'testing', priority: 'medium' },
  { slug: 'test-task-promotion', title: 'Add task promotion tests', description: 'promoteCandidateTask idempotency.', category: 'testing', priority: 'medium' },
  { slug: 'test-recording-error-states', title: 'Add recording error-state tests', description: null, category: 'testing', priority: 'low' },
  { slug: 'test-responsive', title: 'Add responsive tests for major pages', description: null, category: 'testing', priority: 'low' },
  { slug: 'prod-error-monitoring', title: 'Add production error monitoring', description: null, category: 'testing', priority: 'medium' },
  { slug: 'review-loading-empty-error', title: 'Review loading, empty and error states across the app', description: null, category: 'testing', priority: 'medium' },
  { slug: 'prod-build-audit', title: 'Run a complete production build audit', description: 'Bundle is >500 kB; consider code-splitting.', category: 'testing', priority: 'low' },
]
