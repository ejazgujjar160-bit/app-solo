
"use client"

import { useEffect, useRef, useState } from "react"

// Types
type GameState = "waiting" | "countdown" | "flying" | "crashed"
type UserData = { username: string; balance: number; level: number; xp: number }

export default function F16ProEdition() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState("")
  const [balance, setBalance] = useState(10000)
  const [level, setLevel] = useState(1)
  const [xp, setXp] = useState(0)
  const [gameState, setGameState] = useState<GameState>("waiting")
  const [multiplier, setMultiplier] = useState(1.0)
  const [countdown, setCountdown] = useState(3)
  
  // Bet States
  const [bet1, setBet1] = useState(100)
  const [bet1Placed, setBet1Placed] = useState(false)
  const [bet1Cashed, setBet1Cashed] = useState(false)
  
  const crashPoint = useRef(0)
  const gameLoop = useRef<number | null>(null)
  const startTime = useRef(0)

  // Login Function
  const handleLogin = () => {
    if (username.length > 2) setIsLoggedIn(true)
    else alert("Please enter a valid username")
  }

  // Start Game Logic
  const startRound = () => {
    setMultiplier(1.0)
    setGameState("countdown")
    setBet1Cashed(false)
    crashPoint.current = Math.max(1.0, 0.98 / (1 - Math.random()))

    let count = 3
    const timer = setInterval(() => {
      count -= 1
      setCountdown(count)
      if (count <= 0) {
        clearInterval(timer)
        setGameState("flying")
        startTime.current = Date.now()
        runGame()
      }
    }, 1000)
  }

  const runGame = () => {
    const update = () => {
      const elapsed = (Date.now() - startTime.current) / 1000
      const nextVal = Math.exp(elapsed * 0.15)

      if (nextVal >= crashPoint.current) {
        setMultiplier(crashPoint.current)
        setGameState("crashed")
        setBet1Placed(false)
        setTimeout(() => setGameState("waiting"), 3000)
        return
      }

      setMultiplier(nextVal)
      gameLoop.current = requestAnimationFrame(update)
    }
    gameLoop.current = requestAnimationFrame(update)
  }

  const cashOut = () => {
    if (gameState === "flying" && bet1Placed && !bet1Cashed) {
      const win = bet1 * multiplier
      setBalance(prev => prev + win)
      setBet1Cashed(true)
      setXp(prev => prev + 10)
    }
  }

  const placeBet = () => {
    if (balance >= bet1) {
      setBalance(prev => prev - bet1)
      setBet1Placed(true)
      startRound()
    }
  }

  if (!isLoggedIn) {
    return (
      <div style={{ background: '#060b13', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#0d121b', padding: '40px', borderRadius: '20px', border: '1px solid #22c55e', textAlign: 'center' }}>
          <h1 style={{ color: '#22c55e' }}>F16 PRO EDITION</h1>
          <input 
            placeholder="Username" 
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: 'none', width: '100%', marginBottom: '10px' }}
          />
          <button onClick={handleLogin} style={{ background: '#22c55e', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>LOGIN</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#060b13', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '15px', background: '#0d121b', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #22c55e44' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#888' }}>PLAYER</div>
          <div style={{ fontWeight: 'bold', color: '#22c55e' }}>{username} | Lvl {level}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#888' }}>BALANCE</div>
          <div style={{ fontWeight: 'bold', color: '#ffd700' }}>Rs. {balance.toLocaleString()}</div>
        </div>
      </header>

      {/* Main Game Screen */}
      <main style={{ flex: 1, position: 'relative', margin: '15px', background: 'black', borderRadius: '20px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #333' }}>
        <div style={{ fontSize: '4rem', fontWeight: '900', zIndex: 10, color: gameState === 'crashed' ? '#ef4444' : 'white' }}>
          {multiplier.toFixed(2)}x
        </div>

        {gameState === 'countdown' && (
          <div style={{ position: 'absolute', fontSize: '6rem', color: '#eab308', fontWeight: 'bold' }}>{countdown}</div>
        )}

        {(gameState === 'flying' || gameState === 'crashed') && (
          <div style={{ 
            position: 'absolute', 
            bottom: `${15 + multiplier * 4}%`, 
            left: `${15 + multiplier * 3}%`,
            transition: 'all 0.1s linear'
          }}>
            {/* F16 Image Placeholder with Online URL */}
            <img 
              src="https://img.icons8.com/color/160/fighter-jet.png" 
              alt="F16" 
              style={{ width: '100px', transform: 'rotate(-45deg)', filter: 'drop-shadow(0 0 10px #22c55e)' }} 
            />
          </div>
        )}

        {gameState === 'crashed' && (
          <div style={{ position: 'absolute', bottom: '20%', color: '#ef4444', fontSize: '2rem', fontWeight: 'bold' }}>CRASHED! 💥</div>
        )}
      </main>

      {/* Controls */}
      <footer style={{ padding: '20px', background: '#0d121b' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1, background: '#000', padding: '15px', borderRadius: '15px', border: '1px solid #333' }}>
            <input 
              type="number" 
              value={bet1} 
              onChange={(e) => setBet1(Number(e.target.value))}
              style={{ width: '100%', background: 'transparent', color: 'white', border: '1px solid #444', padding: '10px', borderRadius: '8px', marginBottom: '10px', textAlign: 'center' }}
            />
            {gameState === "flying" && bet1Placed ? (
              <button onClick={cashOut} disabled={bet1Cashed} style={{ width: '100%', padding: '15px', borderRadius: '10px', fontWeight: 'bold', background: bet1Cashed ? '#444' : '#eab308', border: 'none' }}>
                {bet1Cashed ? "CASHED" : "CASH OUT"}
              </button>
            ) : (
              <button onClick={placeBet} disabled={gameState !== "waiting"} style={{ width: '100%', padding: '15px', borderRadius: '10px', fontWeight: 'bold', background: '#22c55e', color: 'white', border: 'none' }}>
                BET
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
