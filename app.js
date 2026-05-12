// ── State ──────────────────────────────────────────────
const todayKey = () => new Date().toISOString().slice(0,10);

function loadData() {
  try { return JSON.parse(localStorage.getItem('ht_data') || '{}'); } catch { return {}; }
}
function saveData(data) {
  localStorage.setItem('ht_data', JSON.stringify(data));
}
function todayData() {
  const d = loadData();
  const k = todayKey();
  if (!d[k]) d[k] = { meals:[], exercises:[], sleep:null, mood:null, water:0, weight:null, meds:{} };
  return { data:d, today:d[k], key:k };
}

// ── Nav ────────────────────────────────────────────────
document.querySelectorAll('#nav .nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'dashboard') refreshDashboard();
    if (btn.dataset.tab === 'meds') refreshMeds();
    if (btn.dataset.tab === 'ai') refreshAITab();
    if (btn.dataset.tab === 'nutrition') refreshNutrition();
    if (btn.dataset.tab === 'sleep') drawSleepChart();
    if (btn.dataset.tab === 'exercise') drawExerciseChart();
  });
});

// ── Header date ────────────────────────────────────────
document.getElementById('header-date').textContent = new Date().toLocaleDateString('en-NZ', { weekday:'short', day:'numeric', month:'short' });

