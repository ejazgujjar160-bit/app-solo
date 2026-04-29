"use client";
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, update } from "firebase/database";

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

export default function F16AviatorFinal() {
  const [user, setUser] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [gameState, setGameState] = useState<'waiting' | 'flying' | 'crashed'>('waiting'); 
  const [history, setHistory] = useState<string[]>(["1.14x", "3.5x", "1.20x", "1.05x", "2.10x"]);
  const [planePos, setPlanePos] = useState({ x: 0, y: 0 });
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [showFullHistory, setShowFullHistory] = useState<boolean>(false);

  const [bet1, setBet1] = useState({ amount: 16.00, hasBet: false, auto: false, autoVal: 2.0, cashedOut: false, pending: false });
  const [bet2, setBet2] = useState({ amount: 16.00, hasBet: false, auto: false, autoVal: 2.0, cashedOut: false, pending: false });

  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("f16_user");
    if (savedUser) {
      setUser(savedUser as string);
      onValue(ref(db, 'users/' + savedUser), (snapshot) => {
        if (snapshot.exists()) setBalance(snapshot.val().balance);
      });
    }
    startWaitingPeriod();
    return () => { if (gameTimerRef.current) clearInterval(gameTimerRef.current); };
  }, []);

  const updateBalanceInDB = async (newBal: number) => {
    if (user) await update(ref(db, 'users/' + user), { balance: newBal });
  };

  const startWaitingPeriod = () => {
    setGameState('waiting');
    setLoadingProgress(0);
    // راؤنڈ ختم ہونے پر بیٹ ختم کر دیں تاکہ اگلی بار خود نہ لگے
    setBet1(prev => ({ ...prev, hasBet: false, cashedOut: false }));
    setBet2(prev => ({ ...prev, hasBet: false, cashedOut: false }));

    let progress = 0;
    const interval = setInterval(() => {
      progress += 1;
      setLoadingProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        startRound();
      }
    }, 80); 
  };

  const startRound = () => {
    // بیٹ لگتے ہی بیلنس کاٹنا
    let currentBalance = balance;
    if (bet1.pending) {
        currentBalance -= bet1.amount;
        setBet1(p => ({...p, hasBet: true, pending: false}));
    }
    if (bet2.pending) {
        currentBalance -= bet2.amount;
        setBet2(p => ({...p, hasBet: true, pending: false}));
    }
    updateBalanceInDB(currentBalance);

    setGameState('flying');
    setMultiplier(1.00);
    if (audioRef.current) audioRef.current.play().catch(() => {});

    // پرافٹ لاجک: 55/45 اور ہائی ملٹی پلائر (7000x تک)
    let crashAt;
    const luck = Math.random() * 100;
    if (luck <= 55) {
      crashAt = parseFloat((Math.random() * 0.5 + 1.01).toFixed(2)); 
    } else {
      // کبھی کبھی بہت اوپر جائے گا (6000x+)
      const superLuck = Math.random() * 100;
      if (superLuck > 98) crashAt = parseFloat((Math.random() * 5000 + 1000).toFixed(2));
      else crashAt = parseFloat((Math.random() * 10 + 1.5).toFixed(2));
    }

    gameTimerRef.current = setInterval(() => {
      setMultiplier(prev => {
        const next = parseFloat((prev + (prev < 10 ? 0.01 : prev * 0.01)).toFixed(2));
        
        if (bet1.hasBet && bet1.auto && !bet1.cashedOut && next >= bet1.autoVal) handleCashOut(1, next);
        if (bet2.hasBet && bet2.auto && !bet2.cashedOut && next >= bet2.autoVal) handleCashOut(2, next);

        if (next >= crashAt) {
          if (gameTimerRef.current) clearInterval(gameTimerRef.current);
          setGameState('crashed');
          setHistory(h => [`${next}x`, ...h].slice(0, 50));
          setTimeout(() => startWaitingPeriod(), 3000);
          return next;
        }
        setPlanePos({ x: Math.min((next - 1) * 20 + 10, 260), y: Math.min(Math.pow(next - 1, 0.5) * 40 + 10, 160) });
        return next;
      });
    }, 80);
  };

  const handleCashOut = (num: number, currentMult: number) => {
    if (gameState !== 'flying') return;
    if (num === 1 && bet1.hasBet && !bet1.cashedOut) {
      updateBalanceInDB(balance + (bet1.amount * currentMult));
      setBet1(prev => ({ ...prev, cashedOut: true }));
    } else if (num === 2 && bet2.hasBet && !bet2.cashedOut) {
      updateBalanceInDB(balance + (bet2.amount * currentMult));
      setBet2(prev => ({ ...prev, cashedOut: true }));
    }
  };

  const BetControl = ({ data, setData, num }: any) => (
    <div style={{ background: '#1b1c20', padding: '10px', borderRadius: '15px', marginBottom: '8px', border: '1px solid #2c2d31' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => {
            if (gameState === 'flying') handleCashOut(num, multiplier);
            else setData({...data, pending: !data.pending});
          }}
          style={{ flex: 1, background: data.cashedOut ? '#444' : (gameState === 'flying' && data.hasBet ? '#ff9800' : (data.pending ? '#d32f2f' : '#28a745')), color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold' }}
        >
          {gameState === 'flying' && data.hasBet && !data.cashedOut ? `CASH OUT` : (data.pending ? "CANCEL" : "BET")}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#0b0f18', minHeight: '100vh', color: 'white' }} onClick={() => audioRef.current?.play()}>
      <audio ref={audioRef} src="/background-track.mp3" loop />
      <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: 'red', fontWeight: 'bold' }}>F16 AVIATOR</span>
        <span style={{ color: '#00ff7b' }}>{balance.toFixed(2)} PKR</span>
      </div>

      <div style={{ position: 'relative', height: '220px', margin: '10px', borderRadius: '15px', background: `url('/background.jpg') center/cover` }}>
        <div style={{ position: 'absolute', width: '100%', top: '40%', textAlign: 'center', fontSize: '40px', fontWeight: 'bold' }}>
          {gameState === 'crashed' ? <span style={{color:'red'}}>FLEW AWAY!</span> : gameState === 'waiting' ? 'WAITING...' : multiplier.toFixed(2) + 'x'}
        </div>
        {gameState === 'flying' && <img src="/jet.png" style={{ position: 'absolute', width: '60px', left: planePos.x, bottom: planePos.y }} />}
      </div>

      <div style={{ padding: '10px' }}>
        <BetControl data={bet1} setData={setBet1} num={1} />
        <BetControl data={bet2} setData={setBet2} num={2} />
      </div>
    </div>
  );
}
