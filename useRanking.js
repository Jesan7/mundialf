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
 * Ranking por Jornada — Trae los usuarios de un mismo grupo y calcula la sumatoria de puntos 
 * obtenidos únicamente en la jornada seleccionada de forma eficiente y plana.
 */
// 🌟 CAMBIO CLAVE: Agregamos groupId como tercer parámetro (por defecto es null)
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
    let unsubscribePreds = () => {}

    // 1. Traemos la lista de usuarios FILTRADA por grupo. Usamos getDocs (una sola lectura)
    // para evitar sobrecostos y bucles de renderizado accidentales.
    const fetchUsersAndCalculate = async () => {
      try {
        // 🌟 CAMBIO CLAVE: Aplicamos el filtro estricto por groupId en la colección de usuarios
        // Nos aseguramos de limpiar espacios con .trim() y forzar mayúsculas para evitar fallas manuales
        const usersQuery = query(
          collection(db, 'users'),
          where('groupId', '==', groupId.trim().toUpperCase())
        )
        const usersSnap = await getDocs(usersQuery)
        const usersMap = {}

        usersSnap.docs.forEach((doc) => {
          usersMap[doc.id] = {
            uid: doc.id,
            ...doc.data(),
            jornadaPoints: 0 // Inicialización limpia
          }
        })

        // Si por alguna razón extraña no hay usuarios en este grupo, cortamos de forma segura
        if (Object.keys(usersMap).length === 0) {
          setRanking([])
          setLoading(false)
          return
        }

        // 2. Montamos la consulta de predicciones filtrada estrictamente por la jornada activa.
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
            // Filtro seguro en caliente: Solo sumamos si el usuario pertenece al grupo cargado en memoria 
            // y si el administrador ya inyectó puntos numéricos válidos.
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
  // 🌟 CAMBIO CLAVE: Agregamos groupId al arreglo de dependencias para que el hook se refresque si cambia el grupo
  }, [topN, selectedJornada, groupId])

  return { ranking, loading, error }
}