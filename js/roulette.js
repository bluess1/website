// ── ROULETTE ─────────────────────────────────────────
// American Roulette: 38 pockets (0, 00, 1-36)
const WHEEL_ORDER = [0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1, '00', 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2];
const RED_NUMS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const BLACK_NUMS = new Set([2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35]);
const GREEN_NUMS = new Set([0, '00']);
const POCKET_ANGLE = 360 / 38;

function getNumColor(n) {
  if (GREEN_NUMS.has(n)) return 'green';
  if (RED_NUMS.has(n)) return 'red';
  return 'black';
}

function getNumIndex(num) {
  return WHEEL_ORDER.indexOf(num);
}

const ROULETTE_BETS = [
  { id: 'red',    label: '🔴 RED',     cls: 'red-btn',    mult: 2,  check: n => n > 0 && RED_NUMS.has(n) },
  { id: 'black',  label: '⚫ BLACK',   cls: 'black-btn', mult: 2,  check: n => n > 0 && !RED_NUMS.has(n) },
  { id: 'odd',    label: 'ODD',         cls: '',           mult: 2,  check: n => n > 0 && n % 2 !== 0 },
  { id: 'even',   label: 'EVEN',        cls: '',           mult: 2,  check: n => n > 0 && n % 2 === 0 },
  { id: 'low',    label: '1-18',        cls: '',           mult: 2,  check: n => n >= 1 && n <= 18 },
  { id: 'high',   label: '19-36',       cls: '',           mult: 2,  check: n => n >= 19 && n <= 36 },
  { id: '1st12',  label: '1ST 12',     cls: '',           mult: 3,  check: n => n >= 1 && n <= 12 },
  { id: '2nd12',  label: '2ND 12',     cls: '',           mult: 3,  check: n => n >= 13 && n <= 24 },
  { id: '3rd12',  label: '3RD 12',     cls: '',           mult: 3,  check: n => n >= 25 && n <= 36 },
];

let rouletteSelected = null;
let rouletteSpinning = false;
let rlRecentPayouts = [];

function initRoulette() {
  const c = document.getElementById('roulette-content');
  c.innerHTML = `
    <div class="rl-container">
      <div class="rl-wheel-area">
        <div class="roulette-wheel-wrap">
          <div class="roulette-pointer"></div>
          <div class="roulette-wheel" id="rl-wheel">
            <div class="roulette-result-num" id="rl-num">?</div>
          </div>
        </div>
        <div id="rl-live-feed" class="rl-live-feed">Recent spins appear here...</div>
      </div>
      
      <div class="rl-table-area">
        <div class="section-label">BETTING TABLE</div>
        <div class="roulette-table" id="rl-table"></div>
        
        <div class="section-label" style="margin-top:16px">YOUR BET</div>
        <div class="bet-row">
          <span class="bet-label">$</span>
          <input class="bet-input" id="rl-bet" type="number" min="1" value="50"/>
          <div class="bet-quick">
            <button onclick="document.getElementById('rl-bet').value=10">10</button>
            <button onclick="document.getElementById('rl-bet').value=25">25</button>
            <button onclick="document.getElementById('rl-bet').value=100">100</button>
          </div>
        </div>
        <button class="action-btn" id="rl-spin-btn" onclick="rlSpin()" style="width:100%">
          🎡 SPIN
        </button>
      </div>
    </div>
  `;
  renderRlTable();
}