// ── Pill selection ─────────────────────────────────────
function selectPill(el, groupId) {
  document.querySelectorAll('#'+groupId+' .pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
}

// ── Mood selection ─────────────────────────────────────
let selectedMoodEmoji = '😐', selectedMoodLabel = 'Okay';
function selectMood(el, emoji, label) {
  document.querySelectorAll('#mood-grid .mood-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  selectedMoodEmoji = emoji;
  selectedMoodLabel = label;
}

// ── NUTRITION ──────────────────────────────────────────
function logMeal() {
  const cal = parseInt(document.getElementById('meal-cal').value) || 0;
  const protein = parseInt(document.getElementById('meal-protein').value) || 0;
  const notes = document.getElementById('meal-notes').value.trim();
  const type = document.querySelector('#meal-type-pills .pill.active')?.textContent || 'Meal';
  if (!cal && !notes) { alert('Please enter calories or a meal description.'); return; }
  const { data, today, key } = todayData();
  today.meals.push({ type, cal, protein, notes, time: new Date().toLocaleTimeString('en-NZ',{hour:'2-digit',minute:'2-digit'}) });
  data[key] = today;
  saveData(data);
  document.getElementById('meal-cal').value = '';
  document.getElementById('meal-protein').value = '';
  document.getElementById('meal-notes').value = '';
  refreshNutrition();
  showToast('Meal logged! 🥗');
}

function refreshNutrition() {
  const { today } = todayData();
  const totalCal = today.meals.reduce((s,m) => s+m.cal, 0);
  const totalProtein = today.meals.reduce((s,m) => s+m.protein, 0);
  const calGoal = 2200, proteinGoal = 100;
  document.getElementById('cal-bar').style.width = Math.min(100, Math.round(totalCal/calGoal*100)) + '%';
  document.getElementById('cal-bar-label').textContent = totalCal + ' / ' + calGoal;
  document.getElementById('protein-bar').style.width = Math.min(100, Math.round(totalProtein/proteinGoal*100)) + '%';
  document.getElementById('protein-bar-label').textContent = totalProtein + 'g / ' + proteinGoal + 'g';
  const hist = document.getElementById('meal-history');
  if (!today.meals.length) { hist.innerHTML = '<div class="empty-state">No meals logged today.</div>'; return; }
  hist.innerHTML = today.meals.map(m => `<div class="log-item"><div class="log-item-left"><div class="log-item-name">${m.type}${m.notes ? ' — '+m.notes : ''}</div><div class="log-item-sub">${m.time}</div></div><div class="log-item-val">${m.cal ? m.cal+' kcal' : ''}</div></div>`).join('');
}

// ── EXERCISE ───────────────────────────────────────────
function logExercise() {
  const duration = parseInt(document.getElementById('ex-duration').value) || 0;
  const notes = document.getElementById('ex-notes').value.trim();
  const activity = document.querySelector('#activity-pills .pill.active')?.textContent || 'Workout';
  const intensity = document.querySelector('#intensity-pills .pill.active')?.textContent || 'Medium';
  if (!duration) { alert('Please enter duration.'); return; }
  const { data, today, key } = todayData();
  today.exercises.push({ activity, duration, intensity, notes, time: new Date().toLocaleTimeString('en-NZ',{hour:'2-digit',minute:'2-digit'}) });
  data[key] = today;
  saveData(data);
  document.getElementById('ex-duration').value = '';
  document.getElementById('ex-notes').value = '';
  drawExerciseChart();
  showToast('Workout logged! 💪');
}

function drawExerciseChart() {
  const data = loadData();
  const days = getLast7Days();
  const labels = days.map(d => new Date(d+'T00:00').toLocaleDateString('en-NZ',{weekday:'short'}));
  const values = days.map(d => (data[d]?.exercises||[]).reduce((s,e) => s+e.duration, 0));
  drawBarChart('exerciseChart', labels, values, '#1D9E75', 'Minutes');
}

// ── SLEEP ──────────────────────────────────────────────
function logSleep() {
  const bed = document.getElementById('sleep-bed').value;
  const wake = document.getElementById('sleep-wake').value;
  const quality = document.querySelector('#sleep-quality-pills .pill.active')?.textContent || 'Fair';
  const notes = document.getElementById('sleep-notes').value.trim();
  if (!bed || !wake) { alert('Please set bedtime and wake time.'); return; }
  const bedMins = timeToMins(bed), wakeMins = timeToMins(wake);
  let hrs = (wakeMins - bedMins + 1440) % 1440 / 60;
  hrs = Math.round(hrs * 10) / 10;
  const { data, today, key } = todayData();
  today.sleep = { bed, wake, hrs, quality, notes };
  data[key] = today;
  saveData(data);
  drawSleepChart();
  showToast(`Sleep logged — ${hrs} hrs 😴`);
}

function timeToMins(t) {
  const [h,m] = t.split(':').map(Number);
  return h*60 + m;
}

function drawSleepChart() {
  const data = loadData();
  const days = getLast7Days();
  const labels = days.map(d => new Date(d+'T00:00').toLocaleDateString('en-NZ',{weekday:'short'}));
  const values = days.map(d => data[d]?.sleep?.hrs || 0);
  drawBarChart('sleepChart', labels, values, '#534AB7', 'Hours', 10);
}

// ── MOOD ───────────────────────────────────────────────
function logMood() {
  const energy = document.querySelector('#energy-pills .pill.active')?.textContent || 'Low';
  const notes = document.getElementById('mood-notes').value.trim();
  const { data, today, key } = todayData();
  today.mood = { emoji: selectedMoodEmoji, label: selectedMoodLabel, energy, notes };
  data[key] = today;
  saveData(data);
  showToast('Mood logged ' + selectedMoodEmoji);
}

// ── MEDS ───────────────────────────────────────────────
function getMeds() {
  try { return JSON.parse(localStorage.getItem('ht_meds') || '[]'); } catch { return []; }
}
function saveMeds(meds) { localStorage.setItem('ht_meds', JSON.stringify(meds)); }

function showAddMed() {
  const form = document.getElementById('add-med-form');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function addMed() {
  const name = document.getElementById('med-name').value.trim();
  const dose = document.getElementById('med-dose').value.trim();
  const time = document.querySelector('#med-time-pills .pill.active')?.textContent || 'Morning';
  if (!name) { alert('Please enter a medication name.'); return; }
  const meds = getMeds();
  meds.push({ id: Date.now(), name, dose, time });
  saveMeds(meds);
  document.getElementById('med-name').value = '';
  document.getElementById('med-dose').value = '';
  document.getElementById('add-med-form').style.display = 'none';
  refreshMeds();
  showToast('Medication added!');
}

function refreshMeds() {
  const meds = getMeds();
  const { today } = todayData();
  const list = document.getElementById('med-list');
  if (!meds.length) {
    list.innerHTML = '<div class="empty-state">No medications yet. Add one below.</div>';
    return;
  }
  list.innerHTML = meds.map(m => {
    const taken = today.meds[m.id];
    return `<div class="log-item">
      <div class="log-item-left">
        <div class="log-item-name">${m.name}</div>
        <div class="log-item-sub">${m.dose ? m.dose+' · ' : ''}${m.time}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <button onclick="toggleMed(${m.id})" class="pill ${taken?'active':''}" style="font-size:12px;">${taken?'✓ Taken':'Mark taken'}</button>
        <button onclick="deleteMed(${m.id})" style="background:none;border:none;color:#ccc;cursor:pointer;font-size:18px;padding:4px;">×</button>
      </div>
    </div>`;
  }).join('');
  refreshWater();
}

function toggleMed(id) {
  const { data, today, key } = todayData();
  today.meds[id] = !today.meds[id];
  data[key] = today;
  saveData(data);
  refreshMeds();
}

function deleteMed(id) {
  if (!confirm('Remove this medication?')) return;
  saveMeds(getMeds().filter(m => m.id !== id));
  refreshMeds();
}

// ── WATER ──────────────────────────────────────────────
function refreshWater() {
  const { today } = todayData();
  const count = today.water || 0;
  const dots = document.getElementById('water-dots');
  dots.innerHTML = Array.from({length:8}, (_,i) => `
    <div class="water-dot ${i<count?'filled':''}" onclick="setWater(${i+1})">
      <span style="font-size:18px;">${i<count?'💧':'○'}</span>
    </div>`).join('');
  document.getElementById('water-count').textContent = count + ' of 8 glasses';
}

function setWater(n) {
  const { data, today, key } = todayData();
  today.water = today.water === n ? n-1 : n;
  data[key] = today;
  saveData(data);
  refreshWater();
}

// ── WEIGHT ─────────────────────────────────────────────
function logWeight() {
  const w = parseFloat(document.getElementById('weight-input').value);
  if (!w) { alert('Please enter your weight.'); return; }
  const { data, today, key } = todayData();
  today.weight = w;
  data[key] = today;
  saveData(data);
  document.getElementById('weight-input').value = '';
  refreshDashboard();
  showToast(`Weight logged: ${w} kg`);
}

// ── DASHBOARD ──────────────────────────────────────────
function refreshDashboard() {
  const data = loadData();
  const { today } = todayData();
  const totalCal = today.meals.reduce((s,m) => s+m.cal, 0);
  document.getElementById('d-cal').textContent = totalCal || '—';
  document.getElementById('d-water').textContent = today.water || '—';
  document.getElementById('d-sleep').textContent = today.sleep?.hrs || '—';
  const days = getLast7Days();
  const latestWeight = days.reverse().map(d => data[d]?.weight).find(w => w);
  document.getElementById('d-weight').textContent = latestWeight || '—';
  const log = document.getElementById('today-log');
  const items = [];
  if (today.meals.length) items.push(`<div class="log-item"><div class="log-item-left"><div class="log-item-name">🥗 Nutrition</div><div class="log-item-sub">${today.meals.length} meals · ${totalCal} kcal</div></div><span class="badge badge-green">Logged</span></div>`);
  if (today.exercises.length) items.push(`<div class="log-item"><div class="log-item-left"><div class="log-item-name">💪 Exercise</div><div class="log-item-sub">${today.exercises.map(e=>e.activity).join(', ')}</div></div><span class="badge badge-green">Done</span></div>`);
  if (today.sleep) items.push(`<div class="log-item"><div class="log-item-left"><div class="log-item-name">😴 Sleep</div><div class="log-item-sub">${today.sleep.hrs} hrs · ${today.sleep.quality}</div></div><span class="badge badge-green">Logged</span></div>`);
  if (today.mood) items.push(`<div class="log-item"><div class="log-item-left"><div class="log-item-name">${today.mood.emoji} Mood</div><div class="log-item-sub">${today.mood.label} · ${today.mood.energy} energy</div></div><span class="badge badge-green">Logged</span></div>`);
  if (today.water) items.push(`<div class="log-item"><div class="log-item-left"><div class="log-item-name">💧 Water</div><div class="log-item-sub">${today.water} of 8 glasses</div></div><span class="badge ${today.water>=8?'badge-green':'badge-amber'}">${today.water>=8?'Goal met':'In progress'}</span></div>`);
  log.innerHTML = items.length ? items.join('') : '<div class="empty-state">Nothing logged yet today. Start tracking!</div>';
  drawWeightChart();
}

function drawWeightChart() {
  const data = loadData();
  const days = getLast7Days();
  const labels = days.map(d => new Date(d+'T00:00').toLocaleDateString('en-NZ',{weekday:'short'}));
  const values = days.map(d => data[d]?.weight || null);
  const ctx = document.getElementById('weightChart').getContext('2d');
  if (window._weightChart) window._weightChart.destroy();
  window._weightChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ data: values, borderColor: '#1D9E75', backgroundColor: 'rgba(29,158,117,0.08)', tension: 0.4, pointRadius: 5, pointBackgroundColor: '#1D9E75', fill: true, spanGaps: true }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales: { x:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{font:{size:11},color:'#999'}}, y:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{font:{size:11},color:'#999'}} } }
  });
}

