"use client";
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, get, update } from "firebase/database";

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
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [balance, setBalance] = useState(0);
  const [isLoggingIn, setIsLoggingIn] = useState(true);

  const [multiplier, setMultiplier] = useState(1.00);
  const [gameState, setGameState] = useState<'waiting' | 'flying' | 'crashed'>('waiting');
  const [history, setHistory] = useState(["1.14x", "3.5x", "3.78x", "2.82x", "4.54x"]);
  const [planePos, setPlanePos] = useState({ x: 10, y: 10 });

  // Bet states with auto cashout value
  const [bet1, setBet1] = useState({ amount: 16.00, hasBet: false, auto: false, autoVal: 2.0, cashedOut: false });
  const [bet2, setBet2] = useState({ amount: 16.00, hasBet: false, auto: false, autoVal: 2.0, cashedOut: false });

  const gameTimerRef = useRef<any>(null);
  const flyAudio = useRef<HTMLAudioElement | null>(null);
  const crashAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("f16_user");
    if (savedUser) {
      setUser(savedUser);
      onValue(ref(db, 'users/' + savedUser), (snapshot) => {
        if (snapshot.exists()) setBalance(snapshot.val().balance);
      });
    }
    setIsLoggingIn(false);
    
    // Audio initialization
    flyAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    crashAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3');
  }, []);

  const updateBalance = async (newBalance: number) => {
    if (user) {
      await update(ref(db, 'users/' + user), { balance: newBalance });
    }
  };

  const handleCashOut = (betNum: number) => {
    if (gameState !== 'flying') return;
    
    if (betNum === 1 && bet1.hasBet && !bet1.cashedOut) {
      const winAmount = bet1.amount * multiplier;
      updateBalance(balance + winAmount);
      setBet1({ ...bet1, cashedOut: true });
    } else if (betNum === 2 && bet2.hasBet && !bet2.cashedOut) {
      const winAmount = bet2.amount * multiplier;
      updateBalance(balance + winAmount);
      setBet2({ ...bet2, cashedOut: true });
    }
  };

  const startRound = () => {
    if (gameState !== 'waiting') return;
    
    // Deduct bet amounts
    let totalBet = 0;
    if (bet1.hasBet) totalBet += bet1.amount;
    if (bet2.hasBet) totalBet += bet2.amount;
    
    if (totalBet > balance) return alert("Low Balance!");
    updateBalance(balance - totalBet);

    setGameState('flying');
    setMultiplier(1.00);
    setPlanePos({ x: 10, y: 10 });
    setBet1(prev => ({ ...prev, cashedOut: false }));
    setBet2(prev => ({ ...prev, cashedOut: false }));
    
    flyAudio.current?.play();
    const crashAt = parseFloat((Math.random() * 5 + 1.2).toFixed(2));

    gameTimerRef.current = setInterval(() => {
      setMultiplier(prev => {
        const next = parseFloat((prev + 0.01).toFixed(2));
        
        // Auto Cash Out Check
        if (bet1.hasBet && bet1.auto && !bet1.cashedOut && next >= bet1.autoVal) {
            handleCashOut(1);
        }
        if (bet2.hasBet && bet2.auto && !bet2.cashedOut && next >= bet2.autoVal) {
            handleCashOut(2);
        }

        if (next >= crashAt) {
          clearInterval(gameTimerRef.current);
          setGameState('crashed');
          flyAudio.current?.pause();
          crashAudio.current?.play();
          setHistory(h => [`${next}x`, ...h.slice(0, 10)]);
          setTimeout(() => setGameState('waiting'), 4000);
          return next;
        }
        
        setPlanePos({ 
          x: Math.min((next - 1) * 80 + 10, 260), 
          y: Math.min(Math.pow(next - 1, 1.5) * 60 + 10, 160) 
        });
        return next;
      });
    }, 60);
  };

  // Auth Functions
  const handleAuthSubmit = () => {
    if (!phone.startsWith("03") || phone.length !== 11) return alert("Sahi پاکستانی number likhein");
    setStep('otp');
  };

  const verifyOtp = async () => {
    if (otp === "1234") {
      const userId = phone;
      const userRef = ref(db, 'users/' + userId);
      const snapshot = await get(userRef);
      if (!snapshot.exists()) {
        await set(userRef, { phone, password, balance: 5000 });
      }
      localStorage.setItem("f16_user", userId);
      setUser(userId);
    } else {
      alert("Ghalat OTP!");
    }
  };

  const BetControlPanel = ({ betData, setBetData, num }: any) => (
    <div style={{ background: '#1b1c20', padding: '12px', borderRadius: '15px', border: '1px solid #2c2d31', marginBottom: '10px' }}>
      <div style={{ display: 'flex', background: '#000', borderRadius: '20px', padding: '2px', marginBottom: '10px' }}>
        <button onClick={() => setBetData({...betData, auto: false})} style={{ flex: 1, border: 'none', background: !betData.auto ? '#2c2d31' : 'transparent', color: '#fff', padding: '5px', borderRadius: '20px' }}>Bet</button>
        <button onClick={() => setBetData({...betData, auto: true})} style={{ flex: 1, border: 'none', background: betData.auto ? '#2c2d31' : 'transparent', color: '#fff', padding: '5px', borderRadius: '20px' }}>Auto</button>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', background: '#000', borderRadius: '20px', padding: '5px 10px', border: '1px solid #333' }}>
            <button onClick={() => setBetData({...betData, amount: Math.max(16, betData.amount / 2)})} style={{color: 'white', background: 'none', border: 'none', fontSize: '18px'}}>−</button>
            <span style={{ color: 'white', lineHeight: '25px' }}>{betData.amount.toFixed(2)}</span>
            <button onClick={() => setBetData({...betData, amount: betData.amount * 2})} style={{color: 'white', background: 'none', border: 'none', fontSize: '18px'}}>+</button>
          </div>
        </div>
        <button 
          onClick={() => {
            if (gameState === 'flying') handleCashOut(num);
            else if (gameState === 'waiting') setBetData({...betData, hasBet: !betData.hasBet});
            else startRound();
          }} 
          disabled={betData.cashedOut}
          style={{ 
            flex: 1, 
            background: betData.cashedOut ? '#555' : (gameState === 'flying' && betData.hasBet ? '#ff9800' : (betData.hasBet ? '#d32f2f' : '#28a745')), 
            borderRadius: '12px', color: 'white', border: 'none', padding: '10px', fontWeight: 'bold' 
          }}
        >
          {gameState === 'flying' && betData.hasBet && !betData.cashedOut ? `CASH OUT ${(betData.amount * multiplier).toFixed(2)}` : (betData.hasBet ? "CANCEL" : "BET")}
        </button>
      </div>
    </div>
  );

  if (isLoggingIn) return <div style={{background: '#0b0f18', height: '100vh'}} />;

  if (!user) {
    return (
      <div style={{ background: '#0b0f18', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
        <img src="/logo.png" alt="logo" style={{width:'80px', marginBottom:'10px'}} />
        <h2 style={{color: 'red', marginBottom: '20px'}}>F-16 AVIATOR</h2>
        {step === 'login' ? (
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            <input type="text" placeholder="03xxxxxxxxx" value={phone} onChange={(e)=>setPhone(e.target.value)} style={{padding:'12px', width:'280px', borderRadius:'8px', color:'black'}}/>
            <div style={{position:'relative', width:'280px'}}>
              <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} style={{padding:'12px', width:'100%', borderRadius:'8px', color:'black'}}/>
              <span onClick={()=>setShowPassword(!showPassword)} style={{position:'absolute', right:'10px', top:'12px', cursor:'pointer', color:'#333'}}>{showPassword ? "👁️" : "👁️‍🗨️"}</span>
            </div>
            <button onClick={handleAuthSubmit} style={{padding:'12px 40px', background:'#00c853', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold'}}>LOGIN</button>
          </div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:'10px', textAlign:'center'}}>
            <p>Code: 1234</p>
            <input type="text" placeholder="XXXX" maxLength={4} value={otp} onChange={(e)=>setOtp(e.target.value)} style={{padding:'12px', width:'280px', borderRadius:'8px', color:'black', textAlign:'center', fontSize:'24px'}}/>
            <button onClick={verifyOtp} style={{padding:'12px 40px', background:'#ff9800', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold'}}>VERIFY</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: '#0b0f18', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#121826', borderBottom: '1px solid #333' }}>
        <div style={{ color: 'red', fontWeight: 'bold', fontSize: '22px' }}>F16</div>
        <div style={{ color: '#00ff7b', fontWeight: 'bold' }}>{balance.toFixed(2)} PKR</div>
      </div>
      
      <div style={{ display: 'flex', gap: '5px', padding: '8px', overflowX: 'auto' }}>
        {history.map((h, i) => (
          <span key={i} style={{ color: '#a3a3ff', fontSize: '11px', background: '#1b2335', padding: '2px 8px', borderRadius: '10px' }}>{h}</span>
        ))}
      </div>

      <div style={{ 
        position: 'relative', width: '95%', margin: '10px auto', borderRadius: '15px', height: '250px', 
        background: `linear-gradient(rgba(7, 10, 16, 0.8), rgba(7, 10, 16, 0.8)), url('/background.jpg')`,
        backgroundSize: 'cover', border: '1px solid #333', overflow: 'hidden' 
      }}>
        <div style={{ position: 'absolute', width: '100%', textAlign: 'center', top: '40%', fontSize: '50px', fontWeight: 'bold', zIndex: 5, textShadow: '2px 2px 10px rgba(0,0,0,0.5)' }}>
          {gameState === 'crashed' ? <span style={{color: 'red'}}>FLEW AWAY!</span> : multiplier.toFixed(2) + "x"}
        </div>
        
        {gameState === 'flying' && (
           <img src="/jet.png" style={{ position: 'absolute', width: '80px', left: `${planePos.x}px`, bottom: `${planePos.y}px`, transition: 'all 0.1s linear', zIndex: 6 }} alt="jet" />
        )}
      </div>

      <div style={{ padding: '10px' }}>
        <BetControlPanel betData={bet1} setBetData={setBet1} num={1} />
        <BetControlPanel betData={bet2} setBetData={setBet2} num={2} />
      </div>
    </div>
  );
}
