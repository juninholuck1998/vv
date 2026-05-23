// ═══════════════════════════════════════════════
// APP — boot, tabs, navigation, SW register
// ═══════════════════════════════════════════════

// Helper: Date -> 'YYYY-MM-DD'
function formatYMD(d) {
  return d.toISOString().slice(0, 10);
}

// Switch de aba (data-tab)
function swT(t) {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
  const tab = document.querySelector('.tab[data-tab="' + t + '"]');
  if (tab) tab.classList.add('active');
  const panel = document.getElementById('panel-' + t);
  if (panel) panel.classList.add('active');
  window.scrollTo(0, 0);
  if (t === 'dash' && typeof renderDash === 'function') renderDash();
  if (t === 'cal' && typeof renderCal === 'function') renderCal();
  if (t === 'edital' && typeof renderEdital === 'function') renderEdital();
  if (t === 'topics' && typeof renderTopics === 'function') renderTopics();
  if (t === 'foco' && typeof renderFoco === 'function') renderFoco();
  if (t === 'questoes' && typeof renderQuestoes === 'function') renderQuestoes();
  if (t === 'planner' && typeof renderPlanner === 'function') renderPlanner();
  if (t === 'config' && typeof renderConfig === 'function') renderConfig();
}

// Re-render de tudo (chamado apos mudanca de estado)
function renderAll() {
  if (typeof renderXP === 'function') renderXP();
  const active = document.querySelector('.panel.active');
  if (!active) return;
  const id = active.id.replace('panel-', '');
  if (id === 'dash' && typeof renderDash === 'function') renderDash();
  if (id === 'cal' && typeof renderCal === 'function') renderCal();
  if (id === 'edital' && typeof renderEdital === 'function') renderEdital();
  if (id === 'topics' && typeof renderTopics === 'function') renderTopics();
  if (id === 'foco' && typeof renderFoco === 'function') renderFoco();
  if (id === 'questoes' && typeof renderQuestoes === 'function') renderQuestoes();
  if (id === 'planner' && typeof renderPlanner === 'function') renderPlanner();
  if (id === 'config' && typeof renderConfig === 'function') renderConfig();
}

// Listener das tabs
document.addEventListener('click', e => {
  const tab = e.target.closest('.tab[data-tab]');
  if (tab) swT(tab.dataset.tab);
});

// Service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// Verifica notificacoes de revisoes due hoje
function _checkDueRevisionsNotif() {
  if (!ST.notificationsEnabled) return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const td = today();
  let dueToday = 0;
  TOPICS.forEach(t => {
    const ts = getTopicState(t.id);
    if (!ts.completedDate || !ts.reviews) return;
    REV_DAYS.forEach((_, i) => {
      const n = i + 1;
      const rs = ts.reviews[n];
      if (rs && !rs.completedDate && rs.dueDate === td) dueToday++;
    });
  });
  if (dueToday > 0) {
    try {
      new Notification('CBMMG — Revisoes', {
        body: 'Voce tem ' + dueToday + ' revisao(oes) para hoje',
        icon: 'icons/icon-192.png'
      });
    } catch (e) {}
  }
}

// ─── BOOT ─────────────────────────────────────
(function boot() {
  if (typeof migrateQuestoesLegado === 'function') migrateQuestoesLegado();

  // tema
  document.documentElement.dataset.theme = ST.theme || 'dark';

  // header
  if (typeof renderXP === 'function') renderXP();

  // dashboard inicial
  swT('dash');

  // notificacoes
  if (typeof Notification !== 'undefined' && ST.notificationsEnabled && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
  setTimeout(_checkDueRevisionsNotif, 1500);
})();
