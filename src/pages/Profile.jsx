// src/pages/Profile.jsx
import MainLayout from '@/layouts/MainLayout'
import { useAuth } from '@/context/AuthContext'
import { useRanking } from '@/hooks/useRanking'
import { useNavigate } from 'react-router-dom'
import { LogOut, Trophy, Star, Zap } from 'lucide-react'
import clsx from 'clsx'

export default function Profile() {
  const { user, profile, logout } = useAuth()
  const { ranking }               = useRanking(100)
  const navigate                  = useNavigate()

  const myRank = ranking.findIndex(r => r.uid === user?.uid)
  const rankDisplay = myRank >= 0 ? `#${myRank + 1}` : '—'

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const initial = (profile?.displayName ?? user?.displayName ?? 'U')[0].toUpperCase()

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-5">

        {/* Avatar card */}
        <div className="card p-6 flex flex-col items-center text-center gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00ff7f] to-[#3b82f6] flex items-center justify-center text-3xl font-black text-[#0a0e1a]">
              {initial}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#fbbf24] rounded-full flex items-center justify-center text-xs">
              ⚽
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black text-white">{profile?.displayName ?? user?.displayName}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <Trophy className="w-5 h-5" />, value: profile?.totalPoints ?? 0, label: 'Puntos totales', color: 'text-[#fbbf24]' },
            { icon: <Star   className="w-5 h-5" />, value: rankDisplay,               label: 'Ranking global', color: 'text-[#00ff7f]' },
            { icon: '🪙',                            value: profile?.coins ?? 0,        label: 'Monedas',        color: 'text-[#fbbf24]' },
            { icon: '🔥',                            value: profile?.streak ?? 0,       label: 'Racha actual',   color: 'text-orange-400' },
          ].map((s, i) => (
            <div key={i} className="card p-4 flex items-center gap-3">
              <div className={clsx('text-xl', typeof s.icon === 'string' ? '' : s.color)}>
                {typeof s.icon === 'string' ? s.icon : s.icon}
              </div>
              <div>
                <p className={clsx('text-xl font-black', s.color)}>{s.value}</p>
                <p className="text-[10px] text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Points system reminder */}
        <div className="card p-4">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#00ff7f]" /> Sistema de puntos
          </h3>
          <div className="space-y-2">
            {[
              { label: 'Marcador exacto',    pts: 5, color: 'text-[#fbbf24]' },
              { label: 'Diferencia correcta',pts: 2, color: 'text-[#00ff7f]' },
              { label: 'Ganador correcto',   pts: 1, color: 'text-blue-400'  },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{r.label}</span>
                <span className={clsx('text-sm font-bold', r.color)}>{r.pts} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>

      </div>
    </MainLayout>
  )
}
