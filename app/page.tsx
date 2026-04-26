"use client";

import React, { useState, useEffect, useRef } from 'react';

export default function F16CrashGame() {
  const [balance, setBalance] = useState(111.55);
  const [betAmount, setBetAmount] = useState(10);
  const [multiplier, setMultiplier] = useState(1.00);
  const [isFlying, setIsFlying] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [hasActiveBet, setHasActiveBet] = useState(false);
  const [history, setHistory] = useState(["4.59x", "5.39x", "6.75x", "1.57x"]);
  const [planePos, setPlanePos] = useState({ left: 0, top: 220 });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // راؤنڈ شروع کرنے کا فنکشن
  const startRound = () => {
    if (isFlying) return;
    
    setCrashed(false);
    setMultiplier(1.00);
    setIsFlying(true);
    setPlanePos({ left: 0, top: 220 });

    const crashPoint = (Math.random() * 4 + 1.2); 

    timerRef.current = setInterval(() => {
      setMultiplier((prev) => {
        const nextValue = prev + 0.02;
        
        if (nextValue >= crashPoint) {
          clearInterval(timerRef.current!);
          setIsFlying(false);
          setCrashed(true);
          setHasActiveBet(false); // کریش ہونے پر بیٹ ختم
          setHistory(h => [crashPoint.toFixed(2) + "x", ...h.slice(0, 5)]);
          
          setTimeout(startRound, 4000); // 4 سیکنڈ بعد نیا راؤنڈ
          return parseFloat(crashPoint.toFixed(2));
        }

        // جہاز کی حرکت
        setPlanePos({ 
          left: Math.min(nextValue * 40, 300), 
          top: Math.max(220 - nextValue * 15, 30) 
        });

        return parseFloat(nextValue.toFixed(2));
      });
    }, 80);
  };

  // بیٹ لگانے کا بٹن
  const handleBetClick = () => {
    if (isFlying) {
      alert("اگلے راؤنڈ کا انتظار کریں!");
      return;
    }
    if (balance < betAmount) {
      alert("بیلنس کم ہے!");
      return;
    }
    setBalance(prev => prev - betAmount);
    setHasActiveBet(true);
  };

  // کیش آؤٹ کرنے کا بٹن
  const handleCashOut = () => {
    if (hasActiveBet && isFlying && !crashed) {
      const win = betAmount * multiplier;
      setBalance(prev => prev + win);
      setHasActiveBet(false);
      alert(`کیش آؤٹ کامیاب! آپ نے ${win.toFixed(2)} PKR جیت لیے۔`);
    }
  };

  useEffect(() => {
    startRound();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div style={{ background: '#0b0f18', color: 'white', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#121826', borderBottom: '1px solid #333' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff2b2b' }}>F16</div>
        <div style={{ color: '#00ff7b', fontWeight: 'bold', fontSize: '18px' }}>{balance.toFixed(2)} PKR</div>
      </div>

      {/* Game Screen */}
      <div style={{ 
        position: 'relative', height: '350px', margin: '15px', borderRadius: '20px', overflow: 'hidden', border: '1px solid #444',
        backgroundImage: 'url("https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000")', // عارضی بیک گراؤنڈ
        backgroundSize: 'cover'
      }}>
        <div style={{ 
          position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%, -50%)', 
          fontSize: '65px', fontWeight: 'bold', zIndex: 10, color: crashed ? '#ff2b2b' : 'white',
          textShadow: '0 0 20px rgba(0,0,0,0.8)'
        }}>
          {multiplier.toFixed(2)}x
          {crashed && <div style={{ fontSize: '20px', textAlign: 'center' }}>FLEW AWAY!</div>}
        </div>

        {/* F16 Plane */}
        {!crashed && (
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/F-16_June_2008.jpg/320px-F-16_June_2008.jpg" 
            style={{
              position: 'absolute', width: '90px', borderRadius: '5px',
              left: `${planePos.left}px`, top: `${planePos.top}px`,
              transition: '0.1s linear', zIndex: 5
            }}
          />
        )}
      </div>

      {/* Betting Panel */}
      <div style={{ padding: '0 15px' }}>
        <div style={{ background: '#121826', padding: '20px', borderRadius: '18px', border: '1px solid #333' }}>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ background: '#0b0f18', padding: '10px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <button onClick={() => setBetAmount(Math.max(10, betAmount - 10))} style={{ background: '#1b2335', color: 'white', border: 'none', width: '35px', borderRadius: '5px' }}>-</button>
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{betAmount}</span>
                <button onClick={() => setBetAmount(betAmount + 10)} style={{ background: '#1b2335', color: 'white', border: 'none', width: '35px', borderRadius: '5px' }}>+</button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                {[10, 50, 100, 500].map(amt => (
                  <button key={amt} onClick={() => setBetAmount(amt)} style={{ background: '#1b2335', color: 'white', border: 'none', padding: '8px', borderRadius: '5px', fontSize: '12px' }}>{amt}</button>
                ))}
              </div>
            </div>

            {/* Dynamic Button (Bet or Cashout) */}
            {!hasActiveBet ? (
              <button 
                onClick={handleBetClick}
                disabled={isFlying}
                style={{ 
                  width: '140px', height: '90px', background: isFlying ? '#222' : '#00c853', 
                  color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '15px', fontSize: '22px'
                }}
              >
                BET
              </button>
            ) : (
              <button 
                onClick={handleCashOut}
                disabled={!isFlying || crashed}
                style={{ 
                  width: '140px', height: '90px', background: '#ff9800', 
                  color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '15px', fontSize: '18px'
                }}
              >
                CASH OUT<br/>{(betAmount * multiplier).toFixed(2)}
              </button>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
