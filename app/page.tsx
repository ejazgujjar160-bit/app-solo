"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function F16AviatorFinal() {
  const [balance, setBalance] = useState(441.55);
  const [multiplier, setMultiplier] = useState(1.00);
  const [gameState, setGameState] = useState<'waiting' | 'flying' | 'crashed'>('waiting');
  const [history, setHistory] = useState(["1.14x", "3.5x", "3.78x", "2.82x", "4.54x", "5.72x"]);
  const [planePos, setPlanePos] = useState({ x: 0, y: 0 });
  const [loadingProgress, setLoadingProgress] = useState(100);

  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // بیٹنگ سٹیٹس (ڈیفالٹ رقم 16.00 جیسی اسکرین شاٹ میں ہے)
  const [bet1, setBet1] = useState({ amount: 16.00, hasBet: false, auto: false, autoValue: 2.00 });
  const [bet2, setBet2] = useState({ amount: 16.00, hasBet: false, auto: false, autoValue: 2.00 });

  // راؤنڈ شروع کرنے کا لاجک (25% وننگ ریٹ کے ساتھ)
  const startRound = () => {
    setGameState('flying');
    setMultiplier(1.00);
    setPlanePos({ x: 0, y: 0 });

    // --- بہتر کنٹرولڈ لاجک (سو میں سے 25 جیت) ---
    const chance = Math.random() * 100;
    let crashAt;
    if (chance < 75) {
      // 75% بار جہاز 1.10 سے 1.95 کے درمیان گرے گا (لوگ ہاریں گے)
      crashAt = (Math.random() * 0.85 + 1.10).toFixed(2);
    } else {
      // 25% بار جہاز 2.00 سے 8.00 تک جائے گا (لوگ جیتیں گے)
      crashAt = (Math.random() * 6 + 2.00).toFixed(2);
    }

    gameTimerRef.current = setInterval(() => {
      setMultiplier(prev => {
        const next = parseFloat((prev + 0.02).toFixed(2));
        
        if (bet1.hasBet && bet1.auto && next >= bet1.autoValue) cashOut(1, next);
        if (bet2.hasBet && bet2.auto && next >= bet2.autoValue) cashOut(2, next);

        if (next >= parseFloat(crashAt)) {
          clearInterval(gameTimerRef.current!);
          finishRound(next);
          return next;
        }

        // جہاز کی موومنٹ کو اسکرین کے اندر رکھنا
        const x = Math.min(next * 30, 260);
        const y = Math.min(next * 20, 140);
        setPlanePos({ x, y });
        return next;
      });
    }, 80);
  };

  const finishRound = (point: number) => {
    setGameState('crashed');
    setBet1(prev => ({ ...prev, hasBet: false }));
    setBet2(prev => ({ ...prev, hasBet: false }));
    setHistory(prev => [`${point}x`, ...prev.slice(0, 10)]);
    
    let time = 100;
    setGameState('waiting');
    loadingTimerRef.current = setInterval(() => {
      time -= 2;
      setLoadingProgress(time);
      if (time <= 0) {
        clearInterval(loadingTimerRef.current!);
        startRound();
      }
    }, 100);
  };

  const cashOut = (panel: number, currentMult: number) => {
    if (gameState !== 'flying') return;
    const winningMult = parseFloat(currentMult.toFixed(2));
    if (panel === 1 && bet1.hasBet) {
      setBalance(prev => prev + (bet1.amount * winningMult));
      setBet1(prev => ({ ...prev, hasBet: false }));
    } else if (panel === 2 && bet2.hasBet) {
      setBalance(prev => prev + (bet2.amount * winningMult));
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

  const changeBetAmount = (panel: number, val: number) => {
    if (panel === 1) setBet1(prev => ({ ...prev, amount: Math.max(1, Math.min(15000, prev.amount + val)) }));
    else setBet2(prev => ({ ...prev, amount: Math.max(1, Math.min(15000, prev.amount + val)) }));
  };

  useEffect(() => {
    startRound();
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
    };
  }, []);

  // --- اسکرین شاٹ والا ڈیزائن کمپوننٹ ---
  const BetControlPanel = ({ betData, setBetData, panelNum }: any) => (
    <div style={{ background: '#1b1c20', padding: '12px', borderRadius: '15px', border: '1px solid #2c2d31' }}>
      <div style={{ display: 'flex', background: '#000', borderRadius: '20px', padding: '2px', marginBottom: '10px' }}>
        <button onClick={() => setBetData({...betData, auto: false})} style={{ flex: 1, border: 'none', background: !betData.auto ? '#2c2d31' : 'transparent', color: '#fff', padding: '5px', borderRadius: '20px', fontSize: '13px' }}>Bet</button>
        <button onClick={() => setBetData({...betData, auto: true})} style={{ flex: 1, border: 'none', background: betData.auto ? '#2c2d31' : 'transparent', color: '#fff', padding: '5px', borderRadius: '20px', fontSize: '13px' }}>Auto</button>
      </div>

      <div style={{ display: 'flex', gap: '10px', height: '80px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', borderRadius: '20px', padding: '2px 10px', border: '1px solid #333' }}>
            <button onClick={() => changeBetAmount(panelNum, -1)} style={{ background: '#333', color: 'white', border: 'none', width: '24px', height: '24px', borderRadius: '50%', fontSize: '18px' }}>−</button>
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{betData.amount.toFixed(2)}</span>
            <button onClick={() => changeBetAmount(panelNum, 1)} style={{ background: '#333', color: 'white', border: 'none', width: '24px', height: '24px', borderRadius: '50%', fontSize: '18px' }}>+</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            {[100, 500, 1000, 5000].map(amt => (
              <button key={amt} onClick={() => setBetData({...betData, amount: amt})} style={{ background: '#2c2d31', border: 'none', color: '#9ea0a3', borderRadius: '4px', fontSize: '11px', padding: '3px' }}>{amt}</button>
            ))}
          </div>
        </div>

        {/* متحرک بٹن: Bet یا Cash Out */}
        {!betData.hasBet ? (
          <button onClick={() => placeBet(panelNum)} disabled={gameState !== 'waiting'} style={{ flex: 1, background: gameState === 'waiting' ? '#28a745' : '#444', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>BET</div>
            <div style={{ fontSize: '12px' }}>{betData.amount.toFixed(2)} PKR</div>
          </button>
        ) : (
          <button onClick={() => cashOut(panelNum, multiplier)} disabled={gameState !== 'flying'} style={{ flex: 1, background: '#ff9800', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>CASH OUT</div>
            <div style={{ fontSize: '16px' }}>{(betData.amount * multiplier).toFixed(2)} PKR</div>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ background: '#0b0f18', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#121826' }}>
        <div style={{ color: 'red', fontWeight: 'bold', fontSize: '22px' }}>F16</div>
        <div style={{ color: '#00ff7b', fontWeight: 'bold', fontSize: '18px' }}>{balance.toFixed(2)} PKR</div>
      </div>

      <div style={{ display: 'flex', gap: '5px', padding: '8px', overflowX: 'auto', background: '#0a0e17' }}>
        {history.map((h, i) => (
          <span key={i} style={{ color: '#a3a3ff', fontSize: '11px', background: '#1b2335', padding: '2px 8px', borderRadius: '10px' }}>{h}</span>
        ))}
      </div>

      <div style={{ position: 'relative', width: '95%', margin: '10px auto', borderRadius: '15px', overflow: 'hidden', border: '1px solid #333', aspectRatio: '16/9', background: '#000' }}>
        <div style={{ position: 'absolute', width: '100%', textAlign: 'center', top: '35%', fontSize: '50px', fontWeight: 'bold', zIndex: 10 }}>
          {gameState === 'waiting' ? <span style={{fontSize: '16px', color: 'red'}}>WAITING FOR NEXT ROUND...</span> : multiplier.toFixed(2) + "x"}
        </div>
        
        {gameState === 'flying' && (
          <>
            <svg style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 4 }}>
              <path d={`M 0 180 Q ${planePos.x/2} ${180 - planePos.y/1.5} ${planePos.x} ${180 - planePos.y}`} stroke="#28a745" strokeWidth="4" fill="none" />
            </svg>
            <img src="/f16-jet.png" style={{ position: 'absolute', width: '80px', left: planePos.x - 20, bottom: planePos.y - 10, zIndex: 5 }} alt="jet" />
          </>
        )}

        {gameState === 'waiting' && (
          <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '4px', background: '#333' }}>
            <div style={{ width: `${loadingProgress}%`, height: '100%', background: 'red' }} />
          </div>
        )}
      </div>

      <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <BetControlPanel betData={bet1} setBetData={setBet1} panelNum={1} />
        <BetControlPanel betData={bet2} setBetData={setBet2} panelNum={2} />
      </div>
    </div>
  );
}
