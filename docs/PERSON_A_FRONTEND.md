# Person A — Frontend / UI

## Responsibilities
Person A owns everything the user sees and interacts with directly in Recall: every page,
the reusable component library, styling, and animations. This role builds against the data
contracts defined in CONTRACTS.md, not against the real API or database directly — so work
can start immediately without waiting on Person B or Person C.

Core responsibilities:
- Build the entire Recall frontend
- Build reusable UI components
- Style and animate the app so the demo has a clear "wow" moment
- Handle loading and error states visibly, using the shapes Person C defines
- Connect to Person B's AI services once they're ready
- Connect to Person C's data layer once it's ready

## What you're building

### Authentication
- **Welcome** — landing/marketing entry point into the app
- **Sign In** — auth form
- **Create Workspace** — onboarding step to set up a new workspace

### Workspace
- **Home** — workspace dashboard/overview
- **Sessions** — list of recorded sessions
- **Session Review** — detail view for a single session (see Core Experience below)
- **Live Recording** — active recording/session-in-progress view
- **Projects** — list of projects
- **Project Details** — detail view for a single project
- **Tasks** — task list/management view
- **Calendar** — calendar view
- **Search** — global search
- **Notifications** — notifications feed
- **Settings** — user/workspace settings

### Core Experience — Session Review
The Session Review page is the centerpiece of the product. It should present the following
as clearly separated, well-organized sections (tabs, accordion, or scroll sections — your
call):
- Executive Summary
- Discussion Topics
- Decisions
- Tasks
- Timeline
- Insights
- Risks
- Questions
- Documents
- Transcript

Use the exact field/section names above — don't rename them — since Person B's AI output
and Person C's stored data will key off these names per CONTRACTS.md.

## Before the API exists — build against fake data
Don't wait for Person B or Person C. Hardcode data matching the CONTRACTS.md shapes for a
session (with all ten Session Review sections populated) and build/style every page against
it before the real endpoints exist.

## Checkpoint 1 — swap fake data for the real AI call
Once Person B's endpoint(s) exist, wire up the calls that generate a session's Executive
Summary, Discussion Topics, Decisions, Tasks, Timeline, Insights, Risks, and Questions from
raw recording/transcript input. Handle both success and error response shapes per
CONTRACTS.md.

## Checkpoint 2 — connect to Person C's data layer
Once Person C's backend functions exist, load and save Sessions, Projects, Tasks, and
Calendar data so a refresh never loses state, and Live Recording persists correctly once a
session ends.

## Checklist
- [ ] Welcome / Sign In / Create Workspace built and styled
- [ ] Workspace Home built and styled
- [ ] Sessions list built against fake data
- [ ] Session Review built with all 10 sections against fake data
- [ ] Live Recording page built
- [ ] Projects + Project Details built
- [ ] Tasks page built
- [ ] Calendar page built
- [ ] Search built
- [ ] Notifications built
- [ ] Settings built
- [ ] Real AI calls wired in (post-Checkpoint 1)
- [ ] Data load/save wired in (post-Checkpoint 2)
- [ ] Loading and error states visible and styled
- [ ] Responsive enough to demo on a laptop screen without breaking
