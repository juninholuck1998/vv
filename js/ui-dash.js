// ═══════════════════════════════════════════════
// UI-DASH — dashboard com pendencias, week strip, weak topics, heatmap
// ═══════════════════════════════════════════════

let dashWeekSelected = null;

function renderDash() {
  if (typeof renderLateCard === 'function') renderLateCard();

  const td = today();
  const events = buildEvents();

  // stats
  let concl = 0, revPend = 0, atrasad = 0;
  TOPICS.forEach(t => {
    const ts = getTopicState(t.id);
    if (ts.completedDate) {
      concl++;
      REV_DAYS.forEach((_, i) => {
        const n = i + 1;
        const rs = ts.reviews ? ts.reviews[n] : null;
        if (rs && !rs.completedDate) {
          revPend++;
          if (rs.dueDate < td) atrasad++;
        }
      });
    }
  });
  const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setTxt('d-concl', concl);
  setTxt('d-revpend', revPend);
  setTxt('d-atrasad', atrasad);
  setTxt('d-total-pct', Math.round(concl / TOPICS.length * 100) + '%');

  // today label
  const d = new Date();
  const wn = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];
  const mn = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  setTxt('today-date-lbl', wn[d.getDay()] + ', ' + d.getDate() + ' ' + mn[d.getMonth()]);

  // today tasks
  const todayEvs = events[td] || [];
  const todayBody = document.getElementById('today-body');
  setTxt('today-count', todayEvs.length + ' tarefas');
  if (todayBody) {
    if (!todayEvs.length) {
      todayBody.innerHTML = '<div class="empty"><span class="ei">🎯</span>Nenhuma tarefa para hoje!<br>Marque topicos como concluidos para gerar revisoes.</div>';
    } else {
      todayBody.innerHTML = todayEvs.map(ev => buildDashEventRow(ev)).join('');
    }
  }

  renderWeekStrip(events);
  renderWeakTopics();
  renderHeatmap();
}

function buildDashEventRow(ev) {
  const t = TOPICS.find(x => x.id === ev.id);
  const mat = MATS[ev.mat] || { ico: '📖', l: '', c: '#888' };
  const typeColors = { done: '#ef4444', rev1: '#f59e0b', rev2: '#22c55e', rev3: '#8b5cf6', rev4: '#8b5cf6', manual: '#3b82f6', plan: '#a78bfa' };
  const borderCol = typeColors[ev.type] || '#888';
  let isDone = false, btnTxt = '', onclick = '';

  if (ev.type === 'done') {
    isDone = !!(t && getTopicState(t.id).completedDate);
    btnTxt = isDone ? '✓ OK' : 'Confirmar';
    onclick = isDone ? '' : `confirmTopic('${ev.id}')`;
  } else if (ev.type === 'manual') {
    isDone = !!ev.done;
    btnTxt = isDone ? '✓ OK' : 'Feito';
    onclick = isDone ? '' : `doneManualEvent('${ev.id}');renderAll()`;
  } else if (ev.type === 'plan') {
    const pe = (ST.plannerEvents || []).find(x => x.id === ev.planId);
    isDone = !!(pe && pe.done);
    btnTxt = isDone ? '✓ OK' : 'Feito';
    onclick = isDone ? '' : `donePlanEvent('${ev.planId}','${ev.id}')`;
  } else {
    const rs = t ? getRevState(t.id, ev.num) : null;
    isDone = !!(rs && rs.completedDate);
    btnTxt = isDone ? '✓ OK' : 'Feito';
    onclick = isDone ? '' : `confirmReview('${ev.id}',${ev.num})`;
  }

  const label = ev.type === 'done' ? 'Conclusao' : ev.type === 'manual' ? 'Manual' : ev.type === 'plan' ? 'Plano' : 'Rev.' + ev.num;
  const name = t ? t.nome : ev.name || '';

  return `<div class="today-task" style="border-left:3px solid ${borderCol};padding-left:10px;border-radius:4px;background:${isDone ? 'rgba(255,255,255,.02)' : 'transparent'}">
    <div class="tt-ico" style="font-size:18px">${mat.ico}</div>
    <div class="tt-info" style="flex:1;min-width:0">
      <div class="tt-name" style="${isDone ? 'text-decoration:line-through;opacity:.5' : ''}">${name}</div>
      <div class="tt-meta">${mat.l} · <span style="color:${borderCol};font-weight:600">${label}</span></div>
    </div>
    <button onclick="${onclick}" style="font-family:Oswald,sans-serif;font-size:10px;font-weight:700;padding:6px 10px;border-radius:6px;border:none;cursor:${isDone ? 'default' : 'pointer'};background:${isDone ? 'rgba(255,255,255,.06)' : 'linear-gradient(135deg,var(--rdk),var(--r))'};color:${isDone ? 'var(--t3)' : '#fff'};white-space:nowrap;flex-shrink:0" ${isDone ? 'disabled' : ''}>
      ${btnTxt}
    </button>
  </div>`;
}

