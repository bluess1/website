// ── ROULETTE ─────────────────────────────────────────
// American Roulette: 38 pockets (0, 00, 1-36)
// Wheel order clockwise from top (0 at top = 0 degrees)
const WHEEL_ORDER = [0,28,9,26,30,11,7,20,32,17,5,22,34,15,3,24,36,13,1,00,27,10,25,29,12,8,19,31,18,6,21,33,16,4,23,35,14,2];
const RED_NUMS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const BLACK_NUMS = new Set([2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35]);
const GREEN_NUMS = new Set([0, '00']);

function getNumColor(n) {
  if (GREEN_NUMS.has(n)) return 'green';
  if (RED_NUMS.has(n)) return 'red';
  return 'black';
}

function getNumIndex(num) {
  return WHEEL_ORDER.indexOf(num);
}

const ROULETTE_BETS = [
  { id: 'red',   label: '🔴 RED',    cls: 'red-btn',   mult: 2,  payout: 'Pays 1:1', check: n => n > 0 && RED_NUMS.has(n) },
  { id: 'black', label: '⚫ BLACK',  cls: 'red-btn',   mult: 2,  payout: 'Pays 1:1', check: n => n > 0 && !RED_NUMS.has(n) },
  { id: 'zero',  label: '🟢 ZERO',   cls: 'green-btn', mult: 35, payout: 'Pays 35:1', check: n => n === 0 },
  { id: 'odd',   label: 'ODD',        cls: '',          mult: 2,  payout: 'Pays 1:1', check: n => n > 0 && n % 2 !== 0 },
  { id: 'even',  label: 'EVEN',       cls: '',          mult: 2,  payout: 'Pays 1:1', check: n => n > 0 && n % 2 === 0 },
  { id: 'low',   label: 'LOW 1–18',   cls: '',          mult: 2,  payout: 'Pays 1:1', check: n => n >= 1 && n <= 18 },
  { id: 'high',  label: 'HIGH 19–36', cls: '',          mult: 2,  payout: 'Pays 1:1', check: n => n >= 19 && n <= 36 },
  { id: '1st12', label: '1ST DOZEN',  cls: '',          mult: 3,  payout: 'Pays 2:1', check: n => n >= 1 && n <= 12 },
  { id: '2nd12', label: '2ND DOZEN',  cls: '',          mult: 3,  payout: 'Pays 2:1', check: n => n >= 13 && n <= 24 },
];

let rouletteSelected = null;
let rouletteSpinning = false;

let rlRecentPayouts = [];

