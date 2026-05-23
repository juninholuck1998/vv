// ═══════════════════════════════════════════════
// UI-PLANNER — manual events + auto planner linear/ciclo
// ═══════════════════════════════════════════════

let planMode = 'linear';
let cycleOrderList = [];
let planPreviewData = null;

// ─── Manual events ──────────────────────────────
function updateManTopics() {
  const matSel = document.getElementById('man-mat');
  const sel = document.getElementById('man-topic');
  if (!matSel || !sel) return;
  const mat = matSel.value;
  const mTopics = TOPICS.filter(t => t.mat === mat);
  sel.innerHTML = mTopics.map(t => `<option value="${t.id}">${t.cod} — ${t.nome}</option>`).join('');
}

function addManualEvent() {
  const mat = document.getElementById('man-mat').value;
  const topicId = document.getElementById('man-topic').value;
  const date = document.getElementById('man-date').value;
  const note = document.getElementById('man-note').value.trim();
  const msg = document.getElementById('man-msg');
  if (!date) { msg.textContent = 'Selecione uma data.'; msg.style.color = '#f87171'; setTimeout(() => msg.textContent = '', 3000); return; }
  const t = TOPICS.find(x => x.id === topicId); if (!t) return;
  const ev = { id: 'me_' + Date.now(), topicId, mat, name: t.cod + ' — ' + t.nome, date, note, done: false };
  if (!ST.manualEvents) ST.manualEvents = [];
  ST.manualEvents.push(ev);
  saveState();
  document.getElementById('man-date').value = '';
  document.getElementById('man-note').value = '';
  msg.textContent = 'Evento adicionado para ' + fmtDate(date) + '!';
  msg.style.color = '#4ade80';
  setTimeout(() => msg.textContent = '', 3000);
  renderPlanner();
  toast('Evento adicionado');
}

function delManualEvent(id) {
  ST.manualEvents = (ST.manualEvents || []).filter(e => e.id !== id);
  saveState(); renderPlanner();
}

function doneManualEvent(id) {
  const ev = (ST.manualEvents || []).find(e => e.id === id);
  if (ev) { ev.done = !ev.done; saveState(); renderPlanner(); }
}

// ─── Planner ─────────────────────────────────────
function setPlanMode(mode) {
  planMode = mode;
  const isLinear = mode === 'linear';
  const lo = document.getElementById('linear-opts'); if (lo) lo.style.display = isLinear ? 'block' : 'none';
  const co = document.getElementById('cycle-opts'); if (co) co.style.display = isLinear ? 'none' : 'block';
  const btnL = document.getElementById('mode-btn-linear');
  const btnC = document.getElementById('mode-btn-cycle');
  if (btnL) {
    btnL.style.border = '2px solid ' + (isLinear ? 'var(--blue)' : 'var(--bd)');
    btnL.style.background = isLinear ? 'rgba(29,78,216,.25)' : 'transparent';
    btnL.style.color = isLinear ? '#93c5fd' : 'var(--t3)';
  }
  if (btnC) {
    btnC.style.border = '2px solid ' + (!isLinear ? 'var(--amber)' : 'var(--bd)');
    btnC.style.background = !isLinear ? 'rgba(217,119,6,.15)' : 'transparent';
    btnC.style.color = !isLinear ? 'var(--amr2)' : 'var(--t3)';
  }
  ['plan-stats','plan-preview','plan-confirm-btn'].forEach(id => { const e = document.getElementById(id); if (e) e.style.display = 'none'; });
  planPreviewData = null;
  if (!isLinear) renderCycleList();
}

