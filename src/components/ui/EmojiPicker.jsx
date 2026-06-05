// src/components/ui/EmojiPicker.jsx
import { useState, useRef, useEffect } from 'react'
import { Smile } from 'lucide-react'

// 🔄 REPARADO: Sintaxis corregida (llave de cierre del objeto) y emojis futboleros expandidos
const EMOJI_GROUPS = {
  '⚽ Fútbol': ['⚽', '🏆', '🥇', '🥅', '🎯', '👟', '🥈', '🥉', '🏟️', '⚡'],
  '😂 Caras':  ['😂', '😅', '🤣', '😍', '🥶', '😤', '🤯', '🤩', '😭', '🤬'],
  '👏 Gestos': ['👏', '🙌', '🔥', '💪', '👍', '🫡', '🤌', '🫶', '✌️', '🙏'],
  '🎉 Festejo': ['🎉', '🎊', '🥳', '🍾', '🎈', '🏅', '🌟', '💥', '✨', '🪙'],
}

export default function EmojiPicker({ onSelect, className = '' }) {
  const [open, setOpen]   = useState(false)
  const [tab, setTab]     = useState(Object.keys(EMOJI_GROUPS)[0])
  const ref               = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    // También escuchamos eventos táctiles para mejorar la respuesta en dispositivos móviles
    document.addEventListener('touchstart', handler)
    
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [])

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="p-2.5 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-[#1e2d3d] transition-all duration-150 flex-shrink-0"
        title="Insertar emoji"
      >
        <Smile className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-64 card bg-[#111827] border border-[#1e2d3d] shadow-2xl z-50 animate-slide-up overflow-hidden rounded-2xl">
          {/* Tabs Selectoras */}
          <div className="flex overflow-x-auto border-b border-[#1e2d3d] bg-[#0d1b2a]/60">
            {Object.keys(EMOJI_GROUPS).map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setTab(g)}
                className={`flex-1 px-3 py-2.5 text-base flex-shrink-0 transition-colors border-b-2 ${
                  tab === g 
                    ? 'bg-[#1e2d3d] border-[#00ff7f] text-white' 
                    : 'border-transparent text-gray-400 hover:bg-[#0d1b2a] hover:text-gray-200'
                }`}
              >
                {/* Extrae solo el emoji del título para la pestaña */}
                {g.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Rejilla de Emojis */}
          <div className="p-2 grid grid-cols-5 gap-1 max-h-40 overflow-y-auto bg-[#111827]">
            {EMOJI_GROUPS[tab].map(emoji => (
              <button
                key={emoji}
                type="button"
                // 🔄 REPARADO: Mantiene el selector abierto para permitir múltiples emojis seguidos
                onClick={() => onSelect(emoji)}
                className="text-xl h-10 rounded-xl hover:bg-[#1e2d3d] flex items-center justify-center
                           transition-all duration-700 active:scale-75 select-none"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}