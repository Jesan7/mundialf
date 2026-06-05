// src/components/ui/ChatMessage.jsx
import { useState, useEffect, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import clsx from 'clsx'
import { Smile } from 'lucide-react'

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🔥', '😮', '👏']

export default function ChatMessage({ message, isMe, onReaction, currentUserId }) {
  const [showReactions, setShowReactions] = useState(false)
  const pickerRef = useRef(null)

  // Cierra el selector de reacciones si el usuario hace clic en otro lado
  useEffect(() => {
    if (!showReactions) return
    function handleClickOutside(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowReactions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showReactions])

  // 🔄 REPARADO: Formateo ultra seguro contra la latencia inicial de Firebase
  let timeAgo = ''
  if (message.createdAt) {
    const dateObj = typeof message.createdAt.toDate === 'function' ? message.createdAt.toDate() : message.createdAt
    if (dateObj instanceof Date && !isNaN(dateObj)) {
      timeAgo = formatDistanceToNow(dateObj, { addSuffix: true, locale: es })
    }
  }

  // 🔄 REPARADO: Extracción de inicial segura contra strings vacíos o nulos
  const nameClean = message.displayName?.trim() || 'Usuario'
  const init = nameClean[0].toUpperCase()

  // Agrupar reacciones activas válidas
  const reactionEntries = Object.entries(message.reactions ?? {})
    .filter(([, uids]) => Array.isArray(uids) && uids.length > 0)

  return (
    <div className={clsx('flex gap-2.5 group w-full', isMe && 'flex-row-reverse')}>
      
      {/* Avatar del remitente */}
      {!isMe && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1e2d3d] to-[#0d1b2a] border border-[#2d3f52] flex items-center justify-center text-xs font-black text-white flex-shrink-0 mt-1 shadow-sm select-none">
          {init}
        </div>
      )}

      {/* Contenedor de Contenido */}
      <div className={clsx('max-w-[75%] space-y-1', isMe ? 'items-end flex flex-col' : 'items-start flex flex-col')}>
        
        {/* Nombre de usuario e indicador de tiempo */}
        {!isMe && (
          <p className="text-[10px] text-gray-500 px-1 flex items-center gap-1.5">
            <span className="font-bold text-gray-400">{nameClean}</span>
            {timeAgo && <span className="opacity-50 tabular-nums">{timeAgo}</span>}
          </p>
        )}

        {/* Globo de mensaje + disparadores */}
        <div className="relative" ref={pickerRef}>
          
          <div className={clsx(
            'rounded-2xl px-3 py-2 text-sm relative shadow-sm',
            isMe
              ? 'bg-[#00ff7f] text-[#0a0e1a] rounded-tr-sm font-medium selection:bg-[#0a0e1a]/20'
              : 'bg-[#1e2d3d] text-white rounded-tl-sm border border-[#2d3f52]/40 selection:bg-white/20'
          )}>
            {/* Si contiene imagen adjunta */}
            {message.imageURL ? (
              <div className="relative rounded-xl overflow-hidden bg-[#0a0e1a]/40 max-w-[240px]">
                <img
                  src={message.imageURL}
                  alt="Imagen de chat"
                  className="rounded-xl max-h-60 w-full object-cover border border-[#2d3f52]/40"
                  loading="lazy"
                />
              </div>
            ) : (
              /* Texto plano con quiebres limpios */
              <p className="leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
            )}
          </div>

          {/* 🔄 REPARADO: Botón de reacción con visibilidad pasiva adaptada para móviles */}
          <button
            type="button"
            onClick={() => setShowReactions(v => !v)}
            className={clsx(
              'absolute top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-[#0a0e1a]/80 backdrop-blur border border-[#1e2d3d]',
              'opacity-40 group-hover:opacity-100 transition-all duration-150 hover:scale-105 active:scale-95 z-20',
              isMe ? '-left-10' : '-right-10'
            )}
            title="Reaccionar"
          >
            <Smile className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
          </button>

          {/* Menú flotante de reacciones rápidas */}
          {showReactions && (
            <div className={clsx(
              'absolute bottom-full mb-2 bg-[#111827] border border-[#1e2d3d] rounded-2xl px-1.5 py-1',
              'flex gap-0.5 shadow-2xl z-40 animate-slide-up',
              isMe ? 'right-0 origin-bottom-right' : 'left-0 origin-bottom-left'
            )}>
              {QUICK_REACTIONS.map(emoji => {
                const uids = message.reactions?.[emoji] ?? []
                const alreadyReacted = uids.includes(currentUserId)
                
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => { 
                      onReaction(message.id, emoji)
                      setShowReactions(false) 
                    }}
                    className={clsx(
                      'text-lg w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-100 active:scale-75 select-none',
                      alreadyReacted ? 'bg-[#00ff7f22] border border-[#00ff7f33]' : 'hover:bg-[#1e2d3d]'
                    )}
                  >
                    {emoji}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Tiempo al pie para tus propios mensajes */}
        {isMe && timeAgo && (
          <p className="text-[9px] text-gray-600 px-1 tabular-nums">{timeAgo}</p>
        )}

        {/* Bloque acumulador de reacciones debajo del mensaje */}
        {reactionEntries.length > 0 && (
          <div className={clsx('flex flex-wrap gap-1 mt-0.5', isMe && 'justify-end')}>
            {reactionEntries.map(([emoji, uids]) => {
              const isMine = uids.includes(currentUserId)
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onReaction(message.id, emoji)}
                  className={clsx(
                    'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] transition-all duration-150 select-none border',
                    isMine
                      ? 'bg-[#00ff7f15] border-[#00ff7f33] text-[#00ff7f] font-bold shadow-sm'
                      : 'bg-[#111827] border-[#1e2d3d] text-gray-400 hover:border-[#2d3f52]'
                  )}
                >
                  <span>{emoji}</span>
                  <span className="text-[10px] tabular-nums">{uids.length}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}