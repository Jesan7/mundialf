// scripts/seedMatches.mjs
// Ejecutar UNA sola vez: node scripts/seedMatches.mjs
// Requiere: GOOGLE_APPLICATION_CREDENTIALS o Firebase Admin SDK

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

// Ajusta la ruta a tu serviceAccount.json
// import serviceAccount from '../serviceAccount.json' assert { type: 'json' }

// initializeApp({ credential: cert(serviceAccount) })
// const db = getFirestore()

// ─── Partidos del Mundial 2026 (muestra — horario Ecuador GMT-5) ─────────────
export const MATCHES_SEED = [
  {
    id: 'match_001',
    homeTeam: 'México', homeFlag: '🇲🇽',
    awayTeam: 'Polonia', awayFlag: '🇵🇱',
    homeScore: null, awayScore: null,
    date: '2026-06-11T14:00:00-05:00',
    status: 'upcoming',
    group: 'Grupo B', stage: 'Fase de Grupos',
    venue: 'SoFi Stadium, Los Ángeles',
  },
  {
    id: 'match_002',
    homeTeam: 'Argentina', homeFlag: '🇦🇷',
    awayTeam: 'Arabia Saudita', awayFlag: '🇸🇦',
    homeScore: null, awayScore: null,
    date: '2026-06-12T08:00:00-05:00',
    status: 'upcoming',
    group: 'Grupo C', stage: 'Fase de Grupos',
    venue: 'MetLife Stadium, Nueva York',
  },
  {
    id: 'match_003',
    homeTeam: 'Francia', homeFlag: '🇫🇷',
    awayTeam: 'Marruecos', awayFlag: '🇲🇦',
    homeScore: null, awayScore: null,
    date: '2026-06-13T11:00:00-05:00',
    status: 'upcoming',
    group: 'Grupo D', stage: 'Fase de Grupos',
    venue: 'AT&T Stadium, Dallas',
  },
  {
    id: 'match_004',
    homeTeam: 'Brasil', homeFlag: '🇧🇷',
    awayTeam: 'Serbia', awayFlag: '🇷🇸',
    homeScore: null, awayScore: null,
    date: '2026-06-14T14:00:00-05:00',
    status: 'upcoming',
    group: 'Grupo G', stage: 'Fase de Grupos',
    venue: 'Levi\'s Stadium, San Francisco',
  },
  {
    id: 'match_005',
    homeTeam: 'España', homeFlag: '🇪🇸',
    awayTeam: 'Alemania', awayFlag: '🇩🇪',
    homeScore: null, awayScore: null,
    date: '2026-06-15T08:00:00-05:00',
    status: 'upcoming',
    group: 'Grupo E', stage: 'Fase de Grupos',
    venue: 'Rose Bowl, Los Ángeles',
  },
  {
    id: 'match_006',
    homeTeam: 'Ecuador', homeFlag: '🇪🇨',
    awayTeam: 'Colombia', awayFlag: '🇨🇴',
    homeScore: null, awayScore: null,
    date: '2026-06-16T11:00:00-05:00',
    status: 'upcoming',
    group: 'Grupo A', stage: 'Fase de Grupos',
    venue: 'Estadio Ciudad de México',
  },
  {
    id: 'match_007',
    homeTeam: 'Portugal', homeFlag: '🇵🇹',
    awayTeam: 'Uruguay', awayFlag: '🇺🇾',
    homeScore: null, awayScore: null,
    date: '2026-06-17T14:00:00-05:00',
    status: 'upcoming',
    group: 'Grupo F', stage: 'Fase de Grupos',
    venue: 'Hard Rock Stadium, Miami',
  },
  {
    id: 'match_008',
    homeTeam: 'Inglaterra', homeFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    awayTeam: 'Países Bajos', awayFlag: '🇳🇱',
    homeScore: null, awayScore: null,
    date: '2026-06-18T08:00:00-05:00',
    status: 'upcoming',
    group: 'Grupo H', stage: 'Fase de Grupos',
    venue: 'Lincoln Financial Field, Filadelfia',
  },
]

// Descomenta para ejecutar seed:
// async function seed() {
//   for (const match of MATCHES_SEED) {
//     await db.collection('matches').doc(match.id).set({
//       ...match,
//       date: Timestamp.fromDate(new Date(match.date)),
//     })
//   }
//   console.log('✅ Seed completado')
//   process.exit(0)
// }
// seed()