// ── CHARTS ─────────────────────────────────────────────
function drawBarChart(id, labels, values, color, label, maxY) {
  const ctx = document.getElementById(id)?.getContext('2d');
  if (!ctx) return;
  if (window['_chart_'+id]) window['_chart_'+id].destroy();
  window['_chart_'+id] = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data: values, backgroundColor: color+'cc', borderRadius: 4 }] },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales: {
        x:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{font:{size:11},color:'#999'}},
        y:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{font:{size:11},color:'#999'}, min:0, ...(maxY?{max:maxY}:{}) }
      }
    }
  });
}

// ── AI COACH ───────────────────────────────────────────
function getApiKey() { return localStorage.getItem('ht_api_key') || ''; }
function saveApiKey() {
  const key = document.getElementById('api-key-input').value.trim();
  if (!key.startsWith('sk-ant-')) { alert('That doesn\'t look like an Anthropic API key (should start with sk-ant-). Please check and try again.'); return; }
  localStorage.setItem('ht_api_key', key);
  refreshAITab();
  showToast('API key saved!');
}
function changeApiKey() {
  localStorage.removeItem('ht_api_key');
  refreshAITab();
}
function refreshAITab() {
  const hasKey = !!getApiKey();
  document.getElementById('api-key-card').style.display = hasKey ? 'none' : 'block';
}

