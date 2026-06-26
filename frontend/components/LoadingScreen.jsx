'use client';

export default function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] font-sans">
      {/* Animated SWAIS logo ring */}
      <div className="relative flex items-center justify-center mb-8">
        {/* Outer spinning ring */}
        <div className="absolute w-24 h-24 rounded-full border-4 border-transparent border-t-[#cda653] border-r-[#cda653]/40 animate-spin" />
        {/* Inner pulsing ring */}
        <div className="absolute w-16 h-16 rounded-full border-2 border-[#0f2851]/20 animate-pulse" />
        {/* Center logo mark */}
        <div className="w-12 h-12 rounded-full bg-[#0f2851] flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-[#cda653]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" stroke="#cda653" strokeOpacity="0.4" />
            <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" stroke="#cda653" strokeOpacity="0.3" />
            <circle cx="12" cy="12" r="2.5" fill="#cda653" />
          </svg>
        </div>
      </div>

      {/* Brand name */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold tracking-[0.2em] text-[#0f2851] mb-1">SWAIS</h1>
        <p className="text-xs tracking-widest text-gray-400 font-medium uppercase">Saraf Worldsphere AI Services</p>
      </div>

      {/* Animated dots */}
      <div className="flex items-center gap-2 mb-4">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[#cda653]"
            style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>

      {/* Message */}
      <p className="text-sm text-gray-500 font-medium tracking-wide">{message}</p>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
