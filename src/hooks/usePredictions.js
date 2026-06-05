// src/hooks/usePredictions.js
import { useState, useEffect } from 'react'
import { doc, runTransaction, collection, onSnapshot, query, where } from 'firebase/firestore'

// 🔗 PROBAMOS CON LA RUTA RELATIVA DIRECTA DE VITE ESCAPANDO EL ESPACIO
import { db } from '@/services/firebase'
import { useAuth } from '@/context/AuthContext'

export function usePredictions() {
  const { user } = useAuth() 
  const [predictions, setPredictions] = useState({})
  const [saving, setSaving] = useState(null)
  const [loading, setLoading] = useState(true)

  // Escuchar las predicciones del usuario en tiempo real
  useEffect(() => {
    if (!user?.uid) {
      setPredictions({})
      setLoading(false)
      return
    }

    const q = query(collection(db, 'predictions'), where('userId', '==', user.uid))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const predsMap = {}
      snapshot.forEach((doc) => {
        predsMap[doc.data().matchId] = { id: doc.id, ...doc.data() }
      })
      setPredictions(predsMap)
      setLoading(false)
    }, (error) => {
      console.error("Error al escuchar predicciones:", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user?.uid])

  /**
   * Guarda o edita una predicción aplicando el descuento de monedas si usa comodín.
   * Totalmente blindada usando Transacciones Atómicas para evitar duplicación de saldos.
   * Incluye el registro dinámico de la jornada del partido.
   */
  async function savePrediction(matchId, homeScore, awayScore, matchDate, matchStatus, useMultiplier = false, jornada = 1) {
    if (!user?.uid) return false
    setSaving(matchId)

    try {
      const predId = `${user.uid}_${matchId}`
      const predRef = doc(db, 'predictions', predId)
      const userRef = doc(db, 'users', user.uid)

      await runTransaction(db, async (transaction) => {
        const predSnap = await transaction.get(predRef)
        const userSnap = await transaction.get(userRef)

        const alreadyHadMultiplier = predSnap.exists() ? (predSnap.data().hasMultiplier || false) : false
        const currentCoins = userSnap.exists() ? (userSnap.data().coins || 0) : 0

        let newCoins = currentCoins

        if (useMultiplier && !alreadyHadMultiplier) {
          if (currentCoins < 100) {
            throw new Error('INSUFFICIENT_COINS')
          }
          newCoins = currentCoins - 100
        } else if (!useMultiplier && alreadyHadMultiplier) {
          newCoins = currentCoins + 100
        }

        transaction.update(userRef, { coins: newCoins })
        
        const numeroJornada = Number(jornada) || 1

        transaction.set(predRef, {
          matchId,
          userId: user.uid,
          jornada: numeroJornada, 
          homeScore: Number(homeScore),
          awayScore: Number(awayScore),
          hasMultiplier: useMultiplier,
          updatedAt: new Date().toISOString(),
          points: null 
        }, { merge: true })
      })

      setSaving(null)
      return true
    } catch (err) {
      setSaving(null)
      if (err.message === 'INSUFFICIENT_COINS') {
        alert('❌ No tienes suficientes monedas para activar el Comodín x2.')
      } else {
        console.error('Error crítico en transacción económica:', err)
      }
      return false
    }
  }

  return {
    predictions,
    saving,
    loading,
    savePrediction
  }
}

export default usePredictions;