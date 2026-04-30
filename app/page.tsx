"use client";
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, update } from "firebase/database";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBQ3gSnL9qb8lR1oTPAFVkg3-ka0Lj_uz4",
  authDomain: "f-16-5fbf8.firebaseapp.com",
  projectId: "f-16-5fbf8",
  storageBucket: "f-16-5fbf8.firebasestorage.app",
  messagingSenderId: "1018743993015",
  appId: "1:1018743993015:web:720e93787b529c54149332"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export default function AviatorPro() {
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [gameState, setGameState] = useState<'waiting' | 'flying' | 'crashed'>('waiting'); 
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [planePos, setPlanePos] = useState({ x: 0, y: 0 });

  // Two Betting Panels
  const [bet1, setBet1] = useState({ amount: 10, isQueued: false, active: false, cashedOut: false, auto: false, autoVal: 2.0 });
  const [bet2, setBet2] = useState({ amount: 10, isQueued: false, active: false, cashedOut: false, auto: false, autoVal: 2.0 });

  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        onValue(ref(db, `users/${u.uid}`), (snap) => { if (snap.exists()) setBalance(snap.val().balance); });
      }
    });
    startWaitingPhase();
  }, []);

  const startWaitingPhase = () => {
    setGameState('waiting');
    setLoadingProgress(0);
    setMultiplier(1.00);
    setPlanePos({ x: 0, y: 0 });
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 1;
      setLoadingProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        startFlyingPhase();
      }
    }, 50); // 5 seconds waiting time
  };

  const startFlyingPhase = async () => {
    // Deduct Balance for Queued Bets
    let newBalance = balance;
    if (bet1.isQueued) { newBalance -= bet1.amount; setBet1(p => ({ ...p, active: true, isQueued: false, cashedOut: false })); }
    if (bet2.isQueued) { newBalance -= bet2.amount; setBet2(p => ({ ...p, active: true, isQueued: false, cashedOut: false })); }
    
    if (newBalance !== balance) {
      setBalance(newBalance);
      await update(ref(db, `users/${user.uid}`), { balance: newBalance });
    }

    setGameState('flying');
    const crashAt = Math.random() * (Math.random() < 0.1 ? 1.2 : 5) + 1;

    gameTimerRef.current = setInterval(() => {
      setMultiplier(prev => {
        const next = parseFloat((prev + 0.01 * (prev < 2 ? 1 : prev * 0.5)).toFixed(2));
        
        // Auto Cashout Check
        if (bet1.active && !bet1.cashedOut && bet1.auto && next >= bet1.autoVal) handleCashOut(1, next);
        if (bet2.active && !bet2.cashedOut && bet2.auto && next >= bet2.autoVal) handleCashOut(2, next);

        if (next >= crashAt) {
          clearInterval(gameTimerRef.current!);
          setGameState('crashed');
          setHistory(h => [next + "x", ...h].slice(0, 10));
          setBet1(p => ({ ...p, active: false }));
          setBet2(p => ({ ...p, active: false }));
          setTimeout(startWaitingPhase, 3000);
          return next;
        }

        setPlanePos({ x: Math.min(next * 20, 80), y: Math.min(next * 15, 70) });
        return next;
      });
    }, 100);
  };

  const handleCashOut = async (panel: number, currentMult: number) => {
    const bet = panel === 1 ? bet1 : bet2;
    if (gameState === 'flying' && bet.active && !bet.cashedOut) {
      const win = bet.amount * currentMult;
      const newBal = balance + win;
      setBalance(newBal);
      await update(ref(db, `users/${user.uid}`), { balance: newBal });
      if (panel === 1) setBet1(p => ({ ...p, cashedOut: true }));
      else setBet2(p => ({ ...p, cashedOut: true }));
    }
  };

  const toggleBet = (panel: number) => {
    const setBet = panel === 1 ? setBet1 : setBet2;
    setBet(p => ({ ...p, isQueued: !p.isQueued }));
  };

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', padding: '10px', fontFamily: 'sans-serif' }}>
      {/* Header & Balance */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ color: 'red', fontWeight: 'bold' }}>AVIATOR</span>
        <span style={{ color: '#28a745' }}>{balance.toFixed(2)} PKR</span>
      </div>

      {/* History */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', overflow: 'hidden' }}>
        {history.map((h, i) => (
          <span key={i} style={{ background: '#1b2335', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', color: '#9858f5' }}>{h}</span>
        ))}
      </div>

      {/* Game Stage */}
      <div style={{ height: '250px', background: '#0b0f18', borderRadius: '15px', position: 'relative', overflow: 'hidden', border: '1px solid #333' }}>
        {gameState === 'waiting' && (
          <div style={{ position: 'absolute', width: '100%', bottom: 0 }}>
             <div style={{ textAlign: 'center', marginBottom: '10px', color: '#aaa' }}>NEXT ROUND IN...</div>
             <div style={{ height: '5px', background: 'red', width: `${loadingProgress}%`, transition: 'width 0.1s linear' }}></div>
          </div>
        )}

        <div style={{ position: 'absolute', width: '100%', textAlign: 'center', top: '40%', fontSize: '50px', fontWeight: 'bold' }}>
          {gameState === 'crashed' ? <span style={{ color: 'red' }}>FLEW AWAY!</span> : multiplier + "x"}
        </div>

        {gameState === 'flying' && (
          <img src="/jet.png" style={{ position: 'absolute', bottom: `${planePos.y}%`, left: `${planePos.x}%`, width: '80px', transition: 'all 0.1s linear' }} />
        )}
      </div>

      {/* Betting Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
        {[1, 2].map(id => {
          const bet = id === 1 ? bet1 : bet2;
          const setBet = id === 1 ? setBet1 : setBet2;
          return (
            <div key={id} style={{ background: '#1b1c20', padding: '10px', borderRadius: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
                <input type="number" value={bet.amount} onChange={e => setBet(p => ({ ...p, amount: +e.target.value }))} style={{ width: '60px', background: '#000', color: '#fff', border: '1px solid #444' }} />
                <button onClick={() => setBet(p => ({ ...p, isAuto: !p.isAuto }))} style={{ fontSize: '10px', background: bet.auto ? 'green' : '#333' }}>AUTO</button>
              </div>
              
              <button 
                onClick={() => (gameState === 'flying' && bet.active && !bet.cashedOut) ? handleCashOut(id, multiplier) : toggleBet(id)}
                disabled={bet.cashedOut}
                style={{ 
                  width: '100%', padding: '15px', borderRadius: '10px', fontWeight: 'bold', border: 'none',
                  background: (gameState === 'flying' && bet.active && !bet.cashedOut) ? '#ff9800' : (bet.isQueued ? '#d32f2f' : '#28a745')
                }}
              >
                {(gameState === 'flying' && bet.active && !bet.cashedOut) ? `CASH OUT\n${(bet.amount * multiplier).toFixed(2)}` : (bet.isQueued ? 'CANCEL' : 'BET')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
