// ── BLACKJACK ────────────────────────────────────────
const SUITS = ['♠','♥','♦','♣'];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

function makeDeck() {
  const deck = [];
  for (const s of SUITS) for (const r of RANKS) deck.push({ rank: r, suit: s });
  return shuffle(deck);
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function cardValue(card) {
  if (['J','Q','K'].includes(card.rank)) return 10;
  if (card.rank === 'A') return 11;
  return parseInt(card.rank);
}
function handTotal(hand) {
  let total = hand.reduce((s, c) => s + cardValue(c), 0);
  let aces = hand.filter(c => c.rank === 'A').length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}
function isRed(suit) { return suit === '♥' || suit === '♦'; }

let bjState = null;

function initBlackjack() {
  renderBJ();
}

function renderBJ() {
  const container = document.getElementById('blackjack-content');
  container.innerHTML = `
    <div class="bj-table">
      <div class="bj-message" id="bj-msg">${bjState ? '' : 'Place your bet to begin'}</div>
      <div class="bj-zone">
        <div class="bj-zone-label">DEALER</div>
        <div class="bj-cards" id="dealer-cards"></div>
        <div class="bj-score" id="dealer-score"></div>
      </div>
      <div class="bj-divider"></div>
      <div class="bj-zone">
        <div class="bj-zone-label">YOU</div>
        <div class="bj-cards" id="player-cards"></div>
        <div class="bj-score" id="player-score"></div>
      </div>
      <div class="bet-row" style="margin-top:16px;">
        <span class="bet-label">BET</span>
        <input class="bet-input" id="bj-bet" type="number" min="1" value="50"/>
        <div class="bet-quick">
          <button onclick="document.getElementById('bj-bet').value=10">$10</button>
          <button onclick="document.getElementById('bj-bet').value=25">$25</button>
          <button onclick="document.getElementById('bj-bet').value=50">$50</button>
          <button onclick="document.getElementById('bj-bet').value=100">$100</button>
        </div>
      </div>
      <div class="bj-actions" id="bj-actions">
        <button class="action-btn" id="bj-deal-btn" onclick="bjDeal()">DEAL</button>
      </div>
    </div>
  `;
  if (bjState && bjState.phase !== 'bet') restoreBJState();
}

function restoreBJState() {
  renderCards('dealer-cards', bjState.dealer, bjState.phase === 'player');
  renderCards('player-cards', bjState.player, false);
  updateBJScores();
  if (bjState.phase === 'player') {
    document.getElementById('bj-msg').textContent = '';
    setActions(['hit','stand','double']);
  }
}

function renderCards(containerId, hand, hideSecond) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  hand.forEach((card, i) => {
    const div = document.createElement('div');
    div.className = 'card' + (hideSecond && i === 1 ? ' face-down' : (isRed(card.suit) ? ' red' : ' black'));
    if (hideSecond && i === 1) {
      div.innerHTML = '';
    } else {
      div.innerHTML = `<span class="card-val">${card.rank}</span><span class="card-suit">${card.suit}</span>`;
    }
    el.appendChild(div);
  });
}

function updateBJScores() {
  if (!bjState) return;
  const playerEl = document.getElementById('player-score');
  const dealerEl = document.getElementById('dealer-score');
  if (playerEl) playerEl.textContent = 'Total: ' + handTotal(bjState.player);
  if (dealerEl) {
    if (bjState.phase === 'player') {
      dealerEl.textContent = 'Showing: ' + cardValue(bjState.dealer[0]);
    } else {
      dealerEl.textContent = 'Total: ' + handTotal(bjState.dealer);
    }
  }
}

function setActions(actions) {
  const el = document.getElementById('bj-actions');
  if (!el) return;
  el.innerHTML = '';
  const map = {
    deal:   `<button class="action-btn" id="bj-deal-btn" onclick="bjDeal()">DEAL</button>`,
    hit:    `<button class="action-btn" onclick="bjHit()">HIT</button>`,
    stand:  `<button class="action-btn secondary" onclick="bjStand()">STAND</button>`,
    double: `<button class="action-btn secondary" onclick="bjDouble()" id="bj-dbl">DOUBLE</button>`,
  };
  actions.forEach(a => { if (map[a]) el.innerHTML += map[a]; });
  // Disable double if can't afford
  if (bjState && actions.includes('double')) {
    const dbl = document.getElementById('bj-dbl');
    if (dbl && bjState.bet > State.getBalance()) dbl.disabled = true;
  }
}

function bjDeal() {
  const betEl = document.getElementById('bj-bet');
  const bet = Math.floor(Number(betEl.value));
  if (!bet || bet < 1 || bet > State.getBalance()) { alert('Invalid bet!'); return; }
  State.adjustBalance(-bet);
  const deck = makeDeck();
  bjState = {
    deck, bet,
    player: [deck.pop(), deck.pop()],
    dealer: [deck.pop(), deck.pop()],
    phase: 'player',
  };
  renderBJ();
  const pt = handTotal(bjState.player);
  if (pt === 21) {
    bjReveal(true);
  }
}

function bjHit() {
  bjState.player.push(bjState.deck.pop());
  renderCards('player-cards', bjState.player, false);
  updateBJScores();
  if (handTotal(bjState.player) >= 21) bjStand();
}

function bjDouble() {
  const extra = bjState.bet;
  State.adjustBalance(-extra);
  bjState.bet += extra;
  bjState.player.push(bjState.deck.pop());
  renderCards('player-cards', bjState.player, false);
  updateBJScores();
  bjStand();
}

function bjStand() {
  bjState.phase = 'dealer';
  // Dealer draws to 17
  while (handTotal(bjState.dealer) < 17) bjState.dealer.push(bjState.deck.pop());
  bjReveal(false);
}

function bjReveal(playerBJ) {
  bjState.phase = 'end';
  renderCards('dealer-cards', bjState.dealer, false);
  updateBJScores();
  const pt = handTotal(bjState.player);
  const dt = handTotal(bjState.dealer);
  const msgEl = document.getElementById('bj-msg');
  let won = false, payout = 0;

  if (pt > 21) {
    msgEl.textContent = 'BUST — You lose';
  } else if (playerBJ && dt !== 21) {
    won = true; payout = Math.floor(bjState.bet * 2.5);
    msgEl.textContent = 'BLACKJACK! ×2.5';
  } else if (dt > 21 || pt > dt) {
    won = true; payout = bjState.bet * 2;
    msgEl.textContent = 'YOU WIN!';
  } else if (pt === dt) {
    payout = bjState.bet;
    msgEl.textContent = 'PUSH — Bet returned';
  } else {
    msgEl.textContent = 'DEALER WINS';
  }

  if (payout > 0) State.adjustBalance(payout);
  State.recordResult(won, won ? payout - bjState.bet : 0);
  State.updateAllBalanceDisplays();
  setActions(['deal']);
  bjState.phase = 'bet';
}
