// src/pages/groups/GroupDetail.jsx
import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import { useGroup, useGroupRanking } from '@/hooks/useGroups'
import { useAuth } from '@/context/AuthContext'
import { SkeletonCard, SkeletonRankRow } from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import {
  ArrowLeft, MessageCircle, Copy, Share2, Crown,
  Users, Trophy, ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function GroupDetail() {
  const { groupId }          = useParams()
  const { user }             = useAuth()
  const { group, loading }   = useGroup(groupId)
  const members              = useMemo(() => group?.members ?? [], [group])
  const { ranking, loading: rankLoading } = useGroupRanking(members)

  function copyCode() {
    if (!group?.code) return
    navigator.clipboard.writeText(group.code).then(() => toast.success('Código copiado 📋'))
  }

  function shareGroup() {
    if (!group) return
    const text = `¡Únete a mi grupo "${group.name}" en MundialF! Código de ingreso: ${group.code}`
    if (navigator.share) {
      navigator.share({ title: 'MundialF', text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).then(() => toast.success('Invitación copiada 📋'))
    }
  }

  if (loading) return <MainLayout><div className="space-y-3 pt-4"><SkeletonCard /><SkeletonCard /></div></MainLayout>
  if (!group)  return <MainLayout><EmptyState icon="❌" title="Grupo no encontrado" /></MainLayout>

  const isOwner = group.createdBy === user?.uid
  const myRank  = ranking.findIndex(r => r.uid === user?.uid)

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-5">

        {/* Back */}
        <Link to="/groups" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Mis grupos
        </Link>

        {/* Group header card */}
        <div className="card p-5 bg-gradient-to-br from-[#0d1b2a] to-[#111827]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* 🔄 REPARADO: Lee directo el emoji nativo sin romper strings */}
              <div className="w-14 h-14 rounded-2xl bg-[#1e2d3d] border border-[#2d3f52] flex items-center justify-center text-3xl flex-shrink-0">
                {group.emoji || '👥'}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  {/* 🔄 REPARADO: Nombre completo e intacto */}
                  <h1 className="text-lg font-black text-white leading-tight">{group.name}</h1>
                  {isOwner && <Crown className="w-4 h-4 text-[#fbbf24] flex-shrink-0" />}
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Users className="w-3 h-3" /> {members.length} miembro{members.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Code + share */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-[#0d1b2a] border border-[#1e2d3d] rounded-xl px-4 py-2.5">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Código</span>
              <span className="font-black text-[#00ff7f] tracking-[0.2em] text-sm">{group.code}</span>
            </div>
            <button onClick={copyCode}  className="btn-ghost p-2.5 rounded-xl" title="Copiar">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={shareGroup} className="btn-ghost p-2.5 rounded-xl" title="Compartir">
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* My position */}
          {myRank >= 0 && (
            <div className="mt-3 flex items-center gap-2 bg-[#00ff7f0d] border border-[#00ff7f22] rounded-xl px-4 py-2.5">
              <span className="text-sm">📍</span>
              <span className="text-xs text-[#00ff7f] font-medium">
                Tu posición: <strong>#{myRank + 1}</strong> de {ranking.length}
              </span>
            </div>
          )}
        </div>

        {/* Chat button */}
        <Link
          to={`/groups/${groupId}/chat`}
          className="card p-4 flex items-center gap-4 hover:border-[#3b82f633] transition-all duration-200 active:scale-[0.99] bg-gradient-to-r from-[#3b82f611] to-[#0d1b2a]"
        >
          <div className="w-10 h-10 rounded-xl bg-[#3b82f622] border border-[#3b82f633] flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white text-sm">Chat del grupo</p>
            <p className="text-xs text-gray-500">Mensajes, emojis y memes en tiempo real</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </Link>

        {/* Group ranking */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-[#fbbf24]" />
            <h2 className="text-sm font-bold text-white">Ranking del grupo</h2>
          </div>
          <div className="card divide-y divide-[#1e2d3d]">
            {rankLoading ? (
              <div className="px-4">
                {Array(4).fill(0).map((_, i) => <SkeletonRankRow key={i} />)}
              </div>
            ) : ranking.length === 0 ? (
              <EmptyState icon="📊" title="Sin datos aún" body="Los puntos aparecerán cuando finalicen los partidos." />
            ) : (
              ranking.map(player => (
                <GroupRankRow
                  key={player.uid}
                  player={player}
                  isMe={player.uid === user?.uid}
                />
              ))
            )}
          </div>
        </div>

      </div>
    </MainLayout>
  )
}

function GroupRankRow({ player, isMe }) {
  const init = (player.displayName ?? 'U')[0].toUpperCase()
  return (
    <div className={clsx('flex items-center gap-3 px-4 py-3', isMe && 'bg-[#00ff7f08]')}>
      <span className="text-sm font-bold w-7 text-center text-gray-400 tabular-nums">
        {player.rank <= 3 ? ['🥇','🥈','🥉'][player.rank - 1] : `#${player.rank}`}
      </span>
      <div className={clsx(
        'w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0',
        isMe ? 'bg-gradient-to-br from-[#00ff7f] to-[#3b82f6] text-[#0a0e1a]' : 'bg-[#1e2d3d] text-white'
      )}>
        {init}
      </div>
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-semibold truncate', isMe ? 'text-[#00ff7f]' : 'text-white')}>
          {player.displayName ?? 'Jugador'} {isMe && '(Tú)'}
        </p>
        <p className="text-[10px] text-gray-500">🪙 {player.coins ?? 0}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-black text-[#fbbf24]">{player.totalPoints ?? 0}</p>
        <p className="text-[10px] text-gray-600">pts</p>
      </div>
    </div>
  )
}