function renderWeekStrip(events) {
  const wn = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];
  const wrap = document.getElementById('week-strip');
  if (!wrap) return;
  const dotColor = { done: '#ef4444', rev1: '#f59e0b', rev2: '#22c55e', rev3: '#8b5cf6', rev4: '#8b5cf6', manual: '#3b82f6', plan: '#a78bfa' };
  let html = '';
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    const ds = d.toISOString().slice(0, 10);
    const isToday = i === 0;
    const isSel = dashWeekSelected === ds;
    const evs = events[ds] || [];
    const typeSeen = new Set();
    const dots = evs.filter(ev => { if (typeSeen.has(ev.type)) return false; typeSeen.add(ev.type); return true; })
      .slice(0, 4)
      .map(ev => `<div style="width:5px;height:5px;border-radius:50%;background:${dotColor[ev.type] || '#888'}"></div>`).join('');
    html += `<div onclick="selectWeekDay('${ds}')" style="text-align:center;cursor:pointer;padding:6px 2px;border-radius:8px;flex:1;background:${isSel ? 'rgba(29,78,216,.25)' : isToday ? 'rgba(212,175,55,.08)' : 'transparent'};border:1px solid ${isSel ? 'var(--blu2)' : isToday ? 'rgba(212,175,55,.4)' : 'transparent'}">
      <div style="font-size:9px;color:var(--t3);text-transform:uppercase">${wn[d.getDay()]}</div>
      <div style="font-family:Oswald,sans-serif;font-size:15px;font-weight:700;color:${isToday ? 'var(--gold2)' : 'var(--t2)'};margin:2px 0">${d.getDate()}</div>
      <div style="display:flex;justify-content:center;gap:2px;flex-wrap:wrap;min-height:7px">${dots}</div>
    </div>`;
  }
  wrap.innerHTML = html;
  renderWeekDetail(events);
}

function selectWeekDay(ds) {
  dashWeekSelected = (dashWeekSelected === ds) ? null : ds;
  renderWeekStrip(buildEvents());
}

function renderWeekDetail(events) {
  const det = document.getElementById('week-detail');
  if (!det) return;
  if (!dashWeekSelected) { det.innerHTML = ''; return; }
  const evs = events[dashWeekSelected] || [];
  const d = parseDate(dashWeekSelected);
  const mn = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const wn = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];
  if (!evs.length) {
    det.innerHTML = `<div style="background:var(--bg3);border-radius:10px;border:1px solid var(--bd);padding:12px 14px;margin-top:6px">
      <div style="font-family:Oswald,sans-serif;font-size:11px;color:var(--t3)">${wn[d.getDay()]}, ${d.getDate()} ${mn[d.getMonth()]}</div>
      <div style="font-size:12px;color:var(--t3);margin-top:6px">Nenhuma tarefa.</div>
    </div>`;
    return;
  }
  det.innerHTML = `<div style="background:var(--bg3);border-radius:10px;border:1px solid var(--bd);margin-top:6px;overflow:hidden">
    <div style="background:var(--bg4);padding:10px 14px;font-family:Oswald,sans-serif;font-size:12px;font-weight:700;color:var(--gold2)">
      ${wn[d.getDay()]}, ${d.getDate()} ${mn[d.getMonth()]} · ${evs.length} evento(s)
    </div>
    <div style="padding:8px 14px">${evs.map(ev => buildDashEventRow(ev)).join('')}</div>
  </div>`;
}

