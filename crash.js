// ── CRASH ────────────────────────────────────────────
let crashState = {
  running: false,
  multiplier: 1.0,
  crashAt: 1.0,
  bet: 0,
  cashedOut: false,
  interval: null,
  points: [],
};

function initCrash() {
  const c = document.getElementById('crash-content');
  c.innerHTML = `
    <div class="crash-graph">
      <canvas id="crashCanvas"></canvas>
      <div class="crash-multiplier" id="crash-mult">1.00×</div>
    </div>
    <div class="crash-status" id="crash-status">Place a bet and click PLAY</div>
    <div class="bet-row">
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
      <button class="action-btn" id="crash-play-btn" onclick="crashPlay()">PLAY</button>
      <button class="action-btn danger" id="crash-cashout-btn" onclick="crashCashOut()" disabled>CASH OUT</button>
    </div>
    <div class="info-text" style="margin-top:16px;">The multiplier rises until it crashes. Cash out before it crashes to win your bet × the multiplier. The higher you wait, the bigger the risk.</div>
  `;
  resizeCrashCanvas();
}

function resizeCrashCanvas() {
  const canvas = document.getElementById('crashCanvas');
  if (!canvas) return;
  const wrap = canvas.parentElement;
  canvas.width = wrap.offsetWidth;
  canvas.height = wrap.offsetHeight;
}

function crashGenPoint() {
  // House edge ~3%, crash distribution: P(crash > x) = 0.97/x
  const r = Math.random();
  if (r < 0.03) return 1.0; // instant crash
  return Math.max(1.0, 0.97 / (1 - Math.random()));
}

function crashPlay() {
  if (crashState.running) return;
  const betEl = document.getElementById('crash-bet');
  const bet = Math.floor(Number(betEl.value));
  if (!bet || bet < 1 || bet > State.getBalance()) { alert('Invalid bet!'); return; }

  State.adjustBalance(-bet);
  State.updateAllBalanceDisplays();
  crashState = {
    running: true,
    multiplier: 1.0,
    crashAt: crashGenPoint(),
    bet,
    cashedOut: false,
    interval: null,
    points: [],
  };

  document.getElementById('crash-play-btn').disabled = true;
  document.getElementById('crash-cashout-btn').disabled = false;
  document.getElementById('crash-bet').disabled = true;

  const multEl = document.getElementById('crash-mult');
  multEl.className = 'crash-multiplier';

  let elapsed = 0;
  const canvas = document.getElementById('crashCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  resizeCrashCanvas();

  crashState.interval = setInterval(() => {
    elapsed += 50;
    // Multiplier grows: starts slow, accelerates
    crashState.multiplier = Math.pow(Math.E, elapsed / 5000);

    const statusEl = document.getElementById('crash-status');
    const multEl2 = document.getElementById('crash-mult');
    if (!multEl2) { clearInterval(crashState.interval); return; }

    multEl2.textContent = crashState.multiplier.toFixed(2) + '×';
    if (statusEl) statusEl.textContent = 'Running… cash out before it crashes!';

    // Draw graph
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width, h = canvas.height;
      const maxX = Math.max(60, elapsed / 1000 + 5);
      const maxY = Math.max(3, crashState.multiplier * 1.2);

      const toX = t => (t / maxX) * w * 0.92 + w * 0.04;
      const toY = v => h - (v / maxY) * h * 0.82 - h * 0.08;

      // Grid lines
      ctx.strokeStyle = 'rgba(201,168,76,0.07)';
      ctx.lineWidth = 1;
      for (let v = 1; v <= maxY; v++) {
        ctx.beginPath(); ctx.moveTo(0, toY(v)); ctx.lineTo(w, toY(v)); ctx.stroke();
      }

      // Curve
      ctx.strokeStyle = '#c9a84c';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(201,168,76,0.4)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let t = 0; t <= elapsed / 1000; t += 0.05) {
        const v = Math.pow(Math.E, t / 5);
        const x = toX(t), y = toY(v);
        if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Fill under curve
      ctx.fillStyle = 'rgba(201,168,76,0.06)';
      ctx.beginPath();
      for (let t = 0; t <= elapsed / 1000; t += 0.05) {
        const v = Math.pow(Math.E, t / 5);
        const x = toX(t), y = toY(v);
        if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.lineTo(toX(elapsed / 1000), toY(1));
      ctx.lineTo(toX(0), toY(1));
      ctx.closePath();
      ctx.fill();
    }

    // Check crash
    if (crashState.multiplier >= crashState.crashAt) {
      clearInterval(crashState.interval);
      crashState.running = false;
      if (!crashState.cashedOut) {
        // Draw red crash point
        if (ctx) {
          ctx.fillStyle = '#c0392b';
          ctx.beginPath();
          const ex = (elapsed/1000/Math.max(60, elapsed/1000+5)) * canvas.width * 0.92 + canvas.width*0.04;
          const ey = canvas.height - (crashState.multiplier / Math.max(3,crashState.multiplier*1.2)) * canvas.height*0.82 - canvas.height*0.08;
          ctx.arc(ex, ey, 6, 0, Math.PI*2);
          ctx.fill();
        }
        multEl2.className = 'crash-multiplier crashed';
        if (statusEl) statusEl.textContent = '💥 CRASHED at ' + crashState.multiplier.toFixed(2) + '×';
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
  if (multEl) multEl.className = 'crash-multiplier cashed';
  const statusEl = document.getElementById('crash-status');
  if (statusEl) statusEl.textContent = '✅ Cashed out at ' + crashState.multiplier.toFixed(2) + '×!';

  document.getElementById('crash-cashout-btn').disabled = true;
  showResult(true, 'CASHED OUT ×' + crashState.multiplier.toFixed(2), '+' + State.fmt(payout - crashState.bet));
}

function crashStop() {
  if (crashState.interval) { clearInterval(crashState.interval); crashState.interval = null; }
  crashState.running = false;
}
