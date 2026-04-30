"use client";
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, update } from "firebase/database";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged 
} from "firebase/auth";

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

export default function F16AviatorFinal() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [balance, setBalance] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [gameState, setGameState] = useState<'waiting' | 'flying' | 'crashed'>('waiting'); 
  const [history, setHistory] = useState<string[]>([]);
  const [planePos, setPlanePos] = useState({ x: 10, y: 10 });
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [authLoading, setAuthLoading] = useState(true);

  const [bet1, setBet1] = useState({ amount: 16.00, hasBet: false, cashedOut: false });
  const [bet2, setBet2] = useState({ amount: 16.00, hasBet: false, cashedOut: false });

  // Audio Refs
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const crashSoundRef = useRef<HTMLAudioElement | null>(null);
  const cashOutSoundRef = useRef<HTMLAudioElement | null>(null); // نیو کوائن میوزک
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        onValue(ref(db, 'users/' + u.uid), (snap) => {
          if (snap.exists()) setBalance(snap.val().balance);
        });
      } else setUser(null);
      setAuthLoading(false);
    });

    // آڈیو فائلز لوڈ کرنا (فائل نیم کے مطابق)
    bgMusicRef.current = new Audio('/background-track.mp3');
    bgMusicRef.current.loop = true;
    crashSoundRef.current = new Audio('/crash.mp3');
    cashOutSoundRef.current = new Audio('/cashout.mp3'); // پبلک فولڈر میں یہ فائل ہونی چاہیے

    startWaitingPeriod();
    return () => unsubscribe();
  }, []);

  const updateDbBalance = async (amt: number) => {
    if (user) await update(ref(db, 'users/' + user.uid), { balance: amt });
  };

  const startWaitingPeriod = () => {
    setGameState('waiting');
    setMultiplier(1.00);
    setPlanePos({ x: 10, y: 10 });
    setBet1(prev => ({ ...prev, hasBet: false, cashedOut: false }));
    setBet2(prev => ({ ...prev, hasBet: false, cashedOut: false }));
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setLoadingProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        startRound();
      }
    }, 100);
  };

  const startRound = async () => {
    let currentBalance = balance;
    let totalBet = (bet1.hasBet ? bet1.amount : 0) + (bet2.hasBet ? bet2.amount : 0);

    if (totalBet > currentBalance) {
      startWaitingPeriod();
      return;
    }

    if (totalBet > 0) {
      currentBalance -= totalBet;
      setBalance(currentBalance);
      await updateDbBalance(currentBalance);
      // میوزک شروع کریں
      bgMusicRef.current?.play().catch(() => {});
    }

    setGameState('flying');
    
    let crashAt: number;
    const rand = Math.random() * 100;
    if (rand < 55) {
      crashAt = parseFloat((Math.random() * 0.9 + 1.00).toFixed(2));
    } else {
      crashAt = parseFloat((Math.random() * 998 + 2.0).toFixed(2));
    }

    gameTimerRef.current = setInterval(() => {
      setMultiplier(prev => {
        const next = parseFloat((prev + (prev < 10 ? 0.01 : prev * 0.02)).toFixed(2));
        
        if (next >= crashAt) {
          clearInterval(gameTimerRef.current!);
          setGameState('crashed');
          // میوزک روکیں اور کریش ساؤنڈ چلائیں
          bgMusicRef.current?.pause();
          if (bgMusicRef.current) bgMusicRef.current.currentTime = 0;
          crashSoundRef.current?.play().catch(() => {});

          setHistory(h => [`${next}x`, ...h].slice(0, 15));
          setTimeout(() => startWaitingPeriod(), 3000);
          return next;
        }
        
        setPlanePos({ 
          x: Math.min((next - 1) * 40 + 10, 300), 
          y: Math.min(Math.pow(next - 1, 1.1) * 30 + 10, 180) 
        });
        return next;
      });
    }, 80);
  };

  const handleCashOut = async (num: number) => {
    if (gameState !== 'flying') return;
    const bet = num === 1 ? bet1 : bet2;
    if (bet.hasBet && !bet.cashedOut) {
      // کیش آؤٹ ساؤنڈ چلائیں
      cashOutSoundRef.current?.play().catch(() => {});
      
      const win = bet.amount * multiplier;
      const newBal = balance + win;
      setBalance(newBal);
      await updateDbBalance(newBal);
      if (num === 1) setBet1(p => ({ ...p, cashedOut: true }));
      else setBet2(p => ({ ...p, cashedOut: true }));
    }
  };

  if (authLoading) return <div style={{color:'white', textAlign:'center', marginTop:'50px'}}>Loading...</div>;

  if (!user) return (
    <div style={{background:'#0b0f18', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
      <h1 style={{color:'red', fontSize:'40px'}}>F16 LOGIN</h1>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{padding:'12px', margin:'5px', borderRadius:'8px', width:'250px'}} />
      <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} style={{padding:'12px', margin:'5px', borderRadius:'8px', width:'250px'}} />
      <button onClick={()=>signInWithEmailAndPassword(auth, email, password)} style={{padding:'12px 60px', background:'green', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}>Login</button>
      <button onClick={()=>createUserWithEmailAndPassword(auth, email, password)} style={{marginTop:'15px', background:'none', color:'gray', border:'none', cursor:'pointer'}}>No account? Create one</button>
    </div>
  );

  return (
    <div style={{ background: '#0b0f18', color: 'white', minHeight: '100vh', padding: '10px', fontFamily: 'Arial' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', alignItems: 'center' }}>
        <span style={{ color: 'red', fontWeight: 'bold', fontSize: '20px' }}>F16</span>
        <span style={{ color: '#00ff7b', fontWeight: 'bold' }}>{balance.toFixed(2)} PKR</span>
      </div>

      <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', padding: '10px 0', borderBottom: '1px solid #222' }}>
        {history.map((h, i) => (
          <span key={i} style={{ background: '#1b2335', padding: '3px 12px', borderRadius: '15px', fontSize: '11px', color: parseFloat(h) > 2 ? '#9858f5' : '#34b4ff' }}>{h}</span>
        ))}
      </div>

      <div style={{ 
        position: 'relative', height: '230px', background: '#000', borderRadius: '15px', border: '1px solid #333', overflow: 'hidden', margin: '15px 0',
        backgroundImage: `url('/background.jpg')`, backgroundSize: 'cover',
        animation: gameState === 'flying' ? 'scrollBg 12s linear infinite' : 'none'
      }}>
        <div style={{ position: 'absolute', width: '100%', textAlign: 'center', top: '40%', fontSize: '45px', fontWeight: 'bold', zIndex: 10 }}>
          {gameState === 'crashed' ? <span style={{color:'red'}}>FLEW AWAY!</span> : 
           gameState === 'waiting' ? <div style={{fontSize:'12px', color:'#aaa'}}>WAITING... {((100-loadingProgress)/20).toFixed(0)}s</div> : 
           multiplier.toFixed(2) + "x"}
        </div>

        {gameState === 'flying' && (
          <img src="/jet.png" style={{ 
            position: 'absolute', bottom: planePos.y, left: planePos.x, 
            width: '90px', transition: 'all 0.1s linear', zIndex: 5
          }} />
        )}
      </div>

      {[1, 2].map(num => {
        const bet = num === 1 ? bet1 : bet2;
        const setBet = num === 1 ? setBet1 : setBet2;
        return (
          <div key={num} style={{ background: '#1b1c20', padding: '12px', borderRadius: '15px', marginBottom: '10px', border: '1px solid #2c2d31' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ background: '#000', borderRadius: '20px', padding: '5px 12px', border: '1px solid #444' }}>
                <button onClick={() => setBet(p => ({ ...p, amount: Math.max(16, p.amount - 10) }))} style={{background:'none', border:'none', color:'white', fontSize:'18px'}}>-</button>
                <span style={{ margin: '0 15px', fontSize:'14px' }}>{bet.amount}</span>
                <button onClick={() => setBet(p => ({ ...p, amount: p.amount + 10 }))} style={{background:'none', border:'none', color:'white', fontSize:'18px'}}>+</button>
              </div>
              <button 
                onClick={() => {
                  if (gameState === 'flying') handleCashOut(num);
                  else setBet(p => ({ ...p, hasBet: !p.hasBet }));
                }}
                disabled={bet.cashedOut}
                style={{ 
                  background: bet.cashedOut ? '#444' : (gameState === 'flying' && bet.hasBet ? '#ff9800' : (bet.hasBet ? '#d32f2f' : '#28a745')),
                  border: 'none', color: 'white', padding: '12px 35px', borderRadius: '10px', fontWeight: 'bold', minWidth: '130px'
                }}
              >
                {gameState === 'flying' && bet.hasBet && !bet.cashedOut ? `CASH OUT` : (bet.hasBet ? 'CANCEL' : 'BET')}
              </button>
            </div>
          </div>
        );
      })}

      <style jsx>{`
        @keyframes scrollBg {
          from { background-position: 0 0; }
          to { background-position: -1000px 0; }
        }
      `}</style>
    </div>
  );
}