// ─── Pontos fracos ──────────────────────────────
function renderWeakTopics() {
  const zone = document.getElementById('weak-zone');
  if (!zone) return;
  const weak = (typeof getTopicosFracos === 'function') ? getTopicosFracos(10, 3) : [];
  if (!weak || !weak.length) { zone.innerHTML = ''; return; }
  zone.innerHTML = `
    <div class="sh"><span style="font-size:16px">⚠️</span><span class="sh-title">Pontos fracos</span><div class="sh-line"></div></div>
    <div class="weak-card">
      ${weak.map(w => {
        const t = TOPICS.find(x => x.id === w.topicId);
        const mat = t ? MATS[t.mat] : { l: '', c: '#888', ico: '📖' };
        const col = w.pct >= 50 ? '#fbbf24' : '#f87171';
        return `<div class="weak-card-row">
          <div style="font-size:14px">${mat.ico}</div>
          <div class="weak-card-name">${t ? t.nome : w.topicId}</div>
          <div class="weak-card-pct" style="color:${col}">${w.pct}%</div>
          <div style="font-size:10px;color:var(--t3)">${w.tot}q</div>
        </div>`;
      }).join('')}
    </div>
  `;
}

// ─── Heatmap dos ultimos 91 dias (XP per day) ──
function renderHeatmap() {
  const zone = document.getElementById('heatmap-zone');
  if (!zone) return;
  const days = 91;
  // Agrega XP por dia (de marcacoes de topicos/revisoes/questoes/foco)
  const byDate = {};
  TOPICS.forEach(t => {
    const ts = getTopicState(t.id);
    if (ts.completedDate) byDate[ts.completedDate] = (byDate[ts.completedDate] || 0) + XP_COMPLETE;
    if (ts.reviews) {
      [1,2,3,4].forEach(n => {
        const rs = ts.reviews[n];
        if (rs && rs.completedDate) {
          const xpv = [XP_REV1, XP_REV2, XP_REV3, XP_REV3][n-1] || XP_REV3;
          byDate[rs.completedDate] = (byDate[rs.completedDate] || 0) + xpv;
        }
      });
    }
  });
  (ST.questoes || []).forEach(q => {
    if (!q.ts) return;
    const ds = new Date(q.ts).toISOString().slice(0, 10);
    byDate[ds] = (byDate[ds] || 0) + Math.floor(q.tot / 10) * XP_QUESTOES_BLOCK;
  });
  (ST.focoSessions || []).forEach(s => {
    if (s.date) byDate[s.date] = (byDate[s.date] || 0) + Math.floor(s.seconds / 600);
  });

  const max = Math.max(1, ...Object.values(byDate));
  const cells = [];
  const td = parseDate(today());
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(td); d.setDate(td.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const v = byDate[ds] || 0;
    let lvl = 0;
    if (v > 0) lvl = v >= max * 0.75 ? 4 : v >= max * 0.5 ? 3 : v >= max * 0.25 ? 2 : 1;
    cells.push(`<div class="hm-cell lvl${lvl}" title="${ds}: ${v} XP"></div>`);
  }
  zone.innerHTML = `
    <div class="sh"><span style="font-size:16px">🔥</span><span class="sh-title">Heatmap (91d)</span><div class="sh-line"></div></div>
    <div style="background:var(--bg3);border:1px solid var(--bd);border-radius:var(--rad);padding:12px;margin-bottom:10px">
      <div class="heatmap-grid">${cells.join('')}</div>
    </div>
  `;
}
