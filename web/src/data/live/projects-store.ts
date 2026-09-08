'use client'

/**
 * Projects persistence — the organizational layer above sessions. One interface, two backends chosen
 * by data-mode (mirrors data/notes/notes-store.ts):
 *  - LIVE  → Firestore `projects` collection (workspace-scoped; firestore.rules already ships a
 *            workspace-member CRUD rule for it).
 *  - DEMO  → localStorage, so the feature works without auth/Firebase in the demo build.
 *
 * Reads are WORKSPACE-scoped via a single-field query (`where('workspace_id','==',ws)`) — index-free,
 * like the notes author query — then sorted client-side (project volume per workspace is bounded).
 * Related entities are found by querying THEM for `project_id`, never by storing id arrays here.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase/firestore'
import { isLiveMode } from './data-mode'
import type { LiveProjectDoc, ProjectStatus, ProjectType, TechStackItem } from './types'

export interface CreateProjectInput {
  workspaceId: string
  ownerId: string
  name: string
  description?: string | null
  type?: ProjectType
  icon?: string | null
  techStack?: TechStackItem[]
}

export interface ProjectPatch {
  name?: string
  description?: string | null
  icon?: string | null
  logoUrl?: string | null
  bannerUrl?: string | null
  type?: ProjectType
  status?: ProjectStatus
  techStack?: TechStackItem[]
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

// ================================================================= LIVE (Firestore)

function liveSubscribeProjects(workspaceId: string, cb: (p: LiveProjectDoc[]) => void, onError: (e: unknown) => void) {
  const q = query(collection(getDb(), 'projects'), where('workspace_id', '==', workspaceId))
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LiveProjectDoc, 'id'>) }))),
    onError,
  )
}

async function liveCreateProject(input: CreateProjectInput): Promise<string> {
  const ref = doc(collection(getDb(), 'projects'))
  const payload: Omit<LiveProjectDoc, 'id'> = {
    workspace_id: input.workspaceId,
    owner_id: input.ownerId,
    name: input.name.trim(),
    description: input.description ?? null,
    icon: input.icon ?? null,
    logo_url: null,
    banner_url: null,
    type: input.type ?? 'general',
    status: 'active',
    tech_stack: input.techStack ?? [],
    archived_at: null,
    created_at: serverTimestamp() as unknown as null,
    updated_at: serverTimestamp() as unknown as null,
  }
  await setDoc(ref, payload)
  return ref.id
}

function patchToFields(patch: ProjectPatch): Record<string, unknown> {
  const fields: Record<string, unknown> = { updated_at: serverTimestamp() }
  if (patch.name !== undefined) fields.name = patch.name.trim()
  if (patch.description !== undefined) fields.description = patch.description
  if (patch.icon !== undefined) fields.icon = patch.icon
  if (patch.logoUrl !== undefined) fields.logo_url = patch.logoUrl
  if (patch.bannerUrl !== undefined) fields.banner_url = patch.bannerUrl
  if (patch.type !== undefined) fields.type = patch.type
  if (patch.techStack !== undefined) fields.tech_stack = patch.techStack
  if (patch.status !== undefined) {
    fields.status = patch.status
    fields.archived_at = patch.status === 'archived' ? Date.now() : null
  }
  return fields
}

async function liveUpdateProject(id: string, patch: ProjectPatch): Promise<void> {
  await updateDoc(doc(getDb(), 'projects', id), patchToFields(patch))
}

async function liveGetProject(id: string): Promise<LiveProjectDoc | null> {
  const snap = await getDoc(doc(getDb(), 'projects', id))
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<LiveProjectDoc, 'id'>) }) : null
}

async function liveDeleteProject(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'projects', id))
}

// ================================================================= DEMO (localStorage)

const LS_PROJECTS = 'recall:projects'
type Listener = () => void
const listeners = new Set<Listener>()

function lsRead(): LiveProjectDoc[] {
  try {
    return JSON.parse(localStorage.getItem(LS_PROJECTS) || '[]') as LiveProjectDoc[]
  } catch {
    return []
  }
}
function lsWrite(rows: LiveProjectDoc[]): void {
  localStorage.setItem(LS_PROJECTS, JSON.stringify(rows))
  listeners.forEach((l) => l())
}

function localSubscribeProjects(workspaceId: string, cb: (p: LiveProjectDoc[]) => void) {
  const emit = () => cb(lsRead().filter((p) => p.workspace_id === workspaceId))
  listeners.add(emit)
  emit()
  return () => listeners.delete(emit)
}
function localCreateProject(input: CreateProjectInput): string {
  const project: LiveProjectDoc = {
    id: newId('project'),
    workspace_id: input.workspaceId,
    owner_id: input.ownerId,
    name: input.name.trim(),
    description: input.description ?? null,
    icon: input.icon ?? null,
    logo_url: null,
    banner_url: null,
    type: input.type ?? 'general',
    status: 'active',
    tech_stack: input.techStack ?? [],
    archived_at: null,
    created_at: null,
    updated_at: null,
  }
  lsWrite([...lsRead(), project])
  return project.id
}
function localUpdateProject(id: string, patch: ProjectPatch): void {
  lsWrite(
    lsRead().map((p) => {
      if (p.id !== id) return p
      const next = { ...p }
      if (patch.name !== undefined) next.name = patch.name.trim()
      if (patch.description !== undefined) next.description = patch.description
      if (patch.icon !== undefined) next.icon = patch.icon
      if (patch.logoUrl !== undefined) next.logo_url = patch.logoUrl
      if (patch.bannerUrl !== undefined) next.banner_url = patch.bannerUrl
      if (patch.type !== undefined) next.type = patch.type
      if (patch.techStack !== undefined) next.tech_stack = patch.techStack
      if (patch.status !== undefined) {
        next.status = patch.status
        next.archived_at = patch.status === 'archived' ? Date.now() : null
      }
      return next
    }),
  )
}
function localGetProject(id: string): LiveProjectDoc | null {
  return lsRead().find((p) => p.id === id) ?? null
}
function localDeleteProject(id: string): void {
  lsWrite(lsRead().filter((p) => p.id !== id))
}

// ================================================================= Public API (mode switch)

export function subscribeProjects(workspaceId: string, cb: (p: LiveProjectDoc[]) => void, onError: (e: unknown) => void = () => {}) {
  return isLiveMode ? liveSubscribeProjects(workspaceId, cb, onError) : localSubscribeProjects(workspaceId, cb)
}
export function createProject(input: CreateProjectInput): Promise<string> {
  return isLiveMode ? liveCreateProject(input) : Promise.resolve(localCreateProject(input))
}
export function updateProject(id: string, patch: ProjectPatch): Promise<void> {
  return isLiveMode ? liveUpdateProject(id, patch) : Promise.resolve(localUpdateProject(id, patch))
}
export function getProject(id: string): Promise<LiveProjectDoc | null> {
  return isLiveMode ? liveGetProject(id) : Promise.resolve(localGetProject(id))
}
export function deleteProject(id: string): Promise<void> {
  return isLiveMode ? liveDeleteProject(id) : Promise.resolve(localDeleteProject(id))
}
/** Convenience: archive/unarchive without threading a full patch. */
export function setProjectStatus(id: string, status: ProjectStatus): Promise<void> {
  return updateProject(id, { status })
}
