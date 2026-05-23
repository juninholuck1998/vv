// ═══════════════════════════════════════════════
// UI-QUESTOES — modulo novo de questoes resolvidas
// ═══════════════════════════════════════════════

let _chV = null, _chM = null, _chE = null;

function renderQuestoes() {
  // popula selects
  const matSel = document.getElementById('q-mat');
  if (matSel && !matSel.options.length) {
    matSel.innerHTML = Object.keys(MATS).map(m => `<option value="${m}">${MATS[m].l}</option>`).join('');
  }
  updateQTopics();
  renderQStats();
  renderQAlerts();
  renderQMatBars();
  renderQCharts();
  renderQHist();
}

function updateQTopics() {
  const matSel = document.getElementById('q-mat');
  const topSel = document.getElementById('q-topic');
  if (!matSel || !topSel) return;
  const mat = matSel.value;
  const mTopics = TOPICS.filter(t => t.mat === mat);
  topSel.innerHTML = '<option value="">— escolha um topico —</option>' +
    mTopics.map(t => `<option value="${t.id}">${t.cod} — ${t.nome}</option>`).join('');
}

function lancarQuestao() {
  const mat = document.getElementById('q-mat').value;
  const tipo = document.getElementById('q-tipo').value;
  const topicId = document.getElementById('q-topic').value;
  const tot = parseInt(document.getElementById('q-tot').value) || 0;
  const ac = parseInt(document.getElementById('q-ac-in').value);
  const msg = document.getElementById('q-msg');

  const _err = (txt) => { if (msg) { msg.textContent = txt; msg.style.color = '#f87171'; setTimeout(() => msg.textContent = '', 3000); } };
  if (!tot || tot < 1) return _err('Informe o numero de questoes feitas.');
  if (isNaN(ac) || ac < 0) return _err('Informe o numero de acertos.');
  if (ac > tot) return _err('Acertos nao podem superar o total.');
  if (!topicId) return _err('Escolha um topico.');

  if (!ST.questoes) ST.questoes = [];
  // se ja existe sessao do mesmo (mat, topicId, tipo) hoje, agrega
  const td = today();
  const existing = ST.questoes.find(s => s.mat === mat && s.topicId === topicId && s.tipo === tipo);
  let pct;
  if (existing) {
    existing.tot += tot;
    existing.ac += ac;
    existing.ts = Date.now();
    existing.date = new Date().toLocaleDateString('pt-BR');
    existing.sessions = (existing.sessions || 1) + 1;
    pct = Math.round(existing.ac / existing.tot * 100);
    if (msg) msg.textContent = 'Somado! Total: ' + existing.tot + 'q / ' + pct + '%';
  } else {
    ST.questoes.push({
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      ts: Date.now(),
      date: new Date().toLocaleDateString('pt-BR'),
      mat, topicId, tipo, tot, ac, sessions: 1
    });
    pct = Math.round(ac / tot * 100);
    if (msg) msg.textContent = 'Registrado! ' + tot + 'q — ' + pct + '%';
  }
  if (msg) msg.style.color = '#4ade80';
  saveState();

  // XP por bloco de 10 + bonus
  const blocks = Math.floor(tot / 10);
  if (blocks > 0) addXP(blocks * XP_QUESTOES_BLOCK, 'Questoes resolvidas');
  const blockPct = Math.round(ac / tot * 100);
  if (blocks > 0 && blockPct >= 80) addXP(XP_BLOCO_OK_BONUS, 'Bonus 80%+!');
  if (tipo === 'simulado' && tot >= 30) addXP(XP_SIMULADO_BONUS, 'Bonus simulado!');

  // Sync com revisoes
  if (['rev1','rev2','rev3'].includes(tipo)) {
    const n = tipo === 'rev1' ? 1 : tipo === 'rev2' ? 2 : 3;
    const ts = getTopicState(topicId);
    if (ts.completedDate && ts.reviews && ts.reviews[n] && !ts.reviews[n].completedDate) {
      const sessionPct = Math.round(ac / tot * 100);
      if (sessionPct >= 70) {
        markReview(topicId, n, false);
        toast('Rev.' + n + ' marcada como concluida!');
      } else if (sessionPct < 50) {
        toast('⚠ Recomendado refazer Rev.' + n, 'warn');
      } else {
        markReview(topicId, n, true);
        toast('Rev.' + n + ' concluida (revisitar)');
      }
    }
  }

  // limpa form
  document.getElementById('q-tot').value = '';
  document.getElementById('q-ac-in').value = '';
  if (msg) setTimeout(() => msg.textContent = '', 4000);
  renderQuestoes();
  if (typeof renderAll === 'function') renderAll();
}

function delQuestao(id) {
  if (!confirm('Remover este registro?')) return;
  ST.questoes = (ST.questoes || []).filter(s => s.id !== id);
  saveState();
  renderQuestoes();
  if (typeof renderAll === 'function') renderAll();
}

