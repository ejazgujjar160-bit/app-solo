"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function F16AviatorFinal() {
  const [balance, setBalance] = useState(441.55);
  const [multiplier, setMultiplier] = useState(1.00);
  const [gameState, setGameState] = useState<'waiting' | 'flying' | 'crashed'>('waiting');
  const [history, setHistory] = useState(["1.14x", "3.5x", "3.78x", "2.82x", "4.54x", "5.72x"]);
  const [planePos, setPlanePos] = useState({ x: 0, y: 0 });
  const [loadingProgress, setLoadingProgress] = useState(100);

  // ٹائمرز کے لیے ریفرنسز
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // بیٹنگ سٹیٹس
  const [bet1, setBet1] = useState({ amount: 100, hasBet: false, auto: false, autoValue: 2.00 });
  const [bet2, setBet2] = useState({ amount: 100, hasBet: false, auto: false, autoValue: 2.00 });

  // گیم لاجک: راؤنڈ شروع کرنا
  const startRound = () => {
    setGameState('flying');
    setMultiplier(1.00);
    setPlanePos({ x: 0, y: 0 });
    const crashAt = (Math.random() * 8 + 1.1).toFixed(2); // رینڈم کریش پوائنٹ

    gameTimerRef.current = setInterval(() => {
      setMultiplier(prev => {
        const next = parseFloat((prev + 0.02).toFixed(2));

        // اٹو کیش آؤٹ لاجک
        if (bet1.hasBet && bet1.auto && next >= bet1.autoValue) cashOut(1, next);
        if (bet2.hasBet && bet2.auto && next >= bet2.autoValue) cashOut(2, next);

        if (next >= parseFloat(crashAt)) {
          clearInterval(gameTimerRef.current!);
          finishRound(next);
          return next;
        }

        // جہاز اور گراف کی حرکت (16:9 تناسب کے لیے)
        const x = Math.min(next * 35, 290); // زیادہ سے زیادہ چوڑائی
        const y = Math.min(next * 18, 160); // زیادہ سے زیادہ اونچائی
        setPlanePos({ x, y });

        return next;
      });
    }, 80);
  };

  // گیم لاجک: کریش ہونا اور اگلا راؤنڈ
  const finishRound = (point: number) => {
    setGameState('crashed');
    setBet1(prev => ({ ...prev, hasBet: false }));
    setBet2(prev => ({ ...prev, hasBet: false }));
    setHistory(prev => [`${point}x`, ...prev.slice(0, 6)]);
    
    // 5 سیکنڈ کی لوڈنگ پٹی
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

  // کیش آؤٹ کرنے کا فنکشن
  const cashOut = (panel: number, currentMult: number) => {
    const winningMult = parseFloat(currentMult.toFixed(2));
    if (panel === 1 && bet1.hasBet) {
      setBalance(prev => prev + (bet1.amount * winningMult));
      setBet1(prev => ({ ...prev, hasBet: false }));
    } else if (panel === 2 && bet2.hasBet) {
      setBalance(prev => prev + (bet2.amount * winningMult));
      setBet2(prev => ({ ...prev, hasBet: false }));
    }
  };

  // بیٹ لگانے کا فنکشن
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

  // رقم تبدیل کرنے کا فنکشن (لمٹ 15000)
  const changeBetAmount = (panel: number, amount: number) => {
    let newAmount = Math.max(10, Math.min(15000, amount));
    if (panel === 1) setBet1(prev => ({ ...prev, amount: newAmount }));
    else setBet2(prev => ({ ...prev, amount: newAmount }));
  };

  useEffect(() => {
    startRound();
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
    };
  }, []);

  // بیٹنگ پینل کا کمپوننٹ
  const BetControlPanel = ({ betData, setBetData, panelNum }: any) => (
    <div style={{ background: '#121826', padding: '12px', borderRadius: '15px', border: '1px solid #333' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
        <button 
          onClick={() => setBetData({...betData, auto: !betData.auto})} 
          style={{ background: betData.auto ? '#00c853' : '#1b2335', color: 'white', border: 'none', padding: '3px 10px', borderRadius: '5px' }}
        >
          Auto {betData.auto ? 'ON' : 'OFF'}
        </button>
        {betData.auto && (
          <input type="number" step="0.1" value={betData.autoValue} onChange={(e) => setBetData({...betData, autoValue: Number(e.target.value)})} style={{ width: '50px', background: '#0b0f18', color: 'white', border: '1px solid #333', fontSize: '12px', padding: '2px' }} />
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
        {/* پلس مائنس اور رقم */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#0b0f18', borderRadius: '8px', border: '1px solid #333', flex: 1, padding: '5px' }}>
          <button onClick={() => changeBetAmount(panelNum, betData.amount - 100)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px' }}>−</button>
          <input type="number" value={betData.amount} onChange={(e) => changeBetAmount(panelNum, Number(e.target.value))} style={{ flex: 1, background: 'none', color: 'white', border: 'none', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }} />
          <button onClick={() => changeBetAmount(panelNum, betData.amount + 100)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px' }}>+</button>
        </div>

        {/* بیٹ/کیش آؤٹ بٹن */}
        {!betData.hasBet ? (
          <button onClick={() => placeBet(panelNum)} disabled={gameState !== 'waiting'} style={{ width: '110px', height: '45px', background: gameState === 'waiting' ? '#00c853' : '#333', borderRadius: '10px', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
            BET
          </button>
        ) : (
          <button onClick={() => cashOut(panelNum, multiplier)} disabled={gameState !== 'flying'} style={{ width: '110px', height: '45px', background: '#ff9800', borderRadius: '10px', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
            CASH OUT<br/>{(betData.amount * multiplier).toFixed(2)}
          </button>
        )}
      </div>

      {/* کوئیک بیٹ بٹنز */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
        {[100, 200, 500, 1000].map(amt => (
          <button key={amt} onClick={() => changeBetAmount(panelNum, amt)} style={{ background: '#1b2335', color: 'white', border: 'none', padding: '6px', borderRadius: '6px', fontSize: '12px' }}>{amt}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ background: '#0b0f18', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#121826' }}>
        <div style={{ color: 'red', fontWeight: 'bold', fontSize: '22px' }}>F16</div>
        <div style={{ color: '#00ff7b', fontWeight: 'bold', fontSize: '18px' }}>{balance.toFixed(2)} PKR</div>
      </div>

      {/* History */}
      <div style={{ display: 'flex', gap: '8px', padding: '8px', overflowX: 'auto', background: '#0a0e17' }}>
        {history.map((h, i) => (
          <span key={i} style={{ color: '#a3a3ff', fontSize: '13px', fontWeight: 'bold', background: '#1b2335', padding: '2px 8px', borderRadius: '10px' }}>{h}</span>
        ))}
      </div>

      {/* Game Stage (YouTube Long Video Ratio: 16:9) */}
      <div style={{ 
        position: 'relative', width: '95%', margin: '15px auto', borderRadius: '20px', overflow: 'hidden', border: '2px solid #333',
        aspectRatio: '16/9', // یہ سائز کو لانگ ویڈیو جیسا بنا دے گا
        backgroundImage: 'url("/background.jpg")', backgroundSize: 'cover', backgroundPosition: 'center'
      }}>
        
        {/* Multiplier / Waitting Text */}
        <div style={{ position: 'absolute', width: '100%', textAlign: 'center', top: '35%', fontSize: '60px', fontWeight: 'bold', zIndex: 10, textShadow: '0 0 15px rgba(0,0,0,0.8)' }}>
          {gameState === 'waiting' ? <span style={{color: 'red', fontSize: '18px'}}>WAITING...</span> : multiplier.toFixed(2) + "x"}
        </div>

        {/* نیا گراف اور جہاز کا ڈیزائن (Z-index Fix) */}
        {gameState === 'flying' && (
          <>
            {/* جہاز کے پیچھے گراف کی لائن (SVG Curve) */}
            <svg style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 4, left: 0, bottom: 0 }}>
              <path 
                d={`M 0 200 Q ${planePos.x / 2} ${200 - planePos.y / 1.5} ${planePos.x} ${200 - planePos.y}`} 
                stroke="#00ff00" // سبز رنگ کا گراف
                strokeWidth="5" 
                fill="none" 
                style={{ transition: 'linear 0.08s' }}
              />
            </svg>
            {/* جہاز کی تصویر - گراف کے اوپر */}
            <img 
              src="/jet.png" 
              style={{ position: 'absolute', width: '100px', left: planePos.x - 20, bottom: planePos.y - 15, transition: 'linear 0.08s', zIndex: 5 }} 
            />
          </>
        )}

        {/* لوڈنگ پٹی */}
        {gameState === 'waiting' && (
          <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '5px', background: '#333' }}>
            <div style={{ width: `${loadingProgress}%`, height: '100%', background: 'red', transition: 'linear 0.1s' }} />
          </div>
        )}
        
        <div style={{ position: 'absolute', right: '10px', bottom: '10px', fontSize: '14px', color: '#aaa', background: 'rgba(0,0,0,0.5)', padding: '3px 8px', borderRadius: '10px' }}>👥 1,436</div>
      </div>

      {/* Two Betting Panels */}
      <div style={{ padding: '0 10px 20px 10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <BetControlPanel betData={bet1} setBetData={setBet1} panelNum={1} />
        <BetControlPanel betData={bet2} setBetData={setBet2} panelNum={2} />
      </div>
    </div>
  );
}
