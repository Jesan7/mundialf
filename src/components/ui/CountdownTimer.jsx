// src/components/ui/CountdownTimer.jsx
import { useState, useEffect } from 'react'
import { getCountdown } from '@/utils/dateUtils'
import clsx from 'clsx'

export default function CountdownTimer({ date, className }) {
  const [cd, setCd] = useState(() => getCountdown(date))

  useEffect(() => {
    const t = setInterval(() => setCd(getCountdown(date)), 1000)
    return () => clearInterval(t)
  }, [date])

  if (!cd) {
    return (
      <span className={clsx('text-xs font-semibold text-red-400', className)}>
        En curso
      </span>
    )
  }

  const pad = (n) => String(n).padStart(2, '0')

  // Show days if > 0
  if (cd.days > 0) {
    return (
      <div className={clsx('flex items-center gap-1.5', className)}>
        <Unit value={cd.days}    label="d" />
        <Sep />
        <Unit value={cd.hours}   label="h" />
        <Sep />
        <Unit value={cd.minutes} label="m" />
      </div>
    )
  }

  return (
    <div className={clsx('flex items-center gap-1.5', className)}>
      <Unit value={cd.hours}   label="h" />
      <Sep />
      <Unit value={cd.minutes} label="m" />
      <Sep />
      <Unit value={cd.seconds} label="s" highlight />
    </div>
  )
}

function Unit({ value, label, highlight }) {
  return (
    <div className="flex flex-col items-center">
      <span className={clsx(
        'text-sm font-black tabular-nums leading-none',
        highlight ? 'text-[#00ff7f]' : 'text-white'
      )}>
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[9px] text-gray-600 uppercase">{label}</span>
    </div>
  )
}

function Sep() {
  return <span className="text-gray-600 text-xs font-bold mb-2">:</span>
}
