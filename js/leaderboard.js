// ── LEADERBOARD ──────────────────────────────────────
// Supports both localStorage (offline) and Supabase (online with realtime)
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
      <div id="lb-submit-status" style="margin-top:8px;font-size:0.75rem;"></div>
    </div>

    <div class="lb-section">
      <div class="lb-title" id="lb-online-title">🎖 TOP PLAYERS <span id="lb-online-badge" style="font-size:0.6rem;opacity:0.7;">(loading…)</span></div>
      <div id="lb-online-table">${lbRenderTable(lbGetEntries())}</div>
    </div>
    <div style="font-size:0.6rem;color:var(--text-muted);text-align:center;margin-top:-8px;padding-bottom:8px;">
      Scores synced with global leaderboard
    </div>
  `;
  
  loadOnlineLeaderboard();
  subscribeToOnlineLeaderboard();
}

async function loadOnlineLeaderboard() {
  const { data, error } = await fetchLeaderboard(20);
  if (error) {
    document.getElementById('lb-online-badge').textContent = '(offline)';
    lbRenderOnlineTable(lbGetEntries());
    return;
  }
  
  const badge = document.getElementById('lb-online-badge');
  badge.textContent = '(live)';
  badge.style.color = 'var(--green2)';
  
  lbRenderOnlineTable(data);
  
  lbSaveEntries(data);
}

function lbRenderOnlineTable(entries) {
  const container = document.getElementById('lb-online-table');
  if (!container) return;
  container.innerHTML = lbRenderTable(entries);
}

function lbRenderTable(entries) {
  if (!entries || !entries.length) return '<div class="lb-empty">No scores yet. Be the first!</div>';
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
            <td style="color:var(--text-muted)">${e.games_played || e.games || 0}</td>
            <td>${State.fmt(e.balance)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function subscribeToOnlineLeaderboard() {
  subscribeToLeaderboard((payload) => {
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      loadOnlineLeaderboard();
    }
  });
}

function lbCleanup() {
  unsubscribeFromLeaderboard();
}

async function lbSubmit() {
  const input = document.getElementById('lb-name-input');
  const status = document.getElementById('lb-submit-status');
  const name = (input.value || '').trim() || 'Anonymous';
  State.setName(name);
  
  status.textContent = 'Submitting…';
  status.style.color = 'var(--gold)';
  
  const stats = State.getStats();
  
  const { data, error } = await submitScore(name, State.getBalance(), stats.gamesPlayed, stats.wins);
  
  if (error) {
    status.textContent = '❌ Failed to submit. Try again.';
    status.style.color = 'var(--red2)';
  } else {
    status.textContent = '✅ Score submitted!';
    status.style.color = 'var(--green2)';
    await loadOnlineLeaderboard();
  }
}
