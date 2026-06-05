// src/utils/points.js

/**
 * Calcula los puntos de un pronóstico tomando en cuenta el Comodín x2.
 * Reglas base (NO acumulables):
 * Marcador exacto          → 5 pts (ó 10 pts con Comodín)
 * Diferencia correcta      → 2 pts (ó 4 pts con Comodín)
 * Solo ganador/empate      → 1 pt  (ó 2 pts con Comodín)
 * Ninguno                  → 0 pts
 */
export function calculatePoints(pred, result) {
  const { homeScore: ph, awayScore: pa, hasMultiplier } = pred
  const { homeScore: rh, awayScore: ra } = result

  if (ph == null || pa == null || rh == null || ra == null) return null

  const pH = Number(ph), pA = Number(pa)
  const rH = Number(rh), rA = Number(ra)

  // AJUSTE DEFENSIVO: Evaluamos si viene como booleano true o string "true"
  const multiplier = (hasMultiplier === true || hasMultiplier === 'true') ? 2 : 1

  // 1. Marcador exacto (Ej: Pred: 2-1, Real: 2-1)
  if (pH === rH && pA === rA) return 5 * multiplier

  // Calcular las tendencias (1 = Gana Local, -1 = Gana Visitante, 0 = Empate)
  const predResult = Math.sign(pH - pA)
  const realResult = Math.sign(rH - rA)

  // Si no acertó ni el ganador ni el empate básico, directo se va con 0 puntos
  if (predResult !== realResult) return 0

  // 2. Diferencia de goles correcta (Ej: Pred: 3-1, Real: 2-0 -> Ambos +2 y Ganador Local)
  if (predResult !== 0 && (pH - pA === rH - rA)) return 2 * multiplier

  // 3. Solo ganador o empate no exacto (Ej: Pred: 1-1, Real: 2-2)
  return 1 * multiplier
}

/**
 * Label descriptivo del resultado del pronóstico (soporta valores duplicados)
 */
export function pointsLabel(points) {
  if (points === 10) return '🎯 ¡Comodín Exacto! +10'
  if (points === 5)  return '🎯 ¡Exacto! +5'
  if (points === 4)  return '✅ Comodín Diferencia +4'
  if (points === 2)  return '✅ Diferencia +2'
  if (points === 2)  return '👍 Comodín Ganador +2' // Manejo por si acaso, aunque comparte valor con diferencia base
  if (points === 1)  return '👍 Ganador +1'
  if (points === 0)  return '❌ Sin puntos'
  return null
}

/**
 * Color badge según puntos (Mantiene consistencia con el Comodín)
 */
export function pointsColor(points) {
  if (points === 10 || points === 5) {
    return 'text-[#fbbf24] bg-[#fbbf2420] border-[#fbbf2440]'
  }
  if (points === 4 || points === 2) {
    return 'text-[#00ff7f] bg-[#00ff7f20] border-[#00ff7f40]'
  }
  if (points === 1) {
    return 'text-blue-400 bg-blue-400/10 border-blue-400/30'
  }
  return 'text-gray-500 bg-gray-500/10 border-gray-500/30'
}