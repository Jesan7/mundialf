// src/pages/groups/Chat.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useChat } from '@/hooks/useChat'
import { useGroup } from '@/hooks/useGroups'
import { useAuth } from '@/context/AuthContext'
import ChatMessage from '@/components/ui/ChatMessage'
import EmojiPicker from '@/components/ui/EmojiPicker'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import clsx from 'clsx'

export default function Chat() {
  const { groupId }  = useParams()
  const { user }     = useAuth()
  const { group }    = useGroup(groupId)
  const { messages, loading, sending, sendMessage, toggleReaction } = useChat(groupId)
  const navigate     = useNavigate()

  const [text, setText]     = useState('')
  const bottomRef           = useRef(null)
  const inputRef            = useRef(null)

  // Auto-scroll optimizado al recibir nuevos mensajes
  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Expulsar de la pantalla si el usuario no pertenece a la comunidad
  useEffect(() => {
    if (group && user && !group.members?.includes(user.uid)) {
      navigate('/groups', { replace: true })
    }
  }, [group, user, navigate])

  async function handleSend(e) {
    e?.preventDefault()
    if (!text.trim() || sending) return
    const msg = text.trim()
    setText('')
    await sendMessage(msg)
    // Devolvemos el foco al input para que no se oculte el teclado en móviles
    inputRef.current?.focus()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleEmojiSelect(emoji) {
    setText(prev => prev + emoji)
    setTimeout(() => inputRef.current?.focus(), 10)
  }

  // Agrupamiento seguro de mensajes por fecha calendario
  const groupedMessages = groupMessagesByDate(messages)

  return (
    <div className="flex flex-col h-dvh bg-[#0a0e1a] overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 bg-[#0a0e1a]/95 backdrop-blur border-b border-[#1e2d3d] px-4 h-14 flex items-center gap-3 z-40">
        <Link
          to={`/groups/${groupId}`}
          className="p-1.5 rounded-xl hover:bg-[#1e2d3d] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#1e2d3d] border border-[#2d3f52] flex items-center justify-center text-base flex-shrink-0">
            {group?.emoji || '⚽'}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm leading-tight truncate">
              {group?.name || 'Cargando chat...'}
            </p>
            <p className="text-[10px] text-gray-500">
              {group?.members?.length ?? 0} miembro{(group?.members?.length ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </header>

      {/* ── Messages Box ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#0a0e1a]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3 text-gray-600">
              <Loader2 className="w-6 h-6 animate-spin text-[#00ff7f]" />
              <span className="text-sm">Abriendo sala de chat...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center bg-[#0d1b2a55] border border-[#1e2d3d] p-6 rounded-2xl max-w-xs">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-white font-bold text-sm">¡Canal vacío!</p>
              <p className="text-gray-500 text-xs mt-1">Envía el primer mensaje para romper el hielo del grupo.</p>
            </div>
          </div>
        ) : (
          <>
            {groupedMessages.map(({ date, msgs }) => (
              <div key={date} className="space-y-3">
                {/* Separador de Fecha */}
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-[#1e2d3d]/50" />
                  <span className="text-[10px] text-gray-500 bg-[#0a0e1a] px-2 font-medium tracking-wide uppercase">{date}</span>
                  <div className="flex-1 h-px bg-[#1e2d3d]/50" />
                </div>

                <div className="space-y-2">
                  {msgs.map(msg => (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      isMe={msg.userId === user?.uid}
                      currentUserId={user?.uid}
                      onReaction={toggleReaction}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div ref={bottomRef} className="h-2" />
          </>
        )}
      </div>

      {/* ── Input bar (Limpia y funcional) ─────────────────────────────────── */}
      <div className="flex-shrink-0 bg-[#0d1b2a] border-t border-[#1e2d3d] px-3 py-3 pb-safe">
        <form onSubmit={handleSend} className="flex items-end gap-2 max-w-4xl mx-auto">
          {/* Selector de Emojis */}
          <EmojiPicker onSelect={handleEmojiSelect} />

          {/* Input de Texto principal */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              rows={1}
              className="w-full bg-[#111827] border border-[#1e2d3d] rounded-2xl px-4 py-2.5
                         text-white text-sm placeholder-gray-600 resize-none
                         focus:outline-none focus:border-[#00ff7f] focus:ring-1 focus:ring-[#00ff7f22]
                         transition-all max-h-32 overflow-y-auto leading-relaxed"
              style={{ minHeight: '42px' }}
            />
          </div>

          {/* Botón de Enviar */}
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0',
              text.trim() && !sending
                ? 'bg-[#00ff7f] text-[#0a0e1a] hover:bg-[#00e56f] active:scale-95'
                : 'bg-[#1e2d3d] text-gray-600'
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Helpers de Formateo Seguro ───────────────────────────────────────────────
function groupMessagesByDate(messages) {
  const groups = {}
  messages.forEach(msg => {
    let d = new Date()
    if (msg.createdAt) {
      if (typeof msg.createdAt.toDate === 'function') {
        d = msg.createdAt.toDate()
      } else if (msg.createdAt instanceof Date) {
        d = msg.createdAt
      }
    }
    const key = formatDateLabel(d)
    if (!groups[key]) groups[key] = []
    groups[key].push(msg)
  })
  return Object.entries(groups).map(([date, msgs]) => ({ date, msgs }))
}

function formatDateLabel(date) {
  const today     = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)

  if (isSameDay(date, today))     return 'Hoy'
  if (isSameDay(date, yesterday)) return 'Ayer'

  return date.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth() &&
         a.getDate()     === b.getDate()
}