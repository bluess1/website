// ── MAIN NAVIGATION ──────────────────────────────────
// Defines openGame() and closeGame() used by index.html buttons.

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
  // Hide lobby
  document.getElementById('lobby').classList.remove('active');

  // Show the game screen
  const screen = document.getElementById(id);
  if (screen) screen.classList.add('active');

  // Stop crash ticker if switching away
  if (currentGame === 'crash' && id !== 'crash') {
    if (typeof crashStop === 'function') crashStop();
  }

  currentGame = id;

  // Run the game's init function to render its UI
  const initFn = GAME_INITS[id];
  if (initFn) initFn();

  // Sync balance display in the topbar
  State.updateAllBalanceDisplays();
}

function closeGame(id) {
  // Stop crash if leaving
  if (id === 'crash') {
    if (typeof crashStop === 'function') crashStop();
  }

  const screen = document.getElementById(id);
  if (screen) screen.classList.remove('active');

  // Show lobby and refresh balance
  document.getElementById('lobby').classList.add('active');
  State.updateAllBalanceDisplays();
  currentGame = null;
}

// Sync balance on first load
State.updateAllBalanceDisplays();
