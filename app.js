// ── RPG CONFIG ─────────────────────────────────────────
const RANKS = [
  { rank: 'E',  title: 'Untested Mortal',    min: 0,    color: '#888',    aura: '⬜' },
  { rank: 'D',  title: 'Awakened Trainee',   min: 100,  color: '#5DCAA5', aura: '🟩' },
  { rank: 'C',  title: 'Rising Fighter',     min: 300,  color: '#378ADD', aura: '🟦' },
  { rank: 'B',  title: 'Seasoned Warrior',   min: 700,  color: '#534AB7', aura: '🟪' },
  { rank: 'A',  title: 'Elite Cultivator',   min: 1500, color: '#BA7517', aura: '🟨' },
  { rank: 'S',  title: 'Legendary Hero',     min: 3000, color: '#D85A30', aura: '🟧' },
  { rank: 'SS', title: 'Transcendent One',   min: 6000, color: '#c0392b', aura: '🔴' },
];

const ACHIEVEMENTS = [
  { id: 'first_log',    icon: '🌱', name: 'First Step',       desc: 'Log anything for the first time',       xp: 20  },
  { id: 'streak_3',    icon: '🔥', name: 'Ignition',          desc: '3-day login streak',                    xp: 50  },
  { id: 'streak_7',    icon: '⚡', name: 'Thunder Will',      desc: '7-day login streak',                    xp: 150 },
  { id: 'streak_30',   icon: '🌟', name: 'Unbroken Spirit',   desc: '30-day login streak',                   xp: 500 },
  { id: 'full_day',    icon: '💎', name: 'Perfect Day',       desc: 'Log all 6 categories in one day',       xp: 100 },
  { id: 'full_day_7',  icon: '👑', name: 'Week of Mastery',   desc: '7 perfect days total',                  xp: 300 },
  { id: 'hydrated',    icon: '💧', name: 'Hydration Arc',     desc: 'Drink 8 glasses in a day',              xp: 30  },
  { id: 'sleep_hero',  icon: '😴', name: 'Rest Cultivator',   desc: 'Log 7+ hrs sleep',                      xp: 40  },
  { id: 'warrior',     icon: '⚔️', name: "Warrior's Path",    desc: 'Log 5 workouts total',                  xp: 80  },
  { id: 'iron_body',   icon: '🏋️', name: 'Iron Body',         desc: 'Log 20 workouts total',                 xp: 200 },
  { id: 'med_master',  icon: '💊', name: 'Discipline Arc',    desc: 'Take all meds 7 days in a row',         xp: 120 },
  { id: 'mood_aware',  icon: '🧘', name: 'Inner Clarity',     desc: 'Log mood 7 days in a row',              xp: 80  },
  { id: 'weight_track',icon: '⚖️', name: 'Body Awareness',    desc: 'Log weight 5 times',                    xp: 60  },
];

const DAILY_QUESTS = [
  { id: 'q_meal',     icon: '🥗', name: 'Fuel the Fighter',  desc: 'Log at least one meal',        xp: 15, check: t => t.meals.length > 0 },
  { id: 'q_water',    icon: '💧', name: 'Hydration Training', desc: 'Drink 8 glasses of water',     xp: 20, check: t => t.water >= 8 },
  { id: 'q_sleep',    icon: '😴', name: 'Recovery Protocol',  desc: 'Log your sleep',               xp: 15, check: t => !!t.sleep },
  { id: 'q_exercise', icon: '⚔️', name: 'Daily Training',     desc: 'Log a workout',                xp: 25, check: t => t.exercises.length > 0 },
  { id: 'q_mood',     icon: '🧘', name: 'Mental Cultivation', desc: 'Log your mood',                xp: 10, check: t => !!t.mood },
  { id: 'q_meds',     icon: '💊', name: 'Discipline Check',   desc: 'Take all your medications',    xp: 15, check: t => { const m = getMeds(); return m.length > 0 && m.every(med => t.meds[med.id]); } },
];

// ── RPG STATE ──────────────────────────────────────────
function getRPG() { try { return JSON.parse(localStorage.getItem('ht_rpg') || '{}'); } catch { return {}; } }
function saveRPG(r) { localStorage.setItem('ht_rpg', JSON.stringify(r)); }

function initRPG() {
  const rpg = getRPG();
  if (!rpg.xp)           rpg.xp = 0;
  if (!rpg.achievements) rpg.achievements = [];
  if (!rpg.streak)       rpg.streak = 0;
  if (!rpg.perfectDays)  rpg.perfectDays = 0;
  if (!rpg.totalWorkouts)rpg.totalWorkouts = 0;
  if (!rpg.weightLogs)   rpg.weightLogs = 0;
  if (!rpg.moodStreak)   rpg.moodStreak = 0;
  if (!rpg.medStreak)    rpg.medStreak = 0;
  const today = todayKey();
  if (rpg.lastLogin !== today) {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
    const yKey = yesterday.toISOString().slice(0,10);
    rpg.streak = rpg.lastLogin === yKey ? (rpg.streak||0)+1 : 1;
    rpg.lastLogin = today;
    if (rpg.streak >= 3)  unlockAch(rpg, 'streak_3');
    if (rpg.streak >= 7)  unlockAch(rpg, 'streak_7');
    if (rpg.streak >= 30) unlockAch(rpg, 'streak_30');
  }
  saveRPG(rpg);
}

function getRank(xp) { let r = RANKS[0]; for (const x of RANKS) { if (xp >= x.min) r = x; } return r; }
function getNextRank(xp) { for (const r of RANKS) { if (xp < r.min) return r; } return null; }

function unlockAch(rpg, id) {
  if (rpg.achievements.includes(id)) return false;
  const a = ACHIEVEMENTS.find(x => x.id === id);
  if (!a) return false;
  rpg.achievements.push(id);
  rpg.xp = (rpg.xp||0) + a.xp;
  saveRPG(rpg);
  showAchievementToast(a);
  refreshRPGBar();
  return true;
}

function unlockAchievement(id) {
  const rpg = getRPG();
  return unlockAch(rpg, id);
}

function addXP(amount, reason) {
  const rpg = getRPG();
  rpg.xp = (rpg.xp||0) + amount;
  saveRPG(rpg);
  showXPToast(amount, reason);
  refreshRPGBar();
}

function checkAllAchievements() {
  const rpg = getRPG();
  const { today } = todayData();
  const meds = getMeds();
  const allMedsDone = meds.length > 0 && meds.every(m => today.meds[m.id]);
  const perfectDay = today.meals.length>0 && today.exercises.length>0 && today.sleep && today.mood && today.water>=8 && (meds.length===0||allMedsDone);
  if (perfectDay) {
    const wasNew = unlockAchievement('full_day');
    if (wasNew) { rpg.perfectDays = (rpg.perfectDays||0)+1; saveRPG(rpg); }
    if ((getRPG().perfectDays||0) >= 7) unlockAchievement('full_day_7');
  }
  if (today.water >= 8) unlockAchievement('hydrated');
  if (today.sleep?.hrs >= 7) unlockAchievement('sleep_hero');
  if ((rpg.totalWorkouts||0) >= 5)  unlockAchievement('warrior');
  if ((rpg.totalWorkouts||0) >= 20) unlockAchievement('iron_body');
  if ((rpg.weightLogs||0) >= 5)     unlockAchievement('weight_track');
  if ((rpg.moodStreak||0) >= 7)     unlockAchievement('mood_aware');
  if ((rpg.medStreak||0) >= 7)      unlockAchievement('med_master');
}

// ── RPG UI ─────────────────────────────────────────────
function refreshRPGBar() {
  const rpg = getRPG();
  const xp = rpg.xp||0;
  const rank = getRank(xp);
  const next = getNextRank(xp);
  const pct = next ? Math.round((xp-rank.min)/(next.min-rank.min)*100) : 100;
  const bar = document.getElementById('rpg-bar');
  if (!bar) return;
  bar.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="font-size:26px;">${rank.aura}</div>
      <div style="flex:1;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <span style="font-weight:700;font-size:15px;color:${rank.color};">Rank ${rank.rank} · ${rank.title}</span>
          <span style="font-size:12px;color:#888;">${xp.toLocaleString()} XP</span>
        </div>
        <div style="font-size:11px;color:#888;margin:2px 0 5px;">${rpg.streak||0} day streak 🔥</div>
        <div style="height:8px;background:var(--bg);border-radius:4px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${rank.color};border-radius:4px;transition:width 0.5s;"></div>
        </div>
        <div style="font-size:11px;color:#888;margin-top:3px;">${next?pct+'% → Rank '+next.rank+' ('+next.title+')':'⭐ MAX RANK'}</div>
      </div>
    </div>`;
}

function refreshQuestsTab() {
  const { today } = todayData();
  const el = document.getElementById('quests-list');
  if (!el) return;
  const done = DAILY_QUESTS.filter(q => q.check(today)).length;
  const earnedXP = DAILY_QUESTS.filter(q=>q.check(today)).reduce((s,q)=>s+q.xp,0);
  const totalXP = DAILY_QUESTS.reduce((s,q)=>s+q.xp,0);
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;font-size:13px;color:#888;margin-bottom:6px;">
      <span>${done}/${DAILY_QUESTS.length} complete</span>
      <span style="color:var(--green);font-weight:600;">${earnedXP}/${totalXP} XP</span>
    </div>
    <div style="height:6px;background:var(--bg);border-radius:3px;overflow:hidden;margin-bottom:1rem;">
      <div style="height:100%;width:${Math.round(done/DAILY_QUESTS.length*100)}%;background:var(--green);border-radius:3px;transition:width 0.4s;"></div>
    </div>
    ${DAILY_QUESTS.map(q => {
      const ok = q.check(today);
      return `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:0.5px solid var(--border2);">
        <div style="font-size:22px;${ok?'':'filter:grayscale(1);opacity:0.4;'}">${q.icon}</div>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:500;${ok?'color:var(--green);text-decoration:line-through;opacity:0.7;':'color:var(--text);'}">${q.name}</div>
          <div style="font-size:12px;color:#888;">${q.desc}</div>
        </div>
        <div style="font-size:12px;font-weight:600;color:${ok?'var(--green)':'#888'};">+${q.xp}XP${ok?' ✓':''}</div>
      </div>`;
    }).join('')}`;
}

