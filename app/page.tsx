"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Plane, Wallet, History, Gift, Users, AlertOctagon } from 'lucide-react';

export default function AppSolo() {
  // Game States
  const [balance, setBalance] = useState(10000);
  const [multiplier, setMultiplier] = useState(1.00);
  const [isFlying, setIsFlying] = useState(false);
  const [isCrashed, setIsCrashed] = useState(false);
  const [betAmount, setBetAmount] = useState(100);
  const [crashPoint, setCrashPoint] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // STEP 3: Game Logic - Start Flight
  const startFlight = () => {
    if (balance < betAmount) return alert("Low Balance!");
    
    setBalance(prev => prev - betAmount);
    setMultiplier(1.00);
    setIsCrashed(false);
    setIsFlying(true);

    // Generate Random Crash Point (Logic)
    // 90% chance to go above 1.1x, rare chance for big 100x
    const newCrashPoint = Math.random() < 0.1 ? 1.00 : (Math.random() * 10 + 1);
    setCrashPoint(newCrashPoint);

    // Multiplier Increase Loop
    timerRef.current = setInterval(() => {
      setMultiplier(prev => {
        const nextValue = prev + 0.01 * (prev / 2); // Acceleration logic
        
        // Check for Crash
        if (nextValue >= newCrashPoint) {
          handleCrash();
          return nextValue;
        }
        return nextValue;
      });
    }, 100);
  };

  const handleCrash = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsFlying(false);
    setIsCrashed(true);
  };

  const cashOut = () => {
    if (isFlying && !isCrashed) {
      const winAmount = betAmount * multiplier;
      setBalance(prev => prev + winAmount);
      if (timerRef.current) clearInterval(timerRef.current);
      setIsFlying(false);
      alert(`Success! You won $${winAmount.toFixed(2)}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col p-4 select-none">
      {/* Top Bar */}
      <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Plane size={18} className="fill-white" />
          </div>
          <span className="font-black tracking-tighter text-lg text-blue-500">APP SOLO</span>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 text-green-400 font-bold text-lg">
            <Wallet size={18} />
            <span>${balance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Flight Display Area */}
      <div className={`flex-1 my-4 relative rounded-3xl border-2 flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${isCrashed ? 'border-red-900 bg-red-950/20' : 'border-zinc-800 bg-zinc-900/30'}`}>
        
        {/* Multiplier Text */}
        <div className="z-10 text-center">
          <h1 className={`text-7xl font-black ${isCrashed ? 'text-red-600 animate-shake' : isFlying ? 'text-blue-500' : 'text-zinc-700'}`}>
            {isCrashed ? "CRASHED" : multiplier.toFixed(2) + "x"}
          </h1>
          {isCrashed && <p className="text-red-400 font-bold mt-2">F16 LOST AT {multiplier.toFixed(2)}x</p>}
        </div>

        {/* F16 Visual */}
        <div className={`mt-8 transition-all duration-500 ${isFlying ? 'scale-125 translate-y-[-20px]' : 'scale-100'}`}>
          {isCrashed ? (
            <AlertOctagon size={80} className="text-red-600 animate-ping" />
          ) : (
            <Plane 
              size={120} 
              className={`text-blue-500 fill-blue-600 transform -rotate-45 transition-transform ${isFlying ? 'animate-bounce' : 'opacity-20'}`} 
            />
          )}
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-800 shadow-2xl">
        <div className="mb-4">
          <label className="text-[10px] font-bold text-zinc-500 uppercase px-2">Bet Amount</label>
          <input 
            type="number" 
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            className="w-full bg-black border border-zinc-700 rounded-2xl py-4 px-6 text-center text-2xl font-bold mt-1 outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex gap-3">
          {!isFlying ? (
            <button 
              onClick={startFlight}
              className="flex-1 bg-blue-600 hover:bg-blue-500 py-5 rounded-2xl font-black text-xl active:scale-95 transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)]"
            >
              START F16
            </button>
          ) : (
            <button 
              onClick={cashOut}
              className="flex-1 bg-orange-600 hover:bg-orange-500 py-5 rounded-2xl font-black text-xl active:scale-95 transition-all shadow-[0_0_30px_rgba(234,88,12,0.3)]"
            >
              CASH OUT (${(betAmount * multiplier).toFixed(2)})
            </button>
          )}
        </div>
      </div>

      {/* Live Stats */}
      <div className="mt-4 flex justify-between px-4 text-[10px] font-black text-zinc-600 tracking-widest uppercase">
        <div className="flex items-center gap-1">
          <Users size={12} className="text-green-500" />
          <span>842 PLAYERS ONLINE</span>
        </div>
        <div className="flex gap-3">
          <span className="text-blue-900">1.5x</span>
          <span className="text-blue-900">2.8x</span>
          <span className="text-red-900">1.0x</span>
        </div>
      </div>
    </div>
  );
}
