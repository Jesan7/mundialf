// src/hooks/useMatches.js
import { useState, useEffect } from 'react'
import {
  collection,
  query,
  orderBy,
  doc,
  setDoc,
  updateDoc,
  getDocs, // 👈 Importante para la carga única
  where,
  increment,
  writeBatch,
  Timestamp,
  getDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db, auth } from '@/services/firebase' 
import { MATCHES_DATA } from '@/data/matches'
import { calculatePoints } from '@/utils/points' 

// 🛡️ CANDADO MAESTRO: Coloca aquí tu UID exacto de la consola de Firebase
const ADMIN_UID = "ppm17HE6yUVoESHVf7YNpIVMh9t2";

export function useMatches() {
  const [matches, setMatches]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error,   setError]     = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    // Definimos una función asíncrona interna para hacer el fetch único
    const fetchMatches = async () => {
      try {
        const q = query(collection(db, 'matches'), orderBy('date', 'asc'))
        const snap = await getDocs(q) // 👈 Carga los partidos UNA sola vez al montar el componente

        if (snap.empty) {
          await seedMatches()
          return
        }
        
        const docs = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          date: d.data().date?.toDate?.()
            ? d.data().date.toDate().toISOString()
            : d.data().date,
        }))
        
        setMatches(docs)
        setLoading(false)
      } catch (err) {
        console.error('useMatches error:', err)
        setMatches(MATCHES_DATA)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchMatches()
  }, []) // El array vacío asegura que solo se ejecute al cargar la pantalla

  /**
   * FUNCIÓN ADMINISTRADORA RECONFIGURADA, BLINDADA Y RESTRINGIDA
   */
  async function updateMatchResult(matchId, homeScore, awayScore) {
    // 🛡️ CONTROL DE SEGURIDAD INTERNO: Bloqueo absoluto si no es el administrador real
    const currentUser = auth.currentUser
    if (!currentUser || currentUser.uid !== ADMIN_UID) {
      alert("🚫 Acceso denegado: No tienes permisos de administrador para alterar resultados.")
      console.error("Intento de violación de seguridad por el UID:", currentUser?.uid)
      return false
    }

    setUpdatingId(matchId)
    try {
      const hScore = parseInt(homeScore, 10)
      const aScore = parseInt(awayScore, 10)

      if (isNaN(hScore) || isNaN(aScore)) {
        throw new Error('Los marcadores deben ser números válidos.')
      }

      const matchRef = doc(db, 'matches', matchId)
      
      // 🛡️ CONTROL DE SEGURIDAD 2: Consultar el estado más fresco del partido en el servidor
      const matchSnap = await getDoc(matchRef)
      if (matchSnap.exists() && matchSnap.data().pointsDistributed === true) {
        alert("⚠️ ¡Bloqueo de seguridad! Los puntos y monedas de este partido ya fueron procesados y repartidos previamente.")
        setUpdatingId(null)
        return false
      }

      const matchData = matchSnap.exists() ? matchSnap.data() : {}

      // 1. Cambiar estado del partido a finalizado y marcar puntos como distribuidos
      await updateDoc(matchRef, {
        homeScore: hScore,
        awayScore: aScore,
        status: 'finished',
        pointsDistributed: true
      })

      // 2. Buscar predicciones de los usuarios para el partido
      const predQuery = query(collection(db, 'predictions'), where('matchId', '==', matchId))
      const predSnap = await getDocs(predQuery)

      if (!predSnap.empty) {
        const batch = writeBatch(db)

        for (const predDoc of predSnap.docs) {
          const predData = predDoc.data()
          const userId = predData.userId

          // Calculamos los puntos ganados (considera si usó multiplicador)
          const pointsEarned = calculatePoints(
            { homeScore: predData.homeScore, awayScore: predData.awayScore, hasMultiplier: predData.hasMultiplier },
            { homeScore: hScore, awayScore: aScore }
          )

          // Evaluamos el acierto base sin el multiplicador para las monedas
          const pointsBase = calculatePoints(
            { homeScore: predData.homeScore, awayScore: predData.awayScore, hasMultiplier: false },
            { homeScore: hScore, awayScore: aScore }
          )

          let coinsReward = 0
          if (pointsBase === 5) coinsReward = 200      // Exacto
          else if (pointsBase === 2) coinsReward = 100 // Diferencia
          else if (pointsBase === 1) coinsReward = 50   // Ganador

          // Guardar registro en la predicción
          const predRef = doc(db, 'predictions', predDoc.id)
          batch.update(predRef, { 
            points: pointsEarned,
            coinsWon: coinsReward
          })

          // Actualizar el perfil del usuario atómicamente
          if (userId) {
            const userRef = doc(db, 'users', userId)
            batch.update(userRef, {
              totalPoints: increment(pointsEarned),
              coins: increment(coinsReward), 
              streak: pointsEarned > 0 ? increment(1) : 0
            })

            // 🔔 ENCHUFE DE NOTIFICACIÓN ATÓMICA: Creamos la alerta para cada participante
            const newNotifRef = doc(collection(db, 'notifications'))
            batch.set(newNotifRef, {
              userId: userId,
              title: "🏆 Resultado del partido",
              body: `+${pointsEarned} pts | +${coinsReward} monedas en ${matchData.homeTeam || 'Partido'} vs ${matchData.awayTeam || ''}`,
              type: pointsEarned > 0 ? "points" : "match",
              read: false,
              createdAt: serverTimestamp()
            })
          }
        }

        await batch.commit()
      }

      // Optimización local extra: Actualizamos el estado del partido localmente para que se refleje de inmediato
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, homeScore: hScore, awayScore: aScore, status: 'finished' } : m))
      setUpdatingId(null)
      return true
    } catch (err) {
      console.error('Error al actualizar resultado con economía:', err)
      setUpdatingId(null)
      return false
    }
  }

  return { matches, loading, error, updatingId, updateMatchResult }
}

async function seedMatches() {
  try {
    for (const m of MATCHES_DATA) {
      await setDoc(doc(db, 'matches', m.id), {
        ...m,
        date: Timestamp.fromDate(new Date(m.date)),
      })
    }
  } catch (e) {
    console.warn('Could not seed matches:', e.message)
  }
}

export function filterByStatus(matches, status) {
  return matches.filter(m => m.status === status)
}

export function upcomingMatches(matches, n = 5) {
  return matches.filter(m => m.status === 'upcoming').slice(0, n)
}

export function liveMatches(matches) {
  return matches.filter(m => m.status === 'live')
}

export function finishedMatches(matches, n = 5) {
  return matches.filter(m => m.status === 'finished').slice(-n).reverse()
}