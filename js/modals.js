// ═══════════════════════════════════════════════
// MODALS — sistema generico + confirmar topico/revisao + notas
// ═══════════════════════════════════════════════

function showModal(html) {
  const mz = document.getElementById('modal-zone');
  if (!mz) return;
  mz.innerHTML = '<div class="modal-ov" onclick="if(event.target===this)closeModal()">' +
    '<div class="modal-sh">' + html + '</div></div>';
}

function closeModal() {
  const mz = document.getElementById('modal-zone');
  if (mz) mz.innerHTML = '';
}

// ─── Conclusao de topico ─────────────────────────
function confirmTopic(topicId) {
  const t = TOPICS.find(x => x.id === topicId);
  if (!t) return;
  const ts = getTopicState(topicId);
  if (ts.completedDate) {
    toast('Topico ja concluido em ' + fmtDate(ts.completedDate));
    return;
  }
  const mat = MATS[t.mat];
  const td = today();
  const revDates = REV_DAYS.map((d, i) => ({ num: i + 1, date: addDays(td, d), days: d }));
  const html = `
    <div class="modal-handle"></div>
    <div class="modal-title">Concluir Topico</div>
    <div class="modal-sub">
      <span class="badge-mat ${mat.bc}">${mat.l}</span> &nbsp;
      <strong>${t.cod} — ${t.nome}</strong><br/>
      <span style="font-size:10px;color:var(--t3);margin-top:4px;display:block">${t.aulas} aulas de ${t.dur} min cada</span>
    </div>
    <div class="xp-gain">
      <div class="xp-gain-ico">⭐</div>
      <div>
        <div class="xp-gain-txt">+${XP_COMPLETE} XP ao concluir!</div>
        <div class="xp-gain-sub">Revisoes geradas automaticamente</div>
      </div>
    </div>
    <div class="rev-sched">
      <div class="rev-sched-title">Revisoes agendadas</div>
      ${revDates.map(r => `<div class="rev-sched-item">
        <div class="rsi-num">Rev. ${r.num}</div>
        <div class="rsi-date">${fmtDate(r.date)}</div>
        <div class="rsi-days">em +${r.days} dias</div>
      </div>`).join('')}
    </div>
    <button class="btn-confirm-main" onclick="markCompleted('${topicId}')">CONFIRMAR CONCLUSAO</button>
    <button class="btn-cancel" onclick="closeModal()">Cancelar</button>
  `;
  showModal(html);
}

function markCompleted(topicId) {
  const t = TOPICS.find(x => x.id === topicId);
  if (!t) return;
  const td = today();
  if (!ST.topics[topicId]) ST.topics[topicId] = {};
  ST.topics[topicId].completedDate = td;
  ST.topics[topicId].reviews = {};
  REV_DAYS.forEach((d, i) => {
    const n = i + 1;
    ST.topics[topicId].reviews[n] = { dueDate: addDays(td, d), completedDate: null };
  });
  saveState();
  closeModal();
  addXP(XP_COMPLETE, 'Topico concluido: ' + t.nome);
  if (typeof renderAll === 'function') renderAll();
}

// ─── Conclusao de revisao ────────────────────────
function confirmReview(topicId, n) {
  const t = TOPICS.find(x => x.id === topicId);
  if (!t) return;
  const ts = getTopicState(topicId);
  const rs = ts.reviews ? ts.reviews[n] : null;
  if (!rs) { toast('Agende a revisao primeiro'); return; }
  if (rs.completedDate) { toast('Revisao ' + n + ' ja concluida!'); return; }
  const mat = MATS[t.mat];
  const xpArr = [XP_REV1, XP_REV2, XP_REV3, XP_REV3];
  const xpGain = xpArr[n - 1] || XP_REV3;
  const nextN = n + 1;
  const nextDays = REV_DAYS[nextN - 1] || null;
  const html = `
    <div class="modal-handle"></div>
    <div class="modal-title">Revisao ${n}</div>
    <div class="modal-sub">
      <span class="badge-mat ${mat.bc}">${mat.l}</span> &nbsp;
      <strong>${t.cod} — ${t.nome}</strong><br/>
      <span style="font-size:10px;color:var(--t3);margin-top:4px;display:block">Prevista para: ${fmtDate(rs.dueDate)}</span>
    </div>
    <div class="xp-gain">
      <div class="xp-gain-ico">🔁</div>
      <div>
        <div class="xp-gain-txt">+${xpGain} XP pela revisao!</div>
        <div class="xp-gain-sub">${nextDays ? 'Proxima revisao agendada' : 'Ultima revisao'}</div>
      </div>
    </div>
    ${nextDays ? `<div class="rev-sched">
      <div class="rev-sched-title">Proxima revisao</div>
      <div class="rev-sched-item">
        <div class="rsi-num">Rev. ${nextN}</div>
        <div class="rsi-date">${fmtDate(addDays(today(), nextDays))}</div>
        <div class="rsi-days">em +${nextDays} dias</div>
      </div>
    </div>` : ''}
    <button class="btn-confirm-main" style="background:linear-gradient(135deg,#92400e,var(--amber))" onclick="markReview('${topicId}',${n},false)">CONFIRMAR REV. ${n}</button>
    <button class="btn-cancel" onclick="closeModal()">Cancelar</button>
  `;
  showModal(html);
}

