"use client"
import { useEffect, useRef, useState } from "react"

export default function AviatorStyle() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState({ name: "", balance: 10000 })
  const [gameState, setGameState] = useState("waiting")
  const [multiplier, setMultiplier] = useState(1.0)
  const [history, setHistory] = useState<number[]>([])
  const [bet1, setBet1] = useState(10)
  const [isBet1Placed, setIsBet1Placed] = useState(false)
  
  const crashPoint = useRef(0)
  const startTime = useRef(0)
  const gameLoop = useRef<number | null>(null)

  // ڈیٹا محفوظ رکھنے کے لیے (Local Storage)
  useEffect(() => {
    const savedUser = localStorage.getItem("aviator_user")
    const savedHistory = localStorage.getItem("aviator_history")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
      setIsLoggedIn(true)
    }
    if (savedHistory) setHistory(JSON.parse(savedHistory))
  }, [])

  useEffect(() => {
    if (isLoggedIn) localStorage.setItem("aviator_user", JSON.stringify(user))
  }, [user, isLoggedIn])

  useEffect(() => {
    if (gameState === "waiting") {
      const timer = setTimeout(() => startFlying(), 5000)
      return () => clearTimeout(timer)
    }
  }, [gameState])

  const startFlying = () => {
    setMultiplier(1.0)
    setGameState("flying")
    crashPoint.current = Math.max(1.0, 0.99 / (1 - Math.random()))
    startTime.current = Date.now()
    
    const update = () => {
      const elapsed = (Date.now() - startTime.current) / 1000
      const nextVal = Math.pow(1.15, elapsed)
      if (nextVal >= crashPoint.current) {
        setMultiplier(crashPoint.current)
        setGameState("crashed")
        const newHistory = [crashPoint.current, ...history].slice(0, 10)
        setHistory(newHistory)
        localStorage.setItem("aviator_history", JSON.stringify(newHistory))
        setIsBet1Placed(false)
        setTimeout(() => setGameState("waiting"), 3000)
        return
      }
      setMultiplier(nextVal)
      gameLoop.current = requestAnimationFrame(update)
    }
    gameLoop.current = requestAnimationFrame(update)
  }

  if (!isLoggedIn) {
    return (
      <div style={{ background: '#000', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
        <div style={{ background: '#1b1d21', padding: '30px', borderRadius: '15px', textAlign: 'center', width: '80%' }}>
          <img src="/public/logo.png" width="60" />
          <h2 style={{ color: '#e11d48' }}>AVIATOR LOGIN</h2>
          <input placeholder="Name" style={{ padding: '12px', width: '100%', margin: '10px 0', borderRadius: '5px', border: 'none' }} 
            onChange={(e) => setUser({ ...user, name: e.target.value })} />
          <button onClick={() => user.name && setIsLoggedIn(true)} 
            style={{ background: '#28a745', color: 'white', padding: '12px', width: '100%', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>JOIN GAME</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#1b1d21', alignItems: 'center' }}>
        <span style={{ color: '#e11d48', fontWeight: 'bold' }}>Aviator</span>
        <div style={{ background: '#000', padding: '5px 15px', borderRadius: '20px', color: '#28a745', fontWeight: 'bold' }}>
          {user.balance.toFixed(2)} PKR
        </div>
      </header>

      {/* Crash History */}
      <div style={{ display: 'flex', gap: '5px', padding: '5px', overflowX: 'auto', background: '#141518' }}>
        {history.map((val, i) => (
          <span key={i} style={{ background: '#2c2d30', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', color: val > 2 ? '#913ef8' : '#34b4ff' }}>
            {val.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* Main Game Screen */}
      <main style={{ flex: 1, position: 'relative', margin: '10px', background: '#141518', borderRadius: '15px', overflow: 'hidden', border: '1px solid #333' }}>
        <div style={{ position: 'absolute', top: '20%', width: '100%', textAlign: 'center', fontSize: '3rem', fontWeight: 'bold', color: gameState === 'crashed' ? '#e11d48' : 'white', zIndex: 10 }}>
          {multiplier.toFixed(2)}x
          {gameState === 'crashed' && <div style={{ fontSize: '1.2rem' }}>FLEW AWAY!</div>}
        </div>

        {/* Jet Animation */}
        {gameState === 'flying' && (
          <div style={{
            position: 'absolute',
            bottom: `${20 + (multiplier - 1) * 15}%`,
            left: `${10 + (multiplier - 1) * 10}%`,
            transition: 'all 0.1s linear'
          }}>
            <img src="/public/jet.png" width="100" style={{ filter: 'drop-shadow(0 0 10px red)' }} />
          </div>
        )}
      </main>

      {/* Betting Controls */}
      <footer style={{ padding: '10px', background: '#1b1d21', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {[1, 2].map(i => (
          <div key={i} style={{ background: '#2c2d30', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
              <button style={{ color: 'white' }}>-</button>
              <span>{bet1}</span>
              <button style={{ color: 'white' }}>+</button>
            </div>
            <button 
              disabled={isBet1Placed}
              onClick={() => { setUser({...user, balance: user.balance - bet1}); setIsBet1Placed(true); }}
              style={{ background: isBet1Placed ? '#6c757d' : '#28a745', color: 'white', width: '100%', padding: '10px', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>
              {isBet1Placed ? "WAITING" : "BET"}
            </button>
          </div>
        ))}
      </footer>
    </div>
  )
}
