// src/pages/Groups.jsx
import { Link } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import { useMyGroups } from '@/hooks/useGroups'
import { useAuth } from '@/context/AuthContext'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { Plus, LogIn, Users, ChevronRight, Crown, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Groups() {
  const { groups, loading } = useMyGroups()
  const { user }            = useAuth()

  function copyCode(code, e) {
    e.preventDefault()
    e.stopPropagation()
    if (!navigator.clipboard) {
      toast.error('Tu navegador no soporta el copiado automático')
      return
    }
    navigator.clipboard.writeText(code).then(() => toast.success('Código copiado 📋'))
  }

  return (
    <MainLayout>
      <div className="animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Grupos</h1>
            <p className="text-gray-400 text-xs mt-1">Compite con tus amigos</p>
          </div>
          <div className="flex gap-2">
            <Link to="/groups/join"   className="btn-ghost flex items-center gap-1 text-sm py-2 px-3">
              <LogIn className="w-4 h-4" /> Unirse
            </Link>
            <Link to="/groups/create" className="btn-primary flex items-center gap-1 text-sm py-2 px-3">
              <Plus className="w-4 h-4" /> Crear
            </Link>
          </div>
        </div>

        {/* Groups list */}
        {loading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : groups.length === 0 ? (
          <EmptyState
            icon="👥"
            title="Sin grupos aún"
            body="Crea un grupo privado o únete con un código de invitación."
            action={
              <div className="flex gap-3">
                <Link to="/groups/create" className="btn-primary text-sm py-2.5 px-5">
                  <Plus className="w-4 h-4 inline mr-1" />Crear grupo
                </Link>
                <Link to="/groups/join" className="btn-secondary text-sm py-2.5 px-5">
                  <LogIn className="w-4 h-4 inline mr-1" />Unirse
                </Link>
              </div>
            }
          />
        ) : (
          <div className="space-y-3">
            {groups.map(group => {
              const isOwner = group.createdBy === user?.uid
              const memberCount = group.members?.length ?? 0
              return (
                <Link
                  key={group.id}
                  to={`/groups/${group.id}`}
                  className="card p-4 flex items-center gap-4 hover:border-[#2d3f52] transition-all duration-200 active:scale-[0.99] block"
                >
                  {/* Icon 🔄 REPARADO: Ahora lee dinámicamente el emoji guardado en el documento */}
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#3b82f633] to-[#00ff7f22] border border-[#1e2d3d] flex items-center justify-center text-xl flex-shrink-0">
                    {group.emoji || '⚽'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="font-bold text-white truncate text-sm">{group.name}</h3>
                      {isOwner && <Crown className="w-3.5 h-3.5 text-[#fbbf24] flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {memberCount} miembro{memberCount !== 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={(e) => copyCode(group.code, e)}
                        className="text-[11px] text-gray-600 hover:text-[#00ff7f] flex items-center gap-1 transition-colors"
                      >
                        <Copy className="w-3 h-3" /> {group.code}
                      </button>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        )}

        {/* Info box */}
        {groups.length > 0 && (
          <div className="mt-5 flex items-start gap-2 bg-[#1e2d3d33] rounded-xl p-3">
            <span className="text-sm mt-0.5">💡</span>
            <p className="text-[11px] text-gray-500">
              Comparte el código de tu grupo para que tus amigos puedan unirse.
            </p>
          </div>
        )}

      </div>
    </MainLayout>
  )
}