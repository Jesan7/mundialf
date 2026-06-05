// src/utils/dateUtils.js
import { format, formatDistanceToNow, isPast, differenceInSeconds } from 'date-fns'
import { es } from 'date-fns/locale'

export function toDate(value) {
  if (!value) return null
  // Firestore Timestamp
  if (value?.toDate) return value.toDate()
  // ISO string or Date
  return new Date(value)
}

export function formatMatchDate(value) {
  const d = toDate(value)
  if (!d) return ''
  return format(d, "EEEE d 'de' MMMM · HH:mm", { locale: es })
}

export function formatMatchDateShort(value) {
  const d = toDate(value)
  if (!d) return ''
  return format(d, 'd MMM · HH:mm', { locale: es })
}

export function formatRelative(value) {
  const d = toDate(value)
  if (!d) return ''
  return formatDistanceToNow(d, { addSuffix: true, locale: es })
}

export function isMatchStarted(value) {
  const d = toDate(value)
  if (!d) return false
  return isPast(d)
}

/**
 * Returns { days, hours, minutes, seconds } until the match starts.
 * Returns null if already started.
 */
export function getCountdown(value) {
  const d = toDate(value)
  if (!d) return null
  const total = differenceInSeconds(d, new Date())
  if (total <= 0) return null
  const days    = Math.floor(total / 86400)
  const hours   = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return { days, hours, minutes, seconds, total }
}