function buildContext() {
  const data = loadData();
  const { today } = todayData();
  const days = getLast7Days();
  const sleepAvg = days.map(d=>data[d]?.sleep?.hrs).filter(Boolean);
  const avgSleep = sleepAvg.length ? (sleepAvg.reduce((a,b)=>a+b,0)/sleepAvg.length).toFixed(1) : 'unknown';
  const totalCal = today.meals.reduce((s,m) => s+m.cal, 0);
  const meds = getMeds();
  const takenMeds = meds.filter(m => today.meds[m.id]).map(m=>m.name);
  const pendingMeds = meds.filter(m => !today.meds[m.id]).map(m=>m.name);
  return `You are a warm, knowledgeable AI health coach. Here is the user's current health data:
Today: ${todayKey()}
Calories today: ${totalCal} kcal (goal 2200)
Water today: ${today.water}/8 glasses
Sleep last night: ${today.sleep ? today.sleep.hrs+' hrs ('+today.sleep.quality+')' : 'not logged'}
7-night avg sleep: ${avgSleep} hrs
Exercise today: ${today.exercises.length ? today.exercises.map(e=>e.duration+'min '+e.activity).join(', ') : 'none logged'}
Mood today: ${today.mood ? today.mood.emoji+' '+today.mood.label+', energy: '+today.mood.energy : 'not logged'}
Weight: ${today.weight ? today.weight+' kg' : 'not logged today'}
Medications taken: ${takenMeds.length ? takenMeds.join(', ') : 'none'}
Medications pending: ${pendingMeds.length ? pendingMeds.join(', ') : 'none'}
Provide concise, friendly, actionable advice in 2-4 sentences. No markdown headers or bullet formatting.`;
}

async function askAI() {
  const q = document.getElementById('ai-question').value.trim();
  if (!q) return;
  document.getElementById('ai-question').value = '';
  doAI(q);
}

async function doAI(question) {
  const key = getApiKey();
  if (!key) { alert('Please add your API key in the AI Coach tab first.'); return; }
  const box = document.getElementById('ai-response');
  box.innerHTML = '<div class="ai-msg loading">Thinking...</div>';
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:500, system: buildContext(), messages:[{role:'user',content:question}] })
    });
    const data = await resp.json();
    if (data.error) throw new Error(data.error.message);
    const text = data.content?.map(b=>b.text||'').join('') || 'No response received.';
    box.innerHTML = '<div class="ai-msg">' + text.replace(/\n/g,'<br>') + '</div>';
  } catch(e) {
    box.innerHTML = '<div class="ai-msg" style="color:#c00;">Error: ' + e.message + '. Please check your API key.</div>';
  }
}

// ── HELPERS ────────────────────────────────────────────
function getLast7Days() {
  return Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()-6+i);
    return d.toISOString().slice(0,10);
  });
}

function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1a1a1a;color:white;padding:10px 18px;border-radius:20px;font-size:14px;z-index:999;opacity:0;transition:opacity 0.2s;white-space:nowrap;';
  document.body.appendChild(t);
  setTimeout(() => t.style.opacity='1', 10);
  setTimeout(() => { t.style.opacity='0'; setTimeout(()=>t.remove(),300); }, 2200);
}

// ── INIT ───────────────────────────────────────────────
refreshDashboard();
refreshNutrition();
refreshMeds();
refreshAITab();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}
