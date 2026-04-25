"use client"

import { useEffect, useState } from "react"

export default function Game() {
  const [multiplier, setMultiplier] = useState(1.0)
  const [gameState, setGameState] = useState("waiting")

  return (
    <div className="min-h-screen bg-[#060b13] text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="absolute top-10 text-center">
        <h1 className="text-3xl font-black text-green-500 tracking-tighter">F16 JET PRO</h1>
        <p className="text-gray-400 text-sm uppercase tracking-widest">System Online</p>
      </div>

      <div className="bg-black border-2 border-gray-800 rounded-3xl p-12 shadow-[0_0_50px_rgba(34,197,94,0.1)] mb-8 flex flex-col items-center w-full max-w-sm">
        <div className="text-7xl font-black mb-4 font-mono text-white">
          {multiplier.toFixed(2)}x
        </div>
        <div className={gameState === "waiting" ? "px-6 py-2 rounded-full text-xs font-bold uppercase bg-yellow-500 text-black" : "px-6 py-2 rounded-full text-xs font-bold uppercase bg-green-600 animate-pulse text-white"}>
          {gameState === "waiting" ? "Ready for Takeoff" : "Flying..."}
        </div>
      </div>

      <button 
        className="w-full max-w-xs bg-green-600 hover:bg-green-500 active:scale-95 transition-all py-4 rounded-2xl font-black text-xl shadow-lg shadow-green-900/20 uppercase"
        onClick={() => setGameState("flying")}
      >
        {gameState === "waiting" ? "Start Game" : "In Progress"}
      </button>

      <footer className="absolute bottom-10 text-gray-600 text-[10px] text-center uppercase tracking-widest">
        <p>© 2026 F16 Pro Edition</p>
      </footer>
    </div>
  )
}
