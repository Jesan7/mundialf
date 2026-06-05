// src/services/firebase.js
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth'
import {
  getFirestore,
  enableIndexedDbPersistence,
} from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

// Init app
const app = initializeApp(firebaseConfig)

// Auth — persistir sesión en localStorage
export const auth = getAuth(app)
setPersistence(auth, browserLocalPersistence).catch(console.error)

// Firestore
export const db = getFirestore(app)

// Habilitar caché offline (best-effort)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence: multiple tabs open')
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence: browser not supported')
  }
})

// Storage
export const storage = getStorage(app)

export default app

// ─── Firestore Collections reference ─────────────────────────────────────────
//
// users/{uid}
//   displayName: string
//   email: string
//   photoURL: string | null
//   coins: number          (saldo virtual)
//   totalPoints: number
//   streak: number
//   createdAt: Timestamp
//
// matches/{matchId}
//   homeTeam: string
//   awayTeam: string
//   homeFlag: string       (emoji bandera)
//   awayFlag: string
//   homeScore: number | null
//   awayScore: number | null
//   date: Timestamp        (hora Ecuador GMT-5)
//   status: 'upcoming' | 'live' | 'finished'
//   group: string          (e.g. "Grupo A")
//   stage: string          (e.g. "Fase de Grupos")
//   venue: string
//
// predictions/{uid_matchId}   (docId = `${uid}_${matchId}`)
//   userId: string
//   matchId: string
//   homeScore: number
//   awayScore: number
//   points: number | null  (null = no calculado)
//   createdAt: Timestamp
//   updatedAt: Timestamp
//
// groups/{groupId}
//   name: string
//   code: string           (código único 6 chars)
//   createdBy: string      (uid)
//   members: string[]      (uids)
//   createdAt: Timestamp
//
// groupMessages/{groupId}/messages/{msgId}
//   userId: string
//   displayName: string
//   photoURL: string | null
//   text: string
//   imageURL: string | null
//   reactions: { [emoji]: string[] }   (emoji -> array of uid)
//   createdAt: Timestamp
//
// notifications/{uid}/items/{notifId}
//   type: 'points' | 'coins' | 'group' | 'match'
//   title: string
//   body: string
//   read: boolean
//   createdAt: Timestamp
