// src/components/ui/LoadingScreen.jsx
export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-[#0a0e1a] flex flex-col items-center justify-center z-50">
      {/* Logo */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-2">
          <span className="text-4xl font-black tracking-tight text-white">
            Mundial<span className="neon-text text-shadow-neon">F</span>
          </span>
        </div>
        <p className="text-center text-xs text-gray-500 mt-1 tracking-widest uppercase">
          Mundial 2026
        </p>
      </div>

      {/* Spinner */}
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-[#1e2d3d]" />
        <div className="absolute inset-0 rounded-full border-2 border-t-[#00ff7f] animate-spin" />
      </div>
    </div>
  )
}
