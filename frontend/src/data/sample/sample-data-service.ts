import type { WorkspaceData } from '../types'
import { getWorkspaceData, saveWorkspaceData, clearSampleRecords, hasSampleData } from '../workspace-repository'
import { generateSampleWorkspace as buildSampleWorkspace } from './generate-sample-workspace'

export { hasSampleData }

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Generates one coherent sample workspace and persists it. Real, user-created records are
 * never touched: if a real workspace already exists, sample records are layered in
 * alongside it (after removing any previous sample batch, so regenerating replaces rather
 * than accumulating duplicates) instead of overwriting the whole thing.
 */
export async function seedDummyData(): Promise<WorkspaceData> {
  await delay(900) // ponytail: no backend round trip to await — this just gives the UI something real to show a spinner for.

  const existing = getWorkspaceData()
  const batchId = crypto.randomUUID()
  const sample = buildSampleWorkspace(batchId)

  if (!existing || existing.workspace._sample) {
    saveWorkspaceData(sample)
    return sample
  }

  const withoutOldSample = clearSampleRecords() ?? existing
  const merged: WorkspaceData = {
    workspace: withoutOldSample.workspace,
    people: [...withoutOldSample.people, ...sample.people],
    teams: [...withoutOldSample.teams, ...sample.teams],
    projects: [...withoutOldSample.projects, ...sample.projects],
    sessions: [...withoutOldSample.sessions, ...sample.sessions],
    tasks: [...withoutOldSample.tasks, ...sample.tasks],
    decisions: [...withoutOldSample.decisions, ...sample.decisions],
    questions: [...withoutOldSample.questions, ...sample.questions],
    risks: [...withoutOldSample.risks, ...sample.risks],
    activity: [...withoutOldSample.activity, ...sample.activity],
    notifications: [...withoutOldSample.notifications, ...sample.notifications],
  }
  saveWorkspaceData(merged)
  return merged
}

/** Removes only sample-tagged records — see clearSampleRecords in ../workspace-repository. */
export async function clearSampleData(): Promise<WorkspaceData | null> {
  await delay(400)
  return clearSampleRecords()
}
