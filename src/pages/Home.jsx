// src/pages/Home.jsx
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import { useAuth } from '@/context/AuthContext'
import { useMatches, liveMatches, upcomingMatches, finishedMatches } from '@/hooks/useMatches'
import { usePredictions } from '@/hooks/usePredictions'
import MatchCard from '@/components/ui/MatchCard'
import CountdownTimer from '@/components/ui/CountdownTimer'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { Trophy, Zap, ChevronRight, Star } from 'lucide-react'
import { formatMatchDate } from '@/utils/dateUtils'

export default function Home() {
  const { user, profile }              = useAuth()
  const { matches, loading: mLoading } = useMatches()
  const { predictions }                = usePredictions()

  const live     = useMemo(() => liveMatches(matches),          [matches])
  const upcoming = useMemo(() => upcomingMatches(matches, 4),   [matches])
  const finished = useMemo(() => finishedMatches(matches, 3),   [matches])

  const nextMatch = upcoming[0]

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">

        {/* Greeting */}
        <div>
          <p className="text-gray-400 text-sm">Bienvenido 👋</p>
          <h1 className="text-2xl font-black text-white mt-0.5 leading-tight">
            {profile?.displayName ?? user?.displayName ?? 'Jugador'}
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon="🏆" value={profile?.totalPoints ?? 0} label="Puntos"   color="text-[#fbbf24]" />
          <StatCard icon="🪙" value={profile?.coins ?? 0}       label="Monedas" color="text-[#fbbf24]" />
          <StatCard icon="🔥" value={profile?.streak ?? 0}      label="Racha"   color="text-orange-400" />
        </div>

        {/* Hero: próximo partido */}
        {nextMatch && (
          <div className="card p-5 bg-gradient-to-br from-[#0d1b2a] to-[#111827] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#00ff7f08] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Próximo partido</p>
                <p className="text-xs text-gray-400 mt-0.5 capitalize">{formatMatchDate(nextMatch.date)}</p>
              </div>
              <CountdownTimer date={nextMatch.date} />
            </div>
            <div className="flex items-center justify-around">
              <TeamHero flag={nextMatch.homeFlag} name={nextMatch.homeTeam} />
              <div className="flex flex-col items-center gap-1">
                <span className="text-gray-500 text-sm font-bold">VS</span>
                <span className="text-[10px] text-gray-600">{nextMatch.group}</span>
              </div>
              <TeamHero flag={nextMatch.awayFlag} name={nextMatch.awayTeam} />
            </div>
            <Link to="/predictions" className="mt-4 flex items-center justify-center gap-2 btn-primary text-sm py-2.5">
              <Star className="w-4 h-4" />
              {predictions[nextMatch.id] ? 'Ver pronóstico' : 'Hacer pronóstico'}
            </Link>
          </div>
        )}

        {/* En vivo */}
        {live.length > 0 && (
          <Section title="En vivo" icon={<span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />} titleColor="text-red-400">
            {live.map(m => <MatchCard key={m.id} match={m} prediction={predictions[m.id]} linkTo="/predictions" />)}
          </Section>
        )}

        {/* Próximos partidos */}
        <Section title="Próximos partidos" icon={<Zap className="w-4 h-4 text-[#00ff7f]" />} action={<SeeAll to="/predictions" />}>
          {mLoading
            ? Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : upcoming.length === 0
              ? <p className="text-gray-500 text-sm py-4 text-center">No hay partidos próximos</p>
              : upcoming.map(m => <MatchCard key={m.id} match={m} prediction={predictions[m.id]} linkTo="/predictions" />)
          }
        </Section>

        {/* Últimos resultados */}
        {finished.length > 0 && (
          <Section title="Últimos resultados" icon={<Trophy className="w-4 h-4 text-[#fbbf24]" />}>
            {finished.map(m => <MatchCard key={m.id} match={m} prediction={predictions[m.id]} compact />)}
          </Section>
        )}

        {/* CTA grupos */}
        <div className="card p-5 bg-gradient-to-r from-[#3b82f611] to-[#00ff7f11] border-[#3b82f633]">
          <p className="text-sm font-bold text-white mb-1">¿Juegas con amigos?</p>
          <p className="text-xs text-gray-400 mb-3">Crea un grupo privado y compite con tu círculo.</p>
          <Link to="/groups" className="btn-secondary text-sm py-2 px-4 inline-flex items-center gap-1.5">
            Ver grupos <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </MainLayout>
  )
}

function StatCard({ icon, value, label, color }) {
  return (
    <div className="card p-3 text-center">
      <div className="text-xl mb-1">{icon}</div>
      <div className={`text-xl font-black ${color}`}>{value}</div>
      <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}

// Componente modificado para renderizar banderas grandes desde la API
function TeamHero({ flag, name }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <img 
        src={`https://flagcdn.com/w160/${flag}.png`} 
        alt={name} 
        className="w-16 h-auto aspect-[4/3] object-cover rounded-xl shadow-lg border border-gray-800"
      />
      <span className="text-xs font-semibold text-white text-center max-w-[80px] leading-tight">{name}</span>
    </div>
  )
}

function Section({ title, icon, titleColor = 'text-white', action, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">{icon}<h2 className={`text-sm font-bold ${titleColor}`}>{title}</h2></div>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function SeeAll({ to }) {
  return (
    <Link to={to} className="flex items-center gap-0.5 text-[#00ff7f] text-xs font-semibold hover:underline">
      Ver todos <ChevronRight className="w-3.5 h-3.5" />
    </Link>
  )
}