function markReview(topicId, n, weak) {
  const td = today();
  if (!ST.topics[topicId]) ST.topics[topicId] = { reviews: {} };
  if (!ST.topics[topicId].reviews) ST.topics[topicId].reviews = {};
  const prev = ST.topics[topicId].reviews[n] || {};
  ST.topics[topicId].reviews[n] = Object.assign({}, prev, { completedDate: td, weak: !!weak });
  // agenda proxima revisao
  const nextN = n + 1;
  const nextDays = REV_DAYS[nextN - 1] || null;
  if (nextDays && !ST.topics[topicId].reviews[nextN]) {
    ST.topics[topicId].reviews[nextN] = { dueDate: addDays(td, nextDays), completedDate: null };
  }
  saveState();
  closeModal();
  const xpArr = [XP_REV1, XP_REV2, XP_REV3, XP_REV3];
  addXP(xpArr[n - 1] || XP_REV3, 'Revisao ' + n + (weak ? ' (revisitar)' : ' concluida!'));
  if (typeof renderAll === 'function') renderAll();
}

// ─── Anotacoes por topico ────────────────────────
function noteModal(topicId) {
  const t = TOPICS.find(x => x.id === topicId);
  if (!t) return;
  const mat = MATS[t.mat];
  const cur = (ST.topicNotes && ST.topicNotes[topicId]) || '';
  const html = `
    <div class="modal-handle"></div>
    <div class="modal-title">Anotacoes</div>
    <div class="modal-sub">
      <span class="badge-mat ${mat.bc}">${mat.l}</span> &nbsp;
      <strong>${t.cod} — ${t.nome}</strong>
    </div>
    <textarea id="modal-note-ta" rows="8" style="width:100%;background:var(--bg);color:#fff;border:1.5px solid var(--bd2);border-radius:8px;padding:10px;font-family:Roboto,sans-serif;font-size:13px;resize:vertical;margin-top:6px">${cur.replace(/</g, '&lt;')}</textarea>
    <button class="btn-confirm-main" onclick="saveTopicNote('${topicId}')">SALVAR</button>
    <button class="btn-cancel" onclick="closeModal()">Cancelar</button>
  `;
  showModal(html);
  setTimeout(() => { const ta = document.getElementById('modal-note-ta'); if (ta) ta.focus(); }, 60);
}

function saveTopicNote(topicId) {
  const ta = document.getElementById('modal-note-ta');
  if (!ta) return;
  if (!ST.topicNotes) ST.topicNotes = {};
  const v = ta.value.trim();
  if (v) ST.topicNotes[topicId] = v;
  else delete ST.topicNotes[topicId];
  saveState();
  closeModal();
  toast('Anotacao salva');
  if (typeof renderAll === 'function') renderAll();
}

// Aliases legados (compatibilidade com codigo antigo)
function openCompleteModal(topicId) { confirmTopic(topicId); }
function openRevModal(topicId, n) { confirmReview(topicId, n); }
function confirmComplete(topicId) { markCompleted(topicId); }
function confirmRev(topicId, n) { markReview(topicId, n, false); }

function unmarkTopic(topicId) {
  if (!confirm('Desmarcar este topico? Os dados de revisao serao removidos.')) return;
  delete ST.topics[topicId];
  saveState();
  if (typeof renderAll === 'function') renderAll();
}
