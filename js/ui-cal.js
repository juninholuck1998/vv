// ═══════════════════════════════════════════════
// UI-CAL — calendario com legenda
// ═══════════════════════════════════════════════

let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let calSelected = null;

function calNav(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCal();
}

function renderCal() {
  const events = buildEvents();
  const mn = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const cm = document.getElementById('cal-month');
  if (cm) cm.textContent = mn[calMonth] + ' ' + calYear;
  const first = new Date(calYear, calMonth, 1).getDay();
  const days = new Date(calYear, calMonth + 1, 0).getDate();
  const td = today();
  const dotColor = { done: '#ef4444', rev1: '#f59e0b', rev2: '#22c55e', rev3: '#8b5cf6', rev4: '#8b5cf6', manual: '#3b82f6', plan: '#a78bfa' };

  let html = '';
  for (let i = 0; i < first; i++) html += '<div class="cal-day empty"></div>';
  for (let d = 1; d <= days; d++) {
    const ds = calYear + '-' + String(calMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    const isToday = ds === td;
    const isPast = ds < td;
    const evs = events[ds] || [];
    const isSel = calSelected === ds;
    const typeSeen = new Set();
    const dots = evs.filter(ev => {
      const k = ev.done ? 'done' : ev.type;
      if (typeSeen.has(k)) return false; typeSeen.add(k); return true;
    }).slice(0, 4).map(ev => {
      const col = dotColor[ev.done ? 'done' : ev.type] || '#888';
      return `<div class="cd-dot" style="background:${col}"></div>`;
    }).join('');
    html += `<div class="cal-day${isToday ? ' today' : ''}${isPast ? ' past' : ''}${isSel ? ' selected' : ''}" onclick="calSelect('${ds}')">
      <div class="cd-num">${d}</div>
      <div class="cd-dots">${dots}</div>
    </div>`;
  }
  const grid = document.getElementById('cal-grid');
  if (grid) grid.innerHTML = html;
  if (calSelected) renderCalDetail(calSelected, events);
  else { const cd = document.getElementById('cal-detail'); if (cd) cd.innerHTML = ''; }
}

function calSelect(ds) {
  calSelected = (calSelected === ds) ? null : ds;
  renderCal();
}

function selectDay(ds) { calSelected = ds; renderCal(); }

function renderCalDetail(ds, events) {
  const evs = events[ds] || [];
  const det = document.getElementById('cal-detail');
  if (!det) return;
  if (!evs.length) { det.innerHTML = '<div class="cal-detail-head"><span style="font-size:16px">📅</span> Nenhum evento neste dia</div>'; return; }
  const d = parseDate(ds);
  const mn = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  det.innerHTML = `<div class="cal-detail-head">
    <span style="font-size:16px">📅</span>
    ${d.getDate() + ' ' + mn[d.getMonth()] + ' — ' + evs.length + ' evento(s)'}
  </div>
  <div class="cal-detail-body">
    ${evs.map(ev => {
      const t = TOPICS.find(x => x.id === ev.id);
      const mat = MATS[ev.mat] || { l: ev.mat, bc: 'badge-port', ico: '📖', c: '#888' };

      if (ev.type === 'manual') {
        return `<div class="cal-evt-item" style="border-left:3px solid #3b82f6">
          <div class="cei-ico">📌</div>
          <div class="cei-info">
            <div class="cei-name">${ev.name}${ev.note ? ' · <em style="color:var(--t3)">' + ev.note + '</em>' : ''}</div>
            <div class="cei-mat"><span style="background:rgba(59,130,246,.2);color:#93c5fd;font-size:9px;padding:1px 5px;border-radius:3px;font-family:Oswald,sans-serif">Manual</span> &nbsp; ${mat.l}</div>
          </div>
          <div class="cei-action">
            <button class="btn-confirm ${ev.done ? 'btn-done-sm' : 'btn-rev'}" onclick="doneManualEvent('${ev.id}');renderCal()">${ev.done ? '✓ OK' : 'Feito'}</button>
          </div>
        </div>`;
      }
      if (ev.type === 'plan') {
        const pe = (ST.plannerEvents || []).find(x => x.id === ev.planId);
        const planDone = pe && pe.done;
        const topicDone = t && getTopicState(t.id).completedDate;
        return `<div class="cal-evt-item" style="border-left:3px solid #8b5cf6">
          <div class="cei-ico">📋</div>
          <div class="cei-info">
            <div class="cei-name">${ev.name}</div>
            <div class="cei-mat"><span style="background:rgba(139,92,246,.2);color:#c4b5fd;font-size:9px;padding:1px 5px;border-radius:3px;font-family:Oswald,sans-serif">Plano</span> &nbsp; ${mat.l}</div>
            ${topicDone ? '<div style="font-size:9px;color:var(--grn2);margin-top:2px">✓ Topico concluido</div>' : ''}
          </div>
          <div class="cei-action">
            <button class="btn-confirm ${planDone ? 'btn-done-sm' : 'btn-study'}" onclick="donePlanEvent('${ev.planId}','${ev.id}')">${planDone ? '✓ OK' : 'Feito'}</button>
          </div>
        </div>`;
      }
      if (ev.type === 'done') {
        const topicDone = !!getTopicState(ev.id).completedDate;
        return `<div class="cal-evt-item">
          <div class="cei-ico">${topicDone ? '✅' : '📚'}</div>
          <div class="cei-info">
            <div class="cei-name">${t ? t.cod + ' — ' + t.nome : ev.name}</div>
            <div class="cei-mat"><span class="badge-mat ${mat.bc}">${mat.l}</span> &nbsp; Conclusao</div>
          </div>
          <div class="cei-action">
            <button class="btn-confirm ${topicDone ? 'btn-done-sm' : 'btn-study'}" onclick="${topicDone ? '' : "confirmTopic('" + ev.id + "')"}">${topicDone ? '✓ OK' : 'Confirmar'}</button>
          </div>
        </div>`;
      }
      // revisoes
      if (!t) return '';
      const rs = getRevState(ev.id, ev.num);
      const revDone = rs && rs.completedDate;
      const isOverdue = rs && !revDone && rs.dueDate < today();
      return `<div class="cal-evt-item" style="border-left:3px solid ${isOverdue ? '#ef4444' : ev.num === 1 ? '#f59e0b' : ev.num === 2 ? '#22c55e' : '#8b5cf6'}">
        <div class="cei-ico">${revDone ? '✅' : '🔁'}</div>
        <div class="cei-info">
          <div class="cei-name">${t.cod} — ${t.nome}</div>
          <div class="cei-mat"><span class="badge-mat ${mat.bc}">${mat.l}</span> &nbsp; Rev. ${ev.num}${isOverdue ? ' <span style="color:#ef4444;font-size:9px">ATRASADA</span>' : ''}</div>
        </div>
        <div class="cei-action">
          <button class="btn-confirm ${revDone ? 'btn-done-sm' : 'btn-rev'}" onclick="${revDone ? '' : "confirmReview('" + ev.id + "'," + ev.num + ")"}" ${revDone ? 'disabled' : ''}>${revDone ? '✓ OK' : 'Feito'}</button>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

// Plan event toggle
function donePlanEvent(planId, topicId) {
  const pe = (ST.plannerEvents || []).find(x => x.id === planId);
  if (!pe) return;
  pe.done = !pe.done;
  if (pe.done && topicId) {
    const ts = getTopicState(topicId);
    if (!ts.completedDate) {
      saveState();
      renderCal();
      addXP(30, 'Aula do plano concluida!');
      setTimeout(() => {
        const t = TOPICS.find(x => x.id === topicId);
        if (t && confirm('Marcar o topico "' + t.nome + '" como CONCLUIDO no Edital?\n\nIsso vai gerar as revisoes automaticas.')) {
          confirmTopic(topicId);
        }
      }, 200);
      return;
    }
  }
  saveState();
  if (typeof renderAll === 'function') renderAll();
  addXP(pe.done ? 30 : -30, pe.done ? 'Aula concluida!' : 'Aula desmarcada');
}
