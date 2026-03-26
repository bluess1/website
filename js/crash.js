// ── CRASH ────────────────────────────────────────────
let crashState = {
  running: false, multiplier: 1.0, crashAt: 1.0,
  bet: 0, cashedOut: false, interval: null,
};

function initCrash() {
  const c = document.getElementById('crash-content');
  c.innerHTML = `
    <div class="crash-graph">
      <canvas id="crashCanvas"></canvas>
      <div class="crash-multiplier" id="crash-mult">1.00×</div>
    </div>

    <div class="crash-status" id="crash-status">
      📖 Set a bet, click PLAY — cash out before it crashes to win!
    </div>

    <div class="section-label">BET AMOUNT</div>
    <div class="bet-row" style="margin-bottom:16px;">
      <span class="bet-label">BET</span>
      <input class="bet-input" id="crash-bet" type="number" min="1" value="50"/>
      <div class="bet-quick">
        <button onclick="document.getElementById('crash-bet').value=10">$10</button>
        <button onclick="document.getElementById('crash-bet').value=25">$25</button>
        <button onclick="document.getElementById('crash-bet').value=50">$50</button>
        <button onclick="document.getElementById('crash-bet').value=100">$100</button>
      </div>
    </div>

    <div class="crash-actions">
      <button class="action-btn" id="crash-play-btn" onclick="crashPlay()" style="flex:1;">
        ▶ PLAY
      </button>
      <button class="action-btn danger" id="crash-cashout-btn" onclick="crashCashOut()" disabled style="flex:1;">
        💰 CASH OUT NOW
      </button>
    </div>

    <div class="crash-info">
      <strong style="color:var(--gold)">How to play:</strong> The multiplier starts at 1× and climbs. 
      Hit <strong>CASH OUT NOW</strong> at any point to lock in your winnings 
      (bet × current multiplier). Wait too long and it crashes — you lose everything.
      The higher you wait, the bigger the risk and reward.
    </div>
  `;
  resizeCrashCanvas();
}

function resizeCrashCanvas() {
  const canvas = document.getElementById('crashCanvas');
  if (!canvas) return;
  canvas.width = canvas.parentElement.offsetWidth;
  canvas.height = canvas.parentElement.offsetHeight;
}

function crashGenPoint() {
  const r = Math.random();
  if (r < 0.03) return 1.0;
  return Math.max(1.0, 0.97 / (1 - Math.random()));
}

function crashPlay() {
  if (crashState.running) return;
  const bet = Math.floor(Number(document.getElementById('crash-bet').value));
  if (!bet || bet < 1 || bet > State.getBalance()) { alert('Invalid bet!'); return; }

  State.adjustBalance(-bet);
  State.updateAllBalanceDisplays();

  crashState = {
    running: true, multiplier: 1.0,
    crashAt: crashGenPoint(),
    bet, cashedOut: false, interval: null,
  };

  document.getElementById('crash-play-btn').disabled = true;
  document.getElementById('crash-cashout-btn').disabled = false;
  document.getElementById('crash-bet').disabled = true;

  const multEl = document.getElementById('crash-mult');
  multEl.className = 'crash-multiplier';

  const canvas = document.getElementById('crashCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  resizeCrashCanvas();

  let elapsed = 0;
  crashState.interval = setInterval(() => {
    elapsed += 50;
    crashState.multiplier = Math.pow(Math.E, elapsed / 5000);

    const multEl2 = document.getElementById('crash-mult');
    const statusEl = document.getElementById('crash-status');
    if (!multEl2) { clearInterval(crashState.interval); return; }

    multEl2.textContent = crashState.multiplier.toFixed(2) + '×';
    if (statusEl) statusEl.textContent = `🔥 Running at ${crashState.multiplier.toFixed(2)}× — cash out anytime!`;

    // Draw graph
    const w = canvas.width, h = canvas.height;
    const maxX = Math.max(60, elapsed / 1000 + 5);
    const maxY = Math.max(3, crashState.multiplier * 1.2);
    const toX = t => (t / maxX) * w * 0.9 + w * 0.05;
    const toY = v => h - (v / maxY) * h * 0.82 - h * 0.1;

    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(201,168,76,0.07)';
    ctx.lineWidth = 1;
    for (let v = 1; v <= Math.ceil(maxY); v++) {
      ctx.beginPath(); ctx.moveTo(0, toY(v)); ctx.lineTo(w, toY(v)); ctx.stroke();
      ctx.fillStyle = 'rgba(201,168,76,0.3)';
      ctx.font = '10px DM Mono';
      ctx.fillText(v + '×', 4, toY(v) - 3);
    }

    // Fill
    ctx.fillStyle = 'rgba(201,168,76,0.06)';
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(1));
    for (let t = 0; t <= elapsed / 1000; t += 0.05) {
      ctx.lineTo(toX(t), toY(Math.pow(Math.E, t / 5)));
    }
    ctx.lineTo(toX(elapsed / 1000), toY(1));
    ctx.closePath();
    ctx.fill();

    // Line
    ctx.strokeStyle = '#c9a84c';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(201,168,76,0.5)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    for (let t = 0; t <= elapsed / 1000; t += 0.05) {
      const x = toX(t), y = toY(Math.pow(Math.E, t / 5));
      t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (crashState.multiplier >= crashState.crashAt) {
      clearInterval(crashState.interval);
      crashState.running = false;

      if (!crashState.cashedOut) {
        // Red crash dot
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(toX(elapsed/1000), toY(crashState.multiplier), 7, 0, Math.PI*2);
        ctx.fill();

        multEl2.className = 'crash-multiplier crashed';
        multEl2.textContent = '💥 ' + crashState.crashAt.toFixed(2) + '×';
        if (statusEl) statusEl.textContent = `💥 Crashed at ${crashState.crashAt.toFixed(2)}× — better luck next time!`;
        State.recordResult(false, 0);
        showResult(false, '💥 CRASHED!', '-' + State.fmt(bet));
      }

      document.getElementById('crash-play-btn').disabled = false;
      document.getElementById('crash-cashout-btn').disabled = true;
      document.getElementById('crash-bet').disabled = false;
      State.updateAllBalanceDisplays();
    }
  }, 50);
}

function crashCashOut() {
  if (!crashState.running || crashState.cashedOut) return;
  crashState.cashedOut = true;
  const payout = Math.floor(crashState.bet * crashState.multiplier);
  State.adjustBalance(payout);
  State.recordResult(true, payout - crashState.bet);
  State.updateAllBalanceDisplays();

  const multEl = document.getElementById('crash-mult');
  if (multEl) {
    multEl.className = 'crash-multiplier cashed';
    multEl.textContent = '✅ ' + crashState.multiplier.toFixed(2) + '×';
  }
  const statusEl = document.getElementById('crash-status');
  if (statusEl) statusEl.textContent = `✅ Cashed out at ${crashState.multiplier.toFixed(2)}× — nice move!`;

  document.getElementById('crash-cashout-btn').disabled = true;
  showResult(true, '✅ CASHED OUT!', `× ${crashState.multiplier.toFixed(2)} = +${State.fmt(payout - crashState.bet)}`);
}

function crashStop() {
  if (crashState.interval) { clearInterval(crashState.interval); crashState.interval = null; }
  crashState.running = false;
}
