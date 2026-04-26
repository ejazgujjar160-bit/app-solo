"use client";

import React, { useState, useEffect, useRef } from 'react';

export default function F16CrashGame() {
  // States for Game Logic
  const [balance, setBalance] = useState(111.55);
  const [bet, setBet] = useState(10);
  const [multiplier, setMultiplier] = useState(1.00);
  const [isFlying, setIsFlying] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [history, setHistory] = useState(["4.59x", "5.39x", "6.75x", "1.57x", "1.21x", "1.45x", "3.46x"]);
  const [planePos, setPlanePos] = useState({ left: 0, top: 220, rotate: 0 });
  const [showMenu, setShowMenu] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Game Core Function
  const startRound = () => {
    if (isFlying) return;
    
    setCrashed(false);
    setMultiplier(1.00);
    setIsFlying(true);
    setPlanePos({ left: 0, top: 220, rotate: -20 });

    const crashPoint = (Math.random() * 5 + 1.1); // Random crash between 1.1x and 6x

    timerRef.current = setInterval(() => {
      setMultiplier((prev) => {
        const nextValue = prev + 0.02;
        
        if (nextValue >= crashPoint) {
          clearInterval(timerRef.current!);
          setIsFlying(false);
          setCrashed(true);
          setHistory(h => [crashPoint.toFixed(2) + "x", ...h.slice(0, 6)]);
          
          // Auto restart after 3 seconds
          setTimeout(startRound, 3000);
          return parseFloat(crashPoint.toFixed(2));
        }

        // Plane Movement
        const x = Math.min(nextValue * 45, 280); 
        const y = Math.max(220 - nextValue * 15, 40);
        setPlanePos({ left: x, top: y, rotate: -20 });

        return parseFloat(nextValue.toFixed(2));
      });
    }, 60);
  };

  useEffect(() => {
    startRound();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div style={{ background: '#0b0f18', color: 'white', minHeight: '100vh', fontFamily: 'Arial, sans-serif', overflowX: 'hidden' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#121826', borderBottom: '1px solid #222' }}>
        <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#ff2b2b' }}>F16</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
          <div style={{ color: '#00ff7b', fontWeight: 'bold' }}>{balance.toFixed(2)} PKR</div>
          <div style={{ background: '#1b2335', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setShowMenu(!showMenu)}>☰</div>
          <div style={{ background: '#1b2335', padding: '6px 10px', borderRadius: '8px' }}>💬</div>
        </div>
      </div>

      {/* History */}
      <div style={{ padding: '10px', background: '#0f1524', display: 'flex', gap: '12px', overflowX: 'auto', borderBottom: '1px solid #222', fontSize: '14px' }}>
        {history.map((val, i) => (
          <span key={i} style={{ color: '#a3a3ff', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{val}</span>
        ))}
      </div>

      {/* Game Display Area */}
      <div style={{ position: 'relative', height: '320px', background: 'radial-gradient(circle at center,#1b1b2b,#0a0a12)', margin: '12px', borderRadius: '18px', overflow: 'hidden', border: '1px solid #222' }}>
        <div style={{ 
          position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', 
          fontSize: '60px', fontWeight: 'bold', color: crashed ? '#ff2b2b' : 'white',
          textShadow: '0 0 20px rgba(255,0,0,0.3)', zIndex: 10
        }}>
          {multiplier.toFixed(2)}x
          {crashed && <div style={{ fontSize: '20px', textAlign: 'center' }}>FLEW AWAY!</div>}
        </div>

        {/* Trail Effect */}
        <div style={{ 
          position: 'absolute', height: '4px', background: 'red', borderRadius: '10px',
          boxShadow: '0 0 15px red', left: 0, top: planePos.top + 35, width: planePos.left + 20,
          transition: '0.1s linear'
        }} />

        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/F-16_June_2008.jpg/320px-F-16_June_2008.jpg"
          alt="F16"
          style={{
            position: 'absolute', width: '70px',
            left: `${planePos.left}px`, top: `${planePos.top}px`,
            transform: `rotate(${planePos.rotate}deg)`,
            transition: '0.1s linear', zIndex: 5, borderRadius: '4px'
          }}
        />
        
        <div style={{ position: 'absolute', right: '10px', bottom: '10px', background: 'rgba(0,0,0,0.5)', padding: '5px 10px', borderRadius: '15px', fontSize: '12px' }}>
          👥 1,436
        </div>
      </div>

      {/* Betting Controls */}
      <div style={{ padding: '0 12px 20px 12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        <div style={{ background: '#121826', borderRadius: '16px', padding: '12px', border: '1px solid #222' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', background: '#1b2335', borderRadius: '10px', overflow: 'hidden' }}>
              <button style={{ border: 'none', padding: '8px 15px', background: '#2c3857', color: 'white', fontWeight: 'bold' }}>Bet</button>
              <button style={{ border: 'none', padding: '8px 15px', background: 'transparent', color: 'white' }}>Auto</button>
            </div>
            <span style={{ color: '#666', fontSize: '12px' }}>Panel 1</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#0b0f18', padding: '8px', borderRadius: '10px', border: '1px solid #333', marginBottom: '8px' }}>
                <button onClick={() => setBet(Math.max(10, bet - 10))} style={{ background: '#1b2335', color: 'white', border: 'none', width: '30px', borderRadius: '5px' }}>-</button>
                <span style={{ fontWeight: 'bold' }}>{bet}</span>
                <button onClick={() => setBet(bet + 10)} style={{ background: '#1b2335', color: 'white', border: 'none', width: '30px', borderRadius: '5px' }}>+</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                {[10, 20, 50, 100, 200, 500, 1000, 5000].map(amt => (
                  <button key={amt} onClick={() => setBet(amt)} style={{ background: '#1b2335', color: 'white', border: 'none', padding: '6px', borderRadius: '6px', fontSize: '11px' }}>{amt}</button>
                ))}
              </div>
            </div>
            <button 
              onClick={() => alert('Bet Placed!')}
              style={{ width: '40%', height: '80px', background: '#00c853', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 0 15px rgba(0,200,83,0.4)' }}
            >
              BET<br/><span style={{ fontSize: '14px' }}>{bet} PKR</span>
            </button>
          </div>
        </div>

      </div>

      {/* Menu Popup */}
      {showMenu && (
        <div style={{ position: 'fixed', top: '60px', right: '20px', background: '#121826', border: '1px solid #333', borderRadius: '12px', padding: '10px', width: '180px', zIndex: 100 }}>
          <p style={{ padding: '8px', borderBottom: '1px solid #222', fontSize: '14px' }}>📌 Game Data</p>
          <p style={{ padding: '8px', borderBottom: '1px solid #222', fontSize: '14px' }}>🎮 History</p>
          <p style={{ padding: '8px', fontSize: '14px' }}>⚙ Settings</p>
        </div>
      )}
    </div>
  );
}
