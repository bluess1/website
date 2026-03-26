// ── STATE MANAGER ──────────────────────────────────
const State = (() => {
  const STORAGE_KEY = 'velvet_casino';
  const DEFAULT_BALANCE = 1000;

  let data = {
    balance: DEFAULT_BALANCE,
    stats: { wins: 0, losses: 0, biggestWin: 0, gamesPlayed: 0 },
    playerName: '',
  };

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) data = { ...data, ...JSON.parse(saved) };
    } catch (e) {}
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  function getBalance() { return data.balance; }

  function setBalance(n) {
    data.balance = Math.max(0, Math.round(n * 100) / 100);
    save();
    updateAllBalanceDisplays();
  }

  function adjustBalance(delta) { setBalance(data.balance + delta); }

  function recordResult(won, amount) {
    data.stats.gamesPlayed++;
    if (won) {
      data.stats.wins++;
      if (amount > data.stats.biggestWin) data.stats.biggestWin = amount;
    } else {
      data.stats.losses++;
    }
    save();
  }

  function getStats() { return { ...data.stats }; }
  function getName() { return data.playerName; }
  function setName(n) { data.playerName = n; save(); }
  function hasName() { return data.playerName && data.playerName.trim().length > 0; }

  function reset() {
    data.balance = DEFAULT_BALANCE;
    data.stats = { wins: 0, losses: 0, biggestWin: 0, gamesPlayed: 0 };
    save();
    updateAllBalanceDisplays();
  }

  function fmt(n) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function updateAllBalanceDisplays() {
    const bal = data.balance;
    const displays = document.querySelectorAll('[id$="-balance"], #lobby-balance');
    displays.forEach(el => { el.textContent = fmt(bal); });
  }

  load();
  return { getBalance, setBalance, adjustBalance, recordResult, getStats, getName, setName, hasName, reset, fmt, updateAllBalanceDisplays };
})();

// Global helpers
function resetBalance() {
  if (confirm('Reset your balance to $1,000 and clear stats?')) {
    State.reset();
  }
}
function showResult(win, label, deltaText) {
  const overlay = document.getElementById('result-overlay');
  const icon = document.getElementById('result-icon');
  const text = document.getElementById('result-text');
  const amount = document.getElementById('result-amount');
  overlay.classList.remove('hidden');
  icon.textContent = win ? '🎉' : '💸';
  text.textContent = label;
  text.className = 'result-text ' + (win ? 'win' : 'lose');
  amount.textContent = deltaText + ' — Balance: ' + State.fmt(State.getBalance());
}
function closeOverlay() {
  document.getElementById('result-overlay').classList.add('hidden');
}

// Username modal
function showUsernameModal() {
  if (State.hasName()) return;
  const modal = document.getElementById('username-modal');
  if (modal) modal.classList.remove('hidden');
}
function submitUsername() {
  const input = document.getElementById('username-input');
  const name = (input.value || '').trim();
  if (!name) {
    input.style.borderColor = 'var(--red2)';
    return;
  }
  State.setName(name);
  document.getElementById('username-modal').classList.add('hidden');
}
function skipUsername() {
  State.setName('Guest' + Math.floor(Math.random() * 9999));
  document.getElementById('username-modal').classList.add('hidden');
}
