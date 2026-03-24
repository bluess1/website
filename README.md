# 🎰 Velvet Casino

A polished, dark-luxury gambling simulator built with vanilla HTML, CSS, and JavaScript. Zero dependencies, zero build step — just open `index.html` or deploy to Vercel in one click.

## Games

| Game | Description | Approx. RTP |
|------|-------------|-------------|
| 🎰 Slots | Weighted symbol reels, jackpots up to ×50 | 94% |
| 🃏 Blackjack | Full blackjack with hit/stand/double | 99% |
| ⚫ Roulette | European-style with 9 bet types | 97% |
| 🎲 Dice | High/Low with adjustable target & dynamic multiplier | 97% |
| 📈 Crash | Live multiplier graph — cash out before it crashes | 97% |

## Deploy to Vercel

```bash
# 1. Push this repo to GitHub
git init && git add . && git commit -m "init"
git remote add origin https://github.com/YOU/velvet-casino.git
git push -u origin main

# 2. Go to vercel.com → New Project → Import your repo
# 3. No build settings needed — it's a static site
# Done!
```

## Local Development

Just open `index.html` in a browser — no server needed.

```bash
# Or use a simple dev server:
npx serve .
# Then visit http://localhost:3000
```

## Leaderboard Options

The current leaderboard uses `localStorage` — it persists per-browser but isn't shared between players.

### Option A: Shared leaderboard on Vercel (FREE) ✅

Use **Vercel KV** (Redis) with a serverless function:

```
/api/leaderboard.js  ← GET returns top scores, POST saves a score
```

Vercel KV is free up to 256MB. No VPS needed.

### Option B: Supabase (FREE, Postgres) ✅

1. Create a free project at [supabase.com](https://supabase.com)
2. Create a `scores` table: `id, name, balance, games, created_at`
3. Use the Supabase JS SDK directly from the browser (anon key is safe for public read/write)

### Option C: Real multiplayer (needs a server)

True real-time multiplayer (seeing other players' bets live, synchronized crash game, etc.) requires WebSockets and a persistent server:

- **Fly.io / Railway** — cheapest managed options (~$5–7/mo)
- **Vercel** does NOT support persistent WebSocket servers (serverless only)
- A VPS (DigitalOcean, Linode) gives you full control (~$6/mo)

**Summary:** For just a shared leaderboard → Vercel + KV is free and easy. For real-time multiplayer → you need a real server (VPS or managed like Railway).

## Structure

```
velvet-casino/
├── index.html
├── css/
│   └── main.css
├── js/
│   ├── state.js        # Balance, stats, localStorage
│   ├── main.js         # Navigation
│   ├── slots.js
│   ├── blackjack.js
│   ├── roulette.js
│   ├── dice.js
│   ├── crash.js
│   └── leaderboard.js
└── README.md
```

## Disclaimer

For entertainment purposes only. Not real gambling. No real money involved.
