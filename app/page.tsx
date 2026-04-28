"use client";
import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

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

export default function F16CrashGame() {
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [balance, setBalance] = useState(0);
  const [bet, setBet] = useState(10);
  const [multiplier, setMultiplier] = useState(1.0);
  const [isFlying, setIsFlying] = useState(false);
  const [history, setHistory] = useState(["4.59x", "1.21x"]);
  const intervalRef = useRef(null);

  const handleSignUp = () => {
    if (!email) return alert("Email adds karein");
    const userId = email.replace(".", "_");
    const userRef = ref(db, 'users/' + userId);
    set(userRef, { email: email, balance: 5000 });
    setUser(userId);
    setBalance(5000);
    alert("Signed Up Successfully!");
  };

  const startRound = () => {
    if (balance < bet) return alert("Balance kam hai!");
    setBalance(prev => prev - bet);
    setIsFlying(true);
    let currentMult = 1.0;
    const crashPoint = (Math.random() * 5 + 1.1).toFixed(2);
    intervalRef.current = setInterval(() => {
      currentMult += 0.02;
      setMultiplier(parseFloat(currentMult.toFixed(2)));
      if (currentMult >= parseFloat(crashPoint)) {
        clearInterval(intervalRef.current);
        setIsFlying(false);
        setHistory(prev => [crashPoint + "x", ...prev.slice(0, 5)]);
        setTimeout(() => setMultiplier(1.0), 2000);
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
      setMultiplier(1.0);
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', background: '#0b0f18', height: '100vh', color: 'white' }}>
        <h1 style={{color: '#ff2b2b'}}>F-16 CRASH</h1>
        <input type="email" placeholder="Email likhein" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '12px', borderRadius: '8px', margin: '10px', width: '250px', color: 'black' }} />
        <br />
        <button onClick={handleSignUp} style={{ padding: '12px 30px', background: '#00c853', color: 'white', borderRadius: '8px', fontWeight: 'bold' }}>START GAME</button>
      </div>
    );
  }

  return (
    <div style={{ background: '#0b0f18', color: 'white', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#121826' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff2b2b' }}>F16</div>
        <div style={{ color: '#00ff7b', fontWeight: 'bold' }}>{balance.toFixed(2)} PKR</div>
      </div>
      <div style={{ position: 'relative', height: '300px', background: '#0f1524', margin: '10px', borderRadius: '15px', overflow: 'hidden', border: '1px solid #333' }}>
        <div style={{ textAlign: 'center', paddingTop: '80px', fontSize: '50px', fontWeight: 'bold' }}>{multiplier.toFixed(2)}x</div>
      </div>
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-around', background: '#121826' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={() => setBet(prev => Math.max(10, prev - 10))} style={{ padding: '10px', background: '#333', color: 'white' }}>-</button>
          <span>{bet}</span>
          <button onClick={() => setBet(prev => prev + 10)} style={{ padding: '10px', background: '#333', color: 'white' }}>+</button>
        </div>
        {!isFlying ? (
          <button onClick={startRound} style={{ padding: '15px 40px', background: '#00c853', borderRadius: '10px', fontWeight: 'bold' }}>BET</button>
        ) : (
          <button onClick={cashOut} style={{ padding: '15px 40px', background: '#ff2b2b', borderRadius: '10px', fontWeight: 'bold' }}>CASH OUT</button>
        )}
      </div>
    </div>
  );
}