function refreshAchievementsTab() {
  const rpg = getRPG();
  const unlocked = rpg.achievements||[];
  const el = document.getElementById('achievements-list');
  if (!el) return;
  el.innerHTML = `
    <div style="font-size:13px;color:#888;margin-bottom:1rem;">${unlocked.length}/${ACHIEVEMENTS.length} unlocked</div>
    ${ACHIEVEMENTS.map(a => {
      const got = unlocked.includes(a.id);
      return `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:0.5px solid var(--border2);">
        <div style="font-size:24px;${got?'':'filter:grayscale(1);opacity:0.25;'}">${a.icon}</div>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:500;color:${got?'var(--text)':'#888'};">${got?a.name:'???'}</div>
          <div style="font-size:12px;color:#888;">${got?a.desc:'Keep going to unlock...'}</div>
        </div>
        <div style="font-size:12px;font-weight:600;color:${got?'var(--green)':'#888'};">+${a.xp}XP${got?' ✓':''}</div>
      </div>`;
    }).join('')}`;
}

// ── TOASTS ─────────────────────────────────────────────
function showXPToast(amount, reason) {
  const t = document.createElement('div');
  t.innerHTML = `⚡ <strong>+${amount} XP</strong> — ${reason}`;
  t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#1D9E75;color:white;padding:10px 18px;border-radius:20px;font-size:14px;z-index:999;opacity:0;transition:opacity 0.2s;white-space:nowrap;';
  document.body.appendChild(t);
  setTimeout(()=>t.style.opacity='1',10);
  setTimeout(()=>{t.style.opacity='0';setTimeout(()=>t.remove(),300);},2500);
}

function showAchievementToast(a) {
  const t = document.createElement('div');
  t.innerHTML = `<div style="font-size:12px;opacity:0.8;margin-bottom:2px;">🏆 Achievement Unlocked!</div><div style="font-size:16px;font-weight:700;">${a.icon} ${a.name}</div><div style="font-size:12px;opacity:0.8;margin-top:2px;">+${a.xp} XP</div>`;
  t.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%) scale(0.9);background:#534AB7;color:white;padding:14px 22px;border-radius:16px;font-size:14px;z-index:1000;opacity:0;transition:all 0.3s;text-align:center;min-width:200px;';
  document.body.appendChild(t);
  setTimeout(()=>{t.style.opacity='1';t.style.transform='translateX(-50%) scale(1)';},10);
  setTimeout(()=>{t.style.opacity='0';setTimeout(()=>t.remove(),400);},3500);
}

function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#1a1a1a;color:white;padding:10px 18px;border-radius:20px;font-size:14px;z-index:999;opacity:0;transition:opacity 0.2s;white-space:nowrap;';
  document.body.appendChild(t);
  setTimeout(()=>t.style.opacity='1',10);
  setTimeout(()=>{t.style.opacity='0';setTimeout(()=>t.remove(),300);},2200);
}

// ── DATA ───────────────────────────────────────────────
const todayKey = () => new Date().toISOString().slice(0,10);
function loadData() { try { return JSON.parse(localStorage.getItem('ht_data')||'{}'); } catch { return {}; } }
function saveData(d) { localStorage.setItem('ht_data', JSON.stringify(d)); }
function todayData() {
  const d = loadData(), k = todayKey();
  if (!d[k]) d[k] = { meals:[], exercises:[], sleep:null, mood:null, water:0, weight:null, meds:{} };
  return { data:d, today:d[k], key:k };
}

// ── NAV ────────────────────────────────────────────────
document.querySelectorAll('#nav .nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
    document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
    const t = btn.dataset.tab;
    if (t==='dashboard') { refreshDashboard(); refreshRPGBar(); }
    if (t==='meds')      refreshMeds();
    if (t==='ai')        refreshAITab();
    if (t==='nutrition') refreshNutrition();
    if (t==='sleep')     drawSleepChart();
    if (t==='exercise')  drawExerciseChart();
    if (t==='bp')        { refreshBPHistory(); drawBPCharts(); }
    if (t==='rpg')       { refreshRPGBar(); refreshQuestsTab(); refreshAchievementsTab(); }
  });
});

document.getElementById('header-date').textContent = new Date().toLocaleDateString('en-NZ',{weekday:'short',day:'numeric',month:'short'});

function selectPill(el, gid) {
  document.querySelectorAll('#'+gid+' .pill').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
}
let selectedMoodEmoji='😐', selectedMoodLabel='Okay';
function selectMood(el,emoji,label) {
  document.querySelectorAll('#mood-grid .mood-btn').forEach(b=>b.classList.remove('selected'));
  el.classList.add('selected');
  selectedMoodEmoji=emoji; selectedMoodLabel=label;
}

// ── FOOD DIARY ─────────────────────────────────────────
let diaryDate = todayKey();
let currentFoodData = null; // nutritionix result per 100g
let searchDebounce = null;

function getFoodDiary() { try { return JSON.parse(localStorage.getItem('ht_diary') || '{}'); } catch { return {}; } }
function saveFoodDiary(d) { localStorage.setItem('ht_diary', JSON.stringify(d)); }

function getDiaryDay(date) {
  const d = getFoodDiary();
  if (!d[date]) d[date] = [];
  return d[date];
}

function changeDate(dir) {
  const d = new Date(diaryDate + 'T00:00');
  d.setDate(d.getDate() + dir);
  const newKey = d.toISOString().slice(0, 10);
  if (newKey > todayKey()) return;
  diaryDate = newKey;
  refreshNutrition();
}