function initRoulette() {
  const c = document.getElementById('roulette-content');
  c.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:28px;">

      <div class="section-label" style="margin-bottom:0">STEP 1 — PICK A BET</div>
      <div class="roulette-bets" id="rl-bets" style="margin-top:14px;"></div>

      <div class="section-label">STEP 2 — SET YOUR AMOUNT</div>
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

      <button class="action-btn" id="rl-spin-btn" onclick="rlSpin()" style="width:100%;margin-bottom:12px;">
        🎡 SPIN THE WHEEL
      </button>

      <div id="rl-live-feed" style="font-size:0.65rem;color:var(--text-muted);text-align:center;margin-bottom:16px;">
        🔴 Loading live feed…
      </div>

      <div class="section-label">WHEEL</div>
      <div class="roulette-wheel-wrap">
        <div class="roulette-pointer"></div>
        <div class="roulette-wheel" id="rl-wheel">
          <div class="roulette-result-num" id="rl-num">?</div>
        </div>
      </div>

      <div class="section-label" style="margin-top:20px;">🏆 TOP PLAYERS</div>
      <div id="rl-leaderboard" style="max-height:120px;overflow-y:auto;">
        <div style="text-align:center;color:var(--text-muted);font-size:0.7rem;">Loading…</div>
      </div>
    </div>
  `;
  renderRlBets();
  loadRlLiveFeed();
  loadRlLeaderboard();
  subscribeRlLiveFeed();
}

async function loadRlLiveFeed() {
  const { data } = await fetchLeaderboard(5);
  if (data && data.length) {
    const feed = data.map((p, i) => {
      const medal = ['🥇','🥈','🥉','4️⃣','5️⃣'][i];
      return `${medal} ${p.name}: ${State.fmt(p.balance)}`;
    }).join(' • ');
    document.getElementById('rl-live-feed').innerHTML = feed;
  }
}

async function loadRlLeaderboard() {
  const { data } = await fetchLeaderboard(10);
  const container = document.getElementById('rl-leaderboard');
  if (!data || !data.length) {
    container.innerHTML = '<div style="text-align:center;color:var(--text-muted);font-size:0.7rem;">No players yet</div>';
    return;
  }
  const medals = ['🥇','🥈','🥉'];
  container.innerHTML = data.map((p, i) => `
    <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);font-size:0.7rem;">
      <span>${medals[i] || (i+1)}. ${p.name}</span>
      <span style="color:var(--green2);">${State.fmt(p.balance)}</span>
    </div>
  `).join('');
}

function addRlPayout(num, won, amount) {
  const color = getNumColor(num);
  const emoji = color === 'green' ? '🟢' : color === 'red' ? '🔴' : '⚫';
  rlRecentPayouts.unshift({ num, emoji, won, amount, time: Date.now() });
  if (rlRecentPayouts.length > 5) rlRecentPayouts.pop();
  updateRlPayoutFeed();
}

function updateRlPayoutFeed() {
  const feed = document.getElementById('rl-live-feed');
  if (!feed || !rlRecentPayouts.length) return;
  feed.innerHTML = rlRecentPayouts.map(p => {
    const sign = p.won ? '+' : '-';
    const cls = p.won ? 'color:var(--green2)' : 'color:var(--red2)';
    return `${p.emoji} ${p.num} — <span style="${cls}">${sign}${State.fmt(Math.abs(p.amount))}</span>`;
  }).join(' • ');
}

let rlChannel = null;
function subscribeRlLiveFeed() {
  if (rlChannel) rlChannel.unsubscribe();
  rlChannel = subscribeToLeaderboard(() => {
    loadRlLiveFeed();
    loadRlLeaderboard();
  });
}

function rlCleanup() {
  if (rlChannel) {
    rlChannel.unsubscribe();
    rlChannel = null;
  }
}

function renderRlBets() {
  const el = document.getElementById('rl-bets');
  if (!el) return;
  el.innerHTML = ROULETTE_BETS.map(b => `
    <button class="roulette-bet-btn ${b.cls} ${rouletteSelected===b.id?'selected':''}" onclick="rlSelect('${b.id}')">
      ${b.label}
      <span class="bet-payout">${b.payout}</span>
    </button>
  `).join('');
}

function rlSelect(id) {
  rouletteSelected = id;
  renderRlBets();
}

function rlSpin() {
  if (rouletteSpinning) return;
  if (!rouletteSelected) { alert('Pick a bet type first (Step 1)!'); return; }
  const betEl = document.getElementById('rl-bet');
  const bet = Math.floor(Number(betEl.value));
  if (!bet || bet < 1 || bet > State.getBalance()) { alert('Invalid bet amount!'); return; }

  State.adjustBalance(-bet);
  rouletteSpinning = true;
  const spinBtn = document.getElementById('rl-spin-btn');
  spinBtn.disabled = true;
  spinBtn.textContent = 'Spinning…';
  document.getElementById('rl-num').textContent = '';

  // Generate random result (0-37 where 37 = 00)
  const num = Math.random() < 2/38 ? (Math.random() < 0.5 ? 0 : '00') : Math.floor(Math.random() * 36) + 1;
  const numIndex = getNumIndex(num);
  
  // Calculate target rotation to land on this number
  // Pointer is at top (270deg from CSS default, or -90deg)
  // Each pocket = 360/38 = 9.4737 degrees
  const wheel = document.getElementById('rl-wheel');
  const currentAngle = parseFloat(wheel.dataset.angle || 0);
  const pocketAngle = 360 / 38;
  const targetAngle = 270 - (numIndex * pocketAngle); // Angle where the number should be at top
  const fullRotations = 1440 + Math.floor(Math.random() * 3) * 360; // 4-6 full rotations
  const totalAngle = currentAngle + fullRotations + targetAngle - (currentAngle % 360);
  
  wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 1.0)';
  wheel.style.transform = `rotate(${totalAngle}deg)`;
  wheel.dataset.angle = totalAngle;

  setTimeout(() => {
    const color = getNumColor(num);
    const emoji = color === 'green' ? '🟢' : color === 'red' ? '🔴' : '⚫';
    document.getElementById('rl-num').textContent = num;

    const betDef = ROULETTE_BETS.find(b => b.id === rouletteSelected);
    const won = betDef && betDef.check(num);
    if (won) {
      const payout = bet * betDef.mult;
      State.adjustBalance(payout);
      State.recordResult(true, payout - bet);
      showResult(true, `${emoji} ${num} — YOU WIN!`, '+' + State.fmt(payout - bet));
      addRlPayout(num, true, payout - bet);
    } else {
      State.recordResult(false, 0);
      showResult(false, `${emoji} ${num} — No luck`, '-' + State.fmt(bet));
      addRlPayout(num, false, bet);
    }

    State.updateAllBalanceDisplays();
    rouletteSpinning = false;
    spinBtn.disabled = false;
    spinBtn.textContent = '🎡 SPIN THE WHEEL';
  }, 4200);
}
