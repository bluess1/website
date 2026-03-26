// ── SLOTS ───────────────────────────────────────────
const SYMBOLS = ['🍒','🍋','🍊','🍇','7️⃣','💎','🎰'];
const WEIGHTS  = [30,  25,  20,  15,   6,   3,   1];
const PAYOUTS  = { '🎰': 50, '💎': 25, '7️⃣': 20, '🍇': 8, '🍊': 6, '🍋': 4, '🍒': 3 };

function initSlots() {
  const container = document.getElementById('slots-content');
  container.innerHTML = `
    <div class="slots-machine">

      <div class="section-label">SPIN THE REELS</div>
      <div class="slots-reels">
        <div class="reel" id="r0">🍒</div>
        <div class="reel" id="r1">🍋</div>
        <div class="reel" id="r2">🍊</div>
      </div>

      <div class="bet-row">
        <span class="bet-label">BET</span>
        <input class="bet-input" id="slots-bet" type="number" min="1" max="1000" value="50" />
        <div class="bet-quick">
          <button onclick="slotsSetBet(10)">$10</button>
          <button onclick="slotsSetBet(25)">$25</button>
          <button onclick="slotsSetBet(50)">$50</button>
          <button onclick="slotsSetBet(100)">$100</button>
          <button onclick="slotsSetBet(Math.floor(State.getBalance()/2))">HALF</button>
          <button onclick="slotsSetBet(State.getBalance())">ALL IN</button>
        </div>
      </div>

      <button class="action-btn" id="slots-spin-btn" onclick="slotsSpin()" style="width:100%;margin-bottom:24px;">
        🎰 SPIN
      </button>

      <div class="paytable">
        <div class="paytable-title">PAYTABLE — Match all 3 to win</div>
        <div class="paytable-grid">
          <div>🎰🎰🎰 JACKPOT</div><div><span>× 50</span></div>
          <div>💎💎💎 Diamonds</div><div><span>× 25</span></div>
          <div>7️⃣7️⃣7️⃣ Sevens</div><div><span>× 20</span></div>
          <div>🍇🍇🍇 Grapes</div><div><span>× 8</span></div>
          <div>🍊🍊🍊 Orange</div><div><span>× 6</span></div>
          <div>🍋🍋🍋 Lemon</div><div><span>× 4</span></div>
          <div>🍒🍒🍒 Cherry</div><div><span>× 3</span></div>
          <div>Any 2 match</div><div><span>× 1.5</span></div>
        </div>
      </div>
    </div>
  `;
}

function weightedSymbol() {
  const total = WEIGHTS.reduce((a,b)=>a+b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SYMBOLS.length; i++) {
    r -= WEIGHTS[i];
    if (r <= 0) return SYMBOLS[i];
  }
  return SYMBOLS[0];
}

function slotsSetBet(n) {
  const input = document.getElementById('slots-bet');
  if (input) input.value = Math.max(1, Math.min(Math.round(n), State.getBalance()));
}

let slotsSpinning = false;
function slotsSpin() {
  if (slotsSpinning) return;
  const betInput = document.getElementById('slots-bet');
  const bet = Math.floor(Number(betInput.value));
  if (!bet || bet < 1) return;
  if (bet > State.getBalance()) { alert('Not enough balance!'); return; }

  State.adjustBalance(-bet);
  slotsSpinning = true;
  const btn = document.getElementById('slots-spin-btn');
  btn.disabled = true;
  btn.textContent = 'Spinning…';

  const reels = [document.getElementById('r0'), document.getElementById('r1'), document.getElementById('r2')];
  reels.forEach(r => { r.classList.add('spinning'); r.classList.remove('winner'); });

  const results = [weightedSymbol(), weightedSymbol(), weightedSymbol()];
  const delays = [700, 1050, 1400];

  reels.forEach((r, i) => {
    setTimeout(() => {
      r.textContent = results[i];
      r.classList.remove('spinning');
      if (i === 2) evaluateSlots(results, bet, reels, btn);
    }, delays[i]);
  });
}

function evaluateSlots(results, bet, reels, btn) {
  const [a, b, c] = results;
  let mult = 0;
  if (a === b && b === c) {
    mult = PAYOUTS[a] || 3;
    reels.forEach(r => r.classList.add('winner'));
  } else if (a === b || b === c || a === c) {
    mult = 1.5;
    reels.forEach((r, i) => {
      if ((i===0 && a===b) || (i===1 && (a===b||b===c)) || (i===2 && (a===c||b===c))) {
        r.classList.add('winner');
      }
    });
  }

  const winnings = Math.floor(bet * mult);
  if (winnings > 0) {
    State.adjustBalance(winnings);
    State.recordResult(true, winnings - bet);
    if (mult >= 20) showResult(true, '🎰 JACKPOT!', '+' + State.fmt(winnings - bet));
    else showResult(true, 'YOU WIN!', '+' + State.fmt(winnings - bet));
  } else {
    State.recordResult(false, 0);
  }

  setTimeout(() => {
    slotsSpinning = false;
    btn.disabled = false;
    btn.textContent = '🎰 SPIN';
    State.updateAllBalanceDisplays();
  }, 500);
}
