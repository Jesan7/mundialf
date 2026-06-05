// src/pages/Coins.jsx
import MainLayout from '@/layouts/MainLayout'
import { useAuth } from '@/context/AuthContext'
import { doc, updateDoc, increment, serverTimestamp, collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const DAILY_BONUS = 50

export default function Coins() {
  const { user, profile } = useAuth()
  const [history, setHistory] = useState([])
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)

  // 1. Sincronizar el Historial de Monedas en tiempo real
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'coinHistory'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setHistory(data.slice(0, 10))

      // 🔥 BLINDAJE ULTRA: Verifica si el último bonus diario en la DB fue hoy
      const todayStr = new Date().toDateString()
      const hasClaimedToday = data.some(h => {
        if (h.reason === 'Bonus diario') {
          // Si Firebase aún está calculando el serverTimestamp, usamos la fecha local como fallback provisional
          if (!h.createdAt) return true 
          
          const bonusDate = h.createdAt.toDate ? h.createdAt.toDate() : new Date(h.createdAt)
          return bonusDate.toDateString() === todayStr
        }
        return false
      })
      setClaimed(hasClaimedToday)
    }, (err) => {
      console.error("Error cargando historial de monedas:", err)
    })
    return unsub
  }, [user])

  // 2. Función segura para reclamar el Bonus Diario
  async function claimDaily() {
    if (claimed || claiming) return
    
    // 🛡️ BLOQUEO INSTANTÁNEO EN FRONTEND (Evita el abuso de clicks múltiples)
    setClaimed(true)
    setClaiming(true)
    
    try {
      // Guardar en la base de datos de forma atómica
      await updateDoc(doc(db, 'users', user.uid), { 
        coins: increment(DAILY_BONUS) 
      })
      
      await addDoc(collection(db, 'coinHistory'), {
        userId: user.uid,
        amount: DAILY_BONUS,
        reason: 'Bonus diario',
        createdAt: serverTimestamp(),
      })

      toast.success(`+${DAILY_BONUS} monedas 🪙 ¡Bonus diario reclamado!`)
    } catch (error) {
      console.error(error)
      // Si falla, revertimos los estados para que pueda intentar de nuevo
      setClaimed(false)
      toast.error('Error al reclamar bonus')
    } finally {
      setClaiming(false)
    }
  }

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-5">

        <div>
          <h1 className="text-2xl font-black text-white">Monedas</h1>
          <p className="text-gray-400 text-xs mt-1">Tu saldo virtual del Mundial 2026</p>
        </div>

        {/* Balance card */}
        <div className="card p-6 bg-gradient-to-br from-[#fbbf2415] to-[#0d1b2a] border-[#fbbf2430] text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#fbbf2408] to-transparent pointer-events-none" />
          <div className="text-5xl mb-2">🪙</div>
          <div className="text-5xl font-black text-[#fbbf24]">{profile?.coins ?? 0}</div>
          <div className="text-gray-400 text-sm mt-1">Monedas virtuales</div>
          <p className="text-[10px] text-gray-600 mt-3">
            Sin valor real · Solo para MundialF
          </p>
        </div>

        {/* Claim daily */}
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">☀️</div>
              <div>
                <p className="text-sm font-bold text-white">Bonus diario</p>
                <p className="text-xs text-gray-400">+{DAILY_BONUS} monedas</p>
              </div>
            </div>
            <button
              onClick={claimDaily}
              disabled={claimed || claiming}
              className={clsx(
                'px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200',
                claimed
                  ? 'bg-[#1e2d3d] text-gray-500 cursor-not-allowed'
                  : 'bg-[#fbbf24] text-[#0a0e1a] hover:bg-[#f59e0b] active:scale-95'
              )}
            >
              {claiming ? '...' : claimed ? '✓ Reclamado' : 'Reclamar'}
            </button>
          </div>
        </div>

        {/* Ways to earn */}
        <div>
          <h2 className="text-sm font-bold text-white mb-3">Cómo ganar monedas</h2>
          <div className="space-y-2">
            {[
              { icon: '🎯', label: 'Marcador exacto',   coins: '+200' },
              { icon: '✅', label: 'Diferencia correcta', coins: '+100' },
              { icon: '👍', label: 'Ganador correcto',    coins: '+50'  },
              { icon: '🔥', label: 'Racha de 3 aciertos', coins: '+100' }, 
              { icon: '☀️', label: 'Bonus diario',        coins: `+${DAILY_BONUS}` },
              { icon: '🎉', label: 'Registro inicial',    coins: '+500' },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between bg-[#0d1b2a] border border-[#1e2d3d] rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <span>{r.icon}</span>
                  <span className="text-sm text-gray-300">{r.label}</span>
                </div>
                <span className="text-sm font-bold text-[#fbbf24]">{r.coins}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Historial Cronológico Mejorado */}
        {history.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-white mb-3">Historial reciente</h2>
            <div className="card divide-y divide-[#1e2d3d] overflow-hidden">
              {history.map(h => {
                // Validación para saber si es un gasto o una ganancia
                const isExpense = h.amount < 0 || h.reason?.toLowerCase().includes('compra') || h.reason?.toLowerCase().includes('usado');
                
                return (
                  <div key={h.id} className="flex items-center justify-between px-4 py-3 bg-[#0d1b2a]">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-200">{h.reason}</span>
                      <span className="text-[10px] text-gray-500">
                        {h.createdAt?.toDate 
                          ? h.createdAt.toDate().toLocaleDateString('es-EC', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                          : 'Procesando...'}
                      </span>
                    </div>
                    <span className={clsx(
                      "text-sm font-bold",
                      isExpense ? "text-red-400" : "text-green-400"
                    )}>
                      {isExpense ? '' : '+'}{h.amount} 🪙
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  )
}