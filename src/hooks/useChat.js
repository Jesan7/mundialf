// src/hooks/useChat.js
import { useState, useEffect, useCallback } from 'react'
import {
  collection, query, orderBy, limit,
  onSnapshot, addDoc, updateDoc, getDoc,
  doc, serverTimestamp, arrayUnion, arrayRemove, writeBatch
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

const MESSAGES_PER_PAGE = 50

export function useChat(groupId) {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(true)
  const [sending, setSending]   = useState(false)

  useEffect(() => {
    if (!groupId) { setLoading(false); return }

    // 🔄 REPARADO: Consultamos de forma descendente para capturar los ÚLTIMOS 50 mensajes reales
    const q = query(
      collection(db, 'groupMessages', groupId, 'messages'),
      orderBy('createdAt', 'desc'), 
      limit(MESSAGES_PER_PAGE)
    )

    const unsub = onSnapshot(q, snap => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      // 🔄 Volteamos el array en caliente para que el mensaje más nuevo aparezca abajo en la interfaz
      setMessages(fetched.reverse())
      setLoading(false)
    }, err => {
      console.error('Error en useChat Listener:', err)
      setLoading(false)
    })

    return unsub
  }, [groupId])

  // ── Enviar Mensaje de Texto y Notificar a Miembros ──────────────────────────
  const sendMessage = useCallback(async (text) => {
    if (!user?.uid || !groupId || !text.trim()) return
    
    const senderName = profile?.displayName ?? user.displayName ?? 'Jugador'
    const msgText = text.trim()

    try {
      // 1. Guardar el mensaje en el chat
      await addDoc(collection(db, 'groupMessages', groupId, 'messages'), {
        userId:      user.uid,
        displayName: senderName,
        photoURL:    user.photoURL ?? null,
        text:        msgText,
        imageURL:    null,
        reactions:   {},
        createdAt:   serverTimestamp(),
      })

      // 2. Despachar notificaciones en tiempo real a los demás miembros
      const groupRef = doc(db, 'groups', groupId)
      const groupSnap = await getDoc(groupRef)

      if (groupSnap.exists()) {
        const groupData = groupSnap.data()
        const members = groupData.members || []
        const groupName = groupData.name || 'Grupo de Polla'

        const batch = writeBatch(db)
        let hasNotifications = false

        members.forEach(memberId => {
          // Evitamos enviarte una notificación a ti mismo por tu propio mensaje
          if (memberId !== user.uid) {
            const notifRef = doc(collection(db, 'notifications'))
            batch.set(notifRef, {
              userId: memberId,
              title: `💬 Mensaje en "${groupName}"`,
              body: `${senderName}: ${msgText.length > 40 ? msgText.substring(0, 37) + '...' : msgText}`,
              type: "chat",
              read: false,
              createdAt: serverTimestamp() // Sincronizado con la hora del servidor
            })
            hasNotifications = true
          }
        })

        // Solo disparamos el batch si hay otros miembros a los cuales notificar
        if (hasNotifications) {
          await batch.commit()
        }
      }
    } catch (err) {
      toast.error('No se pudo enviar el mensaje')
      console.error(err)
    }
  }, [user, groupId, profile])

  // ── Sistema Dinámico de Reacciones Cruzadas ─────────────────────────────────
  const toggleReaction = useCallback(async (messageId, emoji) => {
    if (!user?.uid || !groupId) return
    const msgRef = doc(db, 'groupMessages', groupId, 'messages', messageId)
    const msg = messages.find(m => m.id === messageId)
    if (!msg) return

    const currentReactions = msg.reactions?.[emoji] ?? []
    const hasReacted = currentReactions.includes(user.uid)

    try {
      if (hasReacted) {
        await updateDoc(msgRef, {
          [`reactions.${emoji}`]: arrayRemove(user.uid),
        })
      } else {
        await updateDoc(msgRef, {
          [`reactions.${emoji}`]: arrayUnion(user.uid),
        })
      }
    } catch (err) {
      console.error('Error al conmutar reacción:', err)
    }
  }, [user?.uid, groupId, messages])

  return { messages, loading, sending, sendMessage, toggleReaction }
}