// ── MAIN NAVIGATION ──────────────────────────────────
const GAME_INITS = {
  slots:       initSlots,
  blackjack:   initBlackjack,
  roulette:    initRoulette,
  dice:        initDice,
  crash:       initCrash,
  leaderboard: initLeaderboard,
};

let currentGame = null;

function openGame(id) {
  document.getElementById('lobby').classList.remove('active');
  const screen = document.getElementById(id);
  if (screen) screen.classList.add('active');

  if (currentGame === 'crash' && id !== 'crash') {
    if (typeof crashStop === 'function') crashStop();
  }

  currentGame = id;

  const initFn = GAME_INITS[id];
  if (initFn) initFn();

  State.updateAllBalanceDisplays();
  loadTopbarLeaderboard(id);
  subscribeTopbarLeaderboard(id);
}

function closeGame(id) {
  if (id === 'crash' && typeof crashStop === 'function') crashStop();
  if (id === 'roulette' && typeof rlCleanup === 'function') rlCleanup();
  if (id === 'leaderboard' && typeof lbCleanup === 'function') lbCleanup();
  if (topbarLbChannel) { topbarLbChannel.unsubscribe(); topbarLbChannel = null; }

  const screen = document.getElementById(id);
  if (screen) screen.classList.remove('active');

  document.getElementById('lobby').classList.add('active');
  State.updateAllBalanceDisplays();
  currentGame = null;
}

let topbarLbChannel = null;

async function loadTopbarLeaderboard(gameId) {
  const container = document.getElementById(`topbar-lb-${gameId}`);
  if (!container) return;
  
  const { data } = await fetchLeaderboard(3);
  if (!data || !data.length) {
    container.innerHTML = '';
    return;
  }
  
  const medals = ['🥇', '🥈', '🥉'];
  container.innerHTML = data.slice(0, 3).map((p, i) => `
    <div class="topbar-lb-entry">
      <span class="medal">${medals[i]}</span>
      <span class="name">${p.name}</span>
      <span class="balance">${State.fmt(p.balance)}</span>
    </div>
  `).join('');
}

function subscribeTopbarLeaderboard(gameId) {
  if (topbarLbChannel) topbarLbChannel.unsubscribe();
  topbarLbChannel = subscribeToLeaderboard(() => {
    loadTopbarLeaderboard(gameId);
  });
}

State.updateAllBalanceDisplays();
