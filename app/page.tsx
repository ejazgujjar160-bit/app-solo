"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

type GameState = "waiting" | "countdown" | "flying" | "crashed"

export default function F16AviatorPro() {
  // --- AUTH STATES ---
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [userBalance, setUserBalance] = useState(10000)

  // --- GAME STATES ---
  const [gameState, setGameState] = useState<GameState>("waiting")
  const [multiplier, setMultiplier] = useState(1.0)
  const [history, setHistory] = useState<number[]>([1.45, 2.10, 1.05, 5.40])
  
  // BET 1
  const [bet1, setBet1] = useState(100)
  const [bet1Placed, setBet1Placed] = useState(false)
  const [bet1Cashed, setBet1Cashed] = useState(false)

  const gameLoop = useRef<number | null>(null)
  const startTime = useRef<number>(0)
  const crashPoint = useRef<number>(1.0)

  // 1. LOGIN / SIGNUP LOGIC
  const handleAuth = () => {
    if (phone.length < 10 || password.length < 4) {
      alert("صحیح نمبر اور پاس ورڈ درج کریں")
      return
    }

    const savedUsers = JSON.parse(localStorage.getItem("f16_players") || "[]")
    
    if (authMode === "signup") {
      const exists = savedUsers.find((u: any) => u.phone === phone)
      if (exists) return alert("یہ نمبر پہلے سے رجسٹرڈ ہے")
      
      const newUser = { phone, password, balance: 10000 }
      savedUsers.push(newUser)
      localStorage.setItem("f16_players", JSON.stringify(savedUsers))
      localStorage.setItem("current_f16_user", JSON.stringify(newUser))
      alert("اکاؤنٹ بن گیا! اب لاگ ان کریں")
      setAuthMode("login")
    } else {
      const user = savedUsers.find((u: any) => u.phone === phone && u.password === password)
      if (user) {
        setIsLoggedIn(true)
        setUserBalance(user.balance)
        localStorage.setItem("current_f16_user", JSON.stringify(user))
      } else {
        alert("غلط نمبر یا پاس ورڈ")
      }
    }
  }

  // 2. GAME LOGIC
  const startFlight = () => {
    if (gameState !== "waiting") return
    
    setGameState("flying")
    setMultiplier(1.0)
    setBet1Cashed(false)
    crashPoint.current = Math.max(1.0, 0.99 / (1 - Math.random()))
    startTime.current = Date.now()

    const update = () => {
      const elapsed = (Date.now() - startTime.current) / 1000
      const nextVal = Math.exp(elapsed * 0.15) // اڑان کی رفتار

      if (nextVal >= crashPoint.current) {
        setMultiplier(crashPoint.current)
        setGameState("crashed")
        setHistory(prev => [crashPoint.current, ...prev].slice(0, 8))
        setTimeout(() => {
            setGameState("waiting")
            setBet1Placed(false)
        }, 3000)
        return
      }

      setMultiplier(nextVal)
      gameLoop.current = requestAnimationFrame(update)
    }
    gameLoop.current = requestAnimationFrame(update)
  }

  const placeBet = () => {
    if (userBalance < bet1) return alert("بیلنس کم ہے")
    setUserBalance(prev => prev - bet1)
    setBet1Placed(true)
    if (gameState === "waiting") startFlight()
  }

  const cashOut = () => {
    if (gameState !== "flying" || bet1Cashed) return
    const win = bet1 * multiplier
    setUserBalance(prev => prev + win)
    setBet1Cashed(true)
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-[#15191e] border border-gray-800 rounded-3xl p-8 shadow-2xl">
          <h1 className="text-3xl font-black text-red-500 text-center mb-2 italic">F-16 SKY HIGH</h1>
          <p className="text-gray-400 text-center text-sm mb-8">{authMode === 'login' ? 'خوش آمدید! لاگ ان کریں' : 'نیا اکاؤنٹ بنائیں'}</p>
          
          <input 
            type="number" placeholder="Mobile Number" 
            className="w-full bg-[#1b2026] border-none p-4 rounded-xl mb-4 text-white"
            onChange={(e) => setPhone(e.target.value)}
          />
          <input 
            type="password" placeholder="Password" 
            className="w-full bg-[#1b2026] border-none p-4 rounded-xl mb-6 text-white"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={handleAuth} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all">
            {authMode === "login" ? "LOGIN" : "SIGN UP"}
          </button>
          
          <p onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-center text-xs text-gray-500 mt-6 cursor-pointer underline">
            {authMode === 'login' ? 'اکاؤنٹ نہیں ہے؟ یہاں کلک کریں' : 'پہلے سے اکاؤنٹ ہے؟ لاگ ان کریں'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white flex flex-col max-w-md mx-auto border-x border-gray-900 shadow-2xl">
      {/* HEADER */}
      <header className="p-4 flex justify-between items-center bg-[#15191e]">
        <span className="text-red-500 font-black italic text-xl">F-16 SKY</span>
        <div className="bg-black/50 px-4 py-1 rounded-full border border-green-500/50">
          <span className="text-green-400 font-bold">Rs. {userBalance.toFixed(2)}</span>
        </div>
      </header>

      {/* HISTORY BAR */}
      <div className="flex gap-2 p-2 overflow-x-auto bg-black/30 no-scrollbar">
        {history.map((h, i) => (
          <span key={i} className={cn("px-3 py-1 rounded-full text-[10px] font-bold border", 
            h > 2 ? "text-purple-400 border-purple-900 bg-purple-950/30" : "text-blue-400 border-blue-900 bg-blue-950/30")}>
            {h.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* MINI GAME SCREEN (AVIATOR STYLE) */}
      <div className="relative aspect-video mx-4 mt-4 rounded-2xl bg-[#000] border border-gray-800 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
        
        {gameState === "flying" || gameState === "crashed" ? (
          <div className="relative w-full h-full">
            <div className={`absolute transition-all duration-100 ease-linear`}
                 style={{ bottom: `${10 + (multiplier * 4)}%`, left: `${10 + (multiplier * 6)}%` }}>
                <Image src="/f16-jet.png" alt="Jet" width={80} height={50} className={cn(gameState === "crashed" && "opacity-0")} />
                {gameState === "crashed" && <span className="text-4xl">💥</span>}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
               <h2 className={cn("text-6xl font-black transition-all", gameState === "crashed" ? "text-red-600 scale-110" : "text-white")}>
                 {multiplier.toFixed(2)}x
               </h2>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-500 animate-pulse">انتظار کریں، اگلی فلائٹ شروع ہو رہی ہے...</p>
          </div>
        )}
      </div>

      {/* BETTING PANEL */}
      <div className="mt-auto p-4 bg-[#15191e] rounded-t-3xl border-t border-gray-800">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between bg-black/40 p-2 rounded-2xl border border-gray-800">
             <button onClick={() => setBet1(Math.max(10, bet1 - 50))} className="w-10 h-10 rounded-full bg-gray-800 font-bold">-</button>
             <span className="text-2xl font-black">{bet1}</span>
             <button onClick={() => setBet1(bet1 + 50)} className="w-10 h-10 rounded-full bg-gray-800 font-bold">+</button>
          </div>

          {!bet1Placed ? (
            <button 
              onClick={placeBet}
              className="w-full py-5 bg-green-600 hover:bg-green-500 rounded-2xl font-black text-2xl shadow-[0_5px_0_#15803d] active:translate-y-1 active:shadow-none transition-all"
            >
              BET
            </button>
          ) : (
            <button 
              onClick={cashOut}
              disabled={bet1Cashed || gameState !== "flying"}
              className={cn("w-full py-5 rounded-2xl font-black text-2xl transition-all shadow-lg",
                bet1Cashed ? "bg-gray-700 text-gray-400" : "bg-yellow-500 text-black animate-bounce shadow-[0_5px_0_#a16207]")}
            >
              {bet1Cashed ? "WAITING..." : `CASHOUT ${(bet1 * multiplier).toFixed(0)}`}
            </button>
          )}
        </div>
      </div>

      {/* FOOTER NAV */}
      <footer className="flex justify-around p-4 text-[10px] text-gray-500 border-t border-gray-900 uppercase font-bold">
         <span className="text-red-500">Game</span>
         <span>History</span>
         <span onClick={() => setIsLoggedIn(false)}>Logout</span>
      </footer>
    </div>
  )
}