function renderCycleList() {
  const wrap = document.getElementById('cycle-order-list');
  if (!wrap) return;
  if (!cycleOrderList.length) {
    wrap.innerHTML = '<div style="text-align:center;padding:16px;color:var(--t3);font-size:11px;background:var(--bg3);border-radius:8px">Nenhuma materia no ciclo ainda.</div>';
  } else {
    wrap.innerHTML = cycleOrderList.map((m, i) => {
      const mat = MATS[m];
      const pending = TOPICS.filter(t => t.mat === m && !getTopicState(t.id).completedDate).length;
      const isFirst = i === 0, isLast = i === cycleOrderList.length - 1;
      return `<div style="display:flex;align-items:center;gap:8px;background:var(--bg3);border-radius:8px;padding:9px 10px;border:1px solid var(--bd);border-left:3px solid ${mat.c}">
        <div style="font-size:18px">${mat.ico}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:500;color:${mat.c}">${mat.l}</div>
          <div style="font-size:10px;color:var(--t3)">${pending} pendentes · pos ${i + 1}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:2px">
          <button onclick="cycleMove(${i},-1)" ${isFirst ? 'disabled' : ''} style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);color:${isFirst ? 'rgba(255,255,255,.15)' : 'var(--t2)'};padding:3px 9px;border-radius:4px;cursor:${isFirst ? 'default' : 'pointer'};font-size:11px">▲</button>
          <button onclick="cycleMove(${i},1)" ${isLast ? 'disabled' : ''} style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);color:${isLast ? 'rgba(255,255,255,.15)' : 'var(--t2)'};padding:3px 9px;border-radius:4px;cursor:${isLast ? 'default' : 'pointer'};font-size:11px">▼</button>
        </div>
        <button onclick="cycleRemove('${m}')" style="background:rgba(178,34,34,.15);border:1px solid rgba(178,34,34,.3);color:#ff8080;padding:5px 10px;border-radius:6px;cursor:pointer">✕</button>
      </div>`;
    }).join('');
  }
  const addSel = document.getElementById('cycle-add-sel');
  if (addSel) {
    const available = Object.keys(MATS).filter(m => !cycleOrderList.includes(m));
    addSel.innerHTML = '<option value="">— adicionar —</option>' + available.map(m => `<option value="${m}">${MATS[m].ico} ${MATS[m].l}</option>`).join('');
    addSel.disabled = available.length === 0;
  }
}

function cycleAdd() {
  const sel = document.getElementById('cycle-add-sel');
  const v = sel ? sel.value : '';
  if (!v) return;
  if (!cycleOrderList.includes(v)) cycleOrderList.push(v);
  renderCycleList();
  toast(MATS[v].l + ' adicionado');
}
function cycleRemove(m) { cycleOrderList = cycleOrderList.filter(x => x !== m); renderCycleList(); }
function cycleMove(idx, dir) {
  const ni = idx + dir;
  if (ni < 0 || ni >= cycleOrderList.length) return;
  [cycleOrderList[idx], cycleOrderList[ni]] = [cycleOrderList[ni], cycleOrderList[idx]];
  renderCycleList();
}

function renderPlanner() {
  const dateInput = document.getElementById('plan-start');
  if (dateInput && !dateInput.value) dateInput.value = today();
  const mdateInput = document.getElementById('man-date');
  if (mdateInput && !mdateInput.value) mdateInput.value = today();

  // popula select de materias do form manual
  const matSel = document.getElementById('man-mat');
  if (matSel && !matSel.options.length) {
    matSel.innerHTML = Object.keys(MATS).map(m => `<option value="${m}">${MATS[m].l}</option>`).join('');
  }
  updateManTopics();

  const manList = document.getElementById('man-list');
  const evs = ST.manualEvents || [];
  const mc = document.getElementById('man-count');
  if (mc) mc.textContent = evs.length;
  if (manList) {
    if (!evs.length) manList.innerHTML = '<div class="empty"><span class="ei">📌</span>Nenhum evento manual ainda.</div>';
    else {
      const sorted = [...evs].sort((a, b) => a.date.localeCompare(b.date));
      manList.innerHTML = sorted.map(ev => {
        const mat = MATS[ev.mat] || { l: ev.mat, c: '#888' };
        return `<div class="manual-event-item">
          <div class="mei-color" style="background:${mat.c}"></div>
          <div class="mei-info">
            <div class="mei-name" style="${ev.done ? 'text-decoration:line-through;opacity:.5' : ''}">${ev.name}${ev.note ? ' · ' + ev.note : ''}</div>
            <div class="mei-date">${fmtDateFull(ev.date)} · <span style="background:rgba(255,255,255,.07);color:${mat.c};font-size:9px;padding:1px 5px;border-radius:3px">${mat.l}</span></div>
          </div>
          <button class="mei-del" onclick="doneManualEvent('${ev.id}')">${ev.done ? '↩' : '✓'}</button>
          <button class="mei-del" onclick="delManualEvent('${ev.id}')">✕</button>
        </div>`;
      }).join('');
    }
  }
  const planMats = document.getElementById('plan-mats');
  if (planMats && !planMats.innerHTML) {
    planMats.innerHTML = Object.keys(MATS).map(m => `
      <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--t2);background:var(--bg3);padding:4px 9px;border-radius:12px;border:1px solid var(--bd)">
        <input type="checkbox" id="pm-${m}" checked style="accent-color:var(--r)"/>
        ${MATS[m].ico} ${MATS[m].l}
      </label>`).join('');
  }
  if (planMode === 'cycle') renderCycleList();
  renderPlanStatusCard();
}

