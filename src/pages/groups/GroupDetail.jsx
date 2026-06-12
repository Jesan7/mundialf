// src/pages/groups/GroupDetail.jsx
import { useMemo, useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import { useGroup, useGroupRanking } from '@/hooks/useGroups'
import { useAuth } from '@/context/AuthContext'
import { SkeletonCard, SkeletonRankRow } from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import MatchCard from '@/components/ui/MatchCard'

import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { isMatchStarted } from '@/utils/dateUtils'

import {
  ArrowLeft, MessageCircle, Copy, Share2, Crown,
  Users, Trophy, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function GroupDetail() {
  const { groupId }          = useParams()
  const { user }             = useAuth()
  const { group, loading }   = useGroup(groupId)
  const members              = useMemo(() => group?.members ?? [], [group])
  
  // Extraemos los datos base de los usuarios
  const { ranking, loading: rankLoading } = useGroupRanking(members)
  
  const [matches, setMatches] = useState([])
  const [selectedTab, setSelectedTab] = useState('')
  
  // NUEVO ESTADO: Almacena las predicciones de todo el grupo de forma global
  const [groupPreds, setGroupPreds] = useState({})

  // 1. Escuchar los partidos
  useEffect(() => {
    const q = query(collection(db, 'matches'), orderBy('date', 'asc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = []
      snapshot.forEach((doc) => docs.push({ id: doc.id, ...doc.data() }))
      setMatches(docs)
    })
    return () => unsubscribe()
  }, [])

  // 2. Traer TODAS las predicciones del grupo (Optimizado para no saturar Firebase)
  useEffect(() => {
    if (members.length === 0) return
    
    const chunks = []
    for (let i = 0; i < members.length; i += 30) {
      chunks.push(members.slice(i, i + 30))
    }

    const unsubscribes = chunks.map(chunk => {
      const q = query(collection(db, 'predictions'), where('userId', 'in', chunk))
      return onSnapshot(q, (snapshot) => {
        setGroupPreds(prev => {
          const newState = { ...prev }
          snapshot.docChanges().forEach(change => {
            const data = change.doc.data()
            const uid = data.userId
            const matchId = change.doc.id.startsWith(uid + '_')
              ? change.doc.id.replace(uid + '_', '')
              : (data.matchId || change.doc.id)

            if (!newState[uid]) newState[uid] = {}
            if (change.type === 'removed') delete newState[uid][matchId]
            else newState[uid][matchId] = data
          })
          return newState
        })
      })
    })

    return () => unsubscribes.forEach(unsub => unsub())
  }, [members])

  // 3. Configuración de pestañas
  const tournamentTabs = useMemo(() => {
    const stages = matches.map(m => {
      if (m.jornada) return `Jornada ${m.jornada}`
      if (m.stage && m.stage !== 'Fase de Grupos') return m.stage
      return 'Jornada 1'
    })
    return [...new Set(stages)].sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0
      const numB = parseInt(b.replace(/\D/g, '')) || 0
      return numA - numB
    })
  }, [matches])

  useEffect(() => {
    if (tournamentTabs.length > 0 && !selectedTab) setSelectedTab(tournamentTabs[0])
  }, [tournamentTabs, selectedTab])

  // 4. Partidos de la jornada activa
  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      let matchTabName = 'Jornada 1'
      if (m.jornada) matchTabName = `Jornada ${m.jornada}`
      else if (m.stage && m.stage !== 'Fase de Grupos') matchTabName = m.stage
      return matchTabName === selectedTab
    })
  }, [matches, selectedTab])

  // 🚀 5. EL NUEVO RANKING DINÁMICO (Se reinicia por pestaña)
  const dynamicRanking = useMemo(() => {
    if (!ranking || ranking.length === 0) return []

    const calculated = ranking.map(player => {
      let tabPoints = 0
      const playerPreds = groupPreds[player.uid] || {}

      // Sumar los puntos obtenidos SÓLO en la jornada seleccionada
      filteredMatches.forEach(match => {
        const pred = playerPreds[match.id]
        if (pred && pred.points != null) {
          tabPoints += Number(pred.points)
        }
      })

      return { ...player, tabPoints, playerPreds }
    })

    // Ordenar del mejor al peor basándose únicamente en los puntos de esta jornada
    return calculated
      .sort((a, b) => b.tabPoints - a.tabPoints)
      .map((p, index) => ({ ...p, tabRank: index + 1 }))
  }, [ranking, groupPreds, filteredMatches])

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
  const myRankObj = dynamicRanking.find(r => r.uid === user?.uid)

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-5">

        <Link to="/groups" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Mis grupos
        </Link>

        {/* Tarjeta de Información del Grupo */}
        <div className="card p-5 bg-gradient-to-br from-[#0d1b2a] to-[#111827]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#1e2d3d] border border-[#2d3f52] flex items-center justify-center text-3xl flex-shrink-0">
                {group.emoji || '👥'}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-lg font-black text-white leading-tight">{group.name}</h1>
                  {isOwner && <Crown className="w-4 h-4 text-[#fbbf24] flex-shrink-0" />}
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Users className="w-3 h-3" /> {members.length} miembro{members.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-[#0d1b2a] border border-[#1e2d3d] rounded-xl px-4 py-2.5">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Código</span>
              <span className="font-black text-[#00ff7f] tracking-[0.2em] text-sm">{group.code}</span>
            </div>
            <button onClick={copyCode} className="btn-ghost p-2.5 rounded-xl" title="Copiar"><Copy className="w-4 h-4" /></button>
            <button onClick={shareGroup} className="btn-ghost p-2.5 rounded-xl" title="Compartir"><Share2 className="w-4 h-4" /></button>
          </div>

          {/* Posición en la Jornada y Puntos Globales */}
          {myRankObj && (
            <div className="mt-3 flex flex-col gap-1 bg-[#00ff7f0d] border border-[#00ff7f22] rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm">📍</span>
                <span className="text-xs text-[#00ff7f] font-medium">
                  Posición en {selectedTab}: <strong>#{myRankObj.tabRank}</strong> de {dynamicRanking.length}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 ml-6">
                (Torneo Global: <strong className="text-gray-300">{myRankObj.totalPoints ?? 0} pts totales</strong>)
              </p>
            </div>
          )}
        </div>

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

        {/* 🚀 DASHBOARD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMNA IZQUIERDA: Ranking Específico de la Jornada */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#fbbf24]" />
                <h2 className="text-sm font-bold text-white">Ranking: {selectedTab}</h2>
              </div>
            </div>
            
            <div className="card divide-y divide-[#1e2d3d] overflow-hidden">
              {rankLoading ? (
                <div className="px-4">
                  {Array(4).fill(0).map((_, i) => <SkeletonRankRow key={i} />)}
                </div>
              ) : dynamicRanking.length === 0 ? (
                <EmptyState icon="📊" title="Sin datos aún" body="Los puntos aparecerán cuando finalicen los partidos." />
              ) : (
                dynamicRanking.map(player => (
                  <GroupRankRow
                    key={player.uid}
                    player={player}
                    isMe={player.uid === user?.uid}
                    matchesInTab={filteredMatches} 
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: Calendario de Partidos */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 px-1">
              <span className="text-sm">⚽</span>
              <h2 className="text-sm font-bold text-white">Calendario y Resultados</h2>
            </div>
            
            {tournamentTabs.length > 0 && (
              <div className="flex gap-1.5 border-b border-[#1e2d3d] pb-2 overflow-x-auto scrollbar-none snap-x">
                {tournamentTabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={clsx(
                      'px-3.5 py-2 text-xs font-black rounded-xl transition-all duration-150 whitespace-nowrap snap-mq',
                      selectedTab === tab
                        ? 'bg-[#00ff7f] text-[#0a0e1a] shadow-[0_0_12px_rgba(0,255,127,0.2)]'
                        : 'bg-[#111827] text-gray-400 border border-[#1e2d3d] hover:text-white hover:border-gray-700'
                    )}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3.5">
              {filteredMatches.length === 0 ? (
                <p className="text-xs text-gray-500 italic text-center p-6 bg-brand-card rounded-xl border border-gray-800">
                  No hay partidos programados para esta jornada.
                </p>
              ) : (
                filteredMatches.map(match => (
                  <MatchCard 
                    key={match.id} 
                    match={match} 
                    compact={true} 
                  />
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  )
}

function GroupRankRow({ player, isMe, matchesInTab }) {
  const init = (player.displayName ?? 'U')[0].toUpperCase()
  return (
    <div className={clsx('flex flex-col px-4 py-3 gap-2.5 transition-all', isMe && 'bg-[#00ff7f05]')}>
      
      <div className="flex items-center gap-3 w-full">
        {/* Aquí se inyecta la posición del Ranking Dinámico */}
        <span className="text-sm font-bold w-7 text-center text-gray-400 tabular-nums">
          {player.tabRank <= 3 ? ['🥇','🥈','🥉'][player.tabRank - 1] : `#${player.tabRank}`}
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
        </div>
        <div className="text-right">
          {/* Aquí se inyectan los puntos obtenidos exclusivamente en esta Jornada */}
          <p className="text-sm font-black text-[#fbbf24]">{player.tabPoints ?? 0}</p>
          <p className="text-[10px] text-gray-600">pts</p>
        </div>
      </div>

      <PlayerPredictionsSnapshot isMe={isMe} matchesInTab={matchesInTab} playerPreds={player.playerPreds} />
    </div>
  )
}

// Ahora el componente hijo es super liviano porque recibe las predicciones pre-cargadas
function PlayerPredictionsSnapshot({ isMe, matchesInTab, playerPreds }) {
  if (!matchesInTab || matchesInTab.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 bg-[#0d1b2a55] p-2 rounded-xl border border-[#1e2d3d33]">
      {matchesInTab.map((match) => {
        const pred = playerPreds ? playerPreds[match.id] : null
        
        const isLive = match.status === 'live'
        const isFinished = match.status === 'finished'
        const locked = isLive || isFinished || isMatchStarted(match.date)

        return (
          <div 
            key={match.id} 
            className="text-[10px] bg-[#111827] border border-[#1e2d3d] px-2 py-1 rounded-lg flex items-center gap-1.5 text-gray-400"
          >
            <span className="font-bold text-gray-300">{match.homeTeam.substring(0,3)} vs {match.awayTeam.substring(0,3)}:</span>
            
            {!pred ? (
              <span className="text-gray-600 italic text-[9px]">Sin pronóstico</span>
            ) : (!locked && !isMe) ? (
              <span className="text-gray-500 font-medium text-[9px]">🔒 Oculto</span>
            ) : (
              <span className={clsx("font-black", isFinished ? "text-[#fbbf24]" : "text-[#00ff7f]")}>
                {pred.homeScore} - {pred.awayScore}
                {isFinished && pred.points != null && (
                  <span className="text-[#fbbf24] ml-1 font-medium">({pred.points} pts)</span>
                )}
                {!locked && isMe && (
                  <span className="text-gray-500 ml-0.5 font-normal text-[9px]">(Pendiente)</span>
                )}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}