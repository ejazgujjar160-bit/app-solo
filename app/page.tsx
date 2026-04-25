"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

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

  const countdownTimer = useRef<NodeJS.Timeout | null>(null)

  // Smoke trail
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([])
  const trailId = useRef(0)

  // ---------------- HELPERS (LOCAL STORAGE USERS) ----------------
  const getUsers = (): UserData[] => {
    const saved = localStorage.getItem("f16_users")
    return saved ? JSON.parse(saved) : []
  }

  const saveUsers = (users: UserData[]) => {
    localStorage.setItem("f16_users", JSON.stringify(users))
  }

  // ---------------- AUTO LOGIN ----------------
  useEffect(() => {
    const logged = localStorage.getItem("f16_logged_user")
    if (!logged) return

    const parsed = JSON.parse(logged) as UserData
    setUser(parsed)
    setBalance(parsed.balance)
    setLevel(parsed.level)
    setXp(parsed.xp)
    setIsLoggedIn(true)
  }, [])

  // ---------------- SAVE USER DATA LIVE ----------------
  useEffect(() => {
    if (!isLoggedIn || !user) return

    const updatedUser: UserData = {
      ...user,
      balance,
      level,
      xp,
    }

    setUser(updatedUser)
    localStorage.setItem("f16_logged_user", JSON.stringify(updatedUser))

    // update user list too
    const users = getUsers()
    const newUsers = users.map((u) =>
      u.username === updatedUser.username ? updatedUser : u
    )
    saveUsers(newUsers)
  }, [balance, level, xp])

  // ---------------- SIGNUP ----------------
  const signup = () => {
    if (!username || !password) return alert("Username اور Password لازمی ہیں")
    if (password.length < 4) return alert("Password کم از کم 4 characters کا ہو")

    const users = getUsers()

    const exists = users.find((u) => u.username === username)
    if (exists) return alert("یہ Username پہلے سے موجود ہے")

    const newUser: UserData = {
      username,
      password,
      balance: 10000,
      level: 1,
      xp: 0,
    }

    users.push(newUser)
    saveUsers(users)

    localStorage.setItem("f16_logged_user", JSON.stringify(newUser))

    setUser(newUser)
    setBalance(newUser.balance)
    setLevel(newUser.level)
    setXp(newUser.xp)

    setIsLoggedIn(true)
  }

  // ---------------- LOGIN ----------------
  const login = () => {
    if (!username || !password) return alert("Username اور Password لازمی ہیں")

    const users = getUsers()

    const found = users.find((u) => u.username === username && u.password === password)

    if (!found) return alert("Wrong username یا password")

    localStorage.setItem("f16_logged_user", JSON.stringify(found))

    setUser(found)
    setBalance(found.balance)
    setLevel(found.level)
    setXp(found.xp)

    setIsLoggedIn(true)
  }

  // ---------------- LOGOUT ----------------
  const logout = () => {
    localStorage.removeItem("f16_logged_user")

    setIsLoggedIn(false)
    setUser(null)
    setUsername("")
    setPassword("")
    setAuthMode("login")

    setGameState("waiting")
    setMultiplier(1.0)
    setBalance(10000)
    setLevel(1)
    setXp(0)

    setBet1Placed(false)
    setBet2Placed(false)
    setTrail([])
  }

  // ---------------- AUDIO ----------------
  useEffect(() => {
    engineAudio.current = new Audio("/audio/f16-engine.mp3")
    engineAudio.current.loop = true
    engineAudio.current.volume = 0.6

    crashAudio.current = new Audio("/audio/explosion.mp3")
    crashAudio.current.volume = 0.8

    return () => {
      if (gameLoop.current) cancelAnimationFrame(gameLoop.current)
      if (countdownTimer.current) clearInterval(countdownTimer.current)

      engineAudio.current?.pause()
      crashAudio.current?.pause()
    }
  }, [])

  // ---------------- GIFT TIMER ----------------
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

  // ---------------- FAKE PLAYERS ----------------
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

  // ---------------- XP ----------------
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

  // ---------------- CRASH ----------------
  const generateCrashPoint = () => {
    const r = Math.random()
    return Math.max(1.0, 0.98 / (1 - r))
  }

  // ---------------- EFFECTS ----------------
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

  // ---------------- SAFE AUDIO ----------------
  const safePlayEngine = async () => {
    try {
      if (engineAudio.current) {
        engineAudio.current.currentTime = 0
        await engineAudio.current.play()
      }
    } catch (e) {}
  }

  const safePlayCrash = async () => {
    try {
      if (crashAudio.current) {
        crashAudio.current.currentTime = 0
        await crashAudio.current.play()
      }
    } catch (e) {}
  }

  // ---------------- START ROUND ----------------
  const startRound = () => {
    if (gameState !== "waiting") return

    if (gameLoop.current) cancelAnimationFrame(gameLoop.current)
    if (countdownTimer.current) clearInterval(countdownTimer.current)

    crashPoint.current = generateCrashPoint()

    setMultiplier(1.0)
    setTrail([])
    setBet1Cashed(false)
    setBet2Cashed(false)

    setGameState("countdown")
    setCountdown(3)

    let count = 3
    countdownTimer.current = setInterval(() => {
      count -= 1
      setCountdown(count)

      if (count <= 0) {
        if (countdownTimer.current) clearInterval(countdownTimer.current)
        countdownTimer.current = null

        setGameState("flying")
        startTime.current = Date.now()

        safePlayEngine()

        const update = () => {
          const elapsed = (Date.now() - startTime.current) / 1000
          const nextVal = Math.exp(elapsed * 0.18)

          setTrail((prev) => {
            const newTrail = [
              ...prev,
              { x: nextVal * 4, y: nextVal * 5, id: trailId.current++ },
            ]
            return newTrail.slice(-25)
          })

          if (bet1Placed && !bet1Cashed && autoCashout1 && nextVal >= autoCashoutAt1) {
            cashOut1(nextVal)
          }

          if (bet2Placed && !bet2Cashed && autoCashout2 && nextVal >= autoCashoutAt2) {
            cashOut2(nextVal)
          }

          if (nextVal >= crashPoint.current) {
            setMultiplier(crashPoint.current)
            setGameState("crashed")

            setHistory((prev) => [crashPoint.current, ...prev].slice(0, 12))

            engineAudio.current?.pause()
            safePlayCrash()

            triggerExplosion()
            triggerShake()
            triggerRedFlash()

            addXp(10)

            if (gameLoop.current) cancelAnimationFrame(gameLoop.current)
            gameLoop.current = null

            setTimeout(() => {
              setGameState("waiting")
              setBet1Placed(false)
              setBet2Placed(false)
              setTrail([])

              setTimeout(() => {
                setBalance((prevBal) => {
                  let newBal = prevBal
                  let didBet = false

                  if (autoBet1 && newBal >= bet1) {
                    newBal -= bet1
                    setBet1Placed(true)
                    didBet = true
                  }

                  if (autoBet2 && newBal >= bet2) {
                    newBal -= bet2
                    setBet2Placed(true)
                    didBet = true
                  }

                  if (didBet) {
                    setTimeout(() => startRound(), 200)
                  }

                  return newBal
                })
              }, 300)

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

  // ---------------- PLACE BET 1 ----------------
  const placeBet1 = () => {
    if (gameState !== "waiting") return
    if (bet1 <= 0) return

    setBalance((prev) => {
      if (prev < bet1) return prev
      return prev - bet1
    })

    setBet1Placed(true)

    if (!bet2Placed) startRound()
  }

  // ---------------- PLACE BET 2 ----------------
  const placeBet2 = () => {
    if (gameState !== "waiting") return
    if (bet2 <= 0) return

    setBalance((prev) => {
      if (prev < bet2) return prev
      return prev - bet2
    })

    setBet2Placed(true)

    if (!bet1Placed) startRound()
  }

  // ---------------- CASHOUT 1 ----------------
  const cashOut1 = (manualMultiplier?: number) => {
    if (gameState !== "flying") return
    if (!bet1Placed || bet1Cashed) return

    const used = manualMultiplier || multiplier
    const win = bet1 * used

    setBalance((prev) => prev + win)
    setBet1Cashed(true)
    addXp(20)
  }

  // ---------------- CASHOUT 2 ----------------
  const cashOut2 = (manualMultiplier?: number) => {
    if (gameState !== "flying") return
    if (!bet2Placed || bet2Cashed) return

    const used = manualMultiplier || multiplier
    const win = bet2 * used

    setBalance((prev) => prev + win)
    setBet2Cashed(true)
    addXp(20)
  }

  // ---------------- GIFT ----------------
  const claimGift = () => {
    if (!isGiftAvailable) return
    setBalance((prev) => prev + 500)
    setIsGiftAvailable(false)
    setGiftTimer(60)
  }

  // ---------------- HISTORY COLOR ----------------
  const historyColor = (val: number) => {
    if (val >= 10) return "bg-red-600/20 text-red-400 border-red-500/50"
    if (val >= 5) return "bg-purple-600/20 text-purple-400 border-purple-500/50"
    if (val >= 2) return "bg-green-600/20 text-green-400 border-green-500/50"
    return "bg-blue-600/20 text-blue-400 border-blue-500/50"
  }

  // ---------------- AUTH SCREEN ----------------
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060b13] text-white p-4">
        <div className="bg-black border border-gray-700 rounded-2xl p-6 w-full max-w-sm">
          <h1 className="text-2xl font-black text-green-500 mb-4 text-center">
            F16 PRO {authMode === "login" ? "LOGIN" : "SIGNUP"}
          </h1>

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter Username"
            className="w-full mb-3 p-3 rounded-xl bg-transparent border border-gray-700 text-white"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Enter Password"
            className="w-full mb-4 p-3 rounded-xl bg-transparent border border-gray-700 text-white"
          />

          {authMode === "login" ? (
            <button
              onClick={login}
              className="w-full bg-green-600 py-3 rounded-xl font-black text-lg"
            >
              LOGIN
            </button>
          ) : (
            <button
              onClick={signup}
              className="w-full bg-yellow-500 text-black py-3 rounded-xl font-black text-lg"
            >
              SIGNUP
            </button>
          )}

          <button
            onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
            className="w-full mt-3 text-sm underline text-gray-300"
          >
            {authMode === "login"
              ? "Create new account (Signup)"
              : "Already have account? Login"}
          </button>
        </div>
      </div>
    )
  }

  // ---------------- GAME UI ----------------
  return (
    <div
      className={cn(
        "min-h-screen bg-[#060b13] text-white flex flex-col font-sans",
        shake && "animate-[shake_0.3s_linear_infinite]"
      )}
    >
      <style jsx>{`
        @keyframes shake {
          0% { transform: translate(2px, 1px); }
          25% { transform: translate(-2px, -1px); }
          50% { transform: translate(2px, -1px); }
          75% { transform: translate(-2px, 1px); }
          100% { transform: translate(2px, 1px); }
        }
      `}</style>

      <header className="p-4 bg-[#0d121b] flex justify-between items-center border-b border-green-500/30">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">PLAYER</span>
          <span className="font-bold text-green-400">{user?.username}</span>
          <button onClick={logout} className="text-xs text-red-400 underline mt-1">
            Logout
          </button>
        </div>

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
        <div className="absolute inset-0 bg-gradient-to-tr from-green-500/10 via-transparent to-purple-500/10" />

        <div
          className={cn(
            "text-7xl font-black z-20 transition-colors",
            gameState === "crashed" ? "text-red-600" : "text-white"
          )}
        >
          {multiplier.toFixed(2)}x
        </div>

        {gameState === "countdown" && (
          <div className="absolute z-30 text-8xl font-black text-yellow-400 animate-pulse">
            {countdown}
          </div>
        )}

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

        {showExplosion && (
          <div className="absolute z-40 text-7xl animate-ping">💥</div>
        )}

        {gameState === "crashed" && (
          <div className="absolute bottom-10 z-30 text-3xl font-black text-red-500 animate-pulse">
            CRASHED!
          </div>
        )}
      </main>

      {/* CONTROL PANEL */}
      <footer className="p-4 bg-[#0d121b] rounded-t-3xl border-t border-gray-800">
        <div className="grid grid-cols-2 gap-3">
          {/* BET 1 */}
          <div className="bg-black rounded-2xl border border-gray-700 p-3">
            <div className="text-xs text-gray-400 mb-2 font-bold">BET 1</div>

            <input
              type="number"
              value={bet1}
              disabled={bet1Placed}
              onChange={(e) => setBet1(Number(e.target.value))}
              className="w-full bg-transparent border border-gray-700 rounded-xl text-center text-xl font-black py-2 mb-2 disabled:opacity-50"
            />

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

          {/* BET 2 */}
          <div className="bg-black rounded-2xl border border-gray-700 p-3">
            <div className="text-xs text-gray-400 mb-2 font-bold">BET 2</div>

            <input
              type="number"
              value={bet2}
              disabled={bet2Placed}
              onChange={(e) => setBet2(Number(e.target.value))}
              className="w-full bg-transparent border border-gray-700 rounded-xl text-center text-xl font-black py-2 mb-2 disabled:opacity-50"
            />

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