// ─── Preview / Confirm ──────────────────────────
function previewPlan() {
  if (planMode === 'cycle') previewCyclePlan();
  else previewLinearPlan();
}

function previewLinearPlan() {
  const hoursPerDay = parseFloat(document.getElementById('plan-hours').value) || 3;
  const startDate = document.getElementById('plan-start').value || today();
  const order = document.getElementById('plan-order').value;
  const selMats = Object.keys(MATS).filter(m => { const cb = document.getElementById('pm-' + m); return cb && cb.checked; });
  let pending = TOPICS.filter(t => {
    const ts = getTopicState(t.id);
    return !ts.completedDate && selMats.includes(t.mat) && !(ST.plannerEvents || []).some(pe => pe.topicId === t.id && !pe.done);
  });
  const impOrder = { ma: 0, a: 1, m: 2, b: 3 };
  if (order === 'imp') pending.sort((a, b) => (impOrder[a.imp] || 2) - (impOrder[b.imp] || 2));
  else if (order === 'mat') pending.sort((a, b) => a.mat.localeCompare(b.mat));
  else if (order === 'dur') pending.sort((a, b) => (a.aulas * a.dur) - (b.aulas * b.dur));
  if (!pending.length) { toast('Nenhum topico pendente'); return; }
  const minutesPerDay = hoursPerDay * 60;
  const plan = [];
  let curDate = startDate, curMins = 0, dayTasks = [];
  pending.forEach(t => {
    let remaining = t.aulas * t.dur;
    while (remaining > 0) {
      const avail = minutesPerDay - curMins;
      if (avail <= 0) { plan.push({ date: curDate, tasks: [...dayTasks] }); curDate = addDays(curDate, 1); curMins = 0; dayTasks = []; continue; }
      const slot = Math.min(remaining, avail);
      dayTasks.push({ topic: t, mins: slot, partial: slot < t.aulas * t.dur, aulasSlot: Math.floor(slot / t.dur) || 1 });
      curMins += slot; remaining -= slot;
      if (curMins >= minutesPerDay) { plan.push({ date: curDate, tasks: [...dayTasks] }); curDate = addDays(curDate, 1); curMins = 0; dayTasks = []; }
    }
  });
  if (dayTasks.length) plan.push({ date: curDate, tasks: [...dayTasks] });
  showPlanPreview(plan, pending.length, 'Linear');
}

function previewCyclePlan() {
  const startDate = document.getElementById('plan-start').value || today();
  const matsPerDay = parseInt(document.getElementById('cycle-per-day').value) || 2;
  const blockMins = parseInt(document.getElementById('cycle-block-min').value) || 60;
  const cycleMats = cycleOrderList;
  if (!cycleMats.length) { toast('Selecione pelo menos 1 materia no ciclo!'); return; }
  const queues = {};
  cycleMats.forEach(m => {
    queues[m] = [];
    TOPICS.filter(t => t.mat === m && !getTopicState(t.id).completedDate && !(ST.plannerEvents || []).some(pe => pe.topicId === t.id && !pe.done))
      .forEach(t => queues[m].push({ topic: t, remaining: t.aulas * t.dur }));
  });
  const totalPending = cycleMats.reduce((a, m) => a + (queues[m] ? queues[m].length : 0), 0);
  if (!totalPending) { toast('Nenhum topico pendente no ciclo!'); return; }
  let cyclePos = 0;
  const plan = [];
  let curDate = startDate;
  let dayCount = 0;
  while (dayCount < 365) {
    const anyLeft = cycleMats.some(m => queues[m] && queues[m].some(q => q.remaining > 0));
    if (!anyLeft) break;
    const dayTasks = [];
    let matsUsedToday = 0, checked = 0;
    while (matsUsedToday < matsPerDay && checked < cycleMats.length) {
      const mat = cycleMats[cyclePos % cycleMats.length];
      cyclePos = (cyclePos + 1) % cycleMats.length;
      checked++;
      const q = queues[mat];
      if (!q || !q.length || q.every(x => x.remaining <= 0)) continue;
      let filled = 0;
      while (filled < blockMins && q.length > 0) {
        const cur = q[0];
        if (cur.remaining <= 0) { q.shift(); continue; }
        const slot = Math.min(cur.remaining, blockMins - filled);
        dayTasks.push({ topic: cur.topic, mins: slot, mat, partial: slot < cur.topic.aulas * cur.topic.dur, aulasSlot: Math.ceil(slot / cur.topic.dur) || 1 });
        cur.remaining -= slot; filled += slot;
        if (cur.remaining <= 0) q.shift();
      }
      matsUsedToday++;
    }
    if (dayTasks.length) plan.push({ date: curDate, tasks: dayTasks });
    curDate = addDays(curDate, 1);
    dayCount++;
  }
  const topicIds = new Set();
  plan.forEach(d => d.tasks.forEach(tk => topicIds.add(tk.topic.id)));
  showPlanPreview(plan, topicIds.size, 'Ciclo');
}

