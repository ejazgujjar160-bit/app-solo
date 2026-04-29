"use client";
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, update } from "firebase/database";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  signOut 
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
  const [history, setHistory] = useState<string[]>(["1.14x", "3.5x", "1.20x", "1.05x", "2.10x"]);
  const [planePos, setPlanePos] = useState({ x: 0, y: 0 });
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [showFullHistory, setShowFullHistory] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [bet1, setBet1] = useState({ amount: 16.00, hasBet: false, auto: false, autoVal: 2.0, cashedOut: false });
  const [bet2, setBet2] = useState({ amount: 16.00, hasBet: false, auto: false, autoVal: 2.0, cashedOut: false });

  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxBetLimit = 15000;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        onValue(ref(db, 'users/' + firebaseUser.uid), (snapshot) => {
          if (snapshot.exists()) {
            setBalance(snapshot.val().balance || 0);
          } else {
            update(ref(db, 'users/' + firebaseUser.uid), { email: firebaseUser.email, balance: 500 });
          }
        });
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    startWaitingPeriod();
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      unsubscribe();
    };
  }, []);

  const handleAuth = async (type: 'login' | 'signup') => {
    if (!email || !password) return alert("Enter credentials");
    try {
      if (type === 'signup') await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) { alert(err.message); }
  };

  const updateBalance = async (newBalance: number) => {
    if (user) await update(ref(db, 'users/' + user.uid), { balance: newBalance });
  };

  const handleCashOut = (betNum: number) => {
    if (gameState !== 'flying') return;
    if (betNum === 1 && bet1.hasBet && !bet1.cashedOut) {
      updateBalance(balance + (bet1.amount * multiplier));
      setBet1(prev => ({ ...prev, cashedOut: true }));
    } else if (betNum === 2 && bet2.hasBet && !bet2.cashedOut) {
      updateBalance(balance + (bet2.amount * multiplier));
      setBet2(prev => ({ ...prev, cashedOut: true }));
    }
  };

  const startWaitingPeriod = () => {
    setGameState('waiting');
    setLoadingProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 1;
      setLoadingProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        startRound();
      }
    }, 50); 
  };

  const startRound = () => {
    let totalBet = 0;
    if (bet1.hasBet) totalBet += bet1.amount;
    if (bet2.hasBet) totalBet += bet2.amount;
    
    if (totalBet > balance) {
        setBet1(p => ({...p, hasBet: false}));
        setBet2(p => ({...p, hasBet: false}));
    } else if (totalBet > 0) {
        updateBalance(balance - totalBet);
    }

    setGameState('flying');
    setMultiplier(1.00);
    setPlanePos({ x: 10, y: 10 });
    setBet1(prev => ({ ...prev, cashedOut: false }));
    setBet2(prev => ({ ...prev, cashedOut: false }));
    
    // --- پرافٹ اینڈ لاس الگورتھم ---
    let crashAt: number;
    const houseEdge = Math.random() * 100;

    if (houseEdge <= 55) { 
      // 55% چانس: یوزر ہارے گا (Crash between 1.00 and 1.50)
      // Math.random() 0 بھی ہو سکتا ہے، اس لیے یہ 1.00x پر بھی کریش ہو سکتا ہے
      crashAt = parseFloat((Math.random() * 0.5 + 1.00).toFixed(2));
    } else {
      // 45% چانس: یوزر جیت سکتا ہے (Crash between 2.00 and 8000.00)
      const bigWin = Math.random() * 100;
      if (bigWin > 98) { // بہت کم چانس جیک پاٹ کے لیے
        crashAt = parseFloat((Math.random() * 7000 + 1000).toFixed(2));
      } else {
        crashAt = parseFloat((Math.random() * 10 + 2.0).toFixed(2));
      }
    }

    gameTimerRef.current = setInterval(() => {
      setMultiplier(prev => {
        // جہاز کی رفتار بلندی کے ساتھ تھوڑی بڑھتی جائے گی
        const increment = prev < 10 ? 0.01 : prev < 100 ? 0.5 : 2.5;
        const next = parseFloat((prev + increment).toFixed(2));
        
        if (bet1.hasBet && bet1.auto && !bet1.cashedOut && next >= bet1.autoVal) handleCashOut(1);
        if (bet2.hasBet && bet2.auto && !bet2.cashedOut && next >= bet2.autoVal) handleCashOut(2);

        if (next >= crashAt) {
          if (gameTimerRef.current) clearInterval(gameTimerRef.current);
          setGameState('crashed');
          setHistory(h => [`${next}x`, ...h].slice(0, 50)); 
          setTimeout(() => startWaitingPeriod(), 3000);
          return next;
        }
        
        // PNG کی پوزیشن کی سیٹنگ (Aviator Style)
        setPlanePos({ 
          x: Math.min((next - 1) * 30 + 10, 280), 
          y: Math.min(Math.pow(next - 1, 1.2) * 20 + 10, 180) 
        });
        return next;
      });
    }, 60);
  };

  const BetControlPanel = ({ betData, setBetData, num }: any) => (
    <div style={{ background: '#1b1c20', padding: '12px', borderRadius: '15px', border: '1px solid #2c2d31', marginBottom: '8px' }}>
      <div style={{ display: 'flex', background: '#000', borderRadius: '20px', padding: '2px', marginBottom: '8px' }}>
        <button onClick={() => setBetData({...betData, auto: false})} style={{ flex: 1, border: 'none', background: !betData.auto ? '#2c2d31' : 'transparent', color: '#fff', padding: '4px', borderRadius: '20px', fontSize: '12px' }}>Bet</button>
        <button onClick={() => setBetData({...betData, auto: true})} style={{ flex: 1, border: 'none', background: betData.auto ? '#2c2d31' : 'transparent', color: '#fff', padding: '4px', borderRadius: '20px', fontSize: '12px' }}>Auto</button>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', background: '#000', borderRadius: '20px', padding: '4px 10px', border: '1px solid #333' }}>
            <button onClick={() => setBetData({...betData, amount: Math.max(16, betData.amount - 10)})} style={{color: 'white', background: 'none', border: 'none', fontSize: '18px'}}>−</button>
            <span style={{ color: 'white', fontSize: '14px', alignSelf:'center' }}>{betData.amount.toFixed(2)}</span>
            <button onClick={() => setBetData({...betData, amount: Math.min(maxBetLimit, betData.amount + 10)})} style={{color: 'white', background: 'none', border: 'none', fontSize: '18px'}}>+</button>
          </div>
        </div>
        <button 
          onClick={() => {
            if (gameState === 'flying') handleCashOut(num);
            else setBetData({...betData, hasBet: !betData.hasBet});
          }} 
          disabled={betData.cashedOut}
          style={{ 
            flex: 1, 
            background: betData.cashedOut ? '#555' : (gameState === 'flying' && betData.hasBet ? '#ff9800' : (betData.hasBet ? '#d32f2f' : '#28a745')), 
            borderRadius: '12px', color: 'white', border: 'none', padding: '10px', fontWeight: 'bold', fontSize: '14px'
          }}
        >
          {gameState === 'flying' && betData.hasBet && !betData.cashedOut ? `CASH OUT` : (betData.hasBet ? "CANCEL" : "BET")}
        </button>
      </div>
    </div>
  );

  if (authLoading) return <div style={{background:'#0b0f18', height:'100vh', color:'white', display:'flex', justifyContent:'center', alignItems:'center'}}>Loading...</div>;

  if (!user) return (
    <div style={{background: '#0b0f18', minHeight: '100vh', color: 'white', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', gap: '15px', padding: '20px'}}>
        <div style={{fontSize:'45px', fontWeight:'900', color:'red'}}>F16</div>
        <div style={{width:'100%', maxWidth:'320px', background:'#141926', padding:'20px', borderRadius:'15px', border:'1px solid #2c344a'}}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{padding:'12px', width:'100%', background:'#0b0f18', border:'1px solid #333', color:'white', borderRadius:'8px', marginBottom:'10px'}} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{padding:'12px', width:'100%', background:'#0b0f18', border:'1px solid #333', color:'white', borderRadius:'8px', marginBottom:'20px'}} />
            <button onClick={() => handleAuth('login')} style={{width:'100%', padding:'12px', background:'#28a745', color:'white', borderRadius:'8px', fontWeight:'bold', marginBottom:'10px'}}>LOGIN</button>
            <button onClick={() => handleAuth('signup')} style={{width:'100%', padding:'10px', background:'transparent', border:'1px solid #007bff', color:'#007bff', borderRadius:'8px'}}>SIGN UP</button>
        </div>
    </div>
  );

  return (
    <div style={{ background: '#0b0f18', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif', overflowX:'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#121826', alignItems:'center' }}>
        <div style={{ color: 'red', fontWeight: 'bold', fontSize: '20px' }}>F16</div>
        <div style={{textAlign:'right'}}>
          <div style={{ color: '#00ff7b', fontWeight: 'bold' }}>{balance.toFixed(2)} PKR</div>
          <button onClick={() => signOut(auth)} style={{background:'none', border:'none', color:'#ff4444', fontSize:'10px', textDecoration:'underline'}}>Logout</button>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems:'center', gap: '5px', padding: '5px', background: '#070a10', position:'relative' }}>
        <div style={{ display:'flex', gap:'5px', overflowX:'hidden', flex: 1 }}>
          {history.slice(0, 10).map((h, i) => (
            <span key={i} style={{ color: parseFloat(h) > 2 ? '#9858f5' : '#34b4ff', fontSize: '10px', background: '#1b2335', padding: '2px 8px', borderRadius: '10px', minWidth:'40px', textAlign:'center' }}>{h}</span>
          ))}
        </div>
        <button onClick={() => setShowFullHistory(!showFullHistory)} style={{background:'#1b2335', border:'none', color:'#aaa', borderRadius:'50%', width:'20px', height:'20px', fontSize:'12px'}}>⋮</button>
        {showFullHistory && (
            <div style={{position:'absolute', top:'30px', right:'10px', background:'#1b2335', padding:'10px', borderRadius:'10px', zIndex:100, maxHeight:'200px', overflowY:'auto', border:'1px solid #444', width:'150px'}}>
                {history.map((h, i) => <div key={i} style={{fontSize:'11px', padding:'2px 0', color: parseFloat(h) > 2 ? '#9858f5' : '#34b4ff'}}>{h}</div>)}
            </div>
        )}
      </div>

      <div style={{ 
        position: 'relative', width: '96%', margin: '10px auto', borderRadius: '15px', height: '220px', 
        background: `url('/background.jpg')`, backgroundSize: 'cover', border: '1px solid #333', overflow: 'hidden' 
      }}>
        <div style={{ position: 'absolute', width: '100%', textAlign: 'center', top: '35%', fontSize: '45px', fontWeight: 'bold', zIndex: 10 }}>
          {gameState === 'crashed' ? <span style={{color: 'red'}}>FLEW AWAY!</span> : 
           gameState === 'waiting' ? <div style={{width:'100%', display:'flex', flexDirection:'column', alignItems:'center'}}>
             <span style={{fontSize:'12px', color:'#aaa'}}>WAITING FOR NEXT ROUND</span>
             <div style={{width:'60%', height:'4px', background:'#222', marginTop:'10px', borderRadius:'10px', overflow:'hidden'}}>
                <div style={{width: `${loadingProgress}%`, height:'100%', background:'red', transition:'width 0.1s linear'}}></div>
             </div>
           </div> :
           multiplier.toFixed(2) + "x"}
        </div>
        
        <svg style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 5 }}>
            {gameState === 'flying' && (
                <path d={`M 0 220 Q ${planePos.x / 2} 220, ${planePos.x} ${220 - planePos.y}`} stroke="red" strokeWidth="3" fill="transparent" />
            )}
        </svg>

        {gameState === 'flying' && (
           <img src="/jet.png" style={{ 
             position: 'absolute', 
             width: '60px', 
             left: `${planePos.x}px`, 
             bottom: `${planePos.y}px`, 
             transform: 'translate(-50%, 50%)', 
             zIndex: 11,
             transition: 'all 0.1s linear' 
           }} alt="jet" />
        )}
      </div>

      <div style={{ padding: '0 10px' }}>
        <BetControlPanel betData={bet1} setBetData={setBet1} num={1} />
        <BetControlPanel betData={bet2} setBetData={setBet2} num={2} />
      </div>
    </div>
  );
}
