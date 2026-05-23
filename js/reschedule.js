// ═══════════════════════════════════════════════
// RESCHEDULE — detectar atrasos + 3 modos de reprogramacao
// ═══════════════════════════════════════════════

// Verifica se data esta bloqueada (domingo / blockedDays)
function _isBlocked(dateStr) {
  if (ST.skipSundays) {
    const d = parseDate(dateStr);
    if (d && d.getDay() === 0) return true;
  }
  if (ST.blockedDays && ST.blockedDays.indexOf(dateStr) >= 0) return true;
  return false;
}

// Acha proxima data disponivel a partir de dateStr (inclusive)
function _nextAvailable(dateStr) {
  let d = dateStr;
  let safety = 0;
  while (_isBlocked(d) && safety < 365) { d = addDays(d, 1); safety++; }
  return d;
}

// Detecta tarefas atrasadas (passadas e nao concluidas)
function detectLateTasks() {
  const td = today();
  const late = [];
  // Plannerevents
  (ST.plannerEvents || []).forEach(pe => {
    if (!pe.done && pe.date < td) {
      late.push({ kind: 'plan', id: pe.id, date: pe.date, name: pe.name, mat: pe.mat, mins: pe.mins || 60, ref: pe });
    }
  });
  // Manual
  (ST.manualEvents || []).forEach(me => {
    if (!me.done && me.date < td) {
      late.push({ kind: 'manual', id: me.id, date: me.date, name: me.name, mat: me.mat, mins: 60, ref: me });
    }
  });
  // Revisoes
  TOPICS.forEach(t => {
    const ts = getTopicState(t.id);
    if (!ts.completedDate || !ts.reviews) return;
    REV_DAYS.forEach((_, i) => {
      const n = i + 1;
      const rs = ts.reviews[n];
      if (rs && !rs.completedDate && rs.dueDate < td) {
        late.push({ kind: 'rev', id: t.id + ':' + n, topicId: t.id, num: n, date: rs.dueDate, name: 'Rev.' + n + ' — ' + t.nome, mat: t.mat, mins: 30, ref: rs });
      }
    });
  });
  return late;
}

// Card "Voce tem pendencias" no topo do dashboard
function renderLateCard() {
  const zone = document.getElementById('late-card-zone');
  if (!zone) return;
  const late = detectLateTasks();
  if (!late.length) { zone.innerHTML = ''; return; }
  zone.innerHTML = `
    <div class="late-card">
      <div class="late-card-title">⚠ ${late.length} pendencia(s) atrasada(s)</div>
      <div class="late-card-sub">Tarefas dos dias passados que nao foram concluidas. Reprograme para manter o cronograma realista.</div>
      <button class="late-card-btn" onclick="openRescheduleModal()">📅 Reprogramar</button>
      ${ST.lastRescheduleSnapshot ? '<button class="late-card-btn" style="background:var(--bg4);color:var(--t2);margin-top:6px" onclick="undoLastReschedule()">↩ Desfazer ultima reprogramacao</button>' : ''}
    </div>
  `;
}

// Modal de reprogramacao com 3 modos
function openRescheduleModal() {
  const late = detectLateTasks();
  const html = `
    <div class="modal-handle"></div>
    <div class="modal-title">Reprogramar pendencias</div>
    <div class="modal-sub" style="margin-bottom:10px">${late.length} tarefa(s) atrasada(s). Como deseja reprogramar?</div>
    <div class="resched-opts">
      <div class="resched-opt" onclick="applyReschedule('push')">
        <div class="resched-opt-title">🔁 Empurrar tudo</div>
        <div class="resched-opt-desc">Move pendencias para hoje e desliza eventos futuros. Recomendado.</div>
      </div>
      <div class="resched-opt" onclick="applyReschedule('compact')">
        <div class="resched-opt-title">📦 Compactar nos proximos dias</div>
        <div class="resched-opt-desc">Distribui pendencias respeitando horas/dia. Bom para atrasos pequenos.</div>
      </div>
      <div class="resched-opt" onclick="applyReschedule('remap')">
        <div class="resched-opt-title">🧹 Apenas remarcar pendentes</div>
        <div class="resched-opt-desc">Move so os atrasados para o proximo dia util.</div>
      </div>
    </div>
    <button class="btn-cancel" onclick="closeModal()">Cancelar</button>
  `;
  showModal(html);
}

