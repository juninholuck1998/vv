// ═══════════════════════════════════════════════
// UI-EDITAL — visao por materia com % questoes + nota
// ═══════════════════════════════════════════════

function renderEdital() {
  const td = today();
  const body = document.getElementById('edital-body');
  if (!body) return;
  const matOrder = ['port','leg','geo','hist','def','rlm','bio','fis','qui'];
  let html = '';
  matOrder.forEach(mat => {
    const mInfo = MATS[mat];
    const mTopics = TOPICS.filter(t => t.mat === mat);
    const done = mTopics.filter(t => getTopicState(t.id).completedDate).length;
    const pct = Math.round(done / mTopics.length * 100);
    html += `<div class="mat-section">
      <div class="mat-head" onclick="toggleMat('${mat}')">
        <div class="mat-head-ico">${mInfo.ico}</div>
        <div class="mat-head-info">
          <div class="mat-head-name">${mInfo.l}</div>
          <div class="mat-head-prog">${done}/${mTopics.length} topicos concluidos</div>
        </div>
        <div class="mat-prog-bar"><div class="mat-prog-fill" style="width:${pct}%;background:${mInfo.c}"></div></div>
        <div class="mat-pct" style="color:${mInfo.c}">${pct}%</div>
        <div class="mat-expand-ico" id="mei-${mat}">›</div>
      </div>
      <div class="mat-body" id="mb-${mat}" style="display:none">
        ${mTopics.map(t => buildEditalTopicRow(t, td)).join('')}
      </div>
    </div>`;
  });
  body.innerHTML = html;
}

function buildEditalTopicRow(t, td) {
  const ts = getTopicState(t.id);
  const isDone = !!ts.completedDate;
  let revChips = '', nextRev = null;
  REV_DAYS.forEach((_, i) => {
    const n = i + 1;
    const rs = ts.reviews ? ts.reviews[n] : null;
    let cls = 'pending', lbl = 'Rev.' + n;
    if (!isDone) { cls = 'pending'; lbl = 'Rev.' + n; }
    else if (rs && rs.completedDate) { cls = 'done'; lbl = '✓ Rev.' + n; }
    else if (rs) {
      const du = daysUntil(rs.dueDate);
      if (du < 0) { cls = 'overdue'; lbl = 'Rev.' + n + '⚠'; }
      else if (du <= 3) { cls = 'due'; lbl = 'Rev.' + n + '!'; }
      else { cls = 'pending'; lbl = 'Rev.' + n; }
      if (!nextRev && !rs.completedDate) nextRev = { n, date: rs.dueDate, days: du };
    }
    revChips += `<span class="rev-chip ${cls}">${lbl}</span>`;
  });
  let nextRevTxt = '';
  if (nextRev) {
    const du = nextRev.days;
    if (du < 0) nextRevTxt = `<div class="tr-next overdue">Rev.${nextRev.n} atrasada ${Math.abs(du)} dias — ${fmtDate(nextRev.date)}</div>`;
    else if (du <= 3) nextRevTxt = `<div class="tr-next urgent">Rev.${nextRev.n} em ${du === 0 ? 'HOJE' : du + ' dia(s)'} — ${fmtDate(nextRev.date)}</div>`;
    else nextRevTxt = `<div class="tr-next">Proxima rev em ${du} dias — ${fmtDate(nextRev.date)}</div>`;
  } else if (isDone) {
    const allDone = REV_DAYS.every((_, i) => { const n = i + 1; const rs = ts.reviews ? ts.reviews[n] : null; return rs && rs.completedDate; });
    if (allDone) nextRevTxt = `<div class="tr-next" style="color:var(--grn2)">Todas as revisoes concluidas!</div>`;
  }
  const statusCls = isDone ? (nextRev ? 'in-rev' : 'done') : 'pending';
  const statusCont = statusCls === 'done' ? '✓' : statusCls === 'in-rev' ? '↻' : '';

  // % questoes
  let qInfo = '';
  if (typeof getQuestoesPorTopico === 'function') {
    const q = getQuestoesPorTopico(t.id);
    if (q) {
      const col = q.pct >= 70 ? '#4ade80' : q.pct >= 50 ? '#fbbf24' : '#f87171';
      qInfo = ` · <span style="color:${col};font-weight:700">${q.pct}% (${q.tot}q)</span>`;
    }
  }

  // nota indicator
  const hasNote = ST.topicNotes && ST.topicNotes[t.id];
  const noteDot = hasNote ? '<span class="note-dot" title="Tem anotacao"></span>' : '';

  return `<div class="topic-row">
    <div class="tr-status ${statusCls}" onclick="event.stopPropagation();confirmTopic('${t.id}')">${statusCont}</div>
    <div class="tr-info" onclick="confirmTopic('${t.id}')">
      <div class="tr-cod">${t.cod}</div>
      <div class="tr-name">${t.nome}${noteDot}${qInfo}</div>
      <div class="tr-reviews">${revChips}</div>
      ${nextRevTxt}
      ${isDone ? `<div style="font-size:10px;color:var(--t3)">Concluido em ${fmtDate(ts.completedDate)}</div>` : ''}
    </div>
    <button class="note-btn" onclick="event.stopPropagation();noteModal('${t.id}')" title="Anotacao">📝</button>
    <div class="tr-aulas">${t.aulas}x${t.dur}min</div>
  </div>`;
}

function toggleMat(mat) {
  const body = document.getElementById('mb-' + mat);
  const ico = document.getElementById('mei-' + mat);
  if (!body) return;
  if (body.style.display === 'none') { body.style.display = 'block'; if (ico) ico.classList.add('open'); }
  else { body.style.display = 'none'; if (ico) ico.classList.remove('open'); }
}
