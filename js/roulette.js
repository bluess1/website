// ── ROULETTE ─────────────────────────────────────────
const RED_NUMS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const ROULETTE_BETS = [
  { id: 'red',   label: 'RED',   cls: 'red-btn',   mult: 2,  check: n => n > 0 && RED_NUMS.has(n) },
  { id: 'black', label: 'BLACK', cls: 'red-btn',   mult: 2,  check: n => n > 0 && !RED_NUMS.has(n) },
  { id: 'zero',  label: '0 ZERO',cls: 'green-btn', mult: 35, check: n => n === 0 },
  { id: 'odd',   label: 'ODD',   cls: '',          mult: 2,  check: n => n > 0 && n % 2 !== 0 },
  { id: 'even',  label: 'EVEN',  cls: '',          mult: 2,  check: n => n > 0 && n % 2 === 0 },
  { id: 'low',   label: '1–18',  cls: '',          mult: 2,  check: n => n >= 1 && n <= 18 },
  { id: 'high',  label: '19–36', cls: '',          mult: 2,  check: n => n >= 19 && n <= 36 },
  { id: '1st12', label: '1st 12',cls: '',          mult: 3,  check: n => n >= 1 && n <= 12 },
  { id: '2nd12', label: '2nd 12',cls: '',          mult: 3,  check: n => n >= 13 && n <= 24 },
];

let rouletteSelected = null;
let rouletteSpinning = false;

function initRoulette() {
  const c = document.getElementById('roulette-content');
  c.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:24px;">
      <div class="roulette-wheel-wrap">
        <div class="roulette-pointer"></div>
        <div class="roulette-wheel" id="rl-wheel">
          <div class="roulette-result-num" id="rl-num">?</div>
        </div>
      </div>
      <div class="roulette-bets" id="rl-bets" style="margin-top:20px;"></div>
      <div class="bet-row">
        <span class="bet-label">BET</span>
        <input class="bet-input" id="rl-bet" type="number" min="1" value="50"/>
        <div class="bet-quick">
          <button onclick="document.getElementById('rl-bet').value=10">$10</button>
          <button onclick="document.getElementById('rl-bet').value=25">$25</button>
          <button onclick="document.getElementById('rl-bet').value=50">$50</button>
          <button onclick="document.getElementById('rl-bet').value=100">$100</button>
        </div>
      </div>
      <button class="action-btn" id="rl-spin-btn" onclick="rlSpin()" style="width:100%;margin-top:8px;">SPIN THE WHEEL</button>
    </div>
  `;
  renderRlBets();
}

function renderRlBets() {
  const el = document.getElementById('rl-bets');
  if (!el) return;
  el.innerHTML = ROULETTE_BETS.map(b => `
    <button class="roulette-bet-btn ${b.cls} ${rouletteSelected===b.id?'selected':''}" onclick="rlSelect('${b.id}')">
      ${b.label}<br/><span style="font-size:0.55rem;color:var(--gold-dim)">×${b.mult}</span>
    </button>
  `).join('');
}

function rlSelect(id) {
  rouletteSelected = id;
  renderRlBets();
}

function rlSpin() {
  if (rouletteSpinning) return;
  if (!rouletteSelected) { alert('Choose a bet first!'); return; }
  const betEl = document.getElementById('rl-bet');
  const bet = Math.floor(Number(betEl.value));
  if (!bet || bet < 1 || bet > State.getBalance()) { alert('Invalid bet!'); return; }

  State.adjustBalance(-bet);
  rouletteSpinning = true;
  document.getElementById('rl-spin-btn').disabled = true;
  document.getElementById('rl-num').textContent = '';

  const num = Math.floor(Math.random() * 37); // 0-36
  const wheel = document.getElementById('rl-wheel');
  const current = parseInt(wheel.style.getPropertyValue('--spin') || '0') || 0;
  const extra = 1440 + Math.random() * 360;
  const total = current + extra;
  wheel.style.transition = 'transform 3.2s cubic-bezier(0.17,0.67,0.12,1.0)';
  wheel.style.transform = `rotate(${total}deg)`;
  wheel.style.setProperty('--spin', total);

  setTimeout(() => {
    document.getElementById('rl-num').textContent = num;

    const betDef = ROULETTE_BETS.find(b => b.id === rouletteSelected);
    const won = betDef && betDef.check(num);
    if (won) {
      const payout = bet * betDef.mult;
      State.adjustBalance(payout);
      State.recordResult(true, payout - bet);
      showResult(true, num === 0 ? '🟢 ZERO!' : 'YOU WIN!', '+' + State.fmt(payout - bet));
    } else {
      State.recordResult(false, 0);
      showResult(false, 'YOU LOSE', '-' + State.fmt(bet));
    }

    State.updateAllBalanceDisplays();
    rouletteSpinning = false;
    document.getElementById('rl-spin-btn').disabled = false;
  }, 3400);
}
