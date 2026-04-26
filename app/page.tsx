<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>F16 Crash Game</title>

  <style>
    *{margin:0;padding:0;box-sizing:border-box;font-family:Arial, Helvetica, sans-serif;}
    body{
      background:#0b0f18;
      color:white;
      overflow-x:hidden;
    }

    /* Top Header */
    .topbar{
      display:flex;
      justify-content:space-between;
      align-items:center;
      padding:12px;
      background:#121826;
      border-bottom:1px solid #222;
    }

    .logo{
      font-size:22px;
      font-weight:bold;
      color:#ff2b2b;
    }

    .right-top{
      display:flex;
      align-items:center;
      gap:12px;
      font-size:14px;
    }

    .balance{
      color:#00ff7b;
      font-weight:bold;
    }

    .icon-btn{
      width:32px;
      height:32px;
      border-radius:8px;
      background:#1b2335;
      display:flex;
      justify-content:center;
      align-items:center;
      cursor:pointer;
      user-select:none;
    }

    /* History */
    .history{
      padding:10px;
      background:#0f1524;
      display:flex;
      gap:12px;
      overflow-x:auto;
      font-size:14px;
      border-bottom:1px solid #222;
    }

    .history span{
      color:#a3a3ff;
      font-weight:bold;
      white-space:nowrap;
    }

    /* Game Box */
    .game-box{
      position:relative;
      height:320px;
      background:radial-gradient(circle at center,#1b1b2b,#0a0a12);
      margin:12px;
      border-radius:18px;
      overflow:hidden;
      border:1px solid #222;
    }

    /* Multiplier */
    .multiplier{
      position:absolute;
      top:40%;
      left:50%;
      transform:translate(-50%,-50%);
      font-size:64px;
      font-weight:bold;
      text-shadow:0 0 25px rgba(255,0,0,0.5);
    }

    /* Plane */
    .plane{
      position:absolute;
      width:80px;
      top:220px;
      left:0px;
      z-index:5;
      transform:rotate(0deg);
      transition:0.1s linear;
    }

    /* Red trail */
    .trail{
      position:absolute;
      height:6px;
      background:red;
      top:250px;
      left:0;
      width:0px;
      border-radius:10px;
      box-shadow:0 0 15px rgba(255,0,0,0.8);
    }

    /* Players */
    .players{
      position:absolute;
      right:10px;
      bottom:10px;
      background:rgba(0,0,0,0.5);
      padding:6px 12px;
      border-radius:18px;
      font-size:14px;
    }

    /* Controls Container */
    .controls{
      display:flex;
      flex-direction:column;
      gap:12px;
      padding:10px 12px 18px 12px;
    }

    .bet-panel{
      background:#121826;
      border-radius:16px;
      padding:12px;
      border:1px solid #222;
    }

    .panel-top{
      display:flex;
      justify-content:space-between;
      align-items:center;
      margin-bottom:12px;
    }

    .switch-btn{
      display:flex;
      background:#1b2335;
      border-radius:12px;
      overflow:hidden;
    }

    .switch-btn button{
      border:none;
      padding:10px 18px;
      background:transparent;
      color:white;
      cursor:pointer;
      font-weight:bold;
    }

    .switch-btn button.active{
      background:#2c3857;
    }

    /* Bet row */
    .bet-row{
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:10px;
    }

    .bet-amount{
      display:flex;
      flex-direction:column;
      gap:8px;
      width:55%;
    }

    .amount-box{
      display:flex;
      align-items:center;
      justify-content:space-between;
      background:#0b0f18;
      border-radius:12px;
      padding:10px;
      border:1px solid #222;
    }

    .amount-box button{
      width:35px;
      height:35px;
      border:none;
      border-radius:10px;
      background:#1b2335;
      color:white;
      font-size:20px;
      cursor:pointer;
    }

    .amount-box span{
      font-size:18px;
      font-weight:bold;
      color:#fff;
    }

    /* Quick Buttons */
    .quick{
      display:grid;
      grid-template-columns:repeat(4,1fr);
      gap:8px;
    }

    .quick button{
      padding:8px;
      border:none;
      border-radius:10px;
      background:#1b2335;
      color:white;
      cursor:pointer;
      font-weight:bold;
      font-size:13px;
    }

    .bet-btn{
      width:45%;
      height:120px;
      border:none;
      border-radius:16px;
      background:#00c853;
      color:white;
      font-size:20px;
      font-weight:bold;
      cursor:pointer;
      box-shadow:0 0 15px rgba(0,200,83,0.4);
    }

    .bet-btn:disabled{
      background:#333;
      cursor:not-allowed;
      box-shadow:none;
    }

    /* Cashout input */
    .cashout{
      margin-top:10px;
      display:flex;
      justify-content:space-between;
      gap:10px;
    }

    .cashout input{
      width:60%;
      padding:10px;
      border-radius:12px;
      border:1px solid #222;
      background:#0b0f18;
      color:white;
      font-size:14px;
    }

    .cashout button{
      width:40%;
      padding:10px;
      border-radius:12px;
      border:none;
      background:#ff2b2b;
      color:white;
      font-weight:bold;
      cursor:pointer;
    }

    /* Bottom Stats */
    .bottom-bar{
      margin-top:10px;
      background:#121826;
      border-top:1px solid #222;
      padding:10px;
      display:flex;
      justify-content:space-around;
      font-size:14px;
    }

    .bottom-bar span{
      color:#ccc;
      font-weight:bold;
      cursor:pointer;
    }

    .stats{
      margin:10px 12px;
      padding:10px;
      border-radius:12px;
      background:#0f1524;
      border:1px solid #222;
      font-size:14px;
      display:flex;
      justify-content:space-between;
      align-items:center;
    }

    .stats .win{
      color:#00ff7b;
      font-weight:bold;
      font-size:16px;
    }

    /* Menu Popup */
    .menu{
      position:fixed;
      top:70px;
      right:20px;
      background:#121826;
      border:1px solid #333;
      border-radius:12px;
      padding:12px;
      display:none;
      width:200px;
      z-index:1000;
    }

    .menu p{
      padding:8px;
      border-bottom:1px solid #222;
      font-size:14px;
      color:#ddd;
    }

    .menu p:last-child{
      border-bottom:none;
    }

  </style>
</head>

<body>

  <!-- Header -->
  <div class="topbar">
    <div class="logo">F16</div>

    <div class="right-top">
      <div class="balance" id="balance">111.55 PKR</div>
      <div class="icon-btn" onclick="toggleMenu()">☰</div>
      <div class="icon-btn">💬</div>
      <div class="icon-btn">⋮</div>
    </div>
  </div>

  <!-- History -->
  <div class="history" id="history">
    <span>4.59x</span>
    <span>5.39x</span>
    <span>6.75x</span>
    <span>1.57x</span>
    <span>1.21x</span>
    <span>1.45x</span>
    <span>3.46x</span>
  </div>

  <!-- Game -->
  <div class="game-box">
    <div class="multiplier" id="multiplier">1.00x</div>

    <div class="trail" id="trail"></div>

    <!-- F16 Image (simple emoji style, you can replace with real PNG) -->
    <img class="plane" id="plane"
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/F-16_June_2008.jpg/320px-F-16_June_2008.jpg"
      alt="F16">

    <div class="players" id="players">👥 1,436</div>
  </div>

  <!-- Betting Panels -->
  <div class="controls">

    <!-- Panel 1 -->
    <div class="bet-panel">
      <div class="panel-top">
        <div class="switch-btn">
          <button class="active">Bet</button>
          <button>Auto</button>
        </div>
        <div style="color:#aaa;font-size:14px;">Panel 1</div>
      </div>

      <div class="bet-row">
        <div class="bet-amount">

          <div class="amount-box">
            <button onclick="changeBet(-10)">-</button>
            <span id="betAmount">10</span>
            <button onclick="changeBet(10)">+</button>
          </div>

          <div class="quick">
            <button onclick="setBet(10)">10</button>
            <button onclick="setBet(20)">20</button>
            <button onclick="setBet(30)">30</button>
            <button onclick="setBet(100)">100</button>

            <button onclick="setBet(200)">200</button>
            <button onclick="setBet(300)">300</button>
            <button onclick="setBet(1000)">1000</button>
            <button onclick="setBet(3000)">3000</button>

            <button onclick="setBet(5000)">5000</button>
            <button onclick="setBet(10000)">10000</button>
            <button onclick="setBet(15000)">15000</button>
            <button onclick="setBet(50)">50</button>
          </div>

        </div>

        <button class="bet-btn" id="betBtn" onclick="placeBet()">Bet<br><span id="betText">10 PKR</span></button>
      </div>

      <div class="cashout">
        <input type="number" id="cashoutInput" placeholder="Auto Cashout (مثلاً 2.00x)">
        <button onclick="cashOut()">Cash Out</button>
      </div>

    </div>

    <!-- Panel 2 -->
    <div class="bet-panel">
      <div class="panel-top">
        <div class="switch-btn">
          <button class="active">Bet</button>
          <button>Auto</button>
        </div>
        <div style="color:#aaa;font-size:14px;">Panel 2</div>
      </div>

      <div class="bet-row">
        <div class="bet-amount">
          <div class="amount-box">
            <button onclick="changeBet(-10)">-</button>
            <span id="betAmount2">10</span>
            <button onclick="changeBet(10)">+</button>
          </div>
        </div>

        <button class="bet-btn" onclick="placeBet()">Bet<br><span id="betText2">10 PKR</span></button>
      </div>

    </div>

  </div>

  <!-- Bottom Tabs -->
  <div class="bottom-bar">
    <span>All Bets</span>
    <span>Previous</span>
    <span>Top</span>
  </div>

  <!-- Stats -->
  <div class="stats">
    <div>1635 / 4029 Bets</div>
    <div class="win" id="totalWin">404,117.76 PKR</div>
  </div>

  <!-- Menu Popup -->
  <div class="menu" id="menu">
    <p>📌 Game Data</p>
    <p>🎮 Round History</p>
    <p>⚙ Settings</p>
    <p>👤 Profile</p>
  </div>

  <script>
    let bet = 10;
    let multiplier = 1.00;
    let flying = false;
    let crashPoint = 0;
    let interval;

    function toggleMenu(){
      let menu = document.getElementById("menu");
      menu.style.display = (menu.style.display === "block") ? "none" : "block";
    }

    function setBet(val){
      bet = val;
      document.getElementById("betAmount").innerText = bet;
      document.getElementById("betAmount2").innerText = bet;
      document.getElementById("betText").innerText = bet + " PKR";
      document.getElementById("betText2").innerText = bet + " PKR";
    }

    function changeBet(val){
      bet += val;
      if(bet < 10) bet = 10;
      if(bet > 15000) bet = 15000;
      setBet(bet);
    }

    function randomCrash(){
      // Crash point 1.20x to 10x (random)
      return (Math.random() * 9 + 1.2).toFixed(2);
    }

    function startRound(){
      multiplier = 1.00;
      crashPoint = randomCrash();
      flying = true;

      let plane = document.getElementById("plane");
      let trail = document.getElementById("trail");

      plane.style.left = "0px";
      plane.style.top = "220px";
      trail.style.width = "0px";

      interval = setInterval(()=>{
        multiplier += 0.02;
        multiplier = parseFloat(multiplier.toFixed(2));

        document.getElementById("multiplier").innerText = multiplier.toFixed(2) + "x";

        // Move plane
        let x = multiplier * 40;
        let y = 220 - multiplier * 12;

        if(y < 30) y = 30;

        plane.style.left = x + "px";
        plane.style.top = y + "px";
        plane.style.transform = "rotate(-20deg)";

        trail.style.width = (x + 40) + "px";
        trail.style.top = (y + 30) + "px";

        // Crash
        if(multiplier >= crashPoint){
          crashGame();
        }

      }, 60);
    }

    function crashGame(){
      flying = false;
      clearInterval(interval);

      document.getElementById("multiplier").innerText = crashPoint + "x CRASHED!";
      document.getElementById("multiplier").style.color = "red";

      setTimeout(()=>{
        document.getElementById("multiplier").style.color = "white";
        startRound();
      }, 2500);
    }

    function placeBet(){
      alert("Bet Placed: " + bet + " PKR");
      if(!flying){
        startRound();
      }
    }

    function cashOut(){
      if(!flying){
        alert("Round ابھی شروع نہیں ہوا!");
        return;
      }
      alert("Cash Out Successful at " + multiplier.toFixed(2) + "x");
    }

    // Auto Start First Round
    setTimeout(()=>{
      startRound();
    }, 1500);

  </script>

</body>
</html>
