// src/components/ui/MatchCard.jsx
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import CountdownTimer from './CountdownTimer'
import { formatMatchDateShort, isMatchStarted } from '@/utils/dateUtils'
import { pointsColor, pointsLabel } from '@/utils/points'

export default function MatchCard({ match, prediction, compact = false, linkTo }) {
  const isLive      = match.status === 'live'
  const isFinished  = match.status === 'finished'
  const isUpcoming  = match.status === 'upcoming'
  const locked      = isLive || isFinished || isMatchStarted(match.date)

  const Wrapper = linkTo ? Link : 'div'
  const wrapperProps = linkTo ? { to: linkTo } : {}

  return (
    <Wrapper
      {...wrapperProps}
      className={clsx(
        'card p-4 transition-all duration-200 block',
        linkTo && 'hover:border-[#2d3f52] active:scale-[0.99] cursor-pointer',
        compact ? 'p-3' : 'p-4'
      )}
    >
      {/* Header: grupo + estado */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
          {match.group} · {match.stage}
        </span>

        {isLive && (
          <span className="badge-live flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            En vivo
          </span>
        )}
        {isFinished && <span className="badge-finished">Finalizado</span>}
        {isUpcoming && !locked && <span className="badge-upcoming">Próximo</span>}
        {isUpcoming && locked && (
          <span className="badge bg-orange-500/20 text-orange-400 border border-orange-500/30">
            Cerrado
          </span>
        )}
      </div>

      {/* Teams + score */}
      <div className="flex items-center justify-between gap-2">
        {/* Home */}
        <div className="flex-1 flex flex-col items-center gap-1.5">
          {/* Reemplazo de emoji por bandera real de flagcdn */}
          <img 
            src={`https://flagcdn.com/w80/${match.homeFlag}.png`} 
            alt={match.homeTeam} 
            className="w-12 h-auto aspect-[4/3] object-cover rounded shadow-md border border-gray-800"
          />
          <span className="text-xs font-semibold text-white text-center leading-tight">
            {match.homeTeam}
          </span>
        </div>

        {/* Score / time */}
        <div className="flex flex-col items-center gap-1 min-w-[80px]">
          {isFinished || isLive ? (
            <div className="flex items-center gap-2">
              <ScoreBox score={match.homeScore} highlight={isLive} />
              <span className="text-gray-500 text-sm font-bold">-</span>
              <ScoreBox score={match.awayScore} highlight={isLive} />
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs text-gray-400 font-medium">
                {formatMatchDateShort(match.date)}
              </p>
              {!locked && (
                <div className="mt-1">
                  <CountdownTimer date={match.date} />
                </div>
              )}
            </div>
          )}

          {/* VS label for upcoming/unlocked */}
          {isUpcoming && !isLive && (
            <span className="text-[10px] text-gray-600 font-bold">VS</span>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex flex-col items-center gap-1.5">
          {/* Reemplazo de emoji por bandera real de flagcdn */}
          <img 
            src={`https://flagcdn.com/w80/${match.awayFlag}.png`} 
            alt={match.awayTeam} 
            className="w-12 h-auto aspect-[4/3] object-cover rounded shadow-md border border-gray-800"
          />
          <span className="text-xs font-semibold text-white text-center leading-tight">
            {match.awayTeam}
          </span>
        </div>
      </div>

      {/* Prediction row */}
      {prediction && (
        <div className="mt-3 pt-3 border-t border-[#1e2d3d]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-500">Tu pronóstico:</span>
              <span className="text-xs font-bold text-gray-300">
                {prediction.homeScore} – {prediction.awayScore}
              </span>
            </div>
            {prediction.points != null && (
              <span className={clsx(
                'badge border text-[10px]',
                pointsColor(prediction.points)
              )}>
                {pointsLabel(prediction.points)}
              </span>
            )}
            {prediction.points == null && (
              <span className="text-[10px] text-[#00ff7f]">✓ Guardado</span>
            )}
          </div>
        </div>
      )}

      {/* Venue */}
      {!compact && (
        <p className="text-[10px] text-gray-600 mt-2 text-center truncate">
          📍 {match.venue}
        </p>
      )}
    </Wrapper>
  )
}

function ScoreBox({ score, highlight }) {
  return (
    <div className={clsx(
      'w-9 h-9 rounded-lg flex items-center justify-center font-black text-lg',
      highlight
        ? 'bg-red-500/20 text-white border border-red-500/30'
        : 'bg-[#1e2d3d] text-white'
    )}>
      {score ?? '-'}
    </div>
  )
}