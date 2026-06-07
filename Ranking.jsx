// src/pages/Ranking.jsx
import MainLayout from '@/layouts/MainLayout'
import { useRanking } from '@/hooks/useRanking'
import { useAuth } from '@/context/AuthContext'
import { SkeletonRankRow } from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import { useState } from 'react'
import clsx from 'clsx'
import { Crown, Users, ShieldPlus, DoorOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'

const JORNADAS = Array.from({ length: 34 }, (_, i) => ({
  id: i + 1,
  label: `Jornada ${i + 1}`
}))

export default function Ranking() {
  const [jornada, setJornada] = useState(1)
  const { user }             = useAuth() // Contiene el usuario logueado actual

  // Llamamos al hook. Si user?.groupId está vacío, el hook simplemente retornará un arreglo vacío de forma segura.
  const { ranking, loading } = useRanking(50, jornada, user?.groupId)
  
  const [inputGroupId, setInputGroupId] = useState('')
  const [joining, setJoining]           = useState(false)

  // Función para guardar el código de grupo directamente en el perfil del usuario logueado
  async function handleAssignGroup(e, selectedCode) {
    e.preventDefault()
    const code = (selectedCode || inputGroupId).trim().toUpperCase()
    if (!code) { toast.error('Ingresa un nombre o código válido'); return }

    setJoining(true)
    try {
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, { groupId: code })
      toast.success(`¡Te has unido al grupo ${code}! 🎉`)
      // Nota: La app se refrescará sola porque AuthContext detectará el cambio en el documento del usuario
    } catch (err) {
      console.error(err)
      toast.error('No se pudo guardar el grupo. Inténtalo de nuevo.')
    } finally {
      setJoining(false)
    }
  }

  // 🌟 ESCENARIO B: Si el usuario NO pertenece a ningún grupo privado, le mostramos la pantalla de bienvenida a grupos
  if (!loading && !user?.groupId) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto mt-8 animate-fade-in space-y-6 px-2">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#fbbf2411] border border-[#fbbf2422] mb-2">
              <Users className="w-7 h-7 text-[#fbbf24]" />
            </div>
            <h1 className="text-xl font-black text-white">Ligas Privadas Cerradas</h1>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              El ranking en MundialF funciona mediante comunidades aisladas. Crea un grupo para tu oficina o únete a uno existente.
            </p>
          </div>

          {/* Formulario Unirse */}
          <div className="card p-5 space-y-4 shadow-xl border border-[#1e2d3d]">
            <div className="flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-[#00ff7f]" />
              <h3 className="text-sm font-bold text-white">Unirse a un grupo existente</h3>
            </div>
            <form onSubmit={(e) => handleAssignGroup(e)} className="flex gap-2">
              <input
                type="text"
                value={inputGroupId}
                onChange={(e) => setInputGroupId(e.target.value)}
                placeholder="Ej: INEC2026, TRABAJO"
                className="input-field uppercase flex-1 text-sm h-10"
                disabled={joining}
                required
              />
              <button
                type="submit"
                disabled={joining}
                className="btn-primary px-4 h-10 text-xs font-bold flex-shrink-0"
              >
                {joining ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>

          {/* Sección de sugerencia rápida para crear uno rápido */}
          <div className="card p-5 space-y-3 border border-[#1e2d3d] bg-gradient-to-br from-[#0a0e1a] to-[#111c30]">
            <div className="flex items-center gap-2">
              <ShieldPlus className="w-4 h-4 text-[#fbbf24]" />
              <h3 className="text-sm font-bold text-white">¿Eres el administrador de tus amigos?</h3>
            </div>
            <p className="text-[11px] text-gray-400">
              Inventa un código único (ej: tu apellido o el nombre de tu empresa) y diles que se registren usando esa misma palabra.
            </p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // 🌟 ESCENARIO A: Si el usuario ya tiene grupo, ve el ranking normal de su grupo
  const top3 = ranking.slice(0, 3)

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">

        {/* Header con Nombre del Grupo Activo */}
        <div className="flex items-center justify-between gap-4 bg-[#111827] border border-[#1e2d3d] rounded-2xl px-4 py-3">
          <div>
            <h1 className="text-xl font-black text-white">Ranking por Jornada</h1>
            <p className="text-gray-400 text-[10px] mt-0.5">Top posiciones de la fecha activa</p>
          </div>
          <div className="bg-[#00ff7f11] border border-[#00ff7f33] px-3 py-1 rounded-xl flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs font-black text-[#00ff7f] tracking-wider">🛡️ {user?.groupId}</span>
          </div>
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
            <PodiumCard user={top3[1]} rank={2} height="h-24" />
            <PodiumCard user={top3[0]} rank={1} height="h-32" crown />
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
      <span className={clsx('text-sm font-bold w-7 text-center tabular-nums', rankColor)}>
        {player.rank <= 3 ? ['🥇','🥈','🥉'][player.rank - 1] : `#${player.rank}`}
      </span>

      <div className={clsx(
        'w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0',
        isMe ? 'bg-gradient-to-br from-[#00ff7f] to-[#3b82f6] text-[#0a0e1a]' : 'bg-[#1e2d3d]'
      )}>
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-semibold truncate', isMe ? 'text-[#00ff7f]' : 'text-white')}>
          {player.displayName ?? 'Jugador'} {isMe && '(Tú)'}
        </p>
        <p className="text-[10px] text-gray-500">
          {player.streak > 0 && `🔥 ${player.streak} racha · `}
          🪙 {player.coins ?? 0}
        </p>
      </div>

      <div className="text-right">
        <p className="text-sm font-black text-[#fbbf24]">{player.jornadaPoints ?? 0}</p>
        <p className="text-[10px] text-gray-600">pts</p>
      </div>
    </div>
  )
}