function renderRlTable() {
  const table = document.getElementById('rl-table');
  const rows = [
    ['1st12', '1', '2', '3'],
    [null, '4', '5', '6'],
    [null, '7', '8', '9'],
    [null, '10', '11', '12'],
    [null, '13', '14', '15'],
    [null, '16', '17', '18'],
    [null, '19', '20', '21'],
    [null, '22', '23', '24'],
    [null, '25', '26', '27'],
    [null, '28', '29', '30'],
    [null, '31', '32', '33'],
    [null, '34', '35', '36'],
    ['low', 'odd', 'even', 'high'],
  ];
  
  table.innerHTML = rows.map(row => `
    <div class="rl-table-row">
      ${row.map((cell, i) => {
        if (cell === 'low') return `<div class="rl-table-cell outside-cell" onclick="rlSelect('low')">1-18</div>`;
        if (cell === 'odd') return `<div class="rl-table-cell outside-cell" onclick="rlSelect('odd')">ODD</div>`;
        if (cell === 'even') return `<div class="rl-table-cell outside-cell" onclick="rlSelect('even')">EVEN</div>`;
        if (cell === 'high') return `<div class="rl-table-cell outside-cell" onclick="rlSelect('high')">19-36</div>`;
        if (cell === '1st12') return `<div class="rl-table-cell outside-cell" onclick="rlSelect('1st12')">1ST 12</div>`;
        if (cell === '2nd12') return `<div class="rl-table-cell outside-cell" onclick="rlSelect('2nd12')">2ND 12</div>`;
        if (cell === '3rd12') return `<div class="rl-table-cell outside-cell" onclick="rlSelect('3rd12')">3RD 12</div>`;
        if (!cell) return `<div class="rl-table-cell empty"></div>`;
        
        const n = parseInt(cell);
        if (n === 0) return `<div class="rl-table-cell green-cell" onclick="rlSelectNumber(0)">0</div>`;
        const isRed = RED_NUMS.has(n);
        const cls = isRed ? 'red-cell' : 'black-cell';
        return `<div class="rl-table-cell ${cls}" onclick="rlSelectNumber(${n})">${cell}</div>`;
      }).join('')}
    </div>
  `).join('');
  
  table.innerHTML += `
    <div class="rl-zero-row">
      <div class="rl-table-cell green-cell zero-cell" onclick="rlSelectNumber(0)">0</div>
      <div class="rl-table-cell green-cell zero-cell" onclick="rlSelectNumber('00')">00</div>
    </div>
  `;
}

function rlSelect(id) {
  rouletteSelected = id;
  document.querySelectorAll('.rl-table-cell, .roulette-bet-btn').forEach(el => el.classList.remove('selected'));
  document.querySelectorAll(`[onclick*="'${id}'"]`).forEach(el => el.classList.add('selected'));
}

function rlSelectNumber(n) {
  let betId = null;
  if (n === 0 || n === '00') {
    betId = n === 0 ? 'zero' : 'double-zero';
  } else if (RED_NUMS.has(n)) {
    betId = 'red';
  } else {
    betId = 'black';
  }
  rouletteSelected = betId;
  document.querySelectorAll('.rl-table-cell').forEach(el => el.classList.remove('selected'));
  document.querySelectorAll(`[onclick*="rlSelectNumber(${n})"]`).forEach(el => el.classList.add('selected'));
}

function rlCleanup() {
  // cleanup handled by main.js
}

function rlSpin() {
  if (rouletteSpinning) return;
  if (!rouletteSelected) { alert('Select a bet first!'); return; }
  const betEl = document.getElementById('rl-bet');
  const bet = Math.floor(Number(betEl.value));
  if (!bet || bet < 1 || bet > State.getBalance()) { alert('Invalid bet!'); return; }

  State.adjustBalance(-bet);
  rouletteSpinning = true;
  const spinBtn = document.getElementById('rl-spin-btn');
  spinBtn.disabled = true;
  spinBtn.textContent = '🎡 Spinning...';
  document.getElementById('rl-num').textContent = '';

  const num = Math.random() < 2/38 
    ? (Math.random() < 0.5 ? 0 : '00')
    : Math.floor(Math.random() * 36) + 1;
  
  const wheel = document.getElementById('rl-wheel');
  const numIndex = getNumIndex(num);
  const baseRotation = -numIndex * POCKET_ANGLE;
  const extraSpins = (4 + Math.floor(Math.random() * 3)) * 360;
  const totalRotation = baseRotation + extraSpins;
  
  wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 1.0)';
  wheel.style.transform = `rotate(${totalRotation}deg)`;

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
    spinBtn.textContent = '🎡 SPIN';
  }, 4200);
}

function addRlPayout(num, won, amount) {
  const color = getNumColor(num);
  const emoji = color === 'green' ? '🟢' : color === 'red' ? '🔴' : '⚫';
  rlRecentPayouts.unshift({ num, emoji, won, amount });
  if (rlRecentPayouts.length > 5) rlRecentPayouts.pop();
  updateRlPayoutFeed();
}

function updateRlPayoutFeed() {
  const feed = document.getElementById('rl-live-feed');
  if (!feed || !rlRecentPayouts.length) return;
  feed.innerHTML = rlRecentPayouts.map(p => {
    const sign = p.won ? '+' : '-';
    const cls = p.won ? 'win' : 'lose';
    return `<span class="rl-payout ${cls}">${p.emoji} ${p.num} ${sign}${State.fmt(Math.abs(p.amount))}</span>`;
  }).join(' ');
}
