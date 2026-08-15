import { useEmulators } from './config'

// Runs an emulator-connect function exactly once per key (guards against Vite HMR re-running
// module init and double-connecting, which Firebase throws on). No-op unless VITE_USE_EMULATORS
// is enabled in dev.
const connected = new Set<string>()

export function connectEmulatorOnce(key: string, connect: () => void): void {
  if (!useEmulators || connected.has(key)) return
  connected.add(key)
  try {
    connect()
  } catch {
    // Already connected (e.g. across an HMR boundary) — safe to ignore.
  }
}
