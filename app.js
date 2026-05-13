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

// ── NUTRITION ──────────────────────────────────────────
function logMeal() {
  const cal=parseInt(document.getElementById('meal-cal').value)||0;
  const protein=parseInt(document.getElementById('meal-protein').value)||0;
  const notes=document.getElementById('meal-notes').value.trim();
  const type=document.querySelector('#meal-type-pills .pill.active')?.textContent||'Meal';
  if (!cal&&!notes){alert('Enter calories or a description.');return;}
  const {data,today,key}=todayData();
  const isFirst = today.meals.length===0 && !getRPG().achievements.includes('first_log');
  today.meals.push({type,cal,protein,notes,time:new Date().toLocaleTimeString('en-NZ',{hour:'2-digit',minute:'2-digit'})});
  data[key]=today; saveData(data);
  if (isFirst) unlockAchievement('first_log');
  addXP(cal>0?15:8,'Meal logged');
  document.getElementById('meal-cal').value='';
  document.getElementById('meal-protein').value='';
  document.getElementById('meal-notes').value='';
  refreshNutrition(); refreshQuestsTab(); checkAllAchievements();
  showToast('Meal logged! 🥗');
}

function refreshNutrition() {
  const {today}=todayData();
  const totalCal=today.meals.reduce((s,m)=>s+m.cal,0);
  const totalProt=today.meals.reduce((s,m)=>s+m.protein,0);
  document.getElementById('cal-bar').style.width=Math.min(100,Math.round(totalCal/2200*100))+'%';
  document.getElementById('cal-bar-label').textContent=totalCal+' / 2200';
  document.getElementById('protein-bar').style.width=Math.min(100,Math.round(totalProt/100*100))+'%';
  document.getElementById('protein-bar-label').textContent=totalProt+'g / 100g';
  const h=document.getElementById('meal-history');
  h.innerHTML=today.meals.length?today.meals.map(m=>`<div class="log-item"><div class="log-item-left"><div class="log-item-name">${m.type}${m.notes?' — '+m.notes:''}</div><div class="log-item-sub">${m.time}</div></div><div class="log-item-val">${m.cal?m.cal+' kcal':''}</div></div>`).join(''):'<div class="empty-state">No meals logged today.</div>';
}

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

// ── AI ─────────────────────────────────────────────────
function getApiKey(){return localStorage.getItem('ht_api_key')||'';}
function saveApiKey(){
  const k=document.getElementById('api-key-input').value.trim();
  if(!k.startsWith('sk-ant-')){alert('Should start with sk-ant-');return;}
  localStorage.setItem('ht_api_key',k); refreshAITab(); showToast('API key saved!');
}
function changeApiKey(){localStorage.removeItem('ht_api_key');refreshAITab();}
function refreshAITab(){document.getElementById('api-key-card').style.display=getApiKey()?'none':'block';}

async function askAI(){const q=document.getElementById('ai-question').value.trim();if(!q)return;document.getElementById('ai-question').value='';doAI(q);}

async function doAI(question){
  const key=getApiKey();
  if(!key){alert('Add your API key first.');return;}
  const box=document.getElementById('ai-response');
  box.innerHTML='<div class="ai-msg loading">Thinking...</div>';
  const {today}=todayData();
  const rpg=getRPG(),rank=getRank(rpg.xp||0);
  const sys=`You are a passionate anime-style AI health coach. The user is a hero on their health journey.
Rank: ${rank.rank} — ${rank.title} (${rpg.xp||0} XP, ${rpg.streak||0} day streak).
Today: calories ${today.meals.reduce((s,m)=>s+m.cal,0)}/2200, water ${today.water}/8, sleep ${today.sleep?today.sleep.hrs+'hrs':'not logged'}, exercise ${today.exercises.length?today.exercises.map(e=>e.activity).join(','):'none'}, mood ${today.mood?today.mood.label:'not logged'}.
Be motivating, reference their rank/hero journey. 2-4 sentences, no markdown.`;
  try{
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:500,system:sys,messages:[{role:'user',content:question}]})});
    const d=await r.json();
    if(d.error)throw new Error(d.error.message);
    box.innerHTML='<div class="ai-msg">'+d.content.map(b=>b.text||'').join('').replace(/\n/g,'<br>')+'</div>';
  }catch(e){box.innerHTML='<div class="ai-msg" style="color:#c00;">Error: '+e.message+'</div>';}
}

// ── HELPERS ────────────────────────────────────────────
function getLast7Days(){return Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d.toISOString().slice(0,10);});}

// ── INIT ───────────────────────────────────────────────
initRPG();
refreshDashboard();
refreshNutrition();
refreshMeds();
refreshAITab();
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
