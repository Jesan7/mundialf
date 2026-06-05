// src/components/ui/EmptyState.jsx
export default function EmptyState({ icon = '📭', title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-white font-semibold text-base mb-1">{title}</h3>
      {body && <p className="text-gray-400 text-sm max-w-xs">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
