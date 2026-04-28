"use client";
import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

// --- فائر بیس کنفیگریشن ---
const firebaseConfig = {
  apiKey: "AIzaSyBQ3gSnL9qb8lR1oTPAFVkg3-ka0Lj_uz4",
  authDomain: "f-16-5fbf8.firebaseapp.com",
  projectId: "f-16-5fbf8",
  storageBucket: "f-16-5fbf8.firebasestorage.app",
  messagingSenderId: "1018743993015",
  appId: "1:1018743993015:web:720e93787b529c54149332"
};

// انیشلائزیشن
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function F16CrashGame() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [balance, setBalance] = useState(0);
  const [bet, setBet] = useState(10);
  const [multiplier, setMultiplier] = useState(1.00);
  const [isFlying, setIsFlying] = useState(false);
  const [history, setHistory] = useState(["4.59x", "5.39x", "1.21x"]);
  
  const planeRef = useRef(null);
  const trailRef = useRef(null);
  const intervalRef = useRef(null);

  // سائن اپ فنکشن
  const handleSignUp = () => {
    if (!email) return alert("Please enter email");
    const userId = email.replace(".", "_"); // فائر بیس کے لیے ای میل کو کی (key) بنانا
    const userRef = ref(db, 'users/' + userId);
    
    const userData = { email: email, balance: 5000 }; // نئے یوزر کو 5000 بیلنس ملے گا
    set(userRef, userData);
    setUser(userId);
    setBalance(5000);
    alert("Signed Up Successfully!");
  };

  // گیم لاجک
  const startRound = () => {
    if (balance < bet) return alert("Incomplete Balance!");
    
    setBalance(prev => prev - bet);
    setIsFlying(true);
    let currentMult = 1.00;
    const crashPoint = (Math.random() * 5 + 1.1).toFixed(2);

    intervalRef.current = setInterval(() => {
      currentMult += 0.02;
      setMultiplier(parseFloat(currentMult.toFixed(2)));

      if (currentMult >= crashPoint) {
        clearInterval(intervalRef.current);
        setIsFlying(false);
        setHistory(prev => [crashPoint + "x", ...prev.slice(0, 6)]);
        setTimeout(() => setMultiplier(1.00), 2000);
      }
    }, 100);
  };

  const cashOut = () => {
    if (isFlying) {
      clearInterval(intervalRef.current);
      setIsFlying(false);
      const winAmount = bet * multiplier;
      setBalance(prev => prev + winAmount);
      alert(`You Won: ${winAmount.toFixed(2)} PKR`);
      setMultiplier(1.00);
    }
  };

  // اگر یوزر لاگ ان نہیں ہے تو سائن اپ فارم دکھائیں
  if (!user) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', background: '#0b0f18', height: '100vh', color: 'white' }}>
        <h1 style={{color: '#ff2b2b'}}>F-16 CRASH LOGIN</h1>
        <input 
          type="email" 
          placeholder="Enter Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '12px', borderRadius: '8px', border: 'none', margin: '10px', width: '250px' }}
        />
        <br />
        <button 
          onClick={handleSignUp}
          style={{ padding: '12px 30px', borderRadius: '8px', border: 'none', background: '#00c853', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
        >
          START GAME
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: '#0b0f18', color: 'white', minHeight: '100vh' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#121826' }}>
        <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#ff2b2b' }}>F16</div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ color: '#00ff7b', fontWeight: 'bold' }}>{balance.toFixed(2)} PKR</div>
          <div>☰</div>
        </div>
      </div>

      {/* History */}
      <div style={{ display: 'flex', gap: '10px', padding: '10px', background: '#0f1524', overflowX: 'auto' }}>
        {history.map((h, i) => <span key={i} style={{ color: '#a3a3ff', fontWeight: 'bold' }}>{h}</span>)}
      </div>

      {/* Game Box */}
      <div style={{ position: 'relative', height: '320px', background: 'radial-gradient(circle, #1b1b2b, #0a0a12)', margin: '12px', borderRadius: '18px', overflow: 'hidden', border: '1px solid #222' }}>
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '64px', fontWeight: 'bold' }}>
          {multiplier.toFixed(2)}x
        </div>
        
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/F-16_June_2008.jpg/320px-F-16_June_2008.jpg"
          alt="F16"
          style={{
            position: 'absolute', width: '80px', transition: '0.1s linear',
            left: isFlying ? `${multiplier * 30}px` : '10px',
            top: isFlying ? `${220 - multiplier * 10}px` : '220px',
            transform: isFlying ? 'rotate(-20deg)' : 'rotate(0deg)'
          }}
        />
      </div>

      {/* Betting Controls */}
      <div style={{ padding: '12px' }}>
        <div style={{ background: '#121826', padding: '15px', borderRadius: '16px', border: '1px solid #222' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ background: '#0b0f18', padding: '10px', borderRadius: '12px', display: 'flex', gap: '15px' }}>
              <button onClick={() => setBet(prev => Math.max(10, prev - 10))} style={{ background: '#1b2335', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '5px' }}>-</button>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{bet}</span>
              <button onClick={() => setBet(prev => prev + 10)} style={{ background: '#1b2335', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '5px' }}>+</button>
            </div>
            
            {!isFlying ? (
              <button 
                onClick={startRound}
                style={{ width: '45%', height: '80px', background: '#00c853', color: 'white', border: 'none', borderRadius: '16px', fontSize: '20px', fontWeight: 'bold' }}
              >
                BET <br /> {bet} PKR
              </button>
            ) : (
              <button 
                onClick={cashOut}
                style={{ width: '45%', height: '80px', background: '#ff2b2b', color: 'white', border: 'none', borderRadius: '16px', fontSize: '20px', fontWeight: 'bold' }}
              >
                CASH OUT <br /> {(bet * multiplier).toFixed(2)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
