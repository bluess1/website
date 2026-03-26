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
let sidebarChannel = null;

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
  loadSidebarLeaderboard(id);
  subscribeSidebarLeaderboard(id);
}

function closeGame(id) {
  if (id === 'crash' && typeof crashStop === 'function') crashStop();
  if (id === 'roulette' && typeof rlCleanup === 'function') rlCleanup();
  if (id === 'leaderboard' && typeof lbCleanup === 'function') lbCleanup();
  if (sidebarChannel) { sidebarChannel.unsubscribe(); sidebarChannel = null; }

  const screen = document.getElementById(id);
  if (screen) screen.classList.remove('active');

  document.getElementById('lobby').classList.add('active');
  State.updateAllBalanceDisplays();
  currentGame = null;
}

async function loadSidebarLeaderboard(gameId) {
  const container = document.getElementById(`sidebar-${gameId}`);
  if (!container) return;
  
  const { data } = await fetchLeaderboard(10);
  
  container.innerHTML = `
    <div class="sidebar-section">
      <div class="sidebar-title">🏆 Top Players</div>
      ${renderSidebarLB(data)}
    </div>
  `;
}

function renderSidebarLB(entries) {
  if (!entries || !entries.length) {
    return '<div class="sidebar-lb-empty">No players yet</div>';
  }
  const medals = ['🥇', '🥈', '🥉'];
  return entries.map((p, i) => `
    <div class="sidebar-lb-entry">
      <span class="sidebar-lb-rank">${medals[i] || (i+1)}</span>
      <span class="sidebar-lb-name">${p.name}</span>
      <span class="sidebar-lb-balance">${State.fmt(p.balance)}</span>
    </div>
  `).join('');
}

function subscribeSidebarLeaderboard(gameId) {
  if (sidebarChannel) sidebarChannel.unsubscribe();
  sidebarChannel = subscribeToLeaderboard(() => {
    loadSidebarLeaderboard(gameId);
  });
}

State.updateAllBalanceDisplays();
