"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

type GameState = "waiting" | "countdown" | "flying" | "crashed"

export default function F16ProEdition() {
  const [gameState, setGameState] = useState<GameState>("waiting")
  const [multiplier, setMultiplier] = useState(1.0)

  const [balance, setBalance] = useState(10000)

  // BET 1
  const [bet1, setBet1] = useState(100)
  const [bet1Placed, setBet1Placed] = useState(false)
  const [bet1Cashed, setBet1Cashed] = useState(false)

  const [autoCashout1, setAutoCashout1] = useState(false)
  const [autoCashoutAt1, setAutoCashoutAt1] = useState(2.0)

  const [autoBet1, setAutoBet1] = useState(false)

  // BET 2
  const [bet2, setBet2] = useState(100)
  const [bet2Placed, setBet2Placed] = useState(false)
  const [bet2Cashed, setBet2Cashed] = useState(false)

  const [autoCashout2, setAutoCashout2] = useState(false)
  const [autoCashoutAt2, setAutoCashoutAt2] = useState(3.0)

  const [autoBet2, setAutoBet2] = useState(false)

  // Round + History
  const [history, setHistory] = useState<number[]>([1.5, 2.8, 1.1, 10.4, 4.2])
  const [countdown, setCountdown] = useState(3)

  // VIP/Level
  const [level, setLevel] = useState(1)
  const [xp, setXp] = useState(0)

  // Gift
  const [isGiftAvailable, setIsGiftAvailable] = useState(true)
  const [giftTimer, setGiftTimer] = useState(0)

  // Effects
  const [showExplosion, setShowExplosion] = useState(false)
  const [shake, setShake] = useState(false)
  const [flashRed, setFlashRed] = useState(false)

  // Players fake list
  const [players, setPlayers] = useState<
    { name: string; bet: number; cashout: number | null }[]
  >([])

  // Refs
  const engineAudio = useRef<HTMLAudioElement | null>(null)
  const crashAudio = useRef<HTMLAudioElement | null>(null)

  const gameLoop = useRef<number | null>(null)
  const startTime = useRef<number>(0)
  const crashPoint = useRef<number>(0)

  // Smoke trail
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([])
  const trailId = useRef(0)

  // --- Load Audio (F16 engine same + crash extra) ---
  useEffect(() => {
    // یہ آپ کی F16 engine sound ہے (NO CHANGE)
    engineAudio.current = new Audio("/audio/f16-engine.mp3")
    engineAudio.current.loop = true
    engineAudio.current.volume = 0.6

    // crash sound optional (اگر فائل نہ ہو تو remove کر دیں)
    crashAudio.current = new Audio("/audio/explosion.mp3")
    crashAudio.current.volume = 0.8

    return () => {
      if (gameLoop.current) cancelAnimationFrame(gameLoop.current)
      engineAudio.current?.pause()
      crashAudio.current?.pause()
    }
  }, [])

  // --- Gift Timer ---
  useEffect(() => {
    if (giftTimer <= 0) return
    const interval = setInterval(() => {
      setGiftTimer((prev) => {
        if (prev <= 1) {
          setIsGiftAvailable(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [giftTimer])

  // --- Fake Players Live ---
  useEffect(() => {
    const names = [
      "Ali", "Ahmed", "Umar", "Hassan", "Bilal",
      "Sami", "Asad", "Hamza", "Faizan", "Daniyal",
      "Zain", "Usman", "Shahzaib", "Arslan", "Awais"
    ]

    const interval = setInterval(() => {
      if (gameState === "flying") {
        setPlayers(() => {
          return Array.from({ length: 12 }).map(() => ({
            name: names[Math.floor(Math.random() * names.length)],
            bet: Math.floor(Math.random() * 500 + 50),
            cashout: Math.random() > 0.5 ? Number((Math.random() * 5 + 1).toFixed(2)) : null,
          }))
        })
      } else {
        setPlayers([])
      }
    }, 1200)

    return () => clearInterval(interval)
  }, [gameState])

  // --- XP System ---
  const addXp = (amount: number) => {
    setXp((prev) => {
      const total = prev + amount
      if (total >= 100) {
        setLevel((l) => l + 1)
        return total - 100
      }
      return total
    })
  }

  // --- Crash Formula (Aviator Like) ---
  const generateCrashPoint = () => {
    const r = Math.random()
    return Math.max(1.0, 0.98 / (1 - r))
  }

  // --- Effects ---
  const triggerExplosion = () => {
    setShowExplosion(true)
    setTimeout(() => setShowExplosion(false), 1200)
  }

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const triggerRedFlash = () => {
    setFlashRed(true)
    setTimeout(() => setFlashRed(false), 500)
  }

  // --- Round Start ---
  const startRound = () => {
    if (gameLoop.current) cancelAnimationFrame(gameLoop.current)

    crashPoint.current = generateCrashPoint()

    setMultiplier(1.0)
    setTrail([])
    setBet1Cashed(false)
    setBet2Cashed(false)

    setGameState("countdown")
    setCountdown(3)

    let count = 3
    const timer = setInterval(() => {
      count -= 1
      setCountdown(count)

      if (count <= 0) {
        clearInterval(timer)

        setGameState("flying")
        startTime.current = Date.now()

        // F16 Engine Sound (No Change)
        if (engineAudio.current) {
          engineAudio.current.currentTime = 0
          engineAudio.current.play()
        }

        const update = () => {
          const elapsed = (Date.now() - startTime.current) / 1000
          const nextVal = Math.exp(elapsed * 0.18)

          // smoke trail
          setTrail((prev) => {
            const newTrail = [
              ...prev,
              { x: nextVal * 4, y: nextVal * 5, id: trailId.current++ },
            ]
            return newTrail.slice(-25)
          })

          // Auto Cashout Bet 1
          if (bet1Placed && !bet1Cashed && autoCashout1 && nextVal >= autoCashoutAt1) {
            cashOut1(nextVal)
          }

          // Auto Cashout Bet 2
          if (bet2Placed && !bet2Cashed && autoCashout2 && nextVal >= autoCashoutAt2) {
            cashOut2(nextVal)
          }

          // CRASH
          if (nextVal >= crashPoint.current) {
            setMultiplier(crashPoint.current)
            setGameState("crashed")

            setHistory((prev) => [crashPoint.current, ...prev].slice(0, 12))

            engineAudio.current?.pause()
            crashAudio.current?.play()

            triggerExplosion()
            triggerShake()
            triggerRedFlash()

            if (navigator.vibrate) navigator.vibrate(250)

            addXp(10)

            if (gameLoop.current) cancelAnimationFrame(gameLoop.current)
            gameLoop.current = null

            // Reset after crash
            setTimeout(() => {
              setGameState("waiting")
              setBet1Placed(false)
              setBet2Placed(false)
              setTrail([])

              // AutoBet System
              if (autoBet1) placeBet1()
              if (autoBet2) placeBet2()

            }, 2000)

            return
          }

          setMultiplier(nextVal)

          if (engineAudio.current) {
            engineAudio.current.playbackRate = Math.min(2.0, 1 + nextVal / 12)
          }

          gameLoop.current = requestAnimationFrame(update)
        }

        gameLoop.current = requestAnimationFrame(update)
      }
    }, 1000)
  }

  // --- Place Bet 1 ---
  const placeBet1 = () => {
    if (gameState !== "waiting") return
    if (bet1 <= 0) return
    if (balance < bet1) return

    setBalance((prev) => prev - bet1)
    setBet1Placed(true)

    if (!bet2Placed) startRound()
  }

  // --- Place Bet 2 ---
  const placeBet2 = () => {
    if (gameState !== "waiting") return
    if (bet2 <= 0) return
    if (balance < bet2) return

    setBalance((prev) => prev - bet2)
    setBet2Placed(true)

    if (!bet1Placed) startRound()
  }

  // --- CashOut 1 ---
  const cashOut1 = (manualMultiplier?: number) => {
    if (gameState !== "flying") return
    if (!bet1Placed || bet1Cashed) return

    const used = manualMultiplier || multiplier
    const win = bet1 * used

    setBalance((prev) => prev + win)
    setBet1Cashed(true)
    addXp(20)
  }

  // --- CashOut 2 ---
  const cashOut2 = (manualMultiplier?: number) => {
    if (gameState !== "flying") return
    if (!bet2Placed || bet2Cashed) return

    const used = manualMultiplier || multiplier
    const win = bet2 * used

    setBalance((prev) => prev + win)
    setBet2Cashed(true)
    addXp(20)
  }

  // --- Gift Claim ---
  const claimGift = () => {
    if (!isGiftAvailable) return
    setBalance((prev) => prev + 500)
    setIsGiftAvailable(false)
    setGiftTimer(60) // demo 60 seconds
  }

  // --- History Colors ---
  const historyColor = (val: number) => {
    if (val >= 10) return "bg-red-600/20 text-red-400 border-red-500/50"
    if (val >= 5) return "bg-purple-600/20 text-purple-400 border-purple-500/50"
    if (val >= 2) return "bg-green-600/20 text-green-400 border-green-500/50"
    return "bg-blue-600/20 text-blue-400 border-blue-500/50"
  }

  return (
    <div
      className={cn(
        "min-h-screen bg-[#060b13] text-white flex flex-col font-sans",
        shake && "animate-[shake_0.3s_linear_infinite]"
      )}
    >
      {/* Shake CSS */}
      <style jsx>{`
        @keyframes shake {
          0% { transform: translate(2px, 1px); }
          25% { transform: translate(-2px, -1px); }
          50% { transform: translate(2px, -1px); }
          75% { transform: translate(-2px, 1px); }
          100% { transform: translate(2px, 1px); }
        }
      `}</style>

      {/* TOP BAR */}
      <header className="p-4 bg-[#0d121b] flex justify-between items-center border-b border-green-500/30">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">YOUR LEVEL</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-green-500">Lvl {level}</span>
            <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: `${xp}%` }} />
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-xs text-gray-400">BALANCE</div>
          <div className="text-xl font-black text-[#ffd700]">
            Rs. {balance.toLocaleString()}
          </div>
        </div>

        {/* Gift */}
        <button
          onClick={claimGift}
          disabled={!isGiftAvailable}
          className={cn(
            "px-3 py-2 rounded-lg transition-all font-bold",
            isGiftAvailable
              ? "bg-yellow-500 animate-bounce text-black"
              : "bg-gray-600 opacity-60 text-white"
          )}
        >
          🎁 {giftTimer > 0 ? `${giftTimer}s` : ""}
        </button>
      </header>

      {/* HISTORY */}
      <div className="flex gap-2 p-2 bg-[#0a0f18] overflow-x-auto">
        {history.map((h, i) => (
          <span
            key={i}
            className={cn("px-3 py-1 rounded text-xs font-bold border", historyColor(h))}
          >
            {h.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* MAIN AREA */}
      <main
        className={cn(
          "relative flex-1 m-2 rounded-2xl border border-gray-800 bg-black overflow-hidden flex items-center justify-center",
          flashRed && "bg-red-950"
        )}
      >
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-green-500/10 via-transparent to-purple-500/10" />

        {/* Multiplier */}
        <div
          className={cn(
            "text-7xl font-black z-20 transition-colors",
            gameState === "crashed" ? "text-red-600" : "text-white"
          )}
        >
          {multiplier.toFixed(2)}x
        </div>

        {/* Countdown */}
        {gameState === "countdown" && (
          <div className="absolute z-30 text-8xl font-black text-yellow-400 animate-pulse">
            {countdown}
          </div>
        )}

        {/* Smoke Trail */}
        {trail.map((t) => (
          <div
            key={t.id}
            className="absolute w-3 h-3 rounded-full bg-green-400/30 blur-md"
            style={{
              bottom: `${10 + t.y}%`,
              left: `${10 + t.x}%`,
            }}
          />
        ))}

        {/* Jet (F16 NO CHANGE) */}
        {(gameState === "flying" || gameState === "crashed") && (
          <div
            className="absolute transition-all duration-75 z-10"
            style={{
              bottom: `${10 + multiplier * 5}%`,
              left: `${10 + multiplier * 4}%`,
            }}
          >
            <Image
              src="/f16-jet.png"
              alt="F-16"
              width={180}
              height={100}
              className={cn(
                "drop-shadow-[0_0_20px_rgba(0,255,0,0.4)]",
                gameState === "crashed" && "opacity-40"
              )}
            />
          </div>
        )}

        {/* Explosion */}
        {showExplosion && (
          <div className="absolute z-40 text-7xl animate-ping">💥</div>
        )}

        {/* Players Live */}
        {gameState === "flying" && (
          <div className="absolute left-2 top-2 bg-black/60 border border-gray-700 rounded-xl p-2 w-48 text-xs z-40">
            <div className="font-bold text-green-400 mb-1">LIVE PLAYERS</div>
            {players.map((p, i) => (
              <div key={i} className="flex justify-between text-gray-200">
                <span>{p.name}</span>
                <span className="text-yellow-400">{p.bet}</span>
              </div>
            ))}
          </div>
        )}

        {/* Crash Text */}
        {gameState === "crashed" && (
          <div className="absolute bottom-10 z-30 text-3xl font-black text-red-500 animate-pulse">
            CRASHED!
          </div>
        )}
      </main>

      {/* CONTROL PANEL */}
      <footer className="p-4 bg-[#0d121b] rounded-t-3xl border-t border-gray-800">
        <div className="grid grid-cols-2 gap-3">

          {/* BET 1 PANEL */}
          <div className="bg-black rounded-2xl border border-gray-700 p-3">
            <div className="text-xs text-gray-400 mb-2 font-bold">BET 1</div>

            <input
              type="number"
              value={bet1}
              disabled={bet1Placed}
              onChange={(e) => setBet1(Number(e.target.value))}
              className="w-full bg-transparent border border-gray-700 rounded-xl text-center text-xl font-black py-2 mb-2 disabled:opacity-50"
            />

            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-gray-400">AUTO CASHOUT</span>
              <input
                type="checkbox"
                checked={autoCashout1}
                onChange={(e) => setAutoCashout1(e.target.checked)}
              />
            </div>

            <input
              type="number"
              value={autoCashoutAt1}
              onChange={(e) => setAutoCashoutAt1(Number(e.target.value))}
              className="w-full bg-transparent border border-gray-700 rounded-xl text-center text-sm py-2 mb-2"
            />

            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-gray-400">AUTO BET</span>
              <input
                type="checkbox"
                checked={autoBet1}
                onChange={(e) => setAutoBet1(e.target.checked)}
              />
            </div>

            {gameState === "flying" && bet1Placed ? (
              <button
                onClick={() => cashOut1()}
                disabled={bet1Cashed}
                className={cn(
                  "w-full py-3 rounded-xl font-black text-lg",
                  bet1Cashed
                    ? "bg-gray-600 opacity-60"
                    : "bg-yellow-500 text-black animate-pulse"
                )}
              >
                {bet1Cashed ? "CASHED" : "CASH OUT"}
              </button>
            ) : (
              <button
                onClick={placeBet1}
                disabled={bet1Placed || gameState !== "waiting"}
                className={cn(
                  "w-full py-3 rounded-xl font-black text-lg",
                  bet1Placed || gameState !== "waiting"
                    ? "bg-gray-600 opacity-60"
                    : "bg-green-600 text-white"
                )}
              >
                BET
              </button>
            )}
          </div>

          {/* BET 2 PANEL */}
          <div className="bg-black rounded-2xl border border-gray-700 p-3">
            <div className="text-xs text-gray-400 mb-2 font-bold">BET 2</div>

            <input
              type="number"
              value={bet2}
              disabled={bet2Placed}
              onChange={(e) => setBet2(Number(e.target.value))}
              className="w-full bg-transparent border border-gray-700 rounded-xl text-center text-xl font-black py-2 mb-2 disabled:opacity-50"
            />

            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-gray-400">AUTO CASHOUT</span>
              <input
                type="checkbox"
                checked={autoCashout2}
                onChange={(e) => setAutoCashout2(e.target.checked)}
              />
            </div>

            <input
              type="number"
              value={autoCashoutAt2}
              onChange={(e) => setAutoCashoutAt2(Number(e.target.value))}
              className="w-full bg-transparent border border-gray-700 rounded-xl text-center text-sm py-2 mb-2"
            />

            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-gray-400">AUTO BET</span>
              <input
                type="checkbox"
                checked={autoBet2}
                onChange={(e) => setAutoBet2(e.target.checked)}
              />
            </div>

            {gameState === "flying" && bet2Placed ? (
              <button
                onClick={() => cashOut2()}
                disabled={bet2Cashed}
                className={cn(
                  "w-full py-3 rounded-xl font-black text-lg",
                  bet2Cashed
                    ? "bg-gray-600 opacity-60"
                    : "bg-yellow-500 text-black animate-pulse"
                )}
              >
                {bet2Cashed ? "CASHED" : "CASH OUT"}
              </button>
            ) : (
              <button
                onClick={placeBet2}
                disabled={bet2Placed || gameState !== "waiting"}
                className={cn(
                  "w-full py-3 rounded-xl font-black text-lg",
                  bet2Placed || gameState !== "waiting"
                    ? "bg-gray-600 opacity-60"
                    : "bg-green-600 text-white"
                )}
              >
                BET
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