async function searchFood() {
  const q = document.getElementById('food-search-input').value.trim();
  if (!q) return;
  const results = document.getElementById('food-search-results');
  results.innerHTML = '<div style="font-size:13px;color:#888;padding:8px 0;">Searching...</div>';
  clearFoodEntry();

  try {
    // Use Open Food Facts free API — no key needed
    const resp = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=8&fields=product_name,brands,nutriments,serving_size,quantity`);
    const data = await resp.json();
    const products = (data.products || []).filter(p => p.product_name && p.nutriments?.['energy-kcal_100g'] != null);

    if (!products.length) {
      results.innerHTML = '<div style="font-size:13px;color:#888;padding:8px 0;">No results. Try manual entry below.</div>';
      return;
    }

    results.innerHTML = products.slice(0, 6).map((p, i) => {
      const cal = Math.round(p.nutriments['energy-kcal_100g'] || 0);
      const prot = Math.round((p.nutriments['proteins_100g'] || 0) * 10) / 10;
      const brand = p.brands ? p.brands.split(',')[0].trim() : '';
      return `<div class="food-result" onclick="selectFood(${i})">
        <div class="food-result-name">${p.product_name}${brand ? ' <span style="font-weight:400;color:var(--text2);">· ' + brand + '</span>' : ''}</div>
        <div class="food-result-meta">${cal} kcal · ${prot}g protein per 100g${p.serving_size ? ' · Serving: ' + p.serving_size : ''}</div>
      </div>`;
    }).join('');

    // Store results for selection
    window._searchResults = products.slice(0, 6);

  } catch (e) {
    results.innerHTML = '<div style="font-size:13px;color:#c00;padding:8px 0;">Search failed. Check your connection or use manual entry.</div>';
  }
}

function selectFood(i) {
  const p = window._searchResults[i];
  const n = p.nutriments;
  currentFoodData = {
    name: p.product_name,
    brand: p.brands ? p.brands.split(',')[0].trim() : '',
    per100: {
      cal:    Math.round(n['energy-kcal_100g'] || 0),
      protein:Math.round((n['proteins_100g'] || 0) * 10) / 10,
      carbs:  Math.round((n['carbohydrates_100g'] || 0) * 10) / 10,
      fat:    Math.round((n['fat_100g'] || 0) * 10) / 10,
      fibre:  Math.round((n['fiber_100g'] || 0) * 10) / 10,
      sugar:  Math.round((n['sugars_100g'] || 0) * 10) / 10,
      sodium: Math.round((n['sodium_100g'] || 0) * 1000),
    },
    servingSize: p.serving_size || null
  };

  document.getElementById('food-search-results').innerHTML = '';
  document.getElementById('food-entry-form').style.display = 'block';
  document.getElementById('manual-entry-toggle').style.display = 'none';
  document.getElementById('food-entry-name').textContent = currentFoodData.name + (currentFoodData.brand ? ' · ' + currentFoodData.brand : '');
  document.getElementById('food-qty').value = 100;
  document.getElementById('food-unit').value = 'g';
  updateServing();
}

function updateServing() {
  if (!currentFoodData) return;
  const qty = parseFloat(document.getElementById('food-qty').value) || 100;
  const factor = qty / 100;
  const n = currentFoodData.per100;
  showNutritionPreview('nutrition-preview', {
    cal:     Math.round(n.cal * factor),
    protein: Math.round(n.protein * factor * 10) / 10,
    carbs:   Math.round(n.carbs * factor * 10) / 10,
    fat:     Math.round(n.fat * factor * 10) / 10,
    fibre:   Math.round(n.fibre * factor * 10) / 10,
    sugar:   Math.round(n.sugar * factor * 10) / 10,
    sodium:  Math.round(n.sodium * factor),
  });
}

function showNutritionPreview(elId, n) {
  document.getElementById(elId).innerHTML = `
    <div class="nutrition-cell"><div class="nutrition-cell-label">Calories</div><div class="nutrition-cell-value">${n.cal}</div><div class="nutrition-cell-unit">kcal</div></div>
    <div class="nutrition-cell"><div class="nutrition-cell-label">Protein</div><div class="nutrition-cell-value">${n.protein}</div><div class="nutrition-cell-unit">g</div></div>
    <div class="nutrition-cell"><div class="nutrition-cell-label">Carbs</div><div class="nutrition-cell-value">${n.carbs}</div><div class="nutrition-cell-unit">g</div></div>
    <div class="nutrition-cell"><div class="nutrition-cell-label">Fat</div><div class="nutrition-cell-value">${n.fat}</div><div class="nutrition-cell-unit">g</div></div>
    <div class="nutrition-cell"><div class="nutrition-cell-label">Fibre</div><div class="nutrition-cell-value">${n.fibre}</div><div class="nutrition-cell-unit">g</div></div>
    <div class="nutrition-cell"><div class="nutrition-cell-label">Sugar</div><div class="nutrition-cell-value">${n.sugar}</div><div class="nutrition-cell-unit">g</div></div>
    <div class="nutrition-cell" style="grid-column:1/-1;"><div class="nutrition-cell-label">Sodium</div><div class="nutrition-cell-value" style="font-size:14px;">${n.sodium}</div><div class="nutrition-cell-unit">mg</div></div>`;
}

function addFoodEntry() {
  if (!currentFoodData) return;
  const qty = parseFloat(document.getElementById('food-qty').value) || 100;
  const unit = document.getElementById('food-unit').value;
  const notes = document.getElementById('food-entry-notes').value.trim();
  const mealType = document.querySelector('#meal-type-pills .pill.active')?.textContent || 'Snack';
  const factor = qty / 100;
  const n = currentFoodData.per100;

  const entry = {
    id: Date.now(),
    name: currentFoodData.name,
    brand: currentFoodData.brand,
    mealType,
    qty, unit,
    notes,
    time: new Date().toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' }),
    cal:     Math.round(n.cal * factor),
    protein: Math.round(n.protein * factor * 10) / 10,
    carbs:   Math.round(n.carbs * factor * 10) / 10,
    fat:     Math.round(n.fat * factor * 10) / 10,
    fibre:   Math.round(n.fibre * factor * 10) / 10,
    sugar:   Math.round(n.sugar * factor * 10) / 10,
    sodium:  Math.round(n.sodium * factor),
  };

  const diary = getFoodDiary();
  if (!diary[diaryDate]) diary[diaryDate] = [];
  diary[diaryDate].push(entry);
  saveFoodDiary(diary);

  // Also update old meals store for dashboard compat
  syncDiaryToMeals(diaryDate);

  const isFirst = !getRPG().achievements.includes('first_log');
  if (isFirst) unlockAchievement('first_log');
  addXP(12, 'Food logged');
  clearFoodEntry();
  document.getElementById('food-search-input').value = '';
  refreshNutrition();
  refreshQuestsTab();
  checkAllAchievements();
  showToast(entry.name + ' added 🥗');
}

function addManualEntry() {
  const name = document.getElementById('manual-name').value.trim();
  if (!name) { alert('Enter a food name.'); return; }
  const mealType = document.querySelector('#meal-type-pills .pill.active')?.textContent || 'Snack';
  const entry = {
    id: Date.now(),
    name,
    brand: '',
    mealType,
    qty: null, unit: null,
    notes: document.getElementById('manual-notes').value.trim(),
    time: new Date().toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' }),
    cal:     parseInt(document.getElementById('manual-cal').value) || 0,
    protein: parseFloat(document.getElementById('manual-protein').value) || 0,
    carbs:   parseFloat(document.getElementById('manual-carbs').value) || 0,
    fat:     parseFloat(document.getElementById('manual-fat').value) || 0,
    fibre:   parseFloat(document.getElementById('manual-fibre').value) || 0,
    sugar:   parseFloat(document.getElementById('manual-sugar').value) || 0,
    sodium:  parseInt(document.getElementById('manual-sodium').value) || 0,
  };

  const diary = getFoodDiary();
  if (!diary[diaryDate]) diary[diaryDate] = [];
  diary[diaryDate].push(entry);
  saveFoodDiary(diary);
  syncDiaryToMeals(diaryDate);

  addXP(12, 'Food logged');
  ['manual-name','manual-cal','manual-protein','manual-carbs','manual-fat','manual-fibre','manual-sugar','manual-sodium','manual-notes'].forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('manual-entry-form').style.display = 'none';
  document.getElementById('manual-entry-toggle').style.display = 'block';
  refreshNutrition(); refreshQuestsTab(); checkAllAchievements();
  showToast(entry.name + ' added 🥗');
}

function syncDiaryToMeals(date) {
  // Keep old meals store in sync for dashboard/quests compatibility
  const diary = getFoodDiary();
  const entries = diary[date] || [];
  const data = loadData();
  if (!data[date]) data[date] = { meals: [], exercises: [], sleep: null, mood: null, water: 0, weight: null, meds: {} };
  data[date].meals = entries.map(e => ({ type: e.mealType, cal: e.cal, protein: e.protein, notes: e.name, time: e.time }));
  saveData(data);
}

function deleteDiaryEntry(date, id) {
  const diary = getFoodDiary();
  if (!diary[date]) return;
  diary[date] = diary[date].filter(e => e.id !== id);
  saveFoodDiary(diary);
  syncDiaryToMeals(date);
  refreshNutrition();
}

function clearFoodEntry() {
  currentFoodData = null;
  document.getElementById('food-entry-form').style.display = 'none';
  document.getElementById('food-search-results').innerHTML = '';
  document.getElementById('manual-entry-toggle').style.display = 'block';
}

function showManualEntry() {
  const f = document.getElementById('manual-entry-form');
  f.style.display = f.style.display === 'none' ? 'block' : 'none';
}

function refreshNutrition() {
  const entries = getDiaryDay(diaryDate);

  // Date label
  const dateLabel = document.getElementById('diary-date-label');
  if (dateLabel) {
    const isToday = diaryDate === todayKey();
    const d = new Date(diaryDate + 'T00:00');
    dateLabel.textContent = isToday ? 'Today' : d.toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  const nextBtn = document.getElementById('diary-next-btn');
  if (nextBtn) nextBtn.style.opacity = diaryDate === todayKey() ? '0.3' : '1';

  // Totals
  const totals = { cal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sugar: 0, sodium: 0 };
  entries.forEach(e => {
    totals.cal     += e.cal || 0;
    totals.protein += e.protein || 0;
    totals.carbs   += e.carbs || 0;
    totals.fat     += e.fat || 0;
    totals.fibre   += e.fibre || 0;
    totals.sugar   += e.sugar || 0;
    totals.sodium  += e.sodium || 0;
  });
  Object.keys(totals).forEach(k => { totals[k] = Math.round(totals[k] * 10) / 10; });

  const gridEl = document.getElementById('daily-totals-grid');
  if (gridEl) showNutritionPreview('daily-totals-grid', totals);

  const calBar = document.getElementById('cal-bar');
  if (calBar) calBar.style.width = Math.min(100, Math.round(totals.cal / 2200 * 100)) + '%';
  const calLabel = document.getElementById('cal-bar-label');
  if (calLabel) calLabel.textContent = totals.cal + ' / 2200';
  const protBar = document.getElementById('protein-bar');
  if (protBar) protBar.style.width = Math.min(100, Math.round(totals.protein / 100 * 100)) + '%';
  const protLabel = document.getElementById('protein-bar-label');
  if (protLabel) protLabel.textContent = totals.protein + 'g / 100g';

  // Group by meal
  const mealOrder = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Supplement'];
  const byMeal = {};
  entries.forEach(e => { if (!byMeal[e.mealType]) byMeal[e.mealType] = []; byMeal[e.mealType].push(e); });

  const diaryEl = document.getElementById('diary-by-meal');
  if (!diaryEl) return;

  if (!entries.length) {
    diaryEl.innerHTML = '<div class="card"><div class="empty-state">No food logged yet. Search above to add!</div></div>';
    return;
  }

  const sortedMeals = mealOrder.filter(m => byMeal[m]).concat(Object.keys(byMeal).filter(m => !mealOrder.includes(m)));

  diaryEl.innerHTML = sortedMeals.map(meal => {
    const items = byMeal[meal];
    const mealCal = Math.round(items.reduce((s, e) => s + (e.cal || 0), 0));
    const mealProt = Math.round(items.reduce((s, e) => s + (e.protein || 0), 0) * 10) / 10;
    return `<div class="card meal-group">
      <div class="meal-group-header">
        <span>${meal}</span>
        <span style="font-size:12px;color:var(--text3);">${mealCal} kcal · ${mealProt}g protein</span>
      </div>
      ${items.map(e => `
        <div class="diary-item">
          <div class="diary-item-info">
            <div class="diary-item-name">${e.name}${e.brand ? ' <span style="font-weight:400;font-size:12px;color:var(--text2);">· ' + e.brand + '</span>' : ''}</div>
            <div class="diary-item-macros">${e.qty ? e.qty + e.unit + ' · ' : ''}P: ${e.protein}g · C: ${e.carbs}g · F: ${e.fat}g · Fibre: ${e.fibre}g · Na: ${e.sodium}mg${e.notes ? ' · ' + e.notes : ''}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:2px;">${e.time}</div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div class="diary-item-cal">${e.cal} kcal</div>
            <button class="delete-btn" onclick="deleteDiaryEntry('${diaryDate}',${e.id})">×</button>
          </div>
        </div>`).join('')}
    </div>`;
  }).join('');
}

// Legacy logMeal kept for quest compatibility
function logMeal() { showToast('Use the food diary above to log meals!'); }

// ── EXERCISE ───────────────────────────────────────────
function logExercise() {
  const duration=parseInt(document.getElementById('ex-duration').value)||0;
  const notes=document.getElementById('ex-notes').value.trim();
  const activity=document.querySelector('#activity-pills .pill.active')?.textContent||'Workout';
  const intensity=document.querySelector('#intensity-pills .pill.active')?.textContent||'Medium';
  if (!duration){alert('Enter duration.');return;}
  const {data,today,key}=todayData();
  today.exercises.push({activity,duration,intensity,notes,time:new Date().toLocaleTimeString('en-NZ',{hour:'2-digit',minute:'2-digit'})});
  data[key]=today; saveData(data);
  const rpg=getRPG(); rpg.totalWorkouts=(rpg.totalWorkouts||0)+1; saveRPG(rpg);
  const xp=intensity==='High'?30:intensity==='Medium'?20:12;
  addXP(xp, activity+' complete');
  document.getElementById('ex-duration').value='';
  document.getElementById('ex-notes').value='';
  drawExerciseChart(); refreshQuestsTab(); checkAllAchievements();
  showToast('Workout logged! 💪');
}

function drawExerciseChart() {
  const data=loadData(), days=getLast7Days();
  drawBarChart('exerciseChart',days.map(d=>new Date(d+'T00:00').toLocaleDateString('en-NZ',{weekday:'short'})),days.map(d=>(data[d]?.exercises||[]).reduce((s,e)=>s+e.duration,0)),'#1D9E75');
}

// ── SLEEP ──────────────────────────────────────────────
function logSleep() {
  const bed=document.getElementById('sleep-bed').value;
  const wake=document.getElementById('sleep-wake').value;
  const quality=document.querySelector('#sleep-quality-pills .pill.active')?.textContent||'Fair';
  const notes=document.getElementById('sleep-notes').value.trim();
  if (!bed||!wake){alert('Set bedtime and wake time.');return;}
  const bm=timeToMins(bed),wm=timeToMins(wake);
  const hrs=Math.round((wm-bm+1440)%1440/60*10)/10;
  const {data,today,key}=todayData();
  today.sleep={bed,wake,hrs,quality,notes}; data[key]=today; saveData(data);
  addXP(hrs>=7?25:15,'Sleep logged');
  drawSleepChart(); refreshQuestsTab(); checkAllAchievements();
  showToast(`Sleep logged — ${hrs} hrs 😴`);
}

function timeToMins(t){const[h,m]=t.split(':').map(Number);return h*60+m;}

function drawSleepChart() {
  const data=loadData(), days=getLast7Days();
  drawBarChart('sleepChart',days.map(d=>new Date(d+'T00:00').toLocaleDateString('en-NZ',{weekday:'short'})),days.map(d=>data[d]?.sleep?.hrs||0),'#534AB7',10);
}

// ── MOOD ───────────────────────────────────────────────
function logMood() {
  const energy=document.querySelector('#energy-pills .pill.active')?.textContent||'Low';
  const notes=document.getElementById('mood-notes').value.trim();
  const {data,today,key}=todayData();
  today.mood={emoji:selectedMoodEmoji,label:selectedMoodLabel,energy,notes}; data[key]=today; saveData(data);
  const rpg=getRPG(); rpg.moodStreak=(rpg.moodStreak||0)+1; saveRPG(rpg);
  addXP(10,'Mood logged'); refreshQuestsTab(); checkAllAchievements();
  showToast('Mood logged '+selectedMoodEmoji);
}

// ── MEDS ───────────────────────────────────────────────
function getMeds(){try{return JSON.parse(localStorage.getItem('ht_meds')||'[]');}catch{return[];}}
function saveMeds(m){localStorage.setItem('ht_meds',JSON.stringify(m));}

function showAddMed(){const f=document.getElementById('add-med-form');f.style.display=f.style.display==='none'?'block':'none';}

function addMed(){
  const name=document.getElementById('med-name').value.trim();
  const dose=document.getElementById('med-dose').value.trim();
  const time=document.querySelector('#med-time-pills .pill.active')?.textContent||'Morning';
  if (!name){alert('Enter a name.');return;}
  const meds=getMeds(); meds.push({id:Date.now(),name,dose,time}); saveMeds(meds);
  document.getElementById('med-name').value=''; document.getElementById('med-dose').value='';
  document.getElementById('add-med-form').style.display='none';
  refreshMeds(); showToast('Medication added!');
}

function refreshMeds(){
  const meds=getMeds(),{today}=todayData(),list=document.getElementById('med-list');
  if(!meds.length){list.innerHTML='<div class="empty-state">No medications yet.</div>';refreshWater();return;}
  list.innerHTML=meds.map(m=>{
    const taken=today.meds[m.id];
    return`<div class="log-item"><div class="log-item-left"><div class="log-item-name">${m.name}</div><div class="log-item-sub">${m.dose?m.dose+' · ':''}${m.time}</div></div><div style="display:flex;gap:8px;align-items:center;"><button onclick="toggleMed(${m.id})" class="pill ${taken?'active':''}" style="font-size:12px;">${taken?'✓ Taken':'Mark taken'}</button><button onclick="deleteMed(${m.id})" style="background:none;border:none;color:#ccc;cursor:pointer;font-size:18px;padding:4px;">×</button></div></div>`;
  }).join('');
  refreshWater();
}

function toggleMed(id){
  const {data,today,key}=todayData();
  const was=today.meds[id]; today.meds[id]=!was; data[key]=today; saveData(data);
  if(!was){const rpg=getRPG();rpg.medStreak=(rpg.medStreak||0)+1;saveRPG(rpg);addXP(10,'Medication taken');}
  refreshMeds(); refreshQuestsTab(); checkAllAchievements();
}

function deleteMed(id){if(!confirm('Remove?'))return;saveMeds(getMeds().filter(m=>m.id!==id));refreshMeds();}

// ── WATER ──────────────────────────────────────────────
function refreshWater(){
  const {today}=todayData(),count=today.water||0,dots=document.getElementById('water-dots');
  if(!dots)return;
  dots.innerHTML=Array.from({length:8},(_,i)=>`<div class="water-dot ${i<count?'filled':''}" onclick="setWater(${i+1})"><span style="font-size:18px;">${i<count?'💧':'○'}</span></div>`).join('');
  document.getElementById('water-count').textContent=count+' of 8 glasses';
}

function setWater(n){
  const {data,today,key}=todayData();
  const prev=today.water||0; today.water=today.water===n?n-1:n; data[key]=today; saveData(data);
  if(today.water>prev) addXP(3,'Hydration +1');
  refreshWater(); refreshQuestsTab(); checkAllAchievements();
}

// ── WEIGHT ─────────────────────────────────────────────
function logWeight(){
  const w=parseFloat(document.getElementById('weight-input').value);
  if(!w){alert('Enter your weight.');return;}
  const {data,today,key}=todayData(); today.weight=w; data[key]=today; saveData(data);
  const rpg=getRPG(); rpg.weightLogs=(rpg.weightLogs||0)+1; saveRPG(rpg);
  addXP(10,'Weight logged');
  document.getElementById('weight-input').value='';
  refreshDashboard(); checkAllAchievements();
  showToast(`Weight: ${w} kg`);
}

// ── DASHBOARD ──────────────────────────────────────────
function refreshDashboard(){
  const data=loadData(),{today}=todayData();
  const totalCal=today.meals.reduce((s,m)=>s+m.cal,0);
  document.getElementById('d-cal').textContent=totalCal||'—';
  document.getElementById('d-water').textContent=today.water||'—';
  document.getElementById('d-sleep').textContent=today.sleep?.hrs||'—';
  const days=getLast7Days();
  const lw=[...days].reverse().map(d=>data[d]?.weight).find(w=>w);
  document.getElementById('d-weight').textContent=lw||'—';
  const log=document.getElementById('today-log');
  const items=[];
  if(today.meals.length) items.push(`<div class="log-item"><div class="log-item-left"><div class="log-item-name">🥗 Nutrition</div><div class="log-item-sub">${today.meals.length} meals · ${totalCal} kcal</div></div><span class="badge badge-green">Logged</span></div>`);
  if(today.exercises.length) items.push(`<div class="log-item"><div class="log-item-left"><div class="log-item-name">💪 Exercise</div><div class="log-item-sub">${today.exercises.map(e=>e.activity).join(', ')}</div></div><span class="badge badge-green">Done</span></div>`);
  if(today.sleep) items.push(`<div class="log-item"><div class="log-item-left"><div class="log-item-name">😴 Sleep</div><div class="log-item-sub">${today.sleep.hrs} hrs · ${today.sleep.quality}</div></div><span class="badge badge-green">Logged</span></div>`);
  if(today.mood) items.push(`<div class="log-item"><div class="log-item-left"><div class="log-item-name">${today.mood.emoji} Mood</div><div class="log-item-sub">${today.mood.label} · ${today.mood.energy} energy</div></div><span class="badge badge-green">Logged</span></div>`);
  if(today.water) items.push(`<div class="log-item"><div class="log-item-left"><div class="log-item-name">💧 Water</div><div class="log-item-sub">${today.water} of 8 glasses</div></div><span class="badge ${today.water>=8?'badge-green':'badge-amber'}">${today.water>=8?'Goal met':'In progress'}</span></div>`);
  log.innerHTML=items.length?items.join(''):'<div class="empty-state">Nothing logged yet. Start your hero journey!</div>';
  drawWeightChart(); refreshRPGBar();
}

function drawWeightChart(){
  const data=loadData(),days=getLast7Days();
  const ctx=document.getElementById('weightChart').getContext('2d');
  if(window._wc)window._wc.destroy();
  window._wc=new Chart(ctx,{type:'line',data:{labels:days.map(d=>new Date(d+'T00:00').toLocaleDateString('en-NZ',{weekday:'short'})),datasets:[{data:days.map(d=>data[d]?.weight||null),borderColor:'#1D9E75',backgroundColor:'rgba(29,158,117,0.08)',tension:0.4,pointRadius:5,pointBackgroundColor:'#1D9E75',fill:true,spanGaps:true}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{font:{size:11},color:'#999'}},y:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{font:{size:11},color:'#999'}}}}});
}

function drawBarChart(id,labels,values,color,maxY){
  const ctx=document.getElementById(id)?.getContext('2d');
  if(!ctx)return;
  if(window['_c_'+id])window['_c_'+id].destroy();
  window['_c_'+id]=new Chart(ctx,{type:'bar',data:{labels,datasets:[{data:values,backgroundColor:color+'cc',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{font:{size:11},color:'#999'}},y:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{font:{size:11},color:'#999'},min:0,...(maxY?{max:maxY}:{})}}}});
}

// ── AI COACH ───────────────────────────────────────────
let aiMode = 'coach'; // 'coach' or 'food'
let chatHistory = []; // [{role, content}]

function getApiKey(){return localStorage.getItem('ht_api_key')||'';}
function saveApiKey(){
  const k=document.getElementById('api-key-input').value.trim();
  if(!k.startsWith('sk-ant-')){alert('Should start with sk-ant-');return;}
  localStorage.setItem('ht_api_key',k); refreshAITab(); showToast('API key saved!');
}
function changeApiKey(){localStorage.removeItem('ht_api_key');refreshAITab();}
function refreshAITab(){document.getElementById('api-key-card').style.display=getApiKey()?'none':'block';}

function setAIMode(mode, btn) {
  aiMode = mode;
  document.querySelectorAll('#ai-mode-pills .pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const hint = document.getElementById('ai-mode-hint');
  const input = document.getElementById('ai-question');
  const quickPrompts = document.getElementById('ai-quick-prompts');
  const foodPrompts = document.getElementById('ai-food-prompts');
  if (mode === 'food') {
    hint.textContent = 'Tell me what you ate in plain English — e.g. "I had scrambled eggs and toast for breakfast" — and I\'ll estimate the nutrition and add it to your diary.';
    input.placeholder = 'Tell me what you ate...';
    quickPrompts.style.display = 'none';
    foodPrompts.style.display = 'block';
  } else {
    hint.textContent = 'Ask me anything about your health — sleep, exercise, nutrition, mood — and I\'ll give you personalised insights.';
    input.placeholder = 'Ask about your health...';
    quickPrompts.style.display = 'block';
    foodPrompts.style.display = 'none';
  }
}

function addChatBubble(text, type='bot') {
  const win = document.getElementById('ai-chat-window');
  const div = document.createElement('div');
  div.className = 'ai-bubble ai-bubble-' + type;
  div.innerHTML = text;
  win.appendChild(div);
  win.scrollTop = win.scrollHeight;
  return div;
}

function askAI() {
  const q = document.getElementById('ai-question').value.trim();
  if (!q) return;
  document.getElementById('ai-question').value = '';
  if (aiMode === 'food') {
    doFoodLog(q);
  } else {
    doAI(q);
  }
}

async function doAI(question) {
  const key = getApiKey();
  if (!key) { alert('Add your API key first.'); return; }

  addChatBubble(question, 'user');
  const loadingBubble = addChatBubble('Thinking...', 'loading');

  // Build context
  const {today} = todayData();
  const rpg = getRPG(), rank = getRank(rpg.xp||0);
  const entries = getDiaryDay(todayKey());
  const totalCal = entries.reduce((s,e)=>s+(e.cal||0),0);

  const sys = `You are a warm, motivating anime-style AI health coach. The user is on a hero's health journey.
Rank: ${rank.rank} — ${rank.title} (${rpg.xp||0} XP, ${rpg.streak||0} day streak).
Today: calories ${totalCal}/2200, water ${today.water}/8, sleep ${today.sleep?today.sleep.hrs+'hrs':'not logged'}, exercise ${today.exercises.length?today.exercises.map(e=>e.activity).join(','):'none'}, mood ${today.mood?today.mood.label:'not logged'}.
Food today: ${entries.length ? entries.map(e=>e.name+' ('+e.cal+'kcal)').join(', ') : 'nothing logged yet'}.
Be motivating and reference their rank. 2-4 sentences, plain text only, no markdown.`;

  chatHistory.push({ role: 'user', content: question });

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 400, system: sys, messages: chatHistory })
    });
    const data = await resp.json();
    if (data.error) throw new Error(data.error.message);
    const text = data.content.map(b=>b.text||'').join('');
    chatHistory.push({ role: 'assistant', content: text });
    // Keep history manageable
    if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
    loadingBubble.className = 'ai-bubble ai-bubble-bot';
    loadingBubble.textContent = text;
  } catch(e) {
    loadingBubble.className = 'ai-bubble ai-bubble-bot';
    loadingBubble.innerHTML = '<span style="color:#c00;">Error: '+e.message+'</span>';
  }
}

async function doFoodLog(description) {
  const key = getApiKey();
  if (!key) { alert('Add your API key first.'); return; }

  addChatBubble(description, 'user');
  const loadingBubble = addChatBubble('Estimating nutrition...', 'loading');

  const sys = `You are a nutrition assistant. The user will describe food they ate in plain English.
Your job is to estimate nutrition and return ONLY a valid JSON array (no markdown, no explanation, just the raw JSON).
Each item in the array is one distinct food/dish with these fields:
{ "name": string, "mealType": "Breakfast"|"Lunch"|"Dinner"|"Snack"|"Supplement", "qty": number, "unit": "g"|"ml"|"serving"|"piece"|"cup", "cal": number, "protein": number, "carbs": number, "fat": number, "fibre": number, "sugar": number, "sodium": number, "notes": string }
- Infer mealType from context clues ("for breakfast", "for lunch", time of day hints) — default to "Snack" if unclear.
- Use realistic estimates for a typical serving of the described food.
- Split multi-food descriptions into separate items (e.g. "eggs and toast" = 2 items).
- All nutrition values are numbers (not strings). sodium is in mg, all others in g except cal which is kcal.
- notes field: brief description of serving size assumed, e.g. "2 large eggs" or "1 slice wholegrain".`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 800, system: sys, messages: [{ role: 'user', content: description }] })
    });
    const data = await resp.json();
    if (data.error) throw new Error(data.error.message);
    const raw = data.content.map(b=>b.text||'').join('').trim();

    let items;
    try {
      // Strip any accidental markdown fences
      const cleaned = raw.replace(/```json|```/g,'').trim();
      items = JSON.parse(cleaned);
    } catch(e) {
      throw new Error('Could not parse nutrition data. Try rephrasing.');
    }

    if (!Array.isArray(items) || !items.length) throw new Error('No foods recognised.');

    // Add each item to diary
    const diary = getFoodDiary();
    const date = todayKey();
    if (!diary[date]) diary[date] = [];

    items.forEach(item => {
      diary[date].push({
        id: Date.now() + Math.random(),
        name: item.name,
        brand: 'AI estimate',
        mealType: item.mealType || 'Snack',
        qty: item.qty, unit: item.unit,
        notes: item.notes || '',
        time: new Date().toLocaleTimeString('en-NZ',{hour:'2-digit',minute:'2-digit'}),
        cal:     Math.round(item.cal || 0),
        protein: Math.round((item.protein||0)*10)/10,
        carbs:   Math.round((item.carbs||0)*10)/10,
        fat:     Math.round((item.fat||0)*10)/10,
        fibre:   Math.round((item.fibre||0)*10)/10,
        sugar:   Math.round((item.sugar||0)*10)/10,
        sodium:  Math.round(item.sodium || 0),
      });
    });

    saveFoodDiary(diary);
    syncDiaryToMeals(date);
    addXP(10 * items.length, 'Food logged via AI');
    refreshQuestsTab();
    checkAllAchievements();

    // Build confirmation message
    const totalCal = items.reduce((s,i)=>s+(i.cal||0),0);
    const totalProt = Math.round(items.reduce((s,i)=>s+(i.protein||0),0)*10)/10;
    const lines = items.map(i => `<strong>${i.name}</strong> — ${i.cal} kcal, ${i.protein}g protein${i.notes?' ('+i.notes+')':''}`).join('<br>');

    loadingBubble.className = 'ai-bubble ai-bubble-action';
    loadingBubble.innerHTML = `✅ Added ${items.length} item${items.length>1?'s':''} to your diary:<br>${lines}<br><br><strong>Total: ${Math.round(totalCal)} kcal · ${totalProt}g protein</strong><br><span style="font-size:12px;opacity:0.8;">These are estimates — you can edit in the Diary tab.</span>`;

  } catch(e) {
    loadingBubble.className = 'ai-bubble ai-bubble-bot';
    loadingBubble.innerHTML = '<span style="color:#c00;">'+e.message+'</span> — try describing the food differently or use the Diary tab to add manually.';
  }
}

// ── BLOOD PRESSURE ─────────────────────────────────────
function getBPReadings(){try{return JSON.parse(localStorage.getItem('ht_bp')||'[]');}catch{return[];}}
function saveBPReadings(r){localStorage.setItem('ht_bp',JSON.stringify(r));}

function classifyBP(sys,dia){
  if(sys<120&&dia<80) return {label:'Normal',color:'#1D9E75',emoji:'✅'};
  if(sys<130&&dia<80) return {label:'Elevated',color:'#BA7517',emoji:'⚠️'};
  if(sys<140||dia<90) return {label:'High Stage 1',color:'#D85A30',emoji:'🔶'};
  if(sys>=140||dia>=90) return {label:'High Stage 2',color:'#c0392b',emoji:'🔴'};
  return {label:'Unknown',color:'#888',emoji:'❓'};
}

function logBP(){
  const sys=parseInt(document.getElementById('bp-sys').value);
  const dia=parseInt(document.getElementById('bp-dia').value);
  const pulse=parseInt(document.getElementById('bp-pulse').value)||null;
  const context=document.querySelector('#bp-context-pills .pill.active')?.textContent||'Resting';
  const notes=document.getElementById('bp-notes').value.trim();
  const timeVal=document.getElementById('bp-time').value;
  if(!sys||!dia){alert('Please enter systolic and diastolic values.');return;}
  const reading={
    id:Date.now(), date:todayKey(),
    time:timeVal||new Date().toLocaleTimeString('en-NZ',{hour:'2-digit',minute:'2-digit'}),
    sys, dia, pulse, context, notes,
    timestamp:new Date().toISOString()
  };
  const readings=getBPReadings();
  readings.push(reading);
  saveBPReadings(readings);
  document.getElementById('bp-sys').value='';
  document.getElementById('bp-dia').value='';
  document.getElementById('bp-pulse').value='';
  document.getElementById('bp-notes').value='';
  addXP(15,'BP reading logged');
  refreshBPHistory();
  drawBPCharts();
  showToast('BP logged: '+sys+'/'+dia+' mmHg');
}

function refreshBPHistory(){
  const readings=getBPReadings();
  const statusCard=document.getElementById('bp-status-card');
  const latestEl=document.getElementById('bp-latest');
  const histEl=document.getElementById('bp-history');
  if(!readings.length){
    if(statusCard) statusCard.style.display='none';
    if(histEl) histEl.innerHTML='<div class="empty-state">No readings yet.</div>';
    return;
  }
  const latest=readings[readings.length-1];
  const cls=classifyBP(latest.sys,latest.dia);
  if(statusCard) statusCard.style.display='block';
  if(latestEl) latestEl.innerHTML=`
    <div style="display:flex;align-items:center;gap:16px;">
      <div style="text-align:center;">
        <div style="font-size:36px;font-weight:700;color:${cls.color};">${latest.sys}/${latest.dia}</div>
        <div style="font-size:12px;color:#888;">mmHg · ${latest.time}</div>
      </div>
      <div>
        <div style="font-size:15px;font-weight:600;color:${cls.color};">${cls.emoji} ${cls.label}</div>
        ${latest.pulse?`<div style="font-size:13px;color:#888;">Pulse: ${latest.pulse} bpm</div>`:''}
        <div style="font-size:13px;color:#888;">${latest.context}</div>
      </div>
    </div>`;
  if(histEl){
    const sorted=[...readings].reverse();
    histEl.innerHTML=sorted.map(r=>{
      const c=classifyBP(r.sys,r.dia);
      return`<div class="log-item">
        <div class="log-item-left">
          <div class="log-item-name" style="color:${c.color};">${r.sys}/${r.dia} mmHg ${c.emoji}</div>
          <div class="log-item-sub">${r.date} ${r.time} · ${r.context}${r.pulse?' · '+r.pulse+' bpm':''}${r.notes?' · '+r.notes:''}</div>
        </div>
        <button onclick="deleteBP(${r.id})" style="background:none;border:none;color:#ccc;cursor:pointer;font-size:18px;padding:4px;">×</button>
      </div>`;
    }).join('');
  }
}

function deleteBP(id){
  if(!confirm('Delete this reading?'))return;
  saveBPReadings(getBPReadings().filter(r=>r.id!==id));
  refreshBPHistory(); drawBPCharts();
}

function drawBPCharts(){
  const readings=getBPReadings();
  const days=getLast14Days();
  const labels=days.map(d=>new Date(d+'T00:00').toLocaleDateString('en-NZ',{month:'short',day:'numeric'}));
  const sysData=days.map(d=>{
    const dayR=readings.filter(r=>r.date===d);
    return dayR.length?Math.round(dayR.reduce((s,r)=>s+r.sys,0)/dayR.length):null;
  });
  const diaData=days.map(d=>{
    const dayR=readings.filter(r=>r.date===d);
    return dayR.length?Math.round(dayR.reduce((s,r)=>s+r.dia,0)/dayR.length):null;
  });
  drawLineChart('bpSysChart',labels,sysData,'#D85A30',60,180);
  drawLineChart('bpDiaChart',labels,diaData,'#534AB7',40,120);
}

function drawLineChart(id,labels,values,color,minY,maxY){
  const ctx=document.getElementById(id)?.getContext('2d');
  if(!ctx)return;
  if(window['_c_'+id])window['_c_'+id].destroy();
  window['_c_'+id]=new Chart(ctx,{
    type:'line',
    data:{labels,datasets:[{data:values,borderColor:color,backgroundColor:color+'22',tension:0.3,pointRadius:4,pointBackgroundColor:color,fill:true,spanGaps:true}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{font:{size:10},color:'#999',maxRotation:45}},y:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{font:{size:11},color:'#999'},min:minY,max:maxY}}}
  });
}

function getLast14Days(){
  return Array.from({length:14},(_,i)=>{const d=new Date();d.setDate(d.getDate()-13+i);return d.toISOString().slice(0,10);});
}

// ── DOCTOR REPORT ──────────────────────────────────────
function generateReport(){
  const name=document.getElementById('report-name').value.trim()||'Patient';
  const dob=document.getElementById('report-dob').value.trim()||'Not provided';
  const doctor=document.getElementById('report-doctor').value.trim()||'Doctor';
  const notes=document.getElementById('report-notes').value.trim();
  const periodText=document.querySelector('#report-period-pills .pill.active')?.textContent||'7 days';
  const days=periodText==='30 days'?30:periodText==='14 days'?14:7;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const W=210, margin=20, contentW=W-margin*2;
  let y=margin;

  // Colours
  const GREEN='#1D9E75', DARK='#1a1a1a', GRAY='#666666', LIGHTGRAY='#f5f5f3', RED='#c0392b', AMBER='#BA7517';

  function setColor(hex){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);doc.setTextColor(r,g,b);}
  function setFill(hex){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);doc.setFillColor(r,g,b);}
  function setDraw(hex){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);doc.setDrawColor(r,g,b);}

  function checkPage(needed=20){if(y+needed>285){doc.addPage();y=margin;}}

  // Header bar
  setFill(GREEN); doc.rect(0,0,W,22,'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(16);
  doc.setTextColor(255,255,255);
  doc.text('Health Monitoring Report',margin,14);
  doc.setFontSize(9); doc.setFont('helvetica','normal');
  doc.text('Generated: '+new Date().toLocaleDateString('en-NZ',{day:'numeric',month:'long',year:'numeric'}),W-margin,14,{align:'right'});
  y=30;

  // Patient info box
  setFill(LIGHTGRAY); setDraw('#dddddd');
  doc.setLineWidth(0.3);
  doc.roundedRect(margin,y,contentW,22,2,2,'FD');
  doc.setFont('helvetica','bold'); doc.setFontSize(10); setColor(DARK);
  doc.text('Patient: '+name,margin+5,y+7);
  doc.setFont('helvetica','normal'); doc.setFontSize(9); setColor(GRAY);
  doc.text('DOB: '+dob,margin+5,y+13);
  doc.text('Report period: Last '+days+' days',margin+5,y+19);
  doc.text('Prepared for: '+doctor,W-margin-5,y+7,{align:'right'});
  y+=28;

  // Helper: section heading
  function sectionHeading(title,icon){
    checkPage(14);
    setFill(GREEN+'22'); doc.rect(margin,y,contentW,8,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(11); setColor(GREEN);
    doc.text(icon+'  '+title,margin+3,y+5.5);
    y+=11;
  }

  // Helper: stat row
  function statRow(label,value,note,valueColor){
    checkPage(8);
    doc.setFont('helvetica','normal'); doc.setFontSize(9); setColor(GRAY);
    doc.text(label,margin+3,y);
    doc.setFont('helvetica','bold'); setColor(valueColor||DARK);
    doc.text(String(value),margin+contentW/2,y);
    if(note){doc.setFont('helvetica','normal');doc.setFontSize(8);setColor(GRAY);doc.text(note,margin+contentW/2+30,y);}
    y+=6;
  }

  // Helper: divider
  function divider(){setDraw('#eeeeee');doc.setLineWidth(0.2);doc.line(margin,y,W-margin,y);y+=4;}

  // ── BLOOD PRESSURE ──
  const allBP=getBPReadings();
  const cutoff=new Date(); cutoff.setDate(cutoff.getDate()-days);
  const bpData=allBP.filter(r=>new Date(r.timestamp)>=cutoff);
  sectionHeading('Blood Pressure','❤');
  if(bpData.length){
    const avgSys=Math.round(bpData.reduce((s,r)=>s+r.sys,0)/bpData.length);
    const avgDia=Math.round(bpData.reduce((s,r)=>s+r.dia,0)/bpData.length);
    const maxSys=Math.max(...bpData.map(r=>r.sys));
    const minSys=Math.min(...bpData.map(r=>r.sys));
    const cls=classifyBP(avgSys,avgDia);
    statRow('Total readings',bpData.length+' readings');
    statRow('Average BP',avgSys+'/'+avgDia+' mmHg',cls.label,cls.color);
    statRow('Systolic range',minSys+' - '+maxSys+' mmHg');
    const avgPulse=bpData.filter(r=>r.pulse).length?Math.round(bpData.filter(r=>r.pulse).reduce((s,r)=>s+(r.pulse||0),0)/bpData.filter(r=>r.pulse).length):null;
    if(avgPulse) statRow('Average pulse',avgPulse+' bpm');
    divider();
    // BP table
    checkPage(10);
    doc.setFont('helvetica','bold'); doc.setFontSize(8); setColor(GRAY);
    doc.text('Date',margin+3,y); doc.text('Time',margin+28,y); doc.text('Sys',margin+50,y);
    doc.text('Dia',margin+65,y); doc.text('Pulse',margin+80,y); doc.text('Context',margin+100,y); doc.text('Classification',margin+135,y);
    y+=4; setDraw('#cccccc'); doc.setLineWidth(0.2); doc.line(margin,y,W-margin,y); y+=3;
    const recentBP=[...bpData].reverse().slice(0,20);
    for(const r of recentBP){
      checkPage(7);
      const c=classifyBP(r.sys,r.dia);
      doc.setFont('helvetica','normal'); doc.setFontSize(8); setColor(DARK);
      doc.text(r.date,margin+3,y); doc.text(r.time,margin+28,y);
      setColor(c.color); doc.setFont('helvetica','bold');
      doc.text(String(r.sys),margin+50,y); doc.text(String(r.dia),margin+65,y);
      doc.setFont('helvetica','normal'); setColor(DARK);
      doc.text(r.pulse?String(r.pulse):'—',margin+80,y);
      doc.text(r.context||'',margin+100,y);
      setColor(c.color); doc.text(c.label,margin+135,y);
      y+=5.5;
    }
    if(bpData.length>20){setColor(GRAY);doc.setFontSize(8);doc.text('(showing most recent 20 of '+bpData.length+' readings)',margin+3,y);y+=5;}
  } else {
    doc.setFont('helvetica','italic'); doc.setFontSize(9); setColor(GRAY);
    doc.text('No blood pressure readings recorded in this period.',margin+3,y); y+=8;
  }
  y+=4;

  // ── SLEEP ──
  const data=loadData();
  const allDays=Array.from({length:days},(_,i)=>{const d=new Date();d.setDate(d.getDate()-days+1+i);return d.toISOString().slice(0,10);});
  const sleepDays=allDays.map(d=>data[d]?.sleep).filter(Boolean);
  sectionHeading('Sleep','Z');
  if(sleepDays.length){
    const avgSleep=(sleepDays.reduce((s,d)=>s+d.hrs,0)/sleepDays.length).toFixed(1);
    const good=sleepDays.filter(d=>d.hrs>=7).length;
    statRow('Days tracked',sleepDays.length+' / '+days+' days');
    statRow('Average duration',avgSleep+' hrs/night',avgSleep>=7?'Good':'Below recommended',avgSleep>=7?GREEN:AMBER);
    statRow('Nights >= 7hrs',good+' nights ('+Math.round(good/sleepDays.length*100)+'%)');
    const qualities={Excellent:0,Good:0,Fair:0,Poor:0};
    sleepDays.forEach(d=>{ if(qualities[d.quality]!==undefined) qualities[d.quality]++; });
    statRow('Quality breakdown','Excellent: '+qualities.Excellent+' | Good: '+qualities.Good+' | Fair: '+qualities.Fair+' | Poor: '+qualities.Poor);
  } else {
    doc.setFont('helvetica','italic');doc.setFontSize(9);setColor(GRAY);doc.text('No sleep data recorded.',margin+3,y);y+=8;
  }
  y+=4;

  // ── EXERCISE ──
  checkPage(30);
  sectionHeading('Exercise','E');
  const exDays=allDays.map(d=>data[d]?.exercises||[]).filter(e=>e.length>0);
  const totalEx=allDays.flatMap(d=>data[d]?.exercises||[]);
  if(totalEx.length){
    const totalMins=totalEx.reduce((s,e)=>s+e.duration,0);
    statRow('Total workouts',totalEx.length+' sessions');
    statRow('Active days',exDays.length+' / '+days+' days');
    statRow('Total time',totalMins+' mins ('+Math.round(totalMins/60*10)/10+' hrs)');
    const types={};totalEx.forEach(e=>{types[e.activity]=(types[e.activity]||0)+1;});
    statRow('Activities',Object.entries(types).map(([k,v])=>k+': '+v).join(' | '));
  } else {
    doc.setFont('helvetica','italic');doc.setFontSize(9);setColor(GRAY);doc.text('No exercise recorded.',margin+3,y);y+=8;
  }
  y+=4;

  // ── WEIGHT ──
  checkPage(20);
  sectionHeading('Weight','W');
  const weightDays=allDays.map(d=>data[d]?.weight).filter(Boolean);
  if(weightDays.length){
    statRow('Readings',weightDays.length+' entries');
    statRow('Latest',weightDays[weightDays.length-1]+' kg');
    if(weightDays.length>1){
      const change=(weightDays[weightDays.length-1]-weightDays[0]);
      statRow('Change over period',(change>=0?'+':'')+change.toFixed(1)+' kg',null,change<0?GREEN:change>0?AMBER:DARK);
    }
  } else {
    doc.setFont('helvetica','italic');doc.setFontSize(9);setColor(GRAY);doc.text('No weight data recorded.',margin+3,y);y+=8;
  }
  y+=4;

  // ── NUTRITION ──
  checkPage(20);
  sectionHeading('Nutrition','N');
  const mealDays=allDays.map(d=>data[d]?.meals||[]).filter(m=>m.length>0);
  if(mealDays.length){
    const allMeals=allDays.flatMap(d=>data[d]?.meals||[]);
    const avgCal=Math.round(allMeals.reduce((s,m)=>s+m.cal,0)/mealDays.length);
    statRow('Days with meals logged',mealDays.length+' / '+days+' days');
    statRow('Avg daily calories',avgCal+' kcal',avgCal<2200?'Within goal':'Above goal',avgCal<=2200?GREEN:AMBER);
  } else {
    doc.setFont('helvetica','italic');doc.setFontSize(9);setColor(GRAY);doc.text('No nutrition data recorded.',margin+3,y);y+=8;
  }
  y+=4;

  // ── MOOD ──
  checkPage(20);
  sectionHeading('Mood & Wellbeing','M');
  const moodDays=allDays.map(d=>data[d]?.mood).filter(Boolean);
  if(moodDays.length){
    statRow('Days tracked',moodDays.length+' / '+days+' days');
    const moodCounts={};moodDays.forEach(m=>{moodCounts[m.label]=(moodCounts[m.label]||0)+1;});
    statRow('Mood breakdown',Object.entries(moodCounts).map(([k,v])=>k+': '+v+'d').join(' | '));
    const energyCounts={};moodDays.forEach(m=>{energyCounts[m.energy]=(energyCounts[m.energy]||0)+1;});
    statRow('Energy levels',Object.entries(energyCounts).map(([k,v])=>k+': '+v+'d').join(' | '));
  } else {
    doc.setFont('helvetica','italic');doc.setFontSize(9);setColor(GRAY);doc.text('No mood data recorded.',margin+3,y);y+=8;
  }
  y+=4;

  // ── MEDICATIONS ──
  checkPage(20);
  sectionHeading('Medications','Rx');
  const meds=getMeds();
  if(meds.length){
    doc.setFont('helvetica','bold');doc.setFontSize(9);setColor(DARK);
    doc.text('Current medications:',margin+3,y);y+=6;
    meds.forEach(m=>{
      checkPage(6);
      doc.setFont('helvetica','normal');doc.setFontSize(9);setColor(DARK);
      doc.text('• '+m.name+(m.dose?' — '+m.dose:'')+(m.time?' ('+m.time+')':''),margin+6,y);y+=5.5;
    });
  } else {
    doc.setFont('helvetica','italic');doc.setFontSize(9);setColor(GRAY);doc.text('No medications recorded.',margin+3,y);y+=8;
  }
  y+=4;

  // ── NOTES ──
  if(notes){
    checkPage(20);
    sectionHeading('Additional Notes','*');
    const lines=doc.splitTextToSize(notes,contentW-6);
    doc.setFont('helvetica','normal');doc.setFontSize(9);setColor(DARK);
    lines.forEach(l=>{checkPage(6);doc.text(l,margin+3,y);y+=5.5;});
    y+=4;
  }

  // Footer
  const pageCount=doc.getNumberOfPages();
  for(let i=1;i<=pageCount;i++){
    doc.setPage(i);
    setFill(LIGHTGRAY);doc.rect(0,287,W,10,'F');
    doc.setFont('helvetica','normal');doc.setFontSize(8);setColor(GRAY);
    doc.text('Health Tracker Report — '+name+' — Confidential',margin,293);
    doc.text('Page '+i+' of '+pageCount,W-margin,293,{align:'right'});
  }

  const filename='health-report-'+name.replace(/\s+/g,'-').toLowerCase()+'-'+todayKey()+'.pdf';
  doc.save(filename);
  showToast('Report downloaded! 📄');
}

// ── FOOD DIARY PDF ─────────────────────────────────────
function generateFoodDiaryPDF() {
  const name = document.getElementById('report-name').value.trim() || 'Patient';
  const dob  = document.getElementById('report-dob').value.trim() || 'Not provided';
  const doctor = document.getElementById('report-doctor').value.trim() || 'Bariatric Team';
  const periodText = document.querySelector('#report-period-pills .pill.active')?.textContent || '7 days';
  const days = periodText === '30 days' ? 30 : periodText === '14 days' ? 14 : 7;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, margin = 15, contentW = W - margin * 2;
  let y = margin;

  const GREEN = '#1D9E75', DARK = '#1a1a1a', GRAY = '#666', LIGHTGRAY = '#f5f5f3';
  function setColor(hex) { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); doc.setTextColor(r,g,b); }
  function setFill(hex)  { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); doc.setFillColor(r,g,b); }
  function setDraw(hex)  { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); doc.setDrawColor(r,g,b); }
  function checkPage(need=15) { if (y+need > 282) { doc.addPage(); y = margin; } }

  // Header
  setFill(GREEN); doc.rect(0, 0, W, 22, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(15); doc.setTextColor(255,255,255);
  doc.text('Food & Nutrition Diary', margin, 14);
  doc.setFontSize(9); doc.setFont('helvetica','normal');
  doc.text('Generated: '+new Date().toLocaleDateString('en-NZ',{day:'numeric',month:'long',year:'numeric'}), W-margin, 14, {align:'right'});
  y = 28;

  // Patient box
  setFill(LIGHTGRAY); setDraw('#dddddd'); doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentW, 20, 2, 2, 'FD');
  doc.setFont('helvetica','bold'); doc.setFontSize(10); setColor(DARK);
  doc.text('Patient: '+name, margin+4, y+7);
  doc.setFont('helvetica','normal'); doc.setFontSize(9); setColor(GRAY);
  doc.text('DOB: '+dob, margin+4, y+13);
  doc.text('Period: Last '+days+' days   |   Prepared for: '+doctor, W-margin-4, y+7, {align:'right'});
  y += 25;

  const diary = getFoodDiary();
  const allDays = Array.from({length:days}, (_,i) => { const d=new Date(); d.setDate(d.getDate()-days+1+i); return d.toISOString().slice(0,10); });
  const mealOrder = ['Breakfast','Lunch','Dinner','Snack','Supplement'];

  // Summary table header
  function tableHeader() {
    checkPage(10);
    setFill('#e8f5f0'); doc.rect(margin, y, contentW, 7, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(7.5); setColor(DARK);
    const cols = [margin+2, margin+28, margin+50, margin+68, margin+86, margin+104, margin+122, margin+140, margin+158];
    ['Food', 'Meal', 'Cal', 'Prot(g)', 'Carbs(g)', 'Fat(g)', 'Fibre(g)', 'Sugar(g)', 'Na(mg)'].forEach((h,i) => doc.text(h, cols[i], y+5));
    y += 8;
  }

  let grandTotals = {cal:0,protein:0,carbs:0,fat:0,fibre:0,sugar:0,sodium:0};
  let daysLogged = 0;

  for (const date of allDays) {
    const entries = diary[date] || [];
    if (!entries.length) continue;
    daysLogged++;

    const d = new Date(date+'T00:00');
    const dateStr = d.toLocaleDateString('en-NZ',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
    const dayTotals = {cal:0,protein:0,carbs:0,fat:0,fibre:0,sugar:0,sodium:0};
    entries.forEach(e => { dayTotals.cal+=e.cal||0; dayTotals.protein+=e.protein||0; dayTotals.carbs+=e.carbs||0; dayTotals.fat+=e.fat||0; dayTotals.fibre+=e.fibre||0; dayTotals.sugar+=e.sugar||0; dayTotals.sodium+=e.sodium||0; });
    Object.keys(grandTotals).forEach(k => grandTotals[k] += dayTotals[k]);

    checkPage(20);
    // Date heading
    setFill(GREEN); doc.rect(margin, y, contentW, 8, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(255,255,255);
    doc.text(dateStr, margin+3, y+5.5);
    doc.setFontSize(8);
    doc.text(`Total: ${Math.round(dayTotals.cal)} kcal  P:${Math.round(dayTotals.protein*10)/10}g  C:${Math.round(dayTotals.carbs*10)/10}g  F:${Math.round(dayTotals.fat*10)/10}g`, W-margin-3, y+5.5, {align:'right'});
    y += 9;

    tableHeader();

    const byMeal = {};
    entries.forEach(e => { if (!byMeal[e.mealType]) byMeal[e.mealType] = []; byMeal[e.mealType].push(e); });
    const sorted = mealOrder.filter(m=>byMeal[m]).concat(Object.keys(byMeal).filter(m=>!mealOrder.includes(m)));

    for (const meal of sorted) {
      const items = byMeal[meal];
      for (const e of items) {
        checkPage(7);
        const cols = [margin+2, margin+28, margin+50, margin+68, margin+86, margin+104, margin+122, margin+140, margin+158];
        doc.setFont('helvetica','normal'); doc.setFontSize(7.5); setColor(DARK);
        const foodLabel = e.name.length > 22 ? e.name.slice(0,21)+'…' : e.name;
        const serving = e.qty ? `${e.qty}${e.unit}` : '';
        doc.text(foodLabel, cols[0], y);
        doc.setFontSize(7); setColor(GRAY);
        if (serving) doc.text(serving, cols[0], y+3.5);
        doc.setFontSize(7.5); setColor(DARK);
        doc.text(e.mealType, cols[1], y);
        doc.text(String(Math.round(e.cal||0)),          cols[2], y);
        doc.text(String(Math.round((e.protein||0)*10)/10), cols[3], y);
        doc.text(String(Math.round((e.carbs||0)*10)/10),   cols[4], y);
        doc.text(String(Math.round((e.fat||0)*10)/10),     cols[5], y);
        doc.text(String(Math.round((e.fibre||0)*10)/10),   cols[6], y);
        doc.text(String(Math.round((e.sugar||0)*10)/10),   cols[7], y);
        doc.text(String(Math.round(e.sodium||0)),           cols[8], y);
        y += serving ? 7 : 5.5;
        setDraw('#eeeeee'); doc.setLineWidth(0.1); doc.line(margin, y-0.5, W-margin, y-0.5);
      }
    }
    y += 4;
  }

  if (!daysLogged) {
    doc.setFont('helvetica','italic'); doc.setFontSize(11); setColor(GRAY);
    doc.text('No food diary entries found for this period.', W/2, 150, {align:'center'});
  } else {
    // Grand summary
    checkPage(30);
    setFill('#1a1a1a'); doc.rect(margin, y, contentW, 8, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(255,255,255);
    doc.text('Period averages ('+daysLogged+' days logged)', margin+3, y+5.5);
    y += 9;
    setFill(LIGHTGRAY); doc.rect(margin, y, contentW, 10, 'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(8.5); setColor(DARK);
    const avg = k => Math.round(grandTotals[k]/daysLogged*10)/10;
    doc.text(`Avg daily: ${avg('cal')} kcal  |  Protein: ${avg('protein')}g  |  Carbs: ${avg('carbs')}g  |  Fat: ${avg('fat')}g  |  Fibre: ${avg('fibre')}g  |  Sugar: ${avg('sugar')}g  |  Sodium: ${avg('sodium')}mg`, margin+3, y+6.5);
    y += 14;

    // Bariatric note
    checkPage(20);
    setFill('#fff8e1'); setDraw('#f0c040'); doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentW, 16, 2, 2, 'FD');
    doc.setFont('helvetica','bold'); doc.setFontSize(9); setColor('#854F0B');
    doc.text('Note for bariatric team', margin+4, y+6);
    doc.setFont('helvetica','normal'); doc.setFontSize(8); setColor(DARK);
    const note = document.getElementById('report-notes').value.trim() || 'No additional notes provided.';
    const noteLines = doc.splitTextToSize(note, contentW-8);
    noteLines.forEach((l,i) => doc.text(l, margin+4, y+11+(i*4)));
    y += 18 + (noteLines.length-1)*4;
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i=1;i<=pageCount;i++) {
    doc.setPage(i);
    setFill(LIGHTGRAY); doc.rect(0,287,W,10,'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); setColor(GRAY);
    doc.text('Food Diary — '+name+' — Confidential — For bariatric team use only', margin, 293);
    doc.text('Page '+i+' of '+pageCount, W-margin, 293, {align:'right'});
  }

  doc.save('food-diary-'+name.replace(/\s+/g,'-').toLowerCase()+'-'+todayKey()+'.pdf');
  showToast('Food diary PDF downloaded! 📄');
}

// ── VOICE INPUT ────────────────────────────────────────
let recognition = null;
let isListening = false;

function initVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  const r = new SpeechRecognition();
  r.continuous = false;
  r.interimResults = true;
  r.lang = 'en-NZ';

  r.onstart = () => {
    isListening = true;
    const btn = document.getElementById('voice-btn');
    const icon = document.getElementById('voice-icon');
    if (btn) btn.classList.add('voice-listening');
    if (icon) { icon.className = 'ti ti-microphone-off'; }
    setVoiceStatus('🎤 Listening...');
    document.getElementById('ai-question').placeholder = 'Speak now...';
  };

  r.onresult = (e) => {
    const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
    document.getElementById('ai-question').value = transcript;
    if (e.results[e.results.length - 1].isFinal) {
      setVoiceStatus('✓ Got it — sending...');
      stopVoice();
      setTimeout(() => askAI(), 300);
    }
  };

  r.onerror = (e) => {
    stopVoice();
    if (e.error === 'not-allowed') {
      setVoiceStatus('❌ Microphone permission denied. Please allow mic access in browser settings.');
    } else if (e.error === 'no-speech') {
      setVoiceStatus('No speech detected. Try again.');
    } else {
      setVoiceStatus('Voice error: ' + e.error);
    }
  };

  r.onend = () => { if (isListening) stopVoice(); };
  return r;
}

function toggleVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setVoiceStatus('❌ Voice not supported in this browser. Try Chrome on Android.');
    return;
  }
  if (isListening) {
    stopVoice();
  } else {
    startVoice();
  }
}

function startVoice() {
  if (!recognition) recognition = initVoice();
  if (!recognition) return;
  document.getElementById('ai-question').value = '';
  try { recognition.start(); } catch(e) { recognition = initVoice(); recognition.start(); }
}

function stopVoice() {
  isListening = false;
  const btn = document.getElementById('voice-btn');
  const icon = document.getElementById('voice-icon');
  if (btn) btn.classList.remove('voice-listening');
  if (icon) icon.className = 'ti ti-microphone';
  document.getElementById('ai-question').placeholder = aiMode === 'food' ? 'Tell me what you ate...' : 'Ask about your health...';
  if (recognition) try { recognition.stop(); } catch(e) {}
  setTimeout(() => setVoiceStatus(''), 3000);
}

function setVoiceStatus(msg) {
  const el = document.getElementById('voice-status');
  if (el) el.textContent = msg;
}


function getLast7Days(){return Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d.toISOString().slice(0,10);});}

// ── INIT ───────────────────────────────────────────────
initRPG();
diaryDate = todayKey();
refreshDashboard();
refreshNutrition();
refreshMeds();
refreshAITab();
// Set BP time default to now
const bpTimeEl=document.getElementById('bp-time');
if(bpTimeEl) bpTimeEl.value=new Date().toLocaleTimeString('en-NZ',{hour:'2-digit',minute:'2-digit',hour12:false});
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
