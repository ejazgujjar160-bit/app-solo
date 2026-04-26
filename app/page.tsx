"use client";

import React, { useState, useEffect, useRef } from 'react';

export default function F16AviatorGame() {
  const [balance, setBalance] = useState(207.35);
  const [bet, setBet] = useState(10);
  const [multiplier, setMultiplier] = useState(1.00);
  const [gameState, setGameState] = useState<'waiting' | 'flying' | 'crashed'>('waiting');
  const [hasBet, setHasBet] = useState(false);
  const [history, setHistory] = useState(["4.59x", "5.39x", "6.75x", "1.57x", "1.21x", "1.45x", "3.46x"]);
  const [planePos, setPlanePos] = useState({ left: 0, top: 220 });
  const [loadingProgress, setLoadingProgress] = useState(100);
  const [showMenu, setShowMenu] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // گیم لوپ
  const startFlying = () => {
    setGameState('flying');
    setMultiplier(1.00);
    const crashPoint = (Math.random() * 5 + 1.1);

    timerRef.current = setInterval(() => {
      setMultiplier((prev) => {
        const next = prev + 0.02;
        if (next >= crashPoint) {
          clearInterval(timerRef.current!);
          handleCrash(parseFloat(crashPoint.toFixed(2)));
          return parseFloat(crashPoint.toFixed(2));
        }
        setPlanePos({
          left: Math.min(next * 40, 280),
          top: Math.max(220 - next * 15, 40)
        });
        return parseFloat(next.toFixed(2));
      });
    }, 80);
  };

  const handleCrash = (point: number) => {
    setGameState('crashed');
    setHasBet(false);
    setHistory(prev => [point + "x", ...prev.slice(0, 7)]);
    
    // لوڈنگ پٹی شروع کریں
    let timeLeft = 100;
    setGameState('waiting');
    const interval = setInterval(() => {
      timeLeft -= 2;
      setLoadingProgress(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(interval);
        startFlying();
      }
    }, 100);
  };

  const handlePlaceBet = () => {
    if (gameState === 'waiting' && balance >= bet) {
      setBalance(prev => prev - bet);
      setHasBet(true);
    }
  };

  const handleCashOut = () => {
    if (hasBet && gameState === 'flying') {
      const winnings = bet * multiplier;
      setBalance(prev => prev + winnings);
      setHasBet(false);
      alert(`کیش آؤٹ: ${winnings.toFixed(2)} PKR`);
    }
  };

  useEffect(() => {
    startFlying();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div style={{ background: '#0b0f18', color: 'white', minHeight: '100vh', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      
      {/* Top Header (پہلے والے کوڈ جیسی) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#121826', borderBottom: '1px solid #222' }}>
        <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#ff2b2b' }}>F16</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ color: '#00ff7b', fontWeight: 'bold' }}>{balance.toFixed(2)} PKR</div>
          <div onClick={() => setShowMenu(!showMenu)} style={{ width: '32px', height: '32px', background: '#1b2335', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>☰</div>
          <div style={{ width: '32px', height: '32px', background: '#1b2335', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>💬</div>
          <div style={{ width: '32px', height: '32px', background: '#1b2335', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>⋮</div>
        </div>
      </div>

      {/* History (رنگین ہسٹری بار) */}
      <div style={{ padding: '10px', background: '#0f1524', display: 'flex', gap: '12px', overflowX: 'auto', borderBottom: '1px solid #222' }}>
        {history.map((val, i) => (
          <span key={i} style={{ color: '#a3a3ff', fontWeight: 'bold', fontSize: '14px' }}>{val}</span>
        ))}
      </div>

      {/* Game Box (تصاویر کے ساتھ) */}
      <div style={{ 
        position: 'relative', height: '320px', margin: '12px', borderRadius: '18px', overflow: 'hidden', border: '1px solid #222',
        backgroundImage: 'url("/1000485811.jpg")', backgroundSize: 'cover', backgroundPosition: 'center'
      }}>
        
        {/* Multiplier / Fly Away Text */}
        <div style={{ 
          position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', 
          fontSize: '64px', fontWeight: 'bold', zIndex: 10, color: gameState === 'waiting' ? '#ff2b2b' : 'white',
          textShadow: '0 0 25px rgba(0,0,0,0.5)'
        }}>
          {gameState === 'waiting' ? (multiplier > 1 ? `${multiplier}x FLEW AWAY!` : "WAITING...") : `${multiplier.toFixed(2)}x`}
        </div>

        {/* Loading Progress Bar */}
        {gameState === 'waiting' && (
          <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)' }}>
            <div style={{ width: `${loadingProgress}%`, height: '100%', background: '#ff2b2b', transition: 'linear 0.1s' }}></div>
          </div>
        )}

        {/* Plane Trail */}
        {gameState === 'flying' && (
          <div style={{ position: 'absolute', height: '6px', background: 'red', top: planePos.top + 30, left: 0, width: planePos.left + 20, boxShadow: '0 0 15px red', borderRadius: '10px' }} />
        )}

        {/* F16 Plane */}
        {gameState === 'flying' && (
          <img 
            src="/1000484527.png" 
            style={{ position: 'absolute', width: '80px', left: planePos.left, top: planePos.top, transition: '0.1s linear', zIndex: 5 }} 
          />
        )}

        <div style={{ position: 'absolute', right: '10px', bottom: '10px', background: 'rgba(0,0,0,0.5)', padding: '6px 12px', borderRadius: '18px', fontSize: '14px' }}>👥 1,436</div>
      </div>

      {/* Betting Controls (پہلے والے ڈیزائن کے مطابق) */}
      <div style={{ padding: '0 12px' }}>
        <div style={{ background: '#121826', borderRadius: '16px', padding: '12px', border: '1px solid #222' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
             <div style={{ display: 'flex', background: '#1b2335', borderRadius: '12px', overflow: 'hidden' }}>
                <button style={{ border: 'none', padding: '10px 18px', background: '#2c3857', color: 'white', fontWeight: 'bold' }}>Bet</button>
                <button style={{ border: 'none', padding: '10px 18px', background: 'transparent', color: 'white' }}>Auto</button>
             </div>
             <div style={{ color: '#aaa', fontSize: '14px' }}>Panel 1</div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0b0f18', borderRadius: '12px', padding: '10px', border: '1px solid #222', marginBottom: '10px' }}>
                <button onClick={() => setBet(Math.max(10, bet - 10))} style={{ width: '35px', height: '35px', borderRadius: '10px', background: '#1b2335', color: 'white', border: 'none', fontSize: '20px' }}>-</button>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{bet}</span>
                <button onClick={() => setBet(bet + 10)} style={{ width: '35px', height: '35px', borderRadius: '10px', background: '#1b2335', color: 'white', border: 'none', fontSize: '20px' }}>+</button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {[10, 20, 50, 100, 200, 500, 1000, 5000].map(amt => (
                  <button key={amt} onClick={() => setBet(amt)} style={{ padding: '8px', background: '#1b2335', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px' }}>{amt}</button>
                ))}
              </div>
            </div>

            {/* Dynamic Button (Bet / Cashout) */}
            {!hasBet ? (
              <button 
                onClick={handlePlaceBet}
                disabled={gameState !== 'waiting'}
                style={{ width: '45%', height: '110px', background: gameState === 'waiting' ? '#00c853' : '#333', color: 'white', border: 'none', borderRadius: '16px', fontSize: '20px', fontWeight: 'bold', boxShadow: gameState === 'waiting' ? '0 0 15px rgba(0,200,83,0.4)' : 'none' }}
              >
                BET<br/><span style={{ fontSize: '14px' }}>{bet} PKR</span>
              </button>
            ) : (
              <button 
                onClick={handleCashOut}
                disabled={gameState !== 'flying'}
                style={{ width: '45%', height: '110px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '16px', fontSize: '20px', fontWeight: 'bold', boxShadow: '0 0 15px rgba(255,152,0,0.4)' }}
              >
                CASH OUT<br/><span style={{ fontSize: '14px' }}>{(bet * multiplier).toFixed(2)} PKR</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bottom */}
      <div style={{ margin: '15px 12px', padding: '10px', borderRadius: '12px', background: '#0f1524', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
        <div>1635 / 4029 Bets</div>
        <div style={{ color: '#00ff7b', fontWeight: 'bold' }}>404,117.76 PKR</div>
      </div>

    </div>
  );
}