// ─── Stats ─────────────────────────────────────
function renderQStats() {
  const sess = ST.questoes || [];
  const tot = sess.reduce((a, s) => a + s.tot, 0);
  const ac = sess.reduce((a, s) => a + s.ac, 0);
  const pct = tot ? Math.round(ac / tot * 100) : null;
  const setT = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  setT('q-total', tot);
  setT('q-ac', ac);
  setT('q-pct', pct !== null ? pct + '%' : '--');
  setT('q-top', new Set(sess.map(s => s.topicId).filter(Boolean)).size);
}

function renderQAlerts() {
  const z = document.getElementById('q-alert-zone');
  if (!z) return;
  const sess = ST.questoes || [];
  const byMat = {};
  sess.forEach(s => {
    if (!byMat[s.mat]) byMat[s.mat] = { tot: 0, ac: 0 };
    byMat[s.mat].tot += s.tot;
    byMat[s.mat].ac += s.ac;
  });
  const ruins = Object.entries(byMat)
    .filter(([m, v]) => v.tot >= 10 && Math.round(v.ac / v.tot * 100) < 50)
    .sort((a, b) => Math.round(a[1].ac / a[1].tot * 100) - Math.round(b[1].ac / b[1].tot * 100));
  if (!ruins.length) { z.innerHTML = ''; return; }
  z.innerHTML = '<div class="q-alert"><div class="q-alert-title">⚠ Materias abaixo de 50% (min 10q)</div>' +
    ruins.map(([m, v]) => `<div class="q-alert-item"><span class="badge-mat ${MATS[m].bc}">${MATS[m].l}</span> ${Math.round(v.ac / v.tot * 100)}% (${v.ac}/${v.tot})</div>`).join('') +
    '</div>';
}

function renderQMatBars() {
  const card = document.getElementById('q-mat-bars-card');
  if (!card) return;
  const sess = ST.questoes || [];
  const byMat = {};
  sess.forEach(s => {
    if (!byMat[s.mat]) byMat[s.mat] = { tot: 0, ac: 0 };
    byMat[s.mat].tot += s.tot; byMat[s.mat].ac += s.ac;
  });
  const mats = Object.entries(byMat).filter(([m]) => MATS[m]).sort((a, b) => Math.round(a[1].ac / a[1].tot * 100) - Math.round(b[1].ac / b[1].tot * 100));
  if (!mats.length) { card.innerHTML = '<div class="empty"><span class="ei">🎯</span>Nenhuma sessao ainda</div>'; return; }
  card.innerHTML = '<div class="q-mat-bars">' + mats.map(([m, v]) => {
    const p = Math.round(v.ac / v.tot * 100);
    const col = p >= 70 ? '#22c55e' : p >= 50 ? '#D4AF37' : '#ef4444';
    return `<div class="q-mb-row"><div class="q-mb-lbl"><span class="badge-mat ${MATS[m].bc}">${MATS[m].l}</span></div><div class="q-mb-bg"><div class="q-mb-fill" style="width:${p}%;background:${col}"></div></div><div class="q-mb-pct" style="color:${col}">${p}%</div><div class="q-mb-q">${v.tot}q</div></div>`;
  }).join('') + '</div>';
}

