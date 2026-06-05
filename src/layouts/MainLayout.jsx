// src/layouts/MainLayout.jsx
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useUnreadCount } from '@/hooks/useNotifications' // 🔥 Importamos el contador global plano
import {
  Home,
  Users,
  Star,
  BarChart2,
  Bell,
  LogOut,
  Trophy,
  Coins,
} from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { path: '/home',        label: 'Inicio',       icon: Home     },
  { path: '/predictions', label: 'Pronósticos', icon: Star  },
  { path: '/groups',      label: 'Grupos',       icon: Users    },
  { path: '/ranking',     label: 'Ranking',      icon: BarChart2 },
  { path: '/coins',       label: 'Monedas',      icon: Coins    },
]

export default function MainLayout({ children }) {
  const { user, profile, logout } = useAuth()
  const unreadCount = useUnreadCount() // 🔥 Conectamos el hook reactivo para escuchar la DB en vivo
  const location = useLocation()
  const navigate  = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[#0a0e1a]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[#0a0e1a]/80 backdrop-blur border-b border-[#1e2d3d]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-1.5">
            <Trophy className="w-5 h-5 text-[#00ff7f]" />
            <span className="font-black text-white tracking-tight">
              Mundial<span className="neon-text">F</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Coins */}
            <div className="flex items-center gap-1 bg-[#fbbf2411] border border-[#fbbf2433] rounded-full px-3 py-1">
              <span className="text-sm">🪙</span>
              <span className="text-xs font-bold text-[#fbbf24]">
                {profile?.coins ?? 0}
              </span>
            </div>

            {/* Notifications */}
            <Link to="/notifications" className="relative p-2 rounded-xl hover:bg-[#1e2d3d] transition-colors">
              <Bell className={clsx("w-5 h-5 transition-colors", unreadCount > 0 ? "text-[#00ff7f]" : "text-gray-400")} />
              
              {/* 🟢 Burbuja flotante reactiva: Solo se muestra si hay más de 0 notificaciones pendientes */}
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[9px] font-black text-[#0a0e1a] animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Avatar / Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl hover:bg-[#1e2d3d] transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 pb-28">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d1b2a]/95 backdrop-blur border-t border-[#1e2d3d] safe-bottom">
        <div className="max-w-2xl mx-auto flex items-center justify-around px-2 h-16">
          {NAV.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={clsx(
                  'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-[52px]',
                  active
                    ? 'text-[#00ff7f]'
                    : 'text-gray-500 hover:text-gray-300'
                )}
              >
                <Icon className={clsx('w-5 h-5', active && 'drop-shadow-[0_0_6px_#00ff7f]')} />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
