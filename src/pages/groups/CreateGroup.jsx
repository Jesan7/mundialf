// src/pages/groups/CreateGroup.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import { useCreateGroup } from '@/hooks/useGroups'
import { ArrowLeft, Users } from 'lucide-react'

const GROUP_EMOJIS = ['⚽','🏆','🥇','🎯','🔥','⚡','🌟','🦁','🦅','🐆','🌍','🎪']

export default function CreateGroup() {
  const { createGroup, loading } = useCreateGroup()
  const navigate                 = useNavigate()
  const [name, setName]          = useState('')
  const [emoji, setEmoji]        = useState('⚽')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    
    // 🔄 REPARADO: Pasamos el nombre limpio y el emoji por separado según nuestro hook optimizado
    const groupId = await createGroup(name.trim(), emoji)
    if (groupId) navigate(`/groups/${groupId}`, { replace: true })
  }

  return (
    <MainLayout>
      <div className="animate-slide-up">
        {/* Back */}
        <Link to="/groups" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">Crear grupo</h1>
          <p className="text-gray-400 text-sm mt-1">Invita a tus amigos con el código único</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Emoji selector */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-3">Elige un emoji</label>
            <div className="grid grid-cols-6 gap-2">
              {GROUP_EMOJIS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`h-12 rounded-xl text-2xl flex items-center justify-center transition-all duration-150 active:scale-95 ${
                    emoji === e
                      ? 'bg-[#00ff7f20] border-2 border-[#00ff7f]'
                      : 'bg-[#0d1b2a] border border-[#1e2d3d] hover:border-[#2d3f52]'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Nombre del grupo</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl">{emoji}</span>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Mis amigos del trabajo"
                maxLength={30}
                className="input-field pl-10"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-600">
                {name.length}/30
              </span>
            </div>
          </div>

          {/* Preview */}
          {name && (
            <div className="card p-4 border-[#00ff7f33] bg-[#00ff7f08]">
              <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider">Vista previa</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1e2d3d] flex items-center justify-center text-xl">{emoji}</div>
                <div>
                  <p className="font-bold text-white text-sm">{name}</p>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1">
                    <Users className="w-3 h-3" /> 1 miembro
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-[#0a0e1a] border-t-transparent rounded-full animate-spin" />Creando...</>
            ) : 'Crear grupo 🎉'}
          </button>
        </form>
      </div>
    </MainLayout>
  )
}