import { afterEach, describe, expect, it } from 'vitest'
import { getWorkspaceData, saveWorkspaceData, deleteWorkspaceData } from './workspace-repository'
import { generateSampleWorkspace, SAMPLE_DATA_VERSION } from './sample/generate-sample-workspace'

describe('getWorkspaceData', () => {
  afterEach(() => {
    deleteWorkspaceData()
  })

  it('returns current-version sample data untouched', () => {
    const workspace = generateSampleWorkspace('batch-1')
    saveWorkspaceData(workspace)

    expect(getWorkspaceData()?.sessions.length).toBe(workspace.sessions.length)
  })

  it('discards a sample workspace saved by an older SAMPLE_DATA_VERSION instead of rendering it half-shaped', () => {
    const workspace = generateSampleWorkspace('old-batch')
    const stale = { ...workspace, workspace: { ...workspace.workspace, _sample: { ...workspace.workspace._sample!, sampleDataVersion: SAMPLE_DATA_VERSION - 1 } } }
    saveWorkspaceData(stale)

    expect(getWorkspaceData()).toBeNull()
  })

  it('never discards a real (non-sample) workspace', () => {
    const workspace = generateSampleWorkspace('batch-1')
    const real = { ...workspace, workspace: { ...workspace.workspace, _sample: undefined } }
    saveWorkspaceData(real)

    expect(getWorkspaceData()).not.toBeNull()
  })
})
