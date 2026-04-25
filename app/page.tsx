"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

// 1. CN helper function defined inside to avoid "@lib/utils" error
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

type GameState = "waiting" | "countdown" | "flying" | "crashed"

type UserData = {
  username: string
  password: string
  balance: number
  level: number
  xp: number
}

export default function F16ProEdition() {
  // ---------------- AUTH ----------------
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [user, setUser] = useState<UserData | null>(null)

  // ---------------- GAME ----------------
  const [gameState, setGameState] = useState<GameState>("waiting")
  const [multiplier, setMultiplier] = useState(1.0)
  const [balance, setBalance] = useState(10000)

  // BETS
  const [bet1, setBet1] = useState(100)
  const [bet1Placed, setBet1Placed] = useState(false)
  const [bet1Cashed, setBet1Cashed] = useState(false)
  
  const [bet2, setBet2] = useState(100)
  const [bet2Placed, setBet2Placed] = useState(false)
  const [bet2Cashed, setBet2Cashed] = useState(false)

  // History & Progress
  const [history, setHistory] = useState<number[]>([1.5, 2.8, 1.1, 10.4, 4.2])
  const [countdown, setCountdown] = useState(3)
  const [level, setLevel] = useState(1)
  const [xp, setXp] = useState(0)

  // Gift & Visuals
  const [isGiftAvailable, setIsGiftAvailable] = useState(true)
  const [giftTimer, setGiftTimer] = useState(0)
  const [showExplosion, setShowExplosion] = useState(false)
  const [shake, setShake] = useState(false)
  const [flashRed, setFlashRed] = useState(false)

  // Refs
  const gameLoop = useRef<number | null>(null)
  const startTime = useRef<number>(0)
  const crashPoint = useRef<number>(0)
  const countdownTimer = useRef<NodeJS.Timeout | null>(null)
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([])
  const trailId = useRef(0)

  // ---------------- AUTH LOGIC ----------------
  useEffect(() => {
    const logged = localStorage.getItem("f16_logged_user")
    if (logged) {
      const parsed = JSON.parse(logged) as UserData
      setUser(parsed)
      setBalance(parsed.balance)
      setLevel(parsed.level)
      setXp(parsed.xp)
      setIsLoggedIn(true)
    }
  }, [])

  const signup = () => {
    if (!username || !password) return alert("Username اور Password لازمی ہیں")
    const users = JSON.parse(localStorage.getItem("f16_users") || "[]")
    if (users.find((u: any) => u.username === username)) return alert("Username موجود ہے")
    
    const newUser = { username, password, balance: 10000, level: 1, xp: 0 }
    users.push(newUser)
    localStorage.setItem("f16_users", JSON.stringify(users))
    localStorage.setItem("f16_logged_user", JSON.stringify(newUser))
    setUser(newUser); setBalance(10000); setIsLoggedIn(true)
  }

  const login = () => {
    const users = JSON.parse(localStorage.getItem("f16_users") || "[]")
    const found = users.find((u: any) => u.username === username && u.password === password)
    if (!found) return alert("Wrong credentials")
    localStorage.setItem("f16_logged_user", JSON.stringify(found))
    setUser(found); setBalance(found.balance); setIsLoggedIn(true)
  }

  // ---------------- GAME LOGIC ----------------
  const startRound = () => {
    if (gameState !== "waiting") return
    crashPoint.current = Math.max(1.0, 0.98 / (1 - Math.random()))
    setGameState("countdown")
    setCountdown(3)

    let count = 3
    countdownTimer.current = setInterval(() => {
      count -= 1
      setCountdown(count)
      if (count <= 0) {
        clearInterval(countdownTimer.current!)
        setGameState("flying")
        startTime.current = Date.now()
        
        const update = () => {
          const elapsed = (Date.now() - startTime.current) / 1000
          const nextVal = Math.exp(elapsed * 0.15)

          if (nextVal >= crashPoint.current) {
            setMultiplier(crashPoint.current)
            setGameState("crashed")
            setShowExplosion(true); setShake(true); setFlashRed(true)
            setHistory(prev => [crashPoint.current, ...prev].slice(0, 10))
            setTimeout(() => { setShowExplosion(false); setShake(false); setFlashRed(false); setGameState("waiting"); setBet1Placed(false); setBet2Placed(false); setBet1Cashed(false); setBet2Cashed(false); }, 3000)
            cancelAnimationFrame(gameLoop.current!)
            return
          }
          setMultiplier(nextVal)
          gameLoop.current = requestAnimationFrame(update)
        }
        gameLoop.current = requestAnimationFrame(update)
      }
    }, 1000)
  }

  const handleBet = (num: number) => {
    const amount = num === 1 ? bet1 : bet2
    if (balance < amount) return alert("بیلنس کم ہے")
    setBalance(prev => prev - amount)
    num === 1 ? setBet1Placed(true) : setBet2Placed(true)
    if (gameState === "waiting") startRound()
  }

  const handleCashout = (num: number) => {
    if (gameState !== "flying") return
    const amount = num === 1 ? bet1 : bet2
    setBalance(prev => prev + (amount * multiplier))
    num === 1 ? setBet1Cashed(true) : setBet2Cashed(true)
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060b13] text-white p-4">
        <div className="bg-black border border-gray-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
          <h1 className="text-2xl font-black text-green-500 mb-6 text-center">F16 JET PRO</h1>
          <input className="w-full mb-3 p-3 bg-gray-900 border border-gray-700 rounded-xl" placeholder="Username" onChange={e => setUsername(e.target.value)} />
          <input className="w-full mb-4 p-3 bg-gray-900 border border-gray-700 rounded-xl" type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
          <button className="w-full bg-green-600 py-3 rounded-xl font-bold mb-3" onClick={authMode === 'login' ? login : signup}>{authMode === 'login' ? 'LOGIN' : 'SIGNUP'}</button>
          <button className="w-full text-sm text-gray-400 underline" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
            {authMode === 'login' ? 'Create Account' : 'Back to Login'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen bg-[#060b13] text-white flex flex-col overflow-hidden", shake && "animate-bounce")}>
      <header className="p-4 bg-[#0d121b] flex justify-between items-center border-b border-green-500/30">
        <div>
          <p className="text-xs text-gray-400">Welcome</p>
          <p className="font-bold text-green-400">{user?.username}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">WALLET</p>
          <p className="text-xl font-black text-yellow-500">Rs. {balance.toFixed(2)}</p>
        </div>
      </header>

      <div className="flex gap-2 p-2 bg-black overflow-x-auto">
        {history.map((h, i) => (
          <span key={i} className="px-3 py-1 rounded-full text-xs font-bold bg-gray-800 border border-gray-600">{h.toFixed(2)}x</span>
        ))}
      </div>

      <main className={cn("flex-1 relative flex items-center justify-center transition-colors duration-300", flashRed ? "bg-red-900/40" : "bg-black")}>
        <div className="text-6xl font-black z-20">{multiplier.toFixed(2)}x</div>
        
        {gameState === "countdown" && <div className="absolute text-8xl font-black text-yellow-400 animate-ping">{countdown}</div>}
        
        {gameState === "flying" && (
          <div className="absolute transition-all" style={{ bottom: `${15 + (multiplier * 3)}%`, left: `${10 + (multiplier * 5)}%` }}>
             <p className="text-4xl">✈️</p>
          </div>
        )}

        {showExplosion && <div className="absolute text-8xl animate-pulse">💥</div>}
        {gameState === "crashed" && <div className="absolute top-20 text-3xl font-black text-red-500">FLEW AWAY!</div>}
      </main>

      <footer className="p-4 bg-[#0d121b] grid grid-cols-2 gap-4">
        {[1, 2].map(num => {
          const placed = num === 1 ? bet1Placed : bet2Placed
          const cashed = num === 1 ? bet1Cashed : bet2Cashed
          return (
            <div key={num} className="bg-gray-900 p-3 rounded-2xl border border-gray-700">
              <input type="number" className="w-full bg-black mb-2 p-2 rounded text-center font-bold" value={num === 1 ? bet1 : bet2} onChange={e => num === 1 ? setBet1(Number(e.target.value)) : setBet2(Number(e.target.value))} disabled={placed} />
              {gameState === "flying" && placed && !cashed ? (
                <button className="w-full bg-yellow-500 text-black py-3 rounded-xl font-black" onClick={() => handleCashout(num)}>CASH OUT</button>
              ) : (
                <button className={cn("w-full py-3 rounded-xl font-black", placed ? "bg-gray-700" : "bg-green-600")} onClick={() => handleBet(num)} disabled={placed}>{placed ? "WAITING..." : "BET"}</button>
              )}
            </div>
          )
        })}
      </footer>
    </div>
  )
}
