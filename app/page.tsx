"use client";
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, update, get, set, runTransaction } from "firebase/database";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// Firebase Configuration
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
const auth = getAuth(app);

export default function F16AviatorPro() {
  const [user, setUser] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [authStep, setAuthStep] = useState('choice'); 
  
  const [balance, setBalance] = useState(0);
  const [multiplier, setMultiplier] = useState(1.00);
  const [gameState, setGameState] = useState('waiting'); 
  const [history, setHistory] = useState(["1.14x", "3.5x", "1.20x", "1.05x", "2.10x"]);
  const [planePos, setPlanePos] = useState({ x: 0, y: 0 });
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const [bet1, setBet1] = useState({ amount: 16.00, hasBet: false, auto: false, autoVal: 2.0, cashedOut: false });
  const [bet2, setBet2] = useState({ amount: 16.00, hasBet: false, auto: false, autoVal: 2.0, cashedOut: false });

  const gameTimerRef = useRef(null);

  // --- Auth Logic (اصلی OTP سسٹم) ---
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });
    }
  };

  const sendOTP = async () => {
    if(!phoneNumber.startsWith('+')) {
        alert("براہ کرم نمبر +92 کے ساتھ لکھیں");
        return;
    }
    setupRecaptcha();
    const appVerifier = window.recaptchaVerifier;
    try {
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setAuthStep('otp');
    } catch (error) {
      alert("نمبر غلط ہے یا فائر بیس سیٹنگز ادھوری ہیں: " + error.message);
    }
  };

  const verifyOTP = async () => {
    try {
      const result = await confirmationResult.confirm(otp);
      const uid = result.user.uid;
      
      const userRef = ref(db, 'users/' + uid);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        await set(userRef, { balance: 500, phone: phoneNumber, createdAt: Date.now() });
        setBalance(500);
      } else {
        setBalance(snapshot.val().balance);
      }
      
      setUser(uid);
      localStorage.setItem("f16_session", uid);
    } catch (error) {
      alert("غلط کوڈ! دوبارہ کوشش کریں");
    }
  };

  // --- Game Logic ---
  useEffect(() => {
    const saved = localStorage.getItem("f16_session");
    if (saved) {
      setUser(saved);
      const balanceRef = ref(db, 'users/' + saved + '/balance');
      onValue(balanceRef, (s) => {
        if (s.exists()) setBalance(s.val());
      });
    }
    startWaitingPeriod();
    return () => { if(gameTimerRef.current) clearInterval(gameTimerRef.current); };
  }, []);

  // بیلنس اپڈیٹ کرنے کا محفوظ طریقہ (Transaction)
  const updateBalanceServer = async (amountChange) => {
    if (!user) return;
    const userRef = ref(db, 'users/' + user + '/balance');
    await runTransaction(userRef, (currentBalance) => {
      return (currentBalance || 0) + amountChange;
    });
  };

  const startWaitingPeriod = () => {
    setGameState('waiting');
    setLoadingProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += 2;
      setLoadingProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        startRound();
      }
    }, 100);
  };

  const startRound = () => {
    let cost = 0;
    if (bet1.hasBet) cost += bet1.amount;
    if (bet2.hasBet) cost += bet2.amount;

    if (cost > balance) {
      alert("بیلنس کم ہے!");
      setBet1(b => ({...b, hasBet: false}));
      setBet2(b => ({...b, hasBet: false}));
      startWaitingPeriod();
      return;
    }

    if (cost > 0) updateBalanceServer(-cost);

    setGameState('flying');
    setMultiplier(1.00);
    
    // Multiplier Logic (45% Loss, 1% Jackpot 7000x)
    let crashAt;
    const luck = Math.random() * 100;
    if (luck <= 45) crashAt = parseFloat((Math.random() * 0.2 + 1.01).toFixed(2));
    else if (luck >= 99) crashAt = parseFloat((Math.random() * 7000 + 100).toFixed(2));
    else crashAt = parseFloat((Math.random() * 4 + 1.2).toFixed(2));

    gameTimerRef.current = setInterval(() => {
      setMultiplier(prev => {
        const next = parseFloat((prev + (prev < 3 ? 0.01 : prev * 0.02)).toFixed(2));
        
        if (next >= crashAt) {
          clearInterval(gameTimerRef.current);
          setGameState('crashed');
          setHistory(h => [`${next}x`, ...h].slice(0, 15));
          // راؤنڈ ختم ہونے پر بیٹس ری سیٹ (تاکہ دوبارہ خود نہ لگیں)
          setBet1(b => ({...b, hasBet: false, cashedOut: false}));
          setBet2(b => ({...b, hasBet: false, cashedOut: false}));
          setTimeout(() => startWaitingPeriod(), 3000);
          return next;
        }
        setPlanePos({ x: Math.min((next-1)*60, 250), y: Math.min(Math.pow(next-1, 1.2)*35, 150) });
        return next;
      });
    }, 80);
  };

  const handleCashOut = (num) => {
    if (gameState !== 'flying') return;
    if (num === 1 && bet1.hasBet && !bet1.cashedOut) {
      updateBalanceServer(bet1.amount * multiplier);
      setBet1(b => ({...b, cashedOut: true, hasBet: false}));
    } else if (num === 2 && bet2.hasBet && !bet2.cashedOut) {
      updateBalanceServer(bet2.amount * multiplier);
      setBet2(b => ({...b, cashedOut: true, hasBet: false}));
    }
  };

  // --- UI ---
  if (!user) {
    return (
      <div style={{ background: '#0b0f18', height: '100vh', color: 'white', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:'20px' }}>
        <h1 style={{color:'red', marginBottom:'30px'}}>F16 AVIATOR</h1>
        <div id="recaptcha-container"></div>
        
        {authStep === 'choice' && (
          <div style={{display:'flex', flexDirection:'column', gap:'15px', width:'100%', maxWidth:'300px'}}>
            <button onClick={() => setAuthStep('phone')} style={{background:'#28a745', color:'white', padding:'15px', borderRadius:'10px', border:'none', fontWeight:'bold', cursor:'pointer'}}>Sign Up / سائن اپ</button>
            <button onClick={() => setAuthStep('phone')} style={{background:'#007bff', color:'white', padding:'15px', borderRadius:'10px', border:'none', fontWeight:'bold', cursor:'pointer'}}>Login / لاگ ان</button>
          </div>
        )}

        {authStep === 'phone' && (
          <div style={{width:'100%', maxWidth:'300px', textAlign:'center'}}>
            <p style={{marginBottom:'10px'}}>فون نمبر لکھیں (+92 کے ساتھ)</p>
            <input type="text" placeholder="+923001234567" value={phoneNumber} onChange={(e)=>setPhoneNumber(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'8px', marginBottom:'15px', border:'1px solid #333', background:'#000', color:'#fff'}} />
            <button onClick={sendOTP} style={{background:'red', color:'white', padding:'12px 25px', border:'none', borderRadius:'8px', width:'100%', fontWeight:'bold'}}>او ٹی پی بھیجیں</button>
          </div>
        )}

        {authStep === 'otp' && (
          <div style={{width:'100%', maxWidth:'300px', textAlign:'center'}}>
            <p style={{marginBottom:'10px'}}>6 ہندسوں کا کوڈ درج کریں</p>
            <input type="text" placeholder="######" onChange={(e)=>setOtp(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'8px', marginBottom:'15px', border:'1px solid #333', background:'#000', color:'#fff'}} />
            <button onClick={verifyOTP} style={{background:'#28a745', color:'white', padding:'12px 25px', border:'none', borderRadius:'8px', width:'100%', fontWeight:'bold'}}>ویریفائی کریں</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: '#0b0f18', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#121826', borderBottom:'1px solid #222' }}>
        <div style={{ color: 'red', fontWeight: 'bold', fontSize: '20px' }}>F16</div>
        <div style={{ color: '#00ff7b', fontWeight: 'bold' }}>{balance.toFixed(2)} PKR</div>
      </div>

      <div style={{ display:'flex', gap:'5px', padding:'8px', overflowX:'auto', background:'#070a10' }}>
        {history.map((h, i) => (
          <span key={i} style={{ color: parseFloat(h) > 2 ? '#9858f5' : '#34b4ff', fontSize: '10px', background: '#1b2335', padding: '3px 10px', borderRadius: '12px', whiteSpace:'nowrap' }}>{h}</span>
        ))}
      </div>

      <div style={{ position: 'relative', width: '94%', margin: '15px auto', borderRadius: '15px', height: '230px', background: '#111', border: '1px solid #333', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: '100%', textAlign: 'center', top: '40%', fontSize: '48px', fontWeight: 'bold', zIndex: 10 }}>
          {gameState === 'crashed' ? <span style={{color: 'red'}}>FLEW AWAY!</span> : 
           gameState === 'waiting' ? <span style={{fontSize:'16px', color:'#aaa'}}>WAITING...</span> :
           <span style={{color:'white'}}>{multiplier.toFixed(2)}x</span>}
        </div>
        
        {gameState === 'flying' && (
           <div style={{ position: 'absolute', left: `${planePos.x}px`, bottom: `${planePos.y}px`, transition: 'all 0.1s linear' }}>
             <img src="/jet.png" style={{ width: '65px' }} alt="jet" />
           </div>
        )}
      </div>

      <div style={{ padding: '0 12px' }}>
        <BetPanel data={bet1} setData={setBet1} onCash={() => handleCashOut(1)} isFlying={gameState === 'flying'} />
        <BetPanel data={bet2} setData={setBet2} onCash={() => handleCashOut(2)} isFlying={gameState === 'flying'} />
      </div>
    </div>
  );
}

function BetPanel({ data, setData, onCash, isFlying }) {
  return (
    <div style={{ background: '#1b1c20', padding: '15px', borderRadius: '18px', marginBottom: '10px', border: '1px solid #2c2d31' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ background: '#000', padding: '12px', borderRadius: '12px', textAlign: 'center', color: 'white', fontWeight:'bold' }}>{data.amount.toFixed(2)}</div>
        </div>
        <button 
          onClick={isFlying ? onCash : () => setData({...data, hasBet: !data.hasBet})}
          disabled={isFlying && data.cashedOut}
          style={{ flex: 1, background: data.cashedOut ? '#444' : (data.hasBet ? (isFlying ? '#ff9800' : '#d32f2f') : '#28a745'), color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize:'14px', cursor:'pointer' }}>
          {isFlying && data.hasBet ? (data.cashedOut ? "CASHED" : "CASH OUT") : (data.hasBet ? "CANCEL" : "BET")}
        </button>
      </div>
    </div>
  );
}
