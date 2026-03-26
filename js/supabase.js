// ── SUPABASE CLIENT ──────────────────────────────────
// Replace with your Supabase project credentials
const SUPABASE_URL = 'https://nyjqjpbmuwxpedwrbccn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55anFqcGJtdXd4cGVkd3JiY2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzI1NzMsImV4cCI6MjA4OTk0ODU3M30.YdAm8NDr8vpUqZAULMeyJ5l_Cz4DJ1MufteKhusqWs8';

let supabase = null;

function initSupabase() {
  if (typeof window.supabase !== 'undefined') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return true;
  }
  console.warn('Supabase SDK not loaded. Add it to index.html.');
  return false;
}

async function submitScore(name, balance, games, wins) {
  if (!supabase) return { error: 'Supabase not initialized' };
  
  const { data, error } = await supabase
    .from('leaderboard')
    .upsert({
      name: name.substring(0, 20),
      balance: Math.floor(balance),
      games_played: games,
      wins: wins,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'name'
    });
  
  return { data, error };
}

async function fetchLeaderboard(limit = 20) {
  if (!supabase) return { data: [], error: 'Supabase not initialized' };
  
  const { data, error } = await supabase
    .from('leaderboard')
    .select('name, balance, games_played, wins, updated_at')
    .order('balance', { ascending: false })
    .limit(limit);
  
  return { data: data || [], error };
}

let leaderboardChannel = null;

function subscribeToLeaderboard(callback) {
  if (!supabase) return null;
  
  if (leaderboardChannel) {
    leaderboardChannel.unsubscribe();
  }
  
  leaderboardChannel = supabase
    .channel('leaderboard-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'leaderboard' },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
  
  return leaderboardChannel;
}

function unsubscribeFromLeaderboard() {
  if (leaderboardChannel) {
    leaderboardChannel.unsubscribe();
    leaderboardChannel = null;
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
});
