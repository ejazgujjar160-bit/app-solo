"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function F16AviatorPro() {
  const [balance, setBalance] = useState(207.35);
  const [multiplier, setMultiplier] = useState(1.00);
  const [gameState, setGameState] = useState<'waiting' | 'flying' | 'crashed'>('waiting');
  const [history, setHistory] = useState(["4.23x", "2.20x", "4.59x", "5.39x", "1.20x"]);
  const [planePos, setPlanePos] = useState({ x: 0, y: 0 });
  const [loadingBar, setLoadingBar] = useState(100);

  // دو الگ الگ بیٹس کے لیے سٹیٹس
  const [bet1, setBet1] = useState({ amount: 10, hasBet: false, isAuto: false, autoValue: 2.00 });
  const [bet2, setBet2] = useState({ amount: 10, hasBet: false, isAuto: false, autoValue: 2.00 });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRound = () => {
    setGameState('flying');
    setMultiplier(1.00);
    const crashAt = (Math.random() * 5 + 1.1);

    timerRef.current = setInterval(() => {
      setMultiplier(prev => {
        const next = parseFloat((prev + 0.02).toFixed(2));

        // Auto Cashout Logic for Bet 1
        if (bet1.hasBet && bet1.isAuto && next >= bet1.autoValue) {
          cashOut(1, next);
        }
        // Auto Cashout Logic for Bet 2
        if (bet2.hasBet && bet2.isAuto && next >= bet2.autoValue) {
          cashOut(2, next);
        }

        if (next >= crashAt) {
          clearInterval(timerRef.current!);
          handleCrash(next);
          return next;
        }
        setPlanePos({ x: next * 35, y: next * 12 });
        return next;
      });
    }, 100);
  };

  const handleCrash = (point: number) => {
    setGameState('crashed');
    setBet1(prev => ({ ...prev, hasBet: false }));
    setBet2(prev => ({ ...prev, hasBet: false }));
    setHistory(prev => [point + "x", ...prev.slice(0, 6)]);
    
    let time = 100;
    setGameState('waiting');
    const interval = setInterval(() => {
      time -= 2;
      setLoadingBar(time);
      if (time <= 0) {
        clearInterval(interval);
        startRound();
      }
    }, 100);
  };

  const cashOut = (panel: number, currentMult: number) => {
    if (panel === 1 && bet1.hasBet) {
      setBalance(prev => prev + (bet1.amount * currentMult));
      setBet1(prev => ({ ...prev, hasBet: false }));
    } else if (panel === 2 && bet2.hasBet) {
      setBalance(prev => prev + (bet2.amount * currentMult));
      setBet2(prev => ({ ...prev, hasBet: false }));
    }
  };

  const placeBet = (panel: number) => {
    if (gameState !== 'waiting') return;
    if (panel === 1 && balance >= bet1.amount) {
      setBalance(prev => prev - bet1.amount);
      setBet1(prev => ({ ...prev, hasBet: true }));
    } else if (panel === 2 && balance >= bet2.amount) {
      setBalance(prev => prev - bet2.amount);
      setBet2(prev => ({ ...prev, hasBet: true }));
    }
  };

  useEffect(() => {
    startRound();
    return () => clearInterval(timerRef.current!);
  }, []);

  return (
    <div style={{ background: '#0b0f18', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#121826' }}>
        <div style={{ color: 'red', fontWeight: 'bold', fontSize: '20px' }}>F16 AVIATOR</div>
        <div style={{ color: '#00ff7b', fontWeight: 'bold' }}>{balance.toFixed(2)} PKR</div>
      </div>

      {/* History */}
      <div style={{ display: 'flex', gap: '8px', padding: '8px', overflowX: 'auto', background: '#0a0e17' }}>
        {history.map((h, i) => (
          <span key={i} style={{ color: '#a3a3ff', fontSize: '12px', fontWeight: 'bold', background: '#1b2335', padding: '2px 8px', borderRadius: '10px' }}>{h}</span>
        ))}
      </div>

      {/* Game Stage */}
      <div style={{ 
        position: 'relative', height: '280px', margin: '10px', borderRadius: '15px', overflow: 'hidden',
        backgroundImage: 'url("/background.jpg")', backgroundSize: 'cover' 
      }}>
        <div style={{ position: 'absolute', width: '100%', textAlign: 'center', top: '35%', fontSize: '50px', fontWeight: 'bold', zIndex: 10 }}>
          {gameState === 'waiting' ? <span style={{color: 'red', fontSize: '20px'}}>WAITING FOR NEXT ROUND</span> : multiplier.toFixed(2) + "x"}
        </div>

        {gameState === 'flying' && (
          <>
            <div style={{ position: 'absolute', bottom: '65px', left: 0, width: planePos.x + 20, height: '4px', background: 'red', boxShadow: '0 0 15px red' }} />
            <img src="/jet.png" style={{ position: 'absolute', width: '70px', left: planePos.x, bottom: planePos.y, transition: '0.1s linear', zIndex: 5 }} />
          </>
        )}

        {gameState === 'waiting' && (
          <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '4px', background: '#333' }}>
            <div style={{ width: `${loadingBar}%`, height: '100%', background: 'red' }} />
          </div>
        )}
      </div>

      {/* Two Betting Panels */}
      <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* Panel 1 */}
        <div style={{ background: '#121826', padding: '12px', borderRadius: '15px', border: '1px solid #222' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
            <button onClick={() => setBet1({...bet1, isAuto: !bet1.isAuto})} style={{ background: bet1.isAuto ? '#00c853' : '#1b2335', border: 'none', color: 'white', padding: '2px 10px', borderRadius: '5px' }}>Auto {bet1.isAuto ? 'ON' : 'OFF'}</button>
            {bet1.isAuto && <input type="number" step="0.1" value={bet1.autoValue} onChange={(e) => setBet1({...bet1, autoValue: Number(e.target.value)})} style={{ width: '50px', background: '#0b0f18', color: 'white', border: '1px solid #333' }} />}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="number" value={bet1.amount} onChange={(e) => setBet1({...bet1, amount: Number(e.target.value)})} style={{ flex: 1, background: '#0b0f18', color: 'white', border: '1px solid #333', borderRadius: '8px', padding: '5px' }} />
            {!bet1.hasBet ? (
              <button onClick={() => placeBet(1)} disabled={gameState !== 'waiting'} style={{ flex: 1, background: '#00c853', borderRadius: '10px', border: 'none', color: 'white', fontWeight: 'bold' }}>BET</button>
            ) : (
              <button onClick={() => cashOut(1, multiplier)} disabled={gameState !== 'flying'} style={{ flex: 1, background: '#ff9800', borderRadius: '10px', border: 'none', color: 'white', fontWeight: 'bold' }}>CASH OUT<br/>{(bet1.amount * multiplier).toFixed(2)}</button>
            )}
          </div>
        </div>

        {/* Panel 2 */}
        <div style={{ background: '#121826', padding: '12px', borderRadius: '15px', border: '1px solid #222' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
            <button onClick={() => setBet2({...bet2, isAuto: !bet2.isAuto})} style={{ background: bet2.isAuto ? '#00c853' : '#1b2335', border: 'none', color: 'white', padding: '2px 10px', borderRadius: '5px' }}>Auto {bet2.isAuto ? 'ON' : 'OFF'}</button>
            {bet2.isAuto && <input type="number" step="0.1" value={bet2.autoValue} onChange={(e) => setBet2({...bet2, autoValue: Number(e.target.value)})} style={{ width: '50px', background: '#0b0f18', color: 'white', border: '1px solid #333' }} />}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="number" value={bet2.amount} onChange={(e) => setBet2({...bet2, amount: Number(e.target.value)})} style={{ flex: 1, background: '#0b0f18', color: 'white', border: '1px solid #333', borderRadius: '8px', padding: '5px' }} />
            {!bet2.hasBet ? (
              <button onClick={() => placeBet(2)} disabled={gameState !== 'waiting'} style={{ flex: 1, background: '#00c853', borderRadius: '10px', border: 'none', color: 'white', fontWeight: 'bold' }}>BET</button>
            ) : (
              <button onClick={() => cashOut(2, multiplier)} disabled={gameState !== 'flying'} style={{ flex: 1, background: '#ff9800', borderRadius: '10px', border: 'none', color: 'white', fontWeight: 'bold' }}>CASH OUT<br/>{(bet2.amount * multiplier).toFixed(2)}</button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
