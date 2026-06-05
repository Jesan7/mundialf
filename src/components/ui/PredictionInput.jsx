// src/components/ui/PredictionInput.jsx
import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { Lock, Loader2, Coins } from 'lucide-react'
import { isMatchStarted } from '@/utils/dateUtils'
import { pointsColor, pointsLabel } from '@/utils/points'

/**
 * Score input + save button + double points multiplier for a single match.
 * Props:
 * match       — match object
 * prediction  — existing prediction or undefined
 * onSave(home, away, useMultiplier)
 * saving      — boolean
 */
export default function PredictionInput({ match, prediction, onSave, saving }) {
  const locked = match.status !== 'upcoming' || isMatchStarted(match.date)

  const [home, setHome] = useState(prediction?.homeScore ?? '')
  const [away, setAway] = useState(prediction?.awayScore ?? '')
  const [useMultiplier, setUseMultiplier] = useState(prediction?.hasMultiplier ?? false)
  const [dirty, setDirty] = useState(false)

  // Sync when prediction loads desde la base de datos
  useEffect(() => {
    if (prediction) {
      setHome(String(prediction.homeScore))
      setAway(String(prediction.awayScore))
      setUseMultiplier(prediction.hasMultiplier ?? false)
      setDirty(false)
    }
  }, [prediction])

  function handleHome(v) { setHome(v); setDirty(true) }
  function handleAway(v) { setAway(v); setDirty(true) }
  
  // Activa o desactiva el comodín y marca el estado como modificado (dirty)
  function toggleMultiplier() {
    setUseMultiplier(prev => !prev)
    setDirty(true)
  }

  async function handleSave() {
    // Propaga goles y el estado del comodín hacia la página principal
    if (await onSave(home, away, useMultiplier)) setDirty(false)
  }

  // ==================== VISTA CUANDO EL PARTIDO ESTÁ CERRADO ====================
  if (locked) {
    return (
      <div className="mt-3 pt-3 border-t border-[#1e2d3d]">
        {prediction ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-gray-600" />
              <span className="text-xs text-gray-400">
                Pronóstico: <strong className="text-white">{prediction.homeScore} – {prediction.awayScore}</strong>
              </span>
              {prediction.hasMultiplier && (
                <span className="flex items-center gap-0.5 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-bold">
                  <Coins className="w-2.5 h-2.5" /> x2
                </span>
              )}
            </div>
            {prediction.points != null ? (
              <span className={clsx('badge border text-[10px]', pointsColor(prediction.points))}>
                {pointsLabel(prediction.points)}
              </span>
            ) : (
              <span className="text-[10px] text-gray-500">Pendiente</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-gray-600">
            <Lock className="w-3.5 h-3.5" />
            <span className="text-xs">Pronóstico cerrado</span>
          </div>
        )}
      </div>
    )
  }

  // ==================== VISTA EDITABLE (PRÓXIMOS PARTIDOS) ====================
  return (
    <div className="mt-3 pt-3 border-t border-[#1e2d3d]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">
          Tu pronóstico
        </p>
        
        {/* BOTÓN DEL COMODÍN ECONÓMICO */}
        <button
          type="button"
          onClick={toggleMultiplier}
          className={clsx(
            'flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all duration-200',
            useMultiplier 
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]' 
              : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-700 hover:text-gray-400'
          )}
        >
          <Coins className={clsx('w-3 h-3', useMultiplier ? 'animate-bounce' : '')} />
          {useMultiplier ? 'Comodín x2 Activo (-100 🪙)' : 'Usar Comodín x2'}
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        {/* Home score input */}
        <div className="flex items-center gap-2.5 flex-1">
          <img 
            src={`https://flagcdn.com/w40/${match.homeFlag}.png`} 
            alt={match.homeTeam} 
            className="w-7 h-auto aspect-[4/3] object-cover rounded shadow-sm border border-gray-800"
          />
          <ScoreInput value={home} onChange={handleHome} />
        </div>

        <span className="text-gray-600 font-bold text-sm">–</span>

        {/* Away score input */}
        <div className="flex items-center gap-2.5 flex-1 justify-end">
          <ScoreInput value={away} onChange={handleAway} />
          <img 
            src={`https://flagcdn.com/w40/${match.awayFlag}.png`} 
            alt={match.awayTeam} 
            className="w-7 h-auto aspect-[4/3] object-cover rounded shadow-sm border border-gray-800"
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || home === '' || away === ''}
          className={clsx(
            'ml-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200',
            dirty
              ? 'bg-[#00ff7f] text-[#0a0e1a] hover:bg-[#00e56f]'
              : 'bg-[#1e2d3d] text-gray-400',
            'disabled:opacity-40 disabled:cursor-not-allowed min-w-[60px] flex items-center justify-center gap-1'
          )}
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : prediction && !dirty ? (
            '✓ OK'
          ) : (
            'Guardar'
          )}
        </button>
      </div>

      {prediction && !dirty && (
        <p className="text-[10px] text-[#00ff7f] mt-1.5">
          ✓ Guardado — puedes editar hasta el inicio del partido {prediction.hasMultiplier && '· ¡Multiplicador x2 activado! 🪙'}
        </p>
      )}
    </div>
  )
}

function ScoreInput({ value, onChange }) {
  return (
    <input
      type="number"
      min="0"
      max="20"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="–"
      className="w-12 h-10 bg-[#0d1b2a] border border-[#1e2d3d] rounded-xl text-center
                 text-white font-black text-lg focus:outline-none focus:border-[#00ff7f]
                 focus:ring-1 focus:ring-[#00ff7f33] transition-all [appearance:textfield]
                 [&::-webkit-outer-spin-button]:appearance-none
                 [&::-webkit-inner-spin-button]:appearance-none"
    />
  )
}