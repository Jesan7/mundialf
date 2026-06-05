// src/pages/Notifications.jsx
import { useState, useEffect } from 'react'
import {
  collection, query, orderBy, limit, where,
  onSnapshot, updateDoc, doc, writeBatch,
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuth } from '@/context/AuthContext'
import MainLayout from '@/layouts/MainLayout'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonLine } from '@/components/ui/Skeleton'
import { CheckCheck } from 'lucide-react'
import clsx from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

// Configuración de tipos con balance de color profesional
const TYPE_CONFIG = {
  points:  { icon: '🏆', bg: 'bg-[#fbbf2415]', border: 'border-[#fbbf2422]' },
  coins:   { icon: '🪙', bg: 'bg-[#fbbf2415]', border: 'border-[#fbbf2422]' },
  group:   { icon: '👥', bg: 'bg-blue-500/15',   border: 'border-blue-500/22'  },
  chat:    { icon: '💬', bg: 'bg-teal-500/15',   border: 'border-teal-500/22'  }, // 🔄 Añadido soporte visual para Chat
  match:   { icon: '⚽', bg: 'bg-[#00ff7f15]', border: 'border-[#00ff7f22]' },
  default: { icon: '🔔', bg: 'bg-gray-500/15',   border: 'border-gray-500/22'  },
}

export default function Notifications() {
  const { user }                    = useAuth()
  const [notifs, setNotifs]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return }
    
    // 🔄 REPARADO: Apunta a la colección raíz filtrando por el campo userId del documento
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(30)
    )
    
    const unsub = onSnapshot(q, snap => {
      setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, (err) => {
      console.error("Error leyendo notificaciones:", err)
      setLoading(false)
    })
    
    return unsub
  }, [user])

  async function markRead(id) {
    if (!user?.uid) return
    // 🔄 REPARADO: Ruta plana de colección global
    await updateDoc(doc(db, 'notifications', id), { read: true })
  }

  async function markAllRead() {
    const unread = notifs.filter(n => !n.read)
    if (!unread.length || !user?.uid) return
    
    setMarkingAll(true)
    const batch = writeBatch(db)
    
    // 🔄 REPARADO: Batch unificado apuntando a la colección plana global
    unread.forEach(n => {
      batch.update(doc(db, 'notifications', n.id), { read: true })
    })
    
    await batch.commit()
    setMarkingAll(false)
  }

  const unreadCount = notifs.filter(n => !n.read).length

  return (
    <MainLayout>
      <div className="animate-fade-in">

        {/* Encabezado */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              Notificaciones
              {unreadCount > 0 && (
                <span className="text-xs font-black bg-[#00ff7f] text-[#0a0e1a] px-2 py-0.5 rounded-full animate-pulse">
                  {unreadCount}
                </span>
              )}
            </h1>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="btn-ghost text-xs text-[#00ff7f] flex items-center gap-1.5 py-1.5 hover:bg-[#00ff7f10]"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar todo como leído
            </button>
          )}
        </div>

        {/* Estado de Carga (Skeletons) */}
        {loading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="card p-4 flex gap-3 bg-[#111827]/50">
                <SkeletonLine className="w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <SkeletonLine className="h-3 w-1/3" />
                  <SkeletonLine className="h-2 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="Buzón despejado"
            body="Aquí aparecerán tus alertas de puntos ganados, monedas de recompensa y desafíos de grupo."
          />
        ) : (
          <div className="space-y-2.5">
            {notifs.map(n => {
              const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.default
              
              let timeLabel = ''
              if (n.createdAt) {
                const dateObj = typeof n.createdAt.toDate === 'function' ? n.createdAt.toDate() : n.createdAt
                if (dateObj instanceof Date && !isNaN(dateObj)) {
                  timeLabel = formatDistanceToNow(dateObj, { addSuffix: true, locale: es })
                }
              }

              return (
                <button
                  key={n.id}
                  onClick={() => !n.read && markRead(n.id)}
                  disabled={n.read}
                  className={clsx(
                    'w-full card p-4 flex items-start gap-3 text-left transition-all duration-200 rounded-2xl border',
                    !n.read 
                      ? 'bg-gradient-to-r from-[#0d1b2a] to-[#111827] border-[#1e2d3d] shadow-md hover:border-[#2d3f52]' 
                      : 'bg-[#060b13]/40 border-transparent opacity-40 cursor-default'
                  )}
                >
                  {/* Icono con contenedor estilizado */}
                  <div className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border', 
                    cfg.bg, 
                    !n.read ? cfg.border : 'border-transparent'
                  )}>
                    {cfg.icon}
                  </div>

                  {/* Cuerpo del contenido */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white leading-tight truncate">
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{n.body}</p>
                    {timeLabel && (
                      <p className="text-[10px] text-gray-600 mt-1.5 font-medium tabular-nums">
                        {timeLabel}
                      </p>
                    )}
                  </div>

                  {/* Punto indicador de no leído */}
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-[#00ff7f] flex-shrink-0 mt-1.5 shadow-[0_0_8px_#00ff7f]" />
                  )}
                </button>
              )
            })}
          </div>
        )}

      </div>
    </MainLayout>
  )
}