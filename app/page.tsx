"use client";
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, get } from "firebase/database";

// --- فائر بیس کنفیگریشن ---
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
  // --- یوزر اور لاگ ان اسٹیٹس ---
  const [user, setUser] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [balance, setBalance] = useState(0);
  const [isLoggingIn, setIsLoggingIn] = useState(true);

  // --- گیم اسٹیٹس (آپ کا ڈیزائن) ---
  const [multiplier, setMultiplier] = useState(1.00);
  const [gameState, setGameState] = useState<'waiting' | 'flying' | 'crashed'>('waiting');
  const [history, setHistory] = useState(["1.14x", "3.5x", "3.78x", "2.82x", "4.54x"]);
  const [planePos, setPlanePos] = useState({ x: 0, y: 0 });
  const [loadingProgress, setLoadingProgress] = useState(100);

  const gameTimerRef = useRef<any>(null);
  const loadingTimerRef = useRef<any>(null);
  const mainAudioRef = useRef<HTMLAudioElement | null>(null);
  const cashOutAudioRef = useRef<HTMLAudioElement | null>(null);

  const [bet1, setBet1] = useState({ amount: 16.00, hasBet: false, auto: false, autoValue: 2.00 });
  const [bet2, setBet2] = useState({ amount: 16.00, hasBet: false, auto: false, autoValue: 2.00 });

  // --- آٹو لاگ ان اور فائر بیس ڈیٹا ---
  useEffect(() => {
    const savedUser = localStorage.getItem("f16_user");
    if (savedUser) {
      setUser(savedUser);
      const userRef = ref(db, 'users/' + savedUser);
      onValue(userRef, (snapshot) => {
        if (snapshot.exists()) setBalance(snapshot.val().balance);
      });
    }
    setIsLoggingIn(false);
  }, []);

  const handleAuth = async () => {
    if (phone.length < 10 || password.length < 4) return alert("Sahi Details Likhein!");
    const userId = phone;
    const userRef = ref(db, 'users/' + userId);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      if (snapshot.val().password === password) {
        localStorage.setItem("f16_user", userId);
        setUser(userId);
      } else {
        alert("Ghalat Password!");
      }
    } else {
      await set(userRef, { phone, password, balance: 5000 });
      localStorage.setItem("f16_user", userId);
      setUser(userId);
    }
  };

  // --- گیم لاجک ---
  const startRound = () => {
    setGameState('flying');
    setMultiplier(1.00);
    setPlanePos({ x: 0, y: 0 });
    const crashAt = (Math.random() * 4 + 1.1).toFixed(2);

    gameTimerRef.current = setInterval(() => {
      setMultiplier(prev => {
        const next = parseFloat((prev + 0.02).toFixed(2));
        if (next >= parseFloat(crashAt)) {
          clearInterval(gameTimerRef.current);
          finishRound(next);
          return next;
        }
        setPlanePos({ x: Math.min(next * 30, 260), y: Math.min(next * 20, 140) });
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
    setTimeout(() => {
      setGameState('waiting');
      loadingTimerRef.current = setInterval(() => {
        time -= 2;
        setLoadingProgress(time);
        if (time <= 0) {
          clearInterval(loadingTimerRef.current);
          startRound();
        }
      }, 100);
    }, 2000);
  };

  const cashOut = (panel: number) => {
    if (gameState !== 'flying') return;
    let win = 0;
    if (panel === 1 && bet1.hasBet) win = bet1.amount * multiplier;
    if (panel === 2 && bet2.hasBet) win = bet2.amount * multiplier;

    if (win > 0) {
      const newBalance = balance + win;
      setBalance(newBalance);
      set(ref(db, 'users/' + user + '/balance'), newBalance);
      if (panel === 1) setBet1(p => ({ ...p, hasBet: false }));
      else setBet2(p => ({ ...p, hasBet: false }));
      if (cashOutAudioRef.current) cashOutAudioRef.current.play().catch(() => {});
    }
  };

  const placeBet = (panel: number) => {
    if (gameState !== 'waiting') return;
    const amt = panel === 1 ? bet1.amount : bet2.amount;
    if (balance >= amt) {
      const newBalance = balance - amt;
      setBalance(newBalance);
      set(ref(db, 'users/' + user + '/balance'), newBalance);
      if (panel === 1) setBet1(p => ({ ...p, hasBet: true }));
      else setBet2(p => ({ ...p, hasBet: true }));
    }
  };

  // --- آپ کا ڈیزائن کردہ پینل ---
  const BetControlPanel = ({ betData, setBetData, panelNum }: any) => (
    <div style={{ background: '#1b1c20', padding: '12px', borderRadius: '15px', border: '1px solid #2c2d31' }}>
      <div style={{ display: 'flex', background: '#000', borderRadius: '20px', padding: '2px', marginBottom: '10px' }}>
        <button onClick={() => setBetData({...betData, auto: false})} style={{ flex: 1, border: 'none', background: !betData.auto ? '#2c2d31' : 'transparent', color: '#fff', padding: '5px', borderRadius: '20px' }}>Bet</button>
        <button onClick={() => setBetData({...betData, auto: true})} style={{ flex: 1, border: 'none', background: betData.auto ? '#2c2d31' : 'transparent', color: '#fff', padding: '5px', borderRadius: '20px' }}>Auto</button>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', background: '#000', borderRadius: '20px', padding: '5px 10px' }}>
            <button onClick={() => setBetData({...betData, amount: Math.max(1, betData.amount - 1)})} style={{color: 'white', background: 'none', border: 'none'}}>−</button>
            <span>{betData.amount.toFixed(2)}</span>
            <button onClick={() => setBetData({...betData, amount: betData.amount + 1})} style={{color: 'white', background: 'none', border: 'none'}}>+</button>
          </div>
        </div>
        {!betData.hasBet ? (
          <button onClick={() => placeBet(panelNum)} disabled={gameState !== 'waiting'} style={{ flex: 1, background: '#28a745', borderRadius: '12px', color: 'white', border: 'none', padding: '10px' }}>BET</button>
        ) : (
          <button onClick={() => cashOut(panelNum)} style={{ flex: 1, background: '#ff9800', borderRadius: '12px', color: 'white', border: 'none', padding: '10px' }}>CASH OUT</button>
        )}
      </div>
    </div>
  );

  if (isLoggingIn) return <div style={{color: 'white', textAlign: 'center', padding: '50px'}}>Loading...</div>;

  if (!user) {
    return (
      <div style={{ background: '#0b0f18', height: '100vh', display: 'flex', flexDirection: 'center', justifyContent: 'center', alignItems: 'center', color: 'white', flexDirection: 'column' }}>
        <h2 style={{color: 'red'}}>F-16 AVIATOR</h2>
        <input type="text" placeholder="Mobile Number" value={phone} onChange={(e)=>setPhone(e.target.value)} style={{padding:'12px', margin:'5px', width:'250px', borderRadius:'8px', color:'black'}}/>
        <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} style={{padding:'12px', margin:'5px', width:'250px', borderRadius:'8px', color:'black'}}/>
        <button onClick={handleAuth} style={{padding:'12px 40px', background:'#00c853', color:'white', border:'none', borderRadius:'8px', marginTop:'10px'}}>LOGIN / SIGNUP</button>
      </div>
    );
  }

  return (
    <div style={{ background: '#0b0f18', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#121826' }}>
        <div style={{ color: 'red', fontWeight: 'bold', fontSize: '22px' }}>F16</div>
        <div style={{ color: '#00ff7b', fontWeight: 'bold' }}>{balance.toFixed(2)} PKR</div>
      </div>
      <div style={{ display: 'flex', gap: '5px', padding: '8px', overflowX: 'auto' }}>
        {history.map((h, i) => (
          <span key={i} style={{ color: '#a3a3ff', fontSize: '11px', background: '#1b2335', padding: '2px 8px', borderRadius: '10px' }}>{h}</span>
        ))}
      </div>
      <div style={{ position: 'relative', width: '95%', margin: '10px auto', borderRadius: '15px', height: '250px', background: '#070a10', border: '1px solid #333' }}>
        <div style={{ position: 'absolute', width: '100%', textAlign: 'center', top: '40%', fontSize: '45px', fontWeight: 'bold' }}>
          {gameState === 'crashed' ? <span style={{color: 'red'}}>FLEW AWAY!</span> : multiplier.toFixed(2) + "x"}
        </div>
        {gameState === 'flying' && (
           <img src="https://pngimg.com/uploads/jet_fighter/jet_fighter_PNG44.png" style={{ position: 'absolute', width: '60px', left: planePos.x, bottom: planePos.y }} alt="jet" />
        )}
      </div>
      <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <BetControlPanel betData={bet1} setBetData={setBet1} panelNum={1} />
        <BetControlPanel betData={bet2} setBetData={setBet2} panelNum={2} />
      </div>
      <audio ref={mainAudioRef} src="/background-track.mp3" loop />
      <audio ref={cashOutAudioRef} src="/cash-out.mp3" />
    </div>
  );
}
