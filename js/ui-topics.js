// ═══════════════════════════════════════════════
// UI-TOPICS — lista plana com busca, filtros chips e notas
// ═══════════════════════════════════════════════

let topicsFilterImp = 'all';
let topicsFilterSts = 'all';

function topicsChipImp(v) {
  topicsFilterImp = v;
  document.querySelectorAll('#topics-chips-imp .tchip').forEach(c => c.classList.toggle('active', c.dataset.imp === v));
  renderTopics();
}
function topicsChipSts(v) {
  topicsFilterSts = v;
  document.querySelectorAll('#topics-chips-sts .tchip').forEach(c => c.classList.toggle('active', c.dataset.sts === v));
  renderTopics();
}

function _topicStatus(t) {
  const ts = getTopicState(t.id);
  if (!ts.completedDate) return 'pend';
  const allDone = REV_DAYS.every((_, i) => { const n = i + 1; const rs = ts.reviews ? ts.reviews[n] : null; return rs && rs.completedDate; });
  return allDone ? 'done' : 'rev';
}

function renderTopics() {
  const td = today();
  const matOrder = ['port','leg','geo','hist','def','rlm','bio','fis','qui'];
  const body = document.getElementById('topics-body');
  if (!body) return;
  const search = (document.getElementById('topics-search')?.value || '').toLowerCase().trim();
  let html = '';
  matOrder.forEach(mat => {
    const mInfo = MATS[mat];
    let mTopics = TOPICS.filter(t => t.mat === mat);
    // filtros
    if (topicsFilterImp !== 'all') mTopics = mTopics.filter(t => t.imp === topicsFilterImp);
    if (topicsFilterSts !== 'all') mTopics = mTopics.filter(t => _topicStatus(t) === topicsFilterSts);
    if (search) mTopics = mTopics.filter(t => (t.nome + ' ' + t.cod).toLowerCase().indexOf(search) >= 0);
    if (!mTopics.length) return;
    const done = mTopics.filter(t => !!getTopicState(t.id).completedDate).length;
    html += `<div class="sh"><span>${mInfo.ico}</span><span class="sh-title">${mInfo.l}</span><div class="sh-line"></div><span class="sh-count">${done}/${mTopics.length}</span></div>
    <div style="background:var(--bg2);border-radius:var(--rad);border:1px solid var(--bd);margin-bottom:10px;overflow:hidden">`;
    mTopics.forEach(t => {
      const ts = getTopicState(t.id);
      const isDone = !!ts.completedDate;
      const impCls = 'imp-' + t.imp;
      let metaTxt = `${t.aulas} aulas · ${t.dur}min cada`;
      if (isDone) {
        metaTxt += ' · Concluido ' + fmtDate(ts.completedDate);
        const pending = REV_DAYS.map((_, i) => {
          const n = i + 1;
          const rs = ts.reviews ? ts.reviews[n] : null;
          if (rs && !rs.completedDate) {
            const du = daysUntil(rs.dueDate);
            return `Rev.${n}: ${du === 0 ? 'hoje' : du > 0 ? 'em ' + du + 'd' : Math.abs(du) + 'd atrasada'}`;
          }
          return null;
        }).filter(Boolean);
        if (pending.length) metaTxt += ' · ' + pending[0];
      }
      // questoes
      let qInfo = '';
      if (typeof getQuestoesPorTopico === 'function') {
        const q = getQuestoesPorTopico(t.id);
        if (q) {
          const col = q.pct >= 70 ? '#4ade80' : q.pct >= 50 ? '#fbbf24' : '#f87171';
          qInfo = ` <span style="color:${col};font-weight:700;font-size:11px">· ${q.pct}% (${q.tot}q)</span>`;
        }
      }
      const hasNote = ST.topicNotes && ST.topicNotes[t.id];
      const noteDot = hasNote ? '<span class="note-dot"></span>' : '';
      html += `<div class="topic-action-row">
        <div class="tar-imp ${impCls}"></div>
        <div class="tar-check${isDone ? ' done' : ''}" onclick="event.stopPropagation();${isDone ? "unmarkTopic('" + t.id + "')" : "confirmTopic('" + t.id + "')"}"></div>
        <div class="tar-info" onclick="${isDone ? '' : "confirmTopic('" + t.id + "')"}">
          <div class="tar-name${isDone ? ' done' : ''}">${t.cod} — ${t.nome}${noteDot}${qInfo}</div>
          <div class="tar-meta">${metaTxt}</div>
          ${isDone && ts.completedDate ? '<div class="tar-date">' + getRevSummary(t.id) + '</div>' : ''}
        </div>
        <button class="note-btn" onclick="event.stopPropagation();noteModal('${t.id}')">📝</button>
      </div>`;
    });
    html += '</div>';
  });
  body.innerHTML = html || '<div class="empty"><span class="ei">🔎</span>Nenhum topico corresponde aos filtros.</div>';
}

function getRevSummary(topicId) {
  const ts = getTopicState(topicId);
  if (!ts.completedDate) return '';
  let txt = '';
  REV_DAYS.forEach((_, i) => {
    const n = i + 1;
    const rs = ts.reviews ? ts.reviews[n] : null;
    if (rs && !rs.completedDate) {
      const du = daysUntil(rs.dueDate);
      if (du < 0) txt = `⚠ Rev.${n} atrasada ${Math.abs(du)}d`;
      else if (du === 0) txt = `🔔 Rev.${n} para HOJE`;
      else if (du <= 3) txt = `🔔 Rev.${n} em ${du} dias`;
    }
  });
  if (!txt) {
    const allDone = REV_DAYS.every((_, i) => { const n = i + 1; const rs = ts.reviews ? ts.reviews[n] : null; return rs && rs.completedDate; });
    if (allDone) txt = '✅ Todas as revisoes OK';
  }
  return txt;
}
