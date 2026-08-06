import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase/firestore'
import { SEED_TASKS, SEED_VERSION, seedTaskId } from './seed-data'
import { devUserName, type DevTaskInput, type DevUser, type DevelopmentTask } from './types'

const TASKS = 'development_tasks'
const META = 'development_taskboard_meta'
const SEED_META_ID = 'initial-seed'

/** Non-conflict failures (missing doc, offline, etc.) surfaced with a user-safe message. */
export class DevTaskError extends Error {}

/** A reservation lost the race — someone else holds the task. Carries the current holder. */
export class DevTaskConflictError extends Error {
  heldBy: DevUser
  constructor(heldBy: DevUser) {
    super(`This task was just reserved by ${devUserName(heldBy)}.`)
    this.name = 'DevTaskConflictError'
    this.heldBy = heldBy
  }
}

// ---- Realtime ----------------------------------------------------------------

/** Live subscription to all development tasks, ordered by `order`. */
export function subscribeDevTasks(
  onData: (tasks: DevelopmentTask[]) => void,
  onError: (err: unknown) => void,
): () => void {
  const q = query(collection(getDb(), TASKS), orderBy('order', 'asc'))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DevelopmentTask)),
    onError,
  )
}

// ---- CRUD --------------------------------------------------------------------

/** Creates a task. `order` is placed after the current max so new tasks sort last. */
export async function createDevTask(
  input: DevTaskInput,
  createdBy: DevUser,
  opts: { order: number; assignTo?: DevUser | null; start?: boolean } = { order: 0 },
): Promise<string> {
  const db = getDb()
  const ref = doc(collection(db, TASKS))
  const assignTo = opts.assignTo ?? null
  const start = Boolean(opts.start && assignTo)
  await setDoc(ref, {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    category: input.category,
    priority: input.priority,
    status: start ? 'in_progress' : assignTo ? 'reserved' : 'backlog',
    reserved_by: assignTo,
    created_by: createdBy,
    completed_by: null,
    order: opts.order,
    reserved_at: assignTo ? serverTimestamp() : null,
    completed_at: null,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  })
  return ref.id
}

export async function updateDevTask(id: string, input: DevTaskInput): Promise<void> {
  await updateDoc(doc(getDb(), TASKS, id), {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    category: input.category,
    priority: input.priority,
    updated_at: serverTimestamp(),
  })
}

export async function deleteDevTask(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), TASKS, id))
}

/**
 * Deletes EVERY development task (batched). Keeps the seed meta doc, so the one-time seeder does not
 * re-create the default backlog on the next load — the board stays empty for you to fill yourself.
 */
export async function deleteAllDevTasks(): Promise<void> {
  const db = getDb()
  const snap = await getDocs(collection(db, TASKS))
  const docs = snap.docs
  for (let i = 0; i < docs.length; i += 400) {
    const batch = writeBatch(db)
    docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }
}

// ---- Lifecycle transitions ---------------------------------------------------

/**
 * Atomically reserves a task for `user`. Uses a transaction so two people can't both reserve the
 * same task — if it's already held by someone else, throws DevTaskConflictError. Reserving a task
 * you already hold is a no-op-ish refresh.
 */
export async function reserveDevTask(id: string, user: DevUser): Promise<void> {
  const db = getDb()
  const ref = doc(db, TASKS, id)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new DevTaskError('This task no longer exists.')
    const data = snap.data() as DevelopmentTask
    if (data.status === 'completed') throw new DevTaskError('This task is already completed.')
    if (data.reserved_by && data.reserved_by !== user) throw new DevTaskConflictError(data.reserved_by)
    tx.update(ref, {
      reserved_by: user,
      status: data.status === 'in_progress' ? 'in_progress' : 'reserved',
      reserved_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
  })
}

/**
 * Atomically takes over a task already reserved by the other person (explicit, confirmed action).
 * Still a transaction so it can't stomp a concurrent change; only blocked if completed.
 */
export async function takeOverDevTask(id: string, user: DevUser): Promise<void> {
  const db = getDb()
  const ref = doc(db, TASKS, id)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new DevTaskError('This task no longer exists.')
    const data = snap.data() as DevelopmentTask
    if (data.status === 'completed') throw new DevTaskError('This task is already completed.')
    tx.update(ref, {
      reserved_by: user,
      status: data.status === 'backlog' ? 'reserved' : data.status,
      reserved_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
  })
}

export async function startDevTask(id: string): Promise<void> {
  await updateDoc(doc(getDb(), TASKS, id), { status: 'in_progress', updated_at: serverTimestamp() })
}

/** Releases a task back to the shared backlog (clears the reservation). */
export async function releaseDevTask(id: string): Promise<void> {
  await updateDoc(doc(getDb(), TASKS, id), {
    status: 'backlog',
    reserved_by: null,
    reserved_at: null,
    updated_at: serverTimestamp(),
  })
}

export async function completeDevTask(id: string, user: DevUser): Promise<void> {
  await updateDoc(doc(getDb(), TASKS, id), {
    status: 'completed',
    completed_by: user,
    completed_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  })
}

/** Reopens a completed task back to the backlog, clearing completion + reservation. */
export async function reopenDevTask(id: string): Promise<void> {
  await updateDoc(doc(getDb(), TASKS, id), {
    status: 'backlog',
    completed_by: null,
    completed_at: null,
    reserved_by: null,
    reserved_at: null,
    updated_at: serverTimestamp(),
  })
}

// ---- Idempotent seed ---------------------------------------------------------

/**
 * Seeds the initial backlog exactly once, inside a transaction so two simultaneous visitors can't
 * double-seed. Guarded by `development_taskboard_meta/initial-seed`: if the meta doc already exists
 * at this SEED_VERSION, it's a no-op. Deterministic task ids mean a future additive bump only
 * creates missing tasks and never overwrites manual edits, completed, or deleted tasks. Safe to
 * call on every page load. Returns whether it seeded.
 */
export async function ensureDevTasksSeeded(): Promise<boolean> {
  const db = getDb()
  const metaRef = doc(db, META, SEED_META_ID)
  const taskRefs = SEED_TASKS.map((seed) => doc(db, TASKS, seedTaskId(seed.slug)))

  return runTransaction(db, async (tx) => {
    const metaSnap = await tx.get(metaRef)
    const seededVersion = (metaSnap.data()?.version as number | undefined) ?? 0
    if (metaSnap.exists() && seededVersion >= SEED_VERSION) return false

    // All reads must precede writes in a transaction. Read every seed task so we can create only the
    // MISSING ones — a task that was edited, completed, or deleted (and re-created) is never
    // clobbered, and a deleted task is not resurrected within the same seed version.
    const existing = await Promise.all(taskRefs.map((ref) => tx.get(ref)))

    let created = false
    SEED_TASKS.forEach((seed, index) => {
      if (existing[index].exists()) return
      created = true
      tx.set(taskRefs[index], {
        title: seed.title,
        description: seed.description,
        category: seed.category,
        priority: seed.priority,
        status: 'backlog',
        reserved_by: null,
        created_by: 'system',
        completed_by: null,
        order: index * 10,
        reserved_at: null,
        completed_at: null,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })
    })

    tx.set(metaRef, { version: SEED_VERSION, seeded_at: serverTimestamp(), seeded_by: 'system' })
    return created
  })
}
