// cron-runner.js
const SECRET   = process.env.CRON_SECRET || 'yoga-temple-cron-2024';
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

console.log('');
console.log('👑 ══════════════════════════════════════');
console.log('   Yoga Temple — Premium Class Reminder Cron');
console.log('══════════════════════════════════════ 👑');
console.log(`📡 Server  : ${BASE_URL}`);
console.log(`🔑 Secret  : ${SECRET}`);
console.log('⏰ Runs every 60 seconds');
console.log('📧 Sends alerts: 60min, 30min, 10min before premium classes');
console.log('👑 Only notifies category-matched subscribers');
console.log('');

async function runCron() {
  const time = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });

  try {
    const res = await fetch(`${BASE_URL}/api/cron/class-reminders`, {
      method:  'GET',
      headers: {
        'Authorization': `Bearer ${SECRET}`,
        'Content-Type':  'application/json',
      },
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch { console.log(`[${time}] ❌ Invalid JSON: ${text.slice(0, 80)}`); return; }

    if (res.status === 401) {
      console.log(`[${time}] 🔑 401 — Check CRON_SECRET`); return;
    }
    if (!res.ok) {
      console.log(`[${time}] ❌ HTTP ${res.status}: ${data?.error || 'Unknown'}`); return;
    }

    if (data.processed > 0) {
      console.log(`[${time}] ✅ ${data.processed} premium reminder(s) sent!`);
      data.results?.forEach(r => {
        console.log(`         👑 "${r.title}" (${r.category})`);
        console.log(`            ⏰ ${r.milestone} min alert`);
        console.log(`            📧 ${r.usersSent}/${r.total} subscribers notified`);
      });
    } else {
      console.log(`[${time}] 🕐 No premium class reminders needed`);
    }

  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('ECONNREFUSED') || msg.includes('fetch failed')) {
      console.log(`[${time}] ⚠️  Server unreachable`);
    } else {
      console.log(`[${time}] ❌ ${msg}`);
    }
  }
}

runCron();
setInterval(runCron, 60_000);

process.on('SIGINT', () => {
  console.log('\n🛑 Cron stopped. Namaste 🙏\n');
  process.exit(0);
});