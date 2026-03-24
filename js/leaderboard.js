// ── LEADERBOARD ──────────────────────────────────────
// All localStorage-based — no server needed!
const LB_KEY = 'velvet_leaderboard';

function lbGetEntries() {
  try { return JSON.parse(localStorage.getItem(LB_KEY)) || []; } catch { return []; }
}
function lbSaveEntries(entries) {
  try { localStorage.setItem(LB_KEY, JSON.stringify(entries)); } catch {}
}

function initLeaderboard() {
  const c = document.getElementById('leaderboard-content');
  const stats = State.getStats();
  const name = State.getName();
  const entries = lbGetEntries();

  c.innerHTML = `
    <div class="lb-section">
      <div class="lb-title">📊 YOUR SESSION</div>
      <div class="lb-stats-grid">
        <div class="lb-stat">
          <div class="lb-stat-val">${State.fmt(State.getBalance())}</div>
          <div class="lb-stat-label">BALANCE</div>
        </div>
        <div class="lb-stat">
          <div class="lb-stat-val">${stats.gamesPlayed}</div>
          <div class="lb-stat-label">PLAYED</div>
        </div>
        <div class="lb-stat">
          <div class="lb-stat-val">${stats.gamesPlayed ? Math.round(stats.wins/stats.gamesPlayed*100) : 0}%</div>
          <div class="lb-stat-label">WIN RATE</div>
        </div>
        <div class="lb-stat">
          <div class="lb-stat-val">${stats.wins}</div>
          <div class="lb-stat-label">WINS</div>
        </div>
        <div class="lb-stat">
          <div class="lb-stat-val">${stats.losses}</div>
          <div class="lb-stat-label">LOSSES</div>
        </div>
        <div class="lb-stat">
          <div class="lb-stat-val">${State.fmt(stats.biggestWin)}</div>
          <div class="lb-stat-label">BEST WIN</div>
        </div>
      </div>
    </div>

    <div class="lb-section">
      <div class="lb-title">🏆 SUBMIT YOUR SCORE</div>
      <div class="lb-name-row">
        <input class="lb-input" id="lb-name-input" placeholder="Enter your name…" value="${name || ''}" maxlength="20"/>
        <button class="action-btn" onclick="lbSubmit()">SUBMIT</button>
      </div>
      <div class="info-text">Your balance will be submitted as your score.</div>
    </div>

    <div class="lb-section">
      <div class="lb-title">🎖 TOP PLAYERS</div>
      ${lbRenderTable(entries)}
    </div>
    <div style="font-size:0.6rem;color:var(--text-muted);text-align:center;margin-top:-8px;padding-bottom:8px;">
      Scores stored locally. For a real leaderboard, see the README for backend options.
    </div>
  `;
}

function lbRenderTable(entries) {
  if (!entries.length) return '<div class="lb-empty">No scores yet. Be the first!</div>';
  const medals = ['🥇','🥈','🥉'];
  return `
    <table class="lb-table">
      <thead>
        <tr>
          <th style="width:30px">#</th>
          <th>PLAYER</th>
          <th>GAMES</th>
          <th style="text-align:right">BALANCE</th>
        </tr>
      </thead>
      <tbody>
        ${entries.map((e, i) => `
          <tr>
            <td class="lb-rank">${medals[i] || (i+1)}</td>
            <td>${e.name || 'Anonymous'}</td>
            <td style="color:var(--text-muted)">${e.games}</td>
            <td>${State.fmt(e.balance)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function lbSubmit() {
  const input = document.getElementById('lb-name-input');
  const name = (input.value || '').trim() || 'Anonymous';
  State.setName(name);

  const entries = lbGetEntries();
  const stats = State.getStats();
  const newEntry = {
    name,
    balance: State.getBalance(),
    games: stats.gamesPlayed,
    wins: stats.wins,
    date: new Date().toLocaleDateString(),
  };

  // Remove old entry with same name, add new
  const filtered = entries.filter(e => e.name.toLowerCase() !== name.toLowerCase());
  filtered.push(newEntry);
  filtered.sort((a,b) => b.balance - a.balance);
  const top = filtered.slice(0, 20);
  lbSaveEntries(top);

  // Re-render
  initLeaderboard();
  const msg = document.createElement('div');
  msg.style.cssText = 'color:var(--green2);font-size:0.75rem;text-align:center;margin-top:8px;';
  msg.textContent = '✅ Score submitted!';
  document.getElementById('leaderboard-content').appendChild(msg);
}
