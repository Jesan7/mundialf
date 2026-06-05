// src/hooks/useNotifications.js
import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuth } from '@/context/AuthContext'

export function useUnreadCount() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user?.uid) {
      console.log("🕵️ MENSAGERO: No hay usuario activo todavía.")
      setUnreadCount(0)
      return
    }

    console.log("🕵️ MENSAGERO: Escuchando notificaciones para el usuario:", user.uid)

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false)
    )

    const unsub = onSnapshot(q, (snap) => {
      console.log("🕵️ MENSAGERO: ¡Llegó un cambio de Firestore! Documentos encontrados:", snap.size)
      setUnreadCount(snap.size)
    }, (err) => {
      console.error("Error en el contador de notificaciones:", err)
    })

    return unsub
  }, [user?.uid])

  return unreadCount
}