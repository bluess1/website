// ── DICE ─────────────────────────────────────────────
const DICE_FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];
let diceMode = 'high'; // 'high' = roll > target, 'low' = roll < target
let diceRolling = false;

function initDice() {
  const c = document.getElementById('dice-content');
  c.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:28px;">
      <div class="dice-display">
        <div class="dice-face" id="dice-face">⚃</div>
        <div class="dice-vs">VS</div>
        <div style="text-align:center;">
          <div style="font-size:2rem;font-weight:700;font-family:'Playfair Display',serif;color:var(--gold2);" id="dice-target-display">4</div>
          <div style="font-size:0.6rem;color:var(--text-muted);letter-spacing:0.1em;">TARGET</div>
        </div>
      </div>
      <div class="dice-mode-row">
        <button class="dice-mode-btn active" id="mode-high" onclick="diceSetMode('high')">ROLL HIGHER ↑</button>
        <button class="dice-mode-btn" id="mode-low" onclick="diceSetMode('low')">ROLL LOWER ↓</button>
      </div>
      <div class="dice-target-row">
        <span class="dice-target-label">TARGET</span>
        <input type="range" class="dice-slider" id="dice-slider" min="1" max="6" value="4" oninput="diceUpdateTarget(this.value)"/>
        <span class="dice-chance" id="dice-chance">WIN: 50%</span>
      </div>
      <div class="bet-row" style="margin-top:12px;">
        <span class="bet-label">BET</span>
        <input class="bet-input" id="dice-bet" type="number" min="1" value="50"/>
        <div class="bet-quick">
          <button onclick="document.getElementById('dice-bet').value=10">$10</button>
          <button onclick="document.getElementById('dice-bet').value=25">$25</button>
          <button onclick="document.getElementById('dice-bet').value=50">$50</button>
          <button onclick="document.getElementById('dice-bet').value=100">$100</button>
        </div>
      </div>
      <div id="dice-payout-info" style="font-size:0.65rem;color:var(--gold-dim);margin-bottom:10px;"></div>
      <button class="action-btn" id="dice-roll-btn" onclick="diceRoll()" style="width:100%;">ROLL DICE</button>
    </div>
  `;
  diceUpdateTarget(4);
}

function diceSetMode(mode) {
  diceMode = mode;
  document.getElementById('mode-high').classList.toggle('active', mode === 'high');
  document.getElementById('mode-low').classList.toggle('active', mode === 'low');
  const slider = document.getElementById('dice-slider');
  if (slider) diceUpdateTarget(parseInt(slider.value));
}

function diceUpdateTarget(val) {
  val = parseInt(val);
  const targetEl = document.getElementById('dice-target-display');
  const chanceEl = document.getElementById('dice-chance');
  const payoutEl = document.getElementById('dice-payout-info');
  if (targetEl) targetEl.textContent = val;

  let winChance, mult;
  if (diceMode === 'high') {
    winChance = (6 - val) / 6;
    mult = winChance > 0 ? +(0.97 / winChance).toFixed(2) : 0;
  } else {
    winChance = (val - 1) / 6;
    mult = winChance > 0 ? +(0.97 / winChance).toFixed(2) : 0;
  }

  if (chanceEl) chanceEl.textContent = 'WIN: ' + Math.round(winChance * 100) + '%';
  if (payoutEl) payoutEl.textContent = `Multiplier: ×${mult} (house edge 3%)`;
}

function diceRoll() {
  if (diceRolling) return;
  const slider = document.getElementById('dice-slider');
  const target = parseInt(slider.value);
  const betEl = document.getElementById('dice-bet');
  const bet = Math.floor(Number(betEl.value));
  if (!bet || bet < 1 || bet > State.getBalance()) { alert('Invalid bet!'); return; }

  State.adjustBalance(-bet);
  diceRolling = true;
  document.getElementById('dice-roll-btn').disabled = true;

  const face = document.getElementById('dice-face');
  face.classList.add('rolling');

  let ticks = 0;
  const rollInterval = setInterval(() => {
    face.textContent = DICE_FACES[Math.floor(Math.random() * 6)];
    ticks++;
    if (ticks > 12) {
      clearInterval(rollInterval);
      face.classList.remove('rolling');
      const result = Math.floor(Math.random() * 6) + 1;
      face.textContent = DICE_FACES[result - 1];

      let won;
      if (diceMode === 'high') won = result > target;
      else won = result < target;

      let winChance = diceMode === 'high' ? (6 - target) / 6 : (target - 1) / 6;
      const mult = winChance > 0 ? 0.97 / winChance : 0;

      if (won && mult > 0) {
        const payout = Math.floor(bet * mult);
        State.adjustBalance(payout);
        State.recordResult(true, payout - bet);
        showResult(true, 'ROLLED ' + result + '!', '+' + State.fmt(payout - bet));
      } else {
        State.recordResult(false, 0);
        showResult(false, 'ROLLED ' + result, '-' + State.fmt(bet));
      }

      State.updateAllBalanceDisplays();
      diceRolling = false;
      document.getElementById('dice-roll-btn').disabled = false;
    }
  }, 80);
}