function applyReschedule(mode) {
  const late = detectLateTasks();
  if (!late.length) { closeModal(); return; }
  // snapshot
  ST.lastRescheduleSnapshot = {
    plannerEvents: JSON.parse(JSON.stringify(ST.plannerEvents || [])),
    manualEvents: JSON.parse(JSON.stringify(ST.manualEvents || [])),
    topics: JSON.parse(JSON.stringify(ST.topics || {})),
    ts: Date.now()
  };
  const td = today();
  const dailyMins = (ST.dailyHours || 3) * 60;

  if (mode === 'push') {
    // Para cada late, calcula delta = dias de hoje - data, e empurra tudo agendado depois desse dia
    // Implementacao simples: junta todos os dias com pendencias, calcula delta maximo, e move tudo a partir do dia mais antigo de pendencia
    const oldestLateDate = late.reduce((min, l) => l.date < min ? l.date : min, late[0].date);
    const delta = Math.round((parseDate(td) - parseDate(oldestLateDate)) / 86400000);
    if (delta > 0) {
      // Empurra plannerEvents nao concluidos cuja data >= oldestLateDate em delta dias (pulando bloqueados)
      (ST.plannerEvents || []).forEach(pe => {
        if (!pe.done && pe.date >= oldestLateDate) {
          let nd = addDays(pe.date, delta);
          nd = _nextAvailable(nd);
          pe.date = nd;
        }
      });
      (ST.manualEvents || []).forEach(me => {
        if (!me.done && me.date >= oldestLateDate) {
          let nd = addDays(me.date, delta);
          nd = _nextAvailable(nd);
          me.date = nd;
        }
      });
    }
    // revisoes: so atualiza dueDate (preservando completedDate da aula)
    late.filter(l => l.kind === 'rev').forEach(l => {
      const ts = ST.topics[l.topicId];
      if (ts && ts.reviews && ts.reviews[l.num]) {
        ts.reviews[l.num].dueDate = _nextAvailable(td);
      }
    });
  } else if (mode === 'compact') {
    // Distribui pendencias nos proximos N dias respeitando dailyMins
    let cursor = _nextAvailable(td);
    let used = 0;
    late.forEach(l => {
      if (used + l.mins > dailyMins) {
        cursor = _nextAvailable(addDays(cursor, 1));
        used = 0;
      }
      _moveLateTo(l, cursor);
      used += l.mins;
    });
  } else if (mode === 'remap') {
    // Move so os pendentes para o proximo dia util (dia a dia se sobrar capacidade)
    let cursor = _nextAvailable(td);
    let used = 0;
    late.forEach(l => {
      if (used + l.mins > dailyMins) {
        cursor = _nextAvailable(addDays(cursor, 1));
        used = 0;
      }
      _moveLateTo(l, cursor);
      used += l.mins;
    });
  }

  // historico
  if (!ST.rescheduleHistory) ST.rescheduleHistory = [];
  ST.rescheduleHistory.push({ ts: Date.now(), mode, count: late.length });
  saveState();
  closeModal();

  // Verifica se alguma data ultrapassa exam date
  const exam = ST.examDate || DEFAULT_EXAM_DATE;
  const hasOverflow = (ST.plannerEvents || []).some(pe => pe.date > exam) ||
    (ST.manualEvents || []).some(me => me.date > exam);
  if (hasOverflow) {
    toast('⚠ Cronograma vai alem de ' + fmtDate(exam) + '!', 'warn');
  } else {
    toast('Reprogramado com sucesso!');
  }
  if (typeof renderAll === 'function') renderAll();
}

function _moveLateTo(l, newDate) {
  if (l.kind === 'plan') {
    const pe = (ST.plannerEvents || []).find(x => x.id === l.id);
    if (pe) pe.date = newDate;
  } else if (l.kind === 'manual') {
    const me = (ST.manualEvents || []).find(x => x.id === l.id);
    if (me) me.date = newDate;
  } else if (l.kind === 'rev') {
    const ts = ST.topics[l.topicId];
    if (ts && ts.reviews && ts.reviews[l.num]) ts.reviews[l.num].dueDate = newDate;
  }
}

function undoLastReschedule() {
  const snap = ST.lastRescheduleSnapshot;
  if (!snap) { toast('Nada para desfazer'); return; }
  ST.plannerEvents = snap.plannerEvents;
  ST.manualEvents = snap.manualEvents;
  ST.topics = snap.topics;
  ST.lastRescheduleSnapshot = null;
  saveState();
  toast('Reprogramacao desfeita');
  if (typeof renderAll === 'function') renderAll();
}
