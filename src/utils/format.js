// src/utils/format.js
// Helpers adicionales de formato

export function formatScore(home, away) {
  if (home == null || away == null) return '? – ?'
  return `${home} – ${away}`
}

export function getMatchResult(homeScore, awayScore) {
  if (homeScore == null || awayScore == null) return null
  if (homeScore > awayScore) return 'home'
  if (awayScore > homeScore) return 'away'
  return 'draw'
}

export function avatarInitials(name) {
  if (!name) return '?'
  return name.trim()[0].toUpperCase()
}

export function generateGroupCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
