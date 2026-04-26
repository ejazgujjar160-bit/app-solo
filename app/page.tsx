"use client";

import React, { useState, useEffect, useRef } from 'react';

export default function F16CrashGame() {
  const [balance, setBalance] = useState(111.55);
  const [bet, setBet] = useState(10);
  const [multiplier, setMultiplier] = useState(1.00);
  const [isFlying, setIsFlying] = useState(false);
  const [history, setHistory] = useState(["4.59x", "5.39x", "6.75x", "1.57x", "1.21x"]);
  const [planePos, setPlanePos] = useState({ left: 0, top: 220, rotate: 0 });
  const [crashed, setCrashed] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRound = () => {
    setCrashed(false);
    setMultiplier(1.00);
    setIsFlying(true);
    
    const crashPoint = (Math.random() * 9 + 1.2);

    timerRef.current = setInterval(() => {
      setMultiplier((prev) => {
        const nextValue = prev + 0.02;
        
        if (nextValue >= crashPoint) {
          clearInterval(timerRef.current!);
          setIsFlying(false);
          setCrashed(true);
          setHistory(h => [crashPoint.toFixed(2) + "x", ...h.slice(0, 6)]);
          
          setTimeout(startRound, 3000);
          return parseFloat(crashPoint.toFixed(2));
        }

        // Plane Movement Logic
        const x = nextValue * 40;
        let y = 220 - nextValue * 12;
        if (y < 30) y = 30;
        setPlanePos({ left: x, top: y, rotate: -20 });

        return parseFloat(nextValue.toFixed(2));
      });
    }, 60);
  };

  useEffect(() => {
    startRound();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleBet = () => {
    alert(`Bet Placed: ${bet} PKR`);
  };

  return (
    <div style={{ background: '#0b0f18', color: 'white', minHeight: '100vh', fontFamily: 'Arial' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#121826', borderBottom: '1px solid #222' }}>
        <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#ff2b2b' }}>F16</div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ color: '#00ff7b', fontWeight: 'bold' }}>{balance.toFixed(2)} PKR</div>
          <div style={{ cursor: 'pointer' }}>☰</div>
        </div>
      </div>

      {/* History */}
      <div style={{ padding: '10px', background: '#0f1524', display: 'flex', gap: '12px', overflowX: 'auto', borderBottom: '1px solid #222' }}>
        {history.map((val, i) => <span key={i} style={{ color: '#a3a3ff', fontWeight: 'bold' }}>{val}</span>)}
      </div>

      {/* Game Box */}
      <div style={{ position: 'relative', height: '320px', background: 'radial-gradient(circle at center,#1b1b2b,#0a0a12)', margin: '12px', borderRadius: '18px', overflow: 'hidden', border: '1px solid #222' }}>
        <div style={{ 
          position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', 
          fontSize: '64px', fontWeight: 'bold', color: crashed ? 'red' : 'white' 
        }}>
          {multiplier.toFixed(2)}x {crashed && "CRASHED!"}
        </div>

        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/F-16_June_2008.jpg/320px-F-16_June_2008.jpg"
          alt="F16"
          style={{
            position: 'absolute', width: '80px',
            left: `${planePos.left}px', top: `${planePos.top}px`,
            transform: `rotate(${planePos.rotate}deg)`,
            transition: '0.1s linear'
          }}
        />
      </div>

      {/* Controls */}
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ background: '#121826', padding: '15px', borderRadius: '16px', border: '1px solid #222' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
             <button style={{ background: '#2c3857', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px' }}>Bet</button>
             <span style={{ color: '#aaa' }}>Panel 1</span>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ background: '#0b0f18', padding: '10px', borderRadius: '10px', textAlign: 'center', marginBottom: '10px' }}>
                <button onClick={() => setBet(b => Math.max(10, b - 10))} style={{ float: 'left', background: 'none', color: 'white', border: 'none', fontSize: '20px' }}>-</button>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{bet}</span>
                <button onClick={() => setBet(b => b + 10)} style={{ float: 'right', background: 'none', color: 'white', border: 'none', fontSize: '20px' }}>+</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                {[10, 20, 50, 100, 200, 500, 1000, 5000].map(amt => (
                  <button key={amt} onClick={() => setBet(amt)} style={{ background: '#1b2335', color: 'white', border: 'none', padding: '5px', borderRadius: '5px', fontSize: '12px' }}>{amt}</button>
                ))}
              </div>
            </div>
            
            <button 
              onClick={handleBet}
              style={{ width: '100px', background: '#00c853', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}
            >
              BET <br/> {bet} PKR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
