"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function F16ProAviator() {
  const [balance, setBalance] = useState(272.55);
  const [multiplier, setMultiplier] = useState(1.00);
  const [gameState, setGameState] = useState<'waiting' | 'flying' | 'crashed'>('waiting');
  const [history, setHistory] = useState(["5.1x", "4.38x", "1.64x", "4.23x", "2.20x"]);
  const [planePos, setPlanePos] = useState({ x: 0, y: 0 });
  const [loadingBar, setLoadingBar] = useState(100);

  // دو الگ الگ بیٹنگ پینلز کے لیے سٹیٹس
  const [bet1, setBet1] = useState({ amount: 10, hasBet: false, autoValue: 2.00, autoOn: false });
  const [bet2, setBet2] = useState({ amount: 10, hasBet: false, autoValue: 2.00, autoOn: false });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // گیم کا مرکزی لاجک
  const startRound = () => {
    setGameState('flying');
    setMultiplier(1.00);
    setPlanePos({ x: 0, y: 0 });
    const crashAt = (Math.random() * 5 + 1.1); // رینڈم کریش پوائنٹ

    timerRef.current = setInterval(() => {
      setMultiplier(prev => {
        const next = parseFloat((prev + 0.02).toFixed(2));

        // Auto Cashout Check for Bet 1
        if (bet1.hasBet && bet1.autoOn && next >= bet1.autoValue) {
          handleCashOut(1, next);
        }
        // Auto Cashout Check for Bet 2
        if (bet2.hasBet && bet2.autoOn && next >= bet2.autoValue) {
          handleCashOut(2, next);
        }

        if (next >= crashAt) {
          clearInterval(timerRef.current!);
          finishRound(next);
          return next;
        }

        // جہاز اب اوپر کی طرف (Diagonal) اڑے گا
        const x = Math.min(next * 40, 280); 
        const y = Math.min(next * 15, 180);
        setPlanePos({ x, y });

        return next;
      });
    }, 80);
  };

  const finishRound = (point: number) => {
    setGameState('crashed');
    setBet1(prev => ({ ...prev, hasBet: false }));
    setBet2(prev => ({ ...prev, hasBet: false }));
    setHistory(prev => [point + "x", ...prev.slice(0, 6)]);
    
    // راؤنڈ کے درمیان لوڈنگ پٹی
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

  const handleCashOut = (panel: number, currentMult: number) => {
    if (panel === 1 && bet1.hasBet) {
      setBalance(prev => prev + (bet1.amount * currentMult));
      setBet1(prev => ({ ...prev, hasBet: false }));
    } else if (panel === 2 && bet2.hasBet) {
      setBalance(prev => prev + (bet2.amount * currentMult));
      setBet2(prev => ({ ...prev, hasBet: false }));
    }
  };

  useEffect(() => {
    startRound();
    return () => clearInterval(timerRef.current!);
  }, []);

  // رقم کم زیادہ کرنے والے پلس مائنس بٹنز کا فنکشن
  const changeAmount = (panel: number, type: 'plus' | 'minus') => {
    const update = (prev: any) => {
      let newAmount = type === 'plus' ? prev.amount + 10 : prev.amount - 10;
      if (newAmount < 10) newAmount = 10;
      return { ...prev, amount: newAmount };
    };
    panel === 1 ? setBet1(update) : setBet2(update);
  };

  // بیٹنگ پینل کا کمپوننٹ
  const BetPanel = ({ data, panelNum }: { data: any, panelNum: number }) => (
    <div style={{ background: '#121826', padding: '12px', borderRadius: '15px', border: '1px solid #222' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <button 
          onClick={() => (panelNum === 1 ? setBet1({...bet1, autoOn: !bet1.autoOn}) : setBet2({...bet2, autoOn: !bet2.autoOn}))}
          style={{ background: data.autoOn ? '#00c853' : '#1b2335', border: 'none', color: 'white', padding: '3px 10px', borderRadius: '5px', fontSize: '12px' }}
        >
          Auto {data.autoOn ? 'ON' : 'OFF'}
        </button>
        {data.autoOn && (
          <input 
            type="number" step="0.1" value={data.autoValue} 
            onChange={(e) => (panelNum === 1 ? setBet1({...bet1, autoValue: Number(e.target.value)}) : setBet2({...bet2, autoValue: Number(e.target.value)}))}
            style={{ width: '50px', background: '#0b0f18', color: 'white', border: '1px solid #333', fontSize: '12px' }}
          />
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {/* پلس مائنس بٹنز */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#0b0f18', borderRadius: '8px', border: '1px solid #333' }}>
          <button onClick={() => changeAmount(panelNum, 'minus')} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', padding: '0 10px' }}>−</button>
          <span style={{ fontSize: '16px', fontWeight: 'bold', minWidth: '40px', textAlign: 'center' }}>{data.amount}</span>
          <button onClick={() => changeAmount(panelNum, 'plus')} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', padding: '0 10px' }}>+</button>
        </div>

        {!data.hasBet ? (
          <button onClick={() => placeBet(panelNum)} disabled={gameState !== 'waiting'} style={{ flex: 1, height: '40px', background: gameState === 'waiting' ? '#00c853' : '#333', borderRadius: '10px', border: 'none', color: 'white', fontWeight: 'bold' }}>
            BET
          </button>
        ) : (
          <button onClick={() => handleCashOut(panelNum, multiplier)} disabled={gameState !== 'flying'} style={{ flex: 1, height: '40px', background: '#ff9800', borderRadius: '10px', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
            CASH OUT<br/>{(data.amount * multiplier).toFixed(2)}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ background: '#0b0f18', color: 'white', minHeight: '100vh', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#121826' }}>
        <div style={{ color: 'red', fontWeight: 'bold', fontSize: '20px' }}>F16</div>
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
        position: 'relative', height: '300px', margin: '10px', borderRadius: '20px', overflow: 'hidden',
        backgroundImage: 'url("/background.jpg")', backgroundSize: 'cover', border: '1px solid #222'
      }}>
        <div style={{ position: 'absolute', width: '100%', textAlign: 'center', top: '35%', fontSize: '55px', fontWeight: 'bold', zIndex: 10 }}>
          {gameState === 'waiting' ? <span style={{color: 'red', fontSize: '18px'}}>WAITING FOR NEXT ROUND</span> : multiplier.toFixed(2) + "x"}
        </div>

        {/* نیا گراف اور جہاز کا ڈیزائن */}
        {gameState === 'flying' && (
          <>
            {/* جہاز کے پیچھے گراف کی لائن */}
            <svg style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 4, left: 0, bottom: 0 }}>
              <path 
                d={`M 0 250 Q ${planePos.x / 2} ${250 - planePos.y / 1.5} ${planePos.x} ${250 - planePos.y}`} 
                stroke="red" 
                strokeWidth="4" 
                fill="none" 
                style={{ transition: '0.1s linear' }}
              />
            </svg>
            <img 
              src="/jet.png" 
              style={{ position: 'absolute', width: '100px', left: planePos.x - 20, bottom: planePos.y - 10, transition: '0.1s linear', zIndex: 5 }} 
            />
          </>
        )}

        {/* لوڈنگ پٹی */}
        {gameState === 'waiting' && (
          <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '4px', background: '#333' }}>
            <div style={{ width: `${loadingBar}%`, height: '100%', background: 'red' }} />
          </div>
        )}
      </div>

      {/* Two Betting Panels */}
      <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <BetPanel data={bet1} panelNum={1} />
        <BetPanel data={bet2} panelNum={2} />
      </div>
    </div>
  );
}
