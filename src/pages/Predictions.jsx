// src/pages/Predictions.jsx
import { useState, useMemo } from 'react'
import MainLayout from '@/layouts/MainLayout'
import { useMatches } from '@/hooks/useMatches'
import { usePredictions } from '@/hooks/usePredictions'
import { useAuth } from '@/context/AuthContext' // 👈 Importamos useAuth para leer el usuario activo
import MatchCard from '@/components/ui/MatchCard'
import PredictionInput from '@/components/ui/PredictionInput'
import { SkeletonCard } from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import { Filter, Play } from 'lucide-react'
import clsx from 'clsx'

// IMPORTACIONES CRÍTICAS: Cargamos el fixture masivo y las herramientas de Firestore
import { MATCHES_DATA } from '@/data/matches'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/services/firebase' 

// 🛡️ CANDADO MAESTRO VISUAL: Coloca aquí tu UID exacto de la consola de Firebase
const ADMIN_UID = "ppm17HE6yUVoESHVf7YNpIVMh9t2";

const TABS = [
  { id: 'all',      label: 'Todos'      },
  { id: 'upcoming', label: 'Próximos'   },
  { id: 'live',     label: 'En vivo'    },
  { id: 'finished', label: 'Finalizados'},
]

export default function Predictions() {
  const { user } = useAuth() // 👈 Extraemos el usuario actual logueado
  const { matches, loading, updatingId, updateMatchResult } = useMatches()
  const { predictions, saving, savePrediction } = usePredictions()
  const [tab, setTab]             = useState('all')
  
  // Estado local para controlar el spinner del cargador masivo
  const [seeding, setSeeding]     = useState(false)

  // Validación booleana: ¿Es el administrador legítimo?
  const isAdmin = user?.uid === ADMIN_UID;

  const filtered = useMemo(() => {
    if (tab === 'all') return matches
    return matches.filter(m => m.status === tab)
  }, [matches, tab])

  // LÓGICA DE INYECCIÓN MASIVA: Recorre los partidos y los guarda con marcadores explícitos en null
  const handleInjectFixtures = async () => {
    if (!isAdmin) return; // Doble control interno de seguridad
    if (!window.confirm("¿Seguro que deseas inyectar todos los partidos oficiales del fixture a Firestore con marcadores en null?")) return;
    setSeeding(true);
    try {
      for (const match of MATCHES_DATA) {
        const matchRef = doc(db, 'matches', match.id);
        
        await setDoc(matchRef, {
          id: match.id,
          jornada: Number(match.jornada),
          homeTeam: match.homeTeam,
          homeFlag: match.homeFlag,
          homeScore: null, 
          awayTeam: match.awayTeam,
          awayFlag: match.awayFlag,
          awayScore: null, 
          venue: match.venue,
          stage: match.stage,
          group: match.group,
          status: match.status || "upcoming",
          date: new Date(match.date) 
        }, { merge: true });
      }
      alert("🏆 ¡Espectacular! Todo el fixture fue inyectado con éxito en Firestore.");
    } catch (error) {
      console.error("Error cargando el fixture masivo:", error);
      alert("Error al inyectar: " + error.message);
    } finally {
      setSeeding(false);
    }
  };

  async function handleSave(matchId, matchDate, matchStatus, home, away, useMultiplier, jornada) {
    // 🛡️ CANDADO DE SEGURIDAD 1: Bloqueo inmediato si el estado en tiempo real no es 'upcoming'
    if (matchStatus !== 'upcoming') {
      alert("🚫 Pronóstico cerrado: Este partido ya está en vivo o ha finalizado.")
      return
    }

    // 🛡️ CANDADO DE SEGURIDAD 2: Control perimetral de tiempo local vs servidor
    const now = new Date()
    const gameDate = matchDate?.toDate ? matchDate.toDate() : new Date(matchDate)
    
    if (gameDate < now) {
      alert("🚫 Pronóstico cerrado: El partido ya ha comenzado.")
      return
    }

    const homeNum = parseInt(home, 10)
    const awayNum = parseInt(away, 10)

    if (isNaN(homeNum) || isNaN(awayNum)) return

    await savePrediction(matchId, homeNum, awayNum, matchDate, matchStatus, useMultiplier, jornada)
  }

  return (
    <MainLayout>
      <div className="animate-fade-in">

        {/* Header con botón Super Admin Condicional */}
        <div className="mb-5 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-white">Pronósticos</h1>
            <p className="text-gray-400 text-xs mt-1">
              Exacto = 5 pts · Diferencia = 2 pts · Ganador = 1 pt
            </p>
          </div>

          {/* 🛡️ CANDADO VISUAL 1: El botón de inyección masiva solo aparece si eres tú */}
          {isAdmin && (
            <button
              onClick={handleInjectFixtures}
              disabled={seeding}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-[10px] font-black px-3 py-2 rounded-xl transition-all shadow-lg shadow-purple-600/20 active:scale-95"
            >
              {seeding ? "Cargando Fixture..." : "⚡ Cargar Partidos"}
            </button>
          )}
        </div>

        {/* Points legend card */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { pts: 5, label: 'Exacto',      color: 'text-[#fbbf24] bg-[#fbbf2415] border-[#fbbf2430]' },
            { pts: 2, label: 'Diferencia',  color: 'text-[#00ff7f] bg-[#00ff7f15] border-[#00ff7f30]' },
            { pts: 1, label: 'Ganador',     color: 'text-blue-400  bg-blue-400/10  border-blue-400/30'  },
          ].map(r => (
            <div key={r.pts} className={clsx('rounded-xl border px-2 py-2 text-center', r.color)}>
              <div className="text-lg font-black">{r.pts}</div>
              <div className="text-[10px] opacity-80">{r.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200',
                tab === t.id
                  ? 'bg-[#00ff7f] text-[#0a0e1a]'
                  : 'bg-[#1e2d3d] text-gray-400 hover:text-white'
              )}
            >
              {t.label}
              {t.id !== 'all' && (
                <span className="ml-1 opacity-60">
                  ({matches.filter(m => m.status === t.id).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Match list */}
        <div className="space-y-3">
          {loading ? (
            Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="⚽"
              title="Sin partidos"
              body={tab === 'live' ? 'No hay partidos en vivo ahora.' : 'No hay partidos en esta categoría.'}
            />
          ) : (
            filtered.map(match => (
              <div key={match.id} className="card p-4 relative overflow-hidden">
                {/* Match info header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                    {match.group} · {match.stage} {match.jornada && `· J${match.jornada}`}
                  </span>
                  <StatusBadge status={match.status} />
                </div>

                {/* Teams + score display */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Team name={match.homeTeam} align="start" />
                  <ScoreDisplay match={match} />
                  <Team name={match.awayTeam} align="end" />
                </div>

                {/* Prediction input */}
                <div className="mb-1">
                  <PredictionInput
                    match={match}
                    prediction={predictions[match.id]}
                    saving={saving === match.id}
                    onSave={(home, away, useMultiplier) =>
                      handleSave(match.id, match.date, match.status, home, away, useMultiplier, match.jornada)
                    }
                  />
                </div>

                {/* 🛡️ CANDADO VISUAL 2: El simulador de resultados completo se evapora si no eres Admin */}
                {isAdmin && match.status !== 'finished' && (
                  <AdminSimulator 
                    match={match} 
                    onSimulate={updateMatchResult}
                    isSimulating={updatingId === match.id}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  )
}

// Sub-componentes intactos para preservar tu renderizado original
function AdminSimulator({ match, onSimulate, isSimulating }) {
  const [simHome, setSimHome] = useState('')
  const [simAway, setSimAway] = useState('')

  const handleTrigger = async () => {
    if (simHome === '' || simAway === '') return
    await onSimulate(match.id, simHome, simAway)
  }

  return (
    <div className="mt-3 pt-3 border-t border-dashed border-red-500/30 bg-red-500/5 -mx-4 -mb-4 p-4 rounded-b-xl">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-red-400 tracking-wide uppercase flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          Simulador Admin
        </span>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            placeholder="L"
            value={simHome}
            onChange={e => setSimHome(e.target.value)}
            className="w-8 h-7 bg-[#0a0e1a] border border-red-500/30 rounded text-center text-xs text-white font-bold focus:outline-none focus:border-red-500"
          />
          <span className="text-gray-600 text-xs">-</span>
          <input
            type="number"
            placeholder="V"
            value={simAway}
            onChange={e => setSimAway(e.target.value)}
            className="w-8 h-7 bg-[#0a0e1a] border border-red-500/30 rounded text-center text-xs text-white font-bold focus:outline-none focus:border-red-500"
          />
          <button
            onClick={handleTrigger}
            disabled={isSimulating || simHome === '' || simAway === ''}
            className="bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded transition-all flex items-center gap-1 disabled:opacity-40"
          >
            {isSimulating ? 'Calculando...' : 'Finalizar e Inyectar Puntos'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Team({ name, align = 'start' }) {
  return (
    <div className={clsx('flex flex-col flex-1', align === 'end' ? 'items-end' : 'items-start')}>
      <span className={clsx(
        'text-sm font-bold text-white leading-snug max-w-[110px]',
        align === 'end' ? 'text-right' : 'text-left'
      )}>
        {name}
      </span>
    </div>
  )
}

function ScoreDisplay({ match }) {
  if (match.status === 'finished' || match.status === 'live') {
    return (
      <div className="flex items-center gap-2 flex-col">
        <div className="flex items-center gap-2">
          <ScoreBox score={match.homeScore} live={match.status === 'live'} />
          <span className="text-gray-500 font-bold">–</span>
          <ScoreBox score={match.awayScore} live={match.status === 'live'} />
        </div>
        {match.status === 'live' && (
          <span className="text-[10px] text-red-400 font-semibold animate-pulse">⚡ EN VIVO</span>
        )}
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-gray-500 text-xs font-bold">VS</span>
    </div>
  )
}

function ScoreBox({ score, live }) {
  return (
    <div className={clsx(
      'w-9 h-9 rounded-lg flex items-center justify-center font-black text-base',
      live ? 'bg-red-500/20 text-white border border-red-500/30' : 'bg-[#1e2d3d] text-white'
    )}>
      {score ?? '-'}
    </div>
  )
}

function StatusBadge({ status }) {
  if (status === 'live')     return <span className="badge-live flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />En vivo</span>
  if (status === 'finished') return <span className="badge-finished">Finalizado</span>
  return <span className="badge-upcoming">Próximo</span>
}