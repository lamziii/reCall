/** Relative-date builders so generated sample data is never stale — always anchored to "now" at generation time. */

export function daysFromNow(days: number, hour = 9, minute = 0): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, minute, 0, 0)
  return date
}

export function hoursFromNow(hours: number): Date {
  const date = new Date()
  date.setHours(date.getHours() + hours, date.getMinutes(), 0, 0)
  return date
}

export function isToday(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

export function isPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now()
}
