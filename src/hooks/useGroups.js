// src/hooks/useGroups.js
import { useState, useEffect, useCallback } from 'react'
import {
  collection, query, where, onSnapshot,
  doc, setDoc, updateDoc, getDocs,
  addDoc, // 👈 IMPORTANTE
  arrayUnion, serverTimestamp, documentId
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuth } from '@/context/AuthContext'
import { generateGroupCode } from '@/utils/format'
import toast from 'react-hot-toast'

// ── 1. MIS GRUPOS ──
export function useMyGroups() {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return }

    const q = query(
      collection(db, 'groups'),
      where('members', 'array-contains', user.uid)
    )

    const unsub = onSnapshot(q, snap => {
      setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })

    return unsub
  }, [user?.uid])

  return { groups, loading }
}

// ── 2. GRUPO INDIVIDUAL ──
export function useGroup(groupId) {
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!groupId) { setLoading(false); return }

    const unsub = onSnapshot(doc(db, 'groups', groupId), snap => {
      setGroup(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      setLoading(false)
    })

    return unsub
  }, [groupId])

  return { group, loading }
}

// ── 3. CREAR GRUPO ──
export function useCreateGroup() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)

  const createGroup = useCallback(async (name, emoji = '👥') => {
    if (!user?.uid) return null

    setLoading(true)

    try {
      const code = generateGroupCode()
      const groupId = `group_${Date.now()}_${user.uid.slice(0, 6)}`

      // ✅ Crear grupo
      await setDoc(doc(db, 'groups', groupId), {
        name: name.trim(),
        emoji,
        code,
        createdBy: user.uid,
        creatorName: profile?.displayName ?? user.displayName ?? 'Jugador',
        members: [user.uid],
        memberNames: {
          [user.uid]: profile?.displayName ?? user.displayName ?? 'Jugador'
        },
        createdAt: serverTimestamp(),
      })

      // ✅ Notificación (SEPARADA Y SEGURA)
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        title: '🎉 Grupo creado',
        body: `Creaste el grupo ${name}`,
        type: 'group',
        read: false,
        createdAt: serverTimestamp()
      })

      toast.success('¡Grupo creado con éxito! 🎉')
      return groupId

    } catch (err) {
      console.error('Error al crear grupo:', err)
      toast.error('Hubo un problema al crear el grupo')
      return null
    } finally {
      setLoading(false)
    }
  }, [user, profile])

  return { createGroup, loading }
}

// ── 4. UNIRSE A GRUPO ──
export function useJoinGroup() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)

  const joinGroup = useCallback(async (code) => {
    if (!user?.uid) return null

    setLoading(true)

    try {
      const cleanCode = code.trim().toUpperCase()

      const q = query(collection(db, 'groups'), where('code', '==', cleanCode))
      const snap = await getDocs(q)

      if (snap.empty) {
        toast.error('Código inválido')
        return null
      }

      const groupDoc = snap.docs[0]
      const groupData = groupDoc.data()

      if (groupData.members?.includes(user.uid)) {
        toast('Ya estás en este grupo')
        return groupDoc.id
      }

      // ✅ Unirse al grupo
      await updateDoc(doc(db, 'groups', groupDoc.id), {
        members: arrayUnion(user.uid),
        [`memberNames.${user.uid}`]:
          profile?.displayName ?? user.displayName ?? 'Jugador'
      })

      // ✅ Notificación (SEPARADA Y SEGURA)
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        title: '👥 Te uniste a un grupo',
        body: `Ahora eres parte de ${groupData.name}`,
        type: 'group',
        read: false,
        createdAt: serverTimestamp()
      })

      toast.success(`¡Bienvenido a ${groupData.name}! 👥`)
      return groupDoc.id

    } catch (err) {
      console.error(err)
      toast.error('Error al unirse')
      return null
    } finally {
      setLoading(false)
    }
  }, [user, profile])

  return { joinGroup, loading }
}

// ── 5. RANKING ──
export function useGroupRanking(memberUids = []) {
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!memberUids.length) {
      setRanking([])
      setLoading(false)
      return
    }

    const chunks = []
    for (let i = 0; i < memberUids.length; i += 30) {
      chunks.push(memberUids.slice(i, i + 30))
    }

    const unsubscribes = []
    let results = {}

    chunks.forEach((chunk, index) => {
      const q = query(
        collection(db, 'users'),
        where(documentId(), 'in', chunk)
      )

      const unsub = onSnapshot(q, snap => {
        snap.docs.forEach(d => {
          results[d.id] = { uid: d.id, ...d.data() }
        })

        if (index === chunks.length - 1) {
          const sorted = Object.values(results)
            .sort((a, b) => (b.totalPoints ?? 0) - (a.totalPoints ?? 0))
            .map((u, i) => ({ ...u, rank: i + 1 }))

          setRanking(sorted)
          setLoading(false)
        }
      })

      unsubscribes.push(unsub)
    })

    return () => unsubscribes.forEach(u => u())
  }, [JSON.stringify(memberUids)])

  return { ranking, loading }
}