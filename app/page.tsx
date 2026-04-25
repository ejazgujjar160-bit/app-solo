"use client"

import { useEffect, useState } from "react"

export default function Game() {
  const [multiplier, setMultiplier] = useState(1.0)
  const [gameState, setGameState] = useState("waiting")

  return (
    <div className="min-h-screen bg-[#060b13] text-white flex flex-col items-center justify-center p-4 font-sans">
      {/* Header */}
      <div className="absolute top-10 text-center">
        <h1 className="text-3xl font-black text-green-500 tracking-tighter">F16 JET PRO</h1>
        <p className="text-gray-400 text-sm uppercase tracking-widest">System Online</p>
      </div>

      {/* Main Game Display */}
      <div className="bg-black border-2 border-gray-800 rounded-3xl p-12 shadow-[0_0_50px_rgba(34,197,94,0.