function renderQCharts() {
  if (typeof Chart === 'undefined') return;
  const sess = ST.questoes || [];
  const byMat = {};
  sess.forEach(s => {
    if (!byMat[s.mat]) byMat[s.mat] = { tot: 0, ac: 0 };
    byMat[s.mat].tot += s.tot; byMat[s.mat].ac += s.ac;
  });
  const labels = Object.keys(MATS).filter(m => byMat[m] && byMat[m].tot > 0);
  const pcts = labels.map(m => Math.round(byMat[m].ac / byMat[m].tot * 100));
  const vols = labels.map(m => byMat[m].tot);
  const colors = labels.map(m => MATS[m].c);
  const lvol = document.getElementById('q-leg-vol');
  const lmat = document.getElementById('q-leg-mat');
  const legHTML = labels.map((m, i) => `<span class="q-chart-leg-i"><span class="q-chart-leg-sq" style="background:${colors[i]}"></span>${MATS[m].l}</span>`).join('');
  if (lvol) lvol.innerHTML = legHTML;
  if (lmat) lmat.innerHTML = legHTML;

  if (_chV) _chV.destroy();
  if (_chM) _chM.destroy();
  if (_chE) _chE.destroy();
  _chV = _chM = _chE = null;

  const gc = 'rgba(255,255,255,.05)', tc = 'rgba(255,255,255,.3)', tf = { size: 9, family: 'Roboto' };
  const cV = document.getElementById('q-ch-vol');
  const cM = document.getElementById('q-ch-mat');
  const cE = document.getElementById('q-ch-evo');
  if (labels.length && cV) {
    _chV = new Chart(cV, {
      type: 'doughnut',
      data: { labels: labels.map(m => MATS[m].l), datasets: [{ data: vols, backgroundColor: colors, borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '55%' }
    });
  }
  if (labels.length && cM) {
    _chM = new Chart(cM, {
      type: 'bar',
      data: { labels: labels.map(m => MATS[m].l), datasets: [{ data: pcts, backgroundColor: colors, borderWidth: 0, borderRadius: 4 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100, ticks: { callback: v => v + '%', font: tf, color: tc }, grid: { color: gc } }, x: { ticks: { font: { size: 8 }, color: tc }, grid: { display: false } } } }
    });
  }
  const sorted = [...sess].sort((a, b) => a.ts - b.ts);
  if (sorted.length >= 2 && cE) {
    const ep = sorted.map(s => Math.round(s.ac / s.tot * 100));
    const ea = sorted.map((s, i, arr) => { const sl = arr.slice(0, i + 1); return Math.round(sl.reduce((a, x) => a + x.ac, 0) / sl.reduce((a, x) => a + x.tot, 0) * 100); });
    _chE = new Chart(cE, {
      type: 'line',
      data: {
        labels: sorted.map((s, i) => '#' + (i + 1)),
        datasets: [
          { label: 'Sessao', data: ep, borderColor: '#B22222', backgroundColor: 'rgba(178,34,34,.08)', tension: .35, pointRadius: 3, fill: true, borderWidth: 2 },
          { label: 'Media', data: ea, borderColor: '#D4AF37', backgroundColor: 'transparent', tension: .35, pointRadius: 2, borderDash: [6, 3], borderWidth: 2 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100, ticks: { callback: v => v + '%', font: tf, color: tc }, grid: { color: gc } }, x: { ticks: { font: { size: 9 }, color: tc }, grid: { display: false } } } }
    });
  }
}

function renderQHist() {
  const tbody = document.getElementById('q-hist-body');
  if (!tbody) return;
  const sess = ST.questoes || [];
  if (!sess.length) { tbody.innerHTML = '<tr><td colspan="6"><div class="empty"><span class="ei">📋</span>Nenhum lancamento.</div></td></tr>'; return; }
  const sorted = [...sess].sort((a, b) => b.ts - a.ts);
  tbody.innerHTML = sorted.map(s => {
    const p = Math.round(s.ac / s.tot * 100);
    const col = p >= 70 ? '#4ade80' : p >= 50 ? '#fbbf24' : '#f87171';
    const mm = MATS[s.mat] || { l: s.mat, bc: 'badge-port' };
    const t = s.topicId ? TOPICS.find(x => x.id === s.topicId) : null;
    const topName = t ? t.cod : (s.topicoLivre || '—');
    const st = (s.sessions > 1) ? '<span style="font-size:9px;background:rgba(212,175,55,.15);color:var(--gold2);padding:0 4px;border-radius:3px;margin-left:3px">' + s.sessions + 'x</span>' : '';
    return `<tr>
      <td style="color:rgba(255,255,255,.25);font-size:10px">${s.date}</td>
      <td><span class="badge-mat ${mm.bc}">${mm.l}</span></td>
      <td style="font-size:11px;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${topName}${st}</td>
      <td style="font-family:Oswald,sans-serif;font-size:13px;font-weight:700;color:#fff">${s.tot}</td>
      <td><span style="font-family:Oswald,sans-serif;font-size:13px;font-weight:700;color:${col}">${p}%</span><span style="font-size:9px;color:rgba(255,255,255,.2)"> (${s.ac}/${s.tot})</span><div class="q-pbwrap"><div class="q-pbfill" style="width:${p}%;background:${col}"></div></div></td>
      <td><button class="q-btndel" onclick="delQuestao('${s.id}')">X</button></td>
    </tr>`;
  }).join('');
}

// ─── Helpers para cruzamento com edital ───────
function getQuestoesPorTopico(topicId) {
  const sess = (ST.questoes || []).filter(s => s.topicId === topicId);
  if (!sess.length) return null;
  const tot = sess.reduce((a, s) => a + s.tot, 0);
  const ac = sess.reduce((a, s) => a + s.ac, 0);
  if (!tot) return null;
  return { tot, ac, pct: Math.round(ac / tot * 100) };
}

function getTopicosFracos(min, n) {
  const byTopic = {};
  (ST.questoes || []).forEach(s => {
    if (!s.topicId) return;
    if (!byTopic[s.topicId]) byTopic[s.topicId] = { tot: 0, ac: 0 };
    byTopic[s.topicId].tot += s.tot;
    byTopic[s.topicId].ac += s.ac;
  });
  const arr = Object.entries(byTopic)
    .filter(([_, v]) => v.tot >= min)
    .map(([topicId, v]) => ({ topicId, tot: v.tot, ac: v.ac, pct: Math.round(v.ac / v.tot * 100) }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, n);
  return arr;
}
