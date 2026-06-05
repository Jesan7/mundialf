// src/pages/groups/JoinGroup.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import { useJoinGroup } from '@/hooks/useGroups'
import { ArrowLeft, Hash } from 'lucide-react'

export default function JoinGroup() {
  const { joinGroup, loading } = useJoinGroup()
  const navigate               = useNavigate()
  const [code, setCode]        = useState('')

  function handleChange(e) {
    // Convierte a mayúsculas y remueve caracteres especiales o espacios al vuelo
    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (code.length !== 6) return
    const groupId = await joinGroup(code)
    if (groupId) navigate(`/groups/${groupId}`, { replace: true })
  }

  return (
    <MainLayout>
      <div className="animate-slide-up">
        {/* Enlace para volver */}
        <Link to="/groups" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">Unirse a grupo</h1>
          <p className="text-gray-400 text-sm mt-1">Ingresa el código de 6 caracteres</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Input de Código */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-3">Código de invitación</label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
              <input
                type="text"
                value={code}
                onChange={handleChange}
                placeholder="ABC123"
                className="input-field text-center text-2xl font-black tracking-[0.3em] uppercase h-16 bg-[#0d1b2a] border border-[#1e2d3d] rounded-xl text-[#00ff7f] focus:border-[#00ff7f] transition-all"
                maxLength={6}
                required
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            <p className="text-[11px] text-gray-600 mt-2 text-center">
              {code.length}/6 caracteres
            </p>
          </div>

          {/* Visual code slots (Casilleros estilo OTP) */}
          <div className="flex justify-center gap-2">
            {Array(6).fill(0).map((_, i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black transition-all duration-200 ${
                  i < code.length
                    ? 'bg-[#00ff7f20] border-2 border-[#00ff7f] text-[#00ff7f]'
                    : 'bg-[#0d1b2a] border border-[#1e2d3d] text-gray-700'
                }`}
              >
                {code[i] ?? '·'}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-[#0a0e1a] border-t-transparent rounded-full animate-spin" />Buscando...</>
            ) : 'Unirse al grupo'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs mt-8">
          Pide el código al administrador del grupo
        </p>
      </div>
    </MainLayout>
  )
}