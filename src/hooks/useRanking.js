// src/hooks/useRanking.js
import { useState, useEffect } from 'react'
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs
} from 'firebase/firestore'
import { db } from '@/services/firebase'

/**
 * Ranking por Jornada — Trae los usuarios y calcula la sumatoria de puntos 
 * obtenidos únicamente en la jornada seleccionada de forma eficiente y plana.
 */
export function useRanking(topN = 50, selectedJornada = 1) {
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    setLoading(true)
    let unsubscribePreds = () => {}

    // 1. Traemos la lista de usuarios. Usamos getDocs (una sola lectura) en lugar de un 
    // listener activo onSnapshot para evitar sobrecostos y bucles de renderizado.
    const fetchUsersAndCalculate = async () => {
      try {
        const usersSnap = await getDocs(query(collection(db, 'users')))
        const usersMap = {}

        usersSnap.docs.forEach((doc) => {
          usersMap[doc.id] = {
            uid: doc.id,
            ...doc.data(),
            jornadaPoints: 0 // Inicialización limpia
          }
        })

        // 2. Montamos la consulta de predicciones filtrada estrictamente por la jornada activa.
        // Removimos el '!= null' temporalmente para evitar la obligación de crear índices complejos en Firebase.
        const predsQuery = query(
          collection(db, 'predictions'),
          where('jornada', '==', Number(selectedJornada))
        )

        // 3. Escuchamos las predicciones en tiempo real para esa jornada elegida
        unsubscribePreds = onSnapshot(predsQuery, (predsSnap) => {
          
          // Resetear los puntos del mapa para que el cálculo no acumule residuos de otras consultas
          Object.keys(usersMap).forEach((uid) => {
            usersMap[uid].jornadaPoints = 0
          })

          // Recorrer los pronósticos y mapear los puntos si el partido ya fue procesado por el admin
          predsSnap.docs.forEach((d) => {
            const predData = d.data()
            // Filtro seguro en caliente: Solo sumamos si el administrador ya inyectó puntos numéricos
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

      } catch (err) {
        console.error('Error obteniendo base de usuarios:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchUsersAndCalculate()

    // 🏁 Limpieza estricta: Cerramos el listener al desmontar el componente o cambiar de pestaña
    return () => {
      unsubscribePreds()
    }
  }, [topN, selectedJornada])

  return { ranking, loading, error }
}