// src/pages/Ranking.jsx
import MainLayout from '@/layouts/MainLayout'
import { useRanking } from '@/hooks/useRanking'
import { useAuth } from '@/context/AuthContext'
import { SkeletonRankRow } from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import { useState } from 'react'
import clsx from 'clsx'
import { Crown } from 'lucide-react'

// 🌟 CAMBIO ESTRATÉGICO: Generación automática de las 34 jornadas del torneo
const JORNADAS = Array.from({ length: 34 }, (_, i) => ({
  id: i + 1,
  label: `Jornada ${i + 1}`
}))

export default function Ranking() {
  const [jornada, setJornada] = useState(1) // Controla qué pestaña está activa
  const { ranking, loading } = useRanking(50, jornada)
  const { user }             = useAuth()

  const top3 = ranking.slice(0, 3)

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-white">Ranking por Jornada</h1>
          <p className="text-gray-400 text-xs mt-1">Top jugadores del Mundial 2026 de la fecha activa</p>
        </div>

        {/* Selector de Jornadas Horizontal */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
          {JORNADAS.map((j) => (
            <button
              key={j.id}
              onClick={() => setJornada(j.id)}
              className={clsx(
                'px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 flex-shrink-0 snap-center border',
                jornada === j.id
                  ? 'bg-[#fbbf24] text-[#0a0e1a] border-[#fbbf24]'
                  : 'bg-[#0d1b2a] text-gray-400 border-[#1e2d3d] hover:text-white hover:border-gray-600'
              )}
            >
              {j.label}
            </button>
          ))}
        </div>

        {/* Podio Dinámico */}
        {!loading && ranking.length >= 3 && (
          <div className="flex items-end justify-center gap-3 mb-4 px-2 pt-2">
            {/* 2nd */}
            <PodiumCard user={top3[1]} rank={2} height="h-24" />
            {/* 1st */}
            <PodiumCard user={top3[0]} rank={1} height="h-32" crown />
            {/* 3rd */}
            <PodiumCard user={top3[2]} rank={3} height="h-20" />
          </div>
        )}

        {/* Tabla de Posiciones Completa */}
        <div className="card divide-y divide-[#1e2d3d]">
          {loading ? (
            <div className="px-4 divide-y divide-[#1e2d3d]">
              {Array(8).fill(0).map((_, i) => <SkeletonRankRow key={i} />)}
            </div>
          ) : ranking.length === 0 ? (
            <EmptyState
              icon="🏅"
              title="Sin actividad"
              body="No hay puntos procesados para esta jornada todavía."
            />
          ) : (
            ranking.map((player) => (
              <RankRow
                key={player.uid}
                player={player}
                isMe={player.uid === user?.uid}
              />
            ))
          )}
        </div>

      </div>
    </MainLayout>
  )
}

function PodiumCard({ user: player, rank, height, crown }) {
  if (!player) return null
  const initials = (player.displayName ?? 'U')[0].toUpperCase()
  const colors = {
    1: 'from-[#fbbf24] to-[#f59e0b]',
    2: 'from-gray-400 to-gray-500',
    3: 'from-orange-600 to-orange-700',
  }
  return (
    <div className="flex flex-col items-center gap-2 flex-1 max-w-[100px]">
      {crown && <Crown className="w-5 h-5 text-[#fbbf24] mb-1 animate-bounce" />}
      <div className={clsx(
        'w-12 h-12 rounded-full flex items-center justify-center text-lg font-black text-white bg-gradient-to-br',
        colors[rank] ?? 'from-gray-600 to-gray-700',
        rank === 1 && 'ring-2 ring-[#fbbf24] ring-offset-2 ring-offset-[#0a0e1a]'
      )}>
        {initials}
      </div>
      <div className={clsx(
        'w-full rounded-t-xl flex flex-col items-center justify-end pb-2',
        height,
        rank === 1 ? 'bg-[#fbbf2420] border border-[#fbbf2440]' :
        rank === 2 ? 'bg-[#6b728020] border border-[#6b728040]' :
                     'bg-[#ea580c20] border border-[#ea580c40]'
      )}>
        <span className="text-lg font-black text-white">#{rank}</span>
        <span className="text-[10px] text-gray-400 text-center px-1 leading-tight truncate w-full">
          {player.displayName ?? 'Jugador'}
        </span>
        <span className="text-xs font-bold text-[#fbbf24]">{player.jornadaPoints ?? 0}pts</span>
      </div>
    </div>
  )
}

function RankRow({ player, isMe }) {
  const initials = (player.displayName ?? 'U')[0].toUpperCase()
  const rankColor = player.rank === 1 ? 'text-[#fbbf24]' : player.rank <= 3 ? 'text-gray-300' : 'text-gray-500'

  return (
    <div className={clsx(
      'flex items-center gap-3 px-4 py-3 transition-colors',
      isMe && 'bg-[#00ff7f08]'
    )}>
      {/* Posición */}
      <span className={clsx('text-sm font-bold w-7 text-center tabular-nums', rankColor)}>
        {player.rank <= 3 ? ['🥇','🥈','🥉'][player.rank - 1] : `#${player.rank}`}
      </span>

      {/* Avatar */}
      <div className={clsx(
        'w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0',
        isMe
          ? 'bg-gradient-to-br from-[#00ff7f] to-[#3b82f6] text-[#0a0e1a]'
          : 'bg-[#1e2d3d]'
      )}>
        {initials}
      </div>

      {/* Detalles del Usuario */}
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-semibold truncate', isMe ? 'text-[#00ff7f]' : 'text-white')}>
          {player.displayName ?? 'Jugador'} {isMe && '(Tú)'}
        </p>
        <p className="text-[10px] text-gray-500">
          {player.streak > 0 && `🔥 ${player.streak} racha · `}
          🪙 {player.coins ?? 0}
        </p>
      </div>

      {/* Puntos de esta Jornada */}
      <div className="text-right">
        <p className="text-sm font-black text-[#fbbf24]">{player.jornadaPoints ?? 0}</p>
        <p className="text-[10px] text-gray-600">pts</p>
      </div>
    </div>
  )
}