function showPlanPreview(plan, topicCount, modeLabel) {
  planPreviewData = plan;
  const totalDays = plan.length;
  const endDate = plan[plan.length - 1] ? plan[plan.length - 1].date : null;
  const daysLeft = daysUntil(ST.examDate || DEFAULT_EXAM_DATE);
  const statsEl = document.getElementById('plan-stats');
  if (!statsEl) return;
  statsEl.style.display = 'block';
  statsEl.innerHTML = `<div class="planner-stat">
    <div><div style="font-size:9px;color:var(--t3)">Modo</div><span class="ps-val" style="font-size:11px">${modeLabel}</span></div>
    <div><div style="font-size:9px;color:var(--t3)">Dias</div><span class="ps-val">${totalDays}</span></div>
    <div><div style="font-size:9px;color:var(--t3)">Termina</div><span class="ps-val" style="font-size:11px">${fmtDate(endDate)}</span></div>
    <div><div style="font-size:9px;color:var(--t3)">P/ prova</div><span class="ps-val" style="color:${daysLeft < totalDays ? '#f87171' : '#4ade80'}">${daysLeft}d</span></div>
  </div>
  ${daysLeft < totalDays ? `<div style="background:rgba(239,68,68,.1);border-left:3px solid #ef4444;border-radius:6px;padding:8px 12px;margin-bottom:10px;font-size:11px;color:#fca5a5">⚠ Cronograma termina ${totalDays - daysLeft} dias apos a prova.</div>` : `<div style="background:rgba(22,163,74,.08);border-left:3px solid #4ade80;border-radius:6px;padding:8px 12px;margin-bottom:10px;font-size:11px;color:#86efac">✓ Termina antes da prova.</div>`}`;

  const prevEl = document.getElementById('plan-preview');
  if (prevEl) {
    prevEl.style.display = 'block';
    prevEl.innerHTML = `<div style="font-family:Oswald,sans-serif;font-size:10px;color:var(--t3);margin-bottom:6px">Previa (primeiros ${Math.min(plan.length, 25)} dias)</div>
    <div class="planner-preview">${plan.slice(0, 25).map(day => {
      const matColors = [...new Set(day.tasks.map(t => t.mat || t.topic.mat))];
      const stripe = matColors.map(m => `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${MATS[m] ? MATS[m].c : '#888'};margin-right:2px"></span>`).join('');
      return `<div class="pp-day">
        <div>
          <div class="pp-date">${fmtDateFull(day.date).slice(0, 10)}</div>
          <div style="display:flex;margin-top:3px">${stripe}</div>
        </div>
        <div class="pp-tasks">${day.tasks.map(task => {
          const mat = MATS[task.mat || task.topic.mat] || { c: '#888', ico: '📖', l: '' };
          return `<div class="pp-task">
            <span style="color:${mat.c}">${mat.ico}</span>
            <span style="color:${mat.c};font-size:9px;font-family:Oswald,sans-serif">${mat.l}</span> —
            ${task.topic.cod} ${task.topic.nome.slice(0, 20)}${task.topic.nome.length > 20 ? '…' : ''}
            ${task.partial ? '<span style="font-size:9px;color:var(--t3)">(parcial)</span>' : ''}
          </div>`;
        }).join('')}</div>
        <div class="pp-hours">${(day.tasks.reduce((a, t) => a + t.mins, 0) / 60).toFixed(1)}h</div>
      </div>`;
    }).join('')}
    ${plan.length > 25 ? `<div style="text-align:center;padding:8px;font-size:11px;color:var(--t3)">...e mais ${plan.length - 25} dias</div>` : ''}
    </div>`;
  }
  const cb = document.getElementById('plan-confirm-btn');
  if (cb) cb.style.display = 'block';
}

function confirmPlan() {
  if (!planPreviewData) return;
  if (!ST.plannerEvents) ST.plannerEvents = [];
  planPreviewData.forEach(day => {
    day.tasks.forEach(task => {
      ST.plannerEvents.push({
        id: 'pe_' + Date.now() + '_' + Math.random().toString(36).slice(2),
        topicId: task.topic.id, mat: task.topic.mat,
        name: task.topic.cod + ' — ' + task.topic.nome,
        date: day.date, mins: task.mins, done: false
      });
    });
  });
  saveState();
  planPreviewData = null;
  ['plan-preview','plan-confirm-btn','plan-stats'].forEach(id => { const e = document.getElementById(id); if (e) e.style.display = 'none'; });
  toast('Cronograma salvo!');
  renderPlanner();
}

function clearPlan() {
  if (!confirm('Zerar o cronograma gerado? Todos os eventos do plano serao removidos.')) return;
  ST.plannerEvents = [];
  saveState();
  planPreviewData = null;
  renderPlanStatusCard();
  renderPlanner();
  if (typeof renderCal === 'function') renderCal();
  toast('Cronograma zerado.');
}

function renderPlanStatusCard() {
  const card = document.getElementById('plan-status-card');
  if (!card) return;
  const evs = ST.plannerEvents || [];
  if (!evs.length) { card.style.display = 'none'; return; }
  card.style.display = 'block';
  const done = evs.filter(e => e.done).length;
  const total = evs.length;
  const pct = Math.round(done / total * 100);
  const dates = evs.map(e => e.date).sort();
  const startD = dates[0], endD = dates[dates.length - 1];
  const mats = [...new Set(evs.map(e => e.mat))];
  const matDots = mats.map(m => `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${MATS[m] ? MATS[m].c : '#888'};margin-right:2px"></span>`).join('');
  const daysLeft = daysUntil(ST.examDate || DEFAULT_EXAM_DATE);
  const remaining = total - done;
  card.innerHTML = `<div style="background:var(--bg2);border-radius:var(--rad);border:1px solid rgba(212,175,55,.25);overflow:hidden">
    <div style="background:linear-gradient(135deg,rgba(212,175,55,.12),rgba(178,34,34,.08));padding:12px 14px;display:flex;align-items:center;gap:10px">
      <span style="font-size:20px">📋</span>
      <div style="flex:1">
        <div style="font-family:Oswald,sans-serif;font-size:13px;font-weight:700;color:var(--gold2)">CRONOGRAMA ATIVO</div>
        <div style="font-size:10px;color:var(--t3);margin-top:1px">${fmtDate(startD)} → ${fmtDate(endD)} · ${total} aulas · ${matDots}</div>
      </div>
      <div style="font-family:Oswald,sans-serif;font-size:20px;font-weight:700;color:${pct >= 70 ? 'var(--grn2)' : pct >= 40 ? 'var(--amr2)' : 'var(--t2)'}">${pct}%</div>
    </div>
    <div style="padding:10px 14px">
      <div style="width:100%;height:6px;background:rgba(255,255,255,.07);border-radius:3px;overflow:hidden;margin-bottom:10px">
        <div style="width:${pct}%;height:100%;border-radius:3px;background:linear-gradient(90deg,var(--rdk),var(--gold2))"></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--bd);border-radius:6px;overflow:hidden;margin-bottom:12px">
        <div style="background:var(--bg);padding:8px 6px;text-align:center"><div style="font-family:Oswald,sans-serif;font-size:16px;font-weight:700;color:var(--grn2)">${done}</div><div style="font-size:9px;color:var(--t3)">Concluidas</div></div>
        <div style="background:var(--bg);padding:8px 6px;text-align:center"><div style="font-family:Oswald,sans-serif;font-size:16px;font-weight:700;color:var(--amr2)">${remaining}</div><div style="font-size:9px;color:var(--t3)">Restantes</div></div>
        <div style="background:var(--bg);padding:8px 6px;text-align:center"><div style="font-family:Oswald,sans-serif;font-size:16px;font-weight:700;color:${daysLeft < 10 ? '#f87171' : 'var(--gold2)'}">${daysLeft}d</div><div style="font-size:9px;color:var(--t3)">P/ prova</div></div>
      </div>
      <button onclick="clearPlan()" style="width:100%;padding:11px;background:transparent;color:#ff8080;border:1.5px solid rgba(255,100,100,.3);border-radius:9px;font-family:Oswald,sans-serif;font-size:13px;font-weight:700;cursor:pointer">🗑 ZERAR</button>
    </div>
  </div>`;
}
