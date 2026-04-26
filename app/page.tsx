"use client"
import React, { useEffect, useRef, useState } from "react"

export default function AviatorPro() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState({ name: "", balance: 10000 })
  const [gameState, setGameState] = useState("waiting")
  const [multiplier, setMultiplier] = useState(1.0)
  const [history, setHistory] = useState<number[]>([])
  const [betAmount, setBetAmount] = useState(10)
  const [activeBet, setActiveBet] = useState<{amount: number, placed: boolean}>({amount: 0, placed: false})
  
  const crashPoint = useRef(0)
  const startTime = useRef(0)
  const gameLoop = useRef<number | null>(null)

  useEffect(() => {
    const savedUser = localStorage.getItem("aviator_user")
    if (savedUser) { setUser(JSON.parse(savedUser)); setIsLoggedIn(true); }
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
    crashPoint.current = Math.max(1.01, 0.99 / (1 - Math.random()))
    startTime.current = Date.now()
    
    const update = () => {
      const elapsed = (Date.now() - startTime.current) / 1000
      const nextVal = Math.pow(1.15, elapsed)
      
      if (nextVal >= crashPoint.current) {
        setMultiplier(crashPoint.current)
        setGameState("crashed")
        setHistory(prev => [crashPoint.current, ...prev].slice(0, 10))
        setActiveBet({amount: 0, placed: false})
        return
      }
      setMultiplier(nextVal)
      gameLoop.current = requestAnimationFrame(update)
    }
    gameLoop.current = requestAnimationFrame(update)
  }

  const handleCashOut = () => {
    if (gameState === "flying" && activeBet.placed) {
      const winAmount = activeBet.amount * multiplier
      setUser(prev => ({ ...prev, balance: prev.balance + winAmount }))
      setActiveBet({amount: 0, placed: false})
      alert(`Cashed Out: ${winAmount.toFixed(2)} PKR`)
    }
  }

  if (!isLoggedIn) return (
    <div style={{background:'#000', height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', color:'white'}}>
      <div style={{background:'#1b1d21', padding:'30px', borderRadius:'15px', textAlign:'center', width:'85%'}}>
        <h2 style={{color:'#e11d48'}}>AVIATOR LOGIN</h2>
        <input placeholder="Enter Name" style={{padding:'12px', width:'100%', margin:'10px 0', borderRadius:'5px', color:'#000'}} 
          onChange={(e) => setUser({ ...user, name: e.target.value })} />
        <button onClick={() => user.name && setIsLoggedIn(true)} style={{background:'#28a745', color:'white', padding:'12px', width:'100%', border:'none', borderRadius:'5px', fontWeight:'bold'}}>JOIN</button>
      </div>
    </div>
  )

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#1b1d21' }}>
        <span style={{ color: '#e11d48', fontWeight: 'bold' }}>Aviator Pro</span>
        <span style={{ color: '#28a745', fontWeight: 'bold' }}>{user.balance.toFixed(2)} PKR</span>
      </header>

      <div style={{ display: 'flex', gap: '5px', padding: '5px', overflowX: 'auto', background: '#141518' }}>
        {history.map((val, i) => (
          <span key={i} style={{ background: '#2c2d30', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', color: val > 2 ? '#913ef8' : '#34b4ff' }}>{val.toFixed(2)}x</span>
        ))}
      </div>

      <main style={{ flex: 1, position: 'relative', margin: '10px', background: '#141518', borderRadius: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #333' }}>
        <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: gameState === 'crashed' ? '#e11d48' : 'white', zIndex: 10 }}>
          {multiplier.toFixed(2)}x
        </div>
        {gameState === 'flying' && (
          <img src="/public/jet.png" width="80" style={{ position: 'absolute', bottom: `${20 + (multiplier-1)*10}%`, left: `${10 + (multiplier-1)*8}%` }} />
        )}
      </main>

      <footer style={{ padding: '15px', background: '#1b1d21', display: 'flex', gap: '10px' }}>
        <div style={{ flex: 1, background: '#2c2d30', padding: '10px', borderRadius: '10px' }}>
          <div style={{ marginBottom: '10px' }}>Bet: {betAmount}</div>
          {activeBet.placed ? (
            <button onClick={handleCashOut} style={{ background: '#ffc107', color: '#000', width: '100%', padding: '15px', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
              CASH OUT ({(activeBet.amount * multiplier).toFixed(2)})
            </button>
          ) : (
            <button onClick={() => { setUser(p => ({...p, balance: p.balance - betAmount})); setActiveBet({amount: betAmount, placed: true}); }} 
              disabled={gameState !== 'waiting'} style={{ background: '#28a745', color: 'white', width: '100%', padding: '15px', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
              BET
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
