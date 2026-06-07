// src/hooks/useRanking.js
import { useState, useEffect } from 'react'
import {
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore'
import { db } from '@/services/firebase'

/**
 * Ranking por Jornada — Trae los usuarios de un mismo grupo y calcula la sumatoria de puntos 
 * obtenidos únicamente en la jornada seleccionada de forma eficiente, aislada y en tiempo real.
 */
export function useRanking(topN = 50, selectedJornada = 1, groupId = null) {
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    // 🛡️ CONTROL DE SEGURIDAD ROBUSTO:
    // Si la sesión aún no carga, o el groupId es undefined, null, o un texto vacío "",
    // frenamos el hook inmediatamente para que NO consulte a toda la base de datos por error.
    if (!groupId || typeof groupId !== 'string' || groupId.trim() === '') {
      setRanking([])
      setLoading(false)
      return
    }

    setLoading(true)
    
    // Declaramos las funciones de limpieza para evitar fugas de memoria
    let unsubscribeUsers = () => {}
    let unsubscribePreds = () => {}

    // 1. Escuchamos la lista de usuarios FILTRADA por grupo en TIEMPO REAL
    const usersQuery = query(
      collection(db, 'users'),
      where('groupId', '==', groupId.trim().toUpperCase())
    )

    unsubscribeUsers = onSnapshot(usersQuery, (usersSnap) => {
      const usersMap = {}

      usersSnap.docs.forEach((doc) => {
        usersMap[doc.id] = {
          uid: doc.id,
          ...doc.data(),
          jornadaPoints: 0 // Inicialización limpia
        }
      })

      // Si el grupo se queda sin miembros o es un ID inválido, limpiamos el estado de forma segura
      if (Object.keys(usersMap).length === 0) {
        setRanking([])
        setLoading(false)
        return
      }

      // Matamos el listener previo de predicciones si la lista de usuarios llega a cambiar
      unsubscribePreds()

      // 2. Montamos la consulta de predicciones filtrada estrictamente por la jornada activa
      const predsQuery = query(
        collection(db, 'predictions'),
        where('jornada', '==', Number(selectedJornada))
      )

      // 3. Escuchamos las predicciones en tiempo real para esa jornada elegida
      unsubscribePreds = onSnapshot(predsQuery, (predsSnap) => {
        
        // Resetear los puntos del mapa para que el cálculo no acumule residuos
        Object.keys(usersMap).forEach((uid) => {
          usersMap[uid].jornadaPoints = 0
        })

        // Recorrer los pronósticos y mapear los puntos si el partido ya fue procesado por el admin
        predsSnap.docs.forEach((d) => {
          const predData = d.data()
          
          // Filtro seguro en caliente: Solo sumamos si el usuario pertenece al grupo y tiene puntos válidos
          if (usersMap[predData.userId] && predData.points !== null && predData.points !== undefined) {
            usersMap[predData.userId].jornadaPoints += Number(predData.points)
          }
        })

        // Convertimos el mapa en un Array ordenado de mayor a menor puntaje
        const sortedList = Object.values(usersMap)
          .sort((a, b) => b.jornadaPoints - a.jornadaPoints)
          .slice(0, topN)
          .map((player, index) => ({
            ...player,
            rank: index + 1, // Posición dinámica en la tabla
          }))

        setRanking(sortedList)
        setLoading(false)
      }, (err) => {
        console.error('Error en listener de predicciones:', err)
        setError(err.message)
        setLoading(false)
      })

    }, (err) => {
      console.error('Error en listener de usuarios por grupo:', err)
      setError(err.message)
      setLoading(false)
    })

    // 🏁 Limpieza estricta: Cerramos ambos listeners en tiempo real al desmontar o cambiar dependencias
    return () => {
      unsubscribeUsers()
      unsubscribePreds()
    }

  // El hook se reactivará automáticamente si cambia el número de top, la jornada o el grupo del usuario
  }, [topN, selectedJornada, groupId])

  return { ranking, loading, error }
}