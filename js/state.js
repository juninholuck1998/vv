// ═══════════════════════════════════════════════
// STATE — persistência, helpers de data, eventos
// ═══════════════════════════════════════════════

// Estado global persistido em localStorage chave 'cbmmg_cron2'
let ST = {
  topics: {}, xp: 0, streak: 0, lastActivity: null,
  manualEvents: [], plannerEvents: [],
  questoes: [], questoesMigrated: false,
  topicNotes: {},
  examDate: DEFAULT_EXAM_DATE,
  dailyHours: 3,
  skipSundays: false,
  blockedDays: [],
  rescheduleHistory: [],
  lastRescheduleSnapshot: null,
  pomodoroPreset: null,
  notificationsEnabled: false,
  theme: 'dark'
};

// Carrega estado do localStorage
try {
  const s = localStorage.getItem('cbmmg_cron2');
  if (s) {
    const parsed = JSON.parse(s);
    ST = Object.assign(ST, parsed);
  }
} catch (e) {}

// Persiste estado
function saveState() {
  try { localStorage.setItem('cbmmg_cron2', JSON.stringify(ST)); } catch (e) {}
}

// ─── Reset de conteúdo (mai/2026) ────────────────────────────
// Português e RLM foram refeitos. Zera o progresso de TODAS as
// matérias UMA única vez, preservando apenas o módulo de Questões
// e as configurações (data da prova, horas/dia, tema, etc.).
if (!ST.resetConteudo202605) {
  ST.topics = {};
  ST.xp = 0;
  ST.streak = 0;
  ST.lastActivity = null;
  ST.manualEvents = [];
  ST.plannerEvents = [];
  ST.topicNotes = {};
  ST.rescheduleHistory = [];
  ST.lastRescheduleSnapshot = null;
  ST.resetConteudo202605 = true;
  saveState();   // ST.questoes e ST.questoesMigrated são mantidos
}

// ─── Helpers de data (timezone-safe) ─────────────────────────
// Sempre usar parseDate para evitar problemas de fuso ao parsear YYYY-MM-DD
function parseDate(s) {
  if (!s) return null;
  return new Date(s + 'T12:00:00');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr, n) {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function fmtDate(s) {
  if (!s) return '—';
  const [y, m, d] = s.split('-');
  const names = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return d + ' ' + names[+m - 1];
}

function fmtDateFull(s) {
  if (!s) return '—';
  const d = parseDate(s);
  const wn = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];
  const mn = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return wn[d.getDay()] + ', ' + d.getDate() + ' ' + mn[d.getMonth()];
}

function daysUntil(s) {
  if (!s) return null;
  const target = parseDate(s);
  const now = parseDate(today());
  return Math.round((target - now) / 86400000);
}

// ─── Patentes ────────────────────────────────────────────────
function getRank(xp) {
  return RANKS.find((r, i) => xp >= r.min && (i === RANKS.length - 1 || xp < r.max + 1)) || RANKS[0];
}
function getRankProgress(xp) {
  const r = getRank(xp);
  if (!r.next) return 100;
  return Math.round((xp - r.min) / (r.next - r.min) * 100);
}
function getRankXpLeft(xp) {
  const r = getRank(xp);
  if (!r.next) return 0;
  return r.next - xp;
}

// ─── Tópicos / Revisões ──────────────────────────────────────
function getTopicState(id) {
  return ST.topics[id] || { completedDate: null, reviews: {} };
}
function getRevState(id, n) {
  const ts = getTopicState(id);
  return ts.reviews ? ts.reviews[n] : null;
}

// ─── Construir mapa de eventos por data ──────────────────────
// Retorna {dateStr: [{id, type, name, mat, ...}]}
function buildEvents() {
  const ev = {};
  // Conclusão de tópicos + revisões automáticas
  TOPICS.forEach(t => {
    const ts = getTopicState(t.id);
    if (ts.completedDate) {
      if (!ev[ts.completedDate]) ev[ts.completedDate] = [];
      ev[ts.completedDate].push({ id: t.id, type: 'done', name: t.nome, mat: t.mat });
      REV_DAYS.forEach((d, i) => {
        const n = i + 1;
        const rs = ts.reviews ? ts.reviews[n] : null;
        const dueDate = rs ? rs.dueDate : addDays(ts.completedDate, d);
        if (!ev[dueDate]) ev[dueDate] = [];
        ev[dueDate].push({
          id: t.id, type: 'rev' + n, num: n, name: t.nome, mat: t.mat,
          done: !!(rs && rs.completedDate), dueDate
        });
      });
    }
  });
  // Eventos manuais
  (ST.manualEvents || []).forEach(me => {
    if (!ev[me.date]) ev[me.date] = [];
    ev[me.date].push({ id: me.id, type: 'manual', name: me.name, mat: me.mat, note: me.note, done: !!me.done });
  });
  // Eventos do planner
  (ST.plannerEvents || []).forEach(pe => {
    if (!ev[pe.date]) ev[pe.date] = [];
    ev[pe.date].push({ id: pe.topicId, type: 'plan', name: pe.name, mat: pe.mat, planId: pe.id, done: !!pe.done });
  });
  return ev;
}

// ─── XP / Streak ─────────────────────────────────────────────
// Cálculo de streak corrigido: 0 dias=mesmo dia (não mexe), 1=+1, >1=reset 1
function addXP(amount, label) {
  const prevRank = getRank(ST.xp || 0);
  ST.xp = (ST.xp || 0) + amount;
  const newRank = getRank(ST.xp);
  const td = today();
  if (ST.lastActivity) {
    const diffDays = Math.round((parseDate(td) - parseDate(ST.lastActivity)) / 86400000);
    if (diffDays === 0) {
      // mesmo dia: não mexe no streak
    } else if (diffDays === 1) {
      ST.streak = (ST.streak || 0) + 1;
      ST.lastActivity = td;
    } else {
      ST.streak = 1;
      ST.lastActivity = td;
    }
  } else {
    ST.streak = 1;
    ST.lastActivity = td;
  }
  saveState();
  if (typeof renderXP === 'function') renderXP();
  if (typeof toast === 'function') toast('+' + amount + ' XP — ' + label);
  if (newRank.name !== prevRank.name) {
    setTimeout(() => { if (typeof showRankUp === 'function') showRankUp(newRank); }, 400);
  }
}

// Atualiza header (XP, patente, streak, contagem regressiva, progresso global)
function renderXP() {
  const xp = ST.xp || 0;
  const rank = getRank(xp);
  const prog = getRankProgress(xp);
  const left = getRankXpLeft(xp);
  const badge = document.getElementById('xp-lvl');
  if (badge) {
    badge.className = 'rank-badge ' + rank.cls;
    badge.textContent = rank.ico + ' ' + rank.name;
  }
  const fill = document.getElementById('xp-fill');
  if (fill) fill.style.width = prog + '%';
  const txt = document.getElementById('xp-txt');
  if (txt) txt.textContent = rank.next ? left + ' XP p/ ' + RANKS[RANKS.indexOf(rank) + 1].name : xp + ' XP (Max)';
  const sb = document.getElementById('streak-badge');
  if (sb) sb.textContent = '🔥 ' + (ST.streak || 0);

  // Contagem regressiva
  const ex = parseDate(ST.examDate || DEFAULT_EXAM_DATE);
  const n = parseDate(today());
  const diff = Math.round((ex - n) / 86400000);
  const hcd = document.getElementById('hcd');
  if (hcd) hcd.textContent = diff > 0 ? diff : 'HOJE!';
  const provaLbl = document.getElementById('hdr-prova-date');
  if (provaLbl) {
    const ed = ST.examDate || DEFAULT_EXAM_DATE;
    const [y, m, d] = ed.split('-');
    provaLbl.textContent = d + '/' + m + '/' + y;
  }

  // Barra de progresso global do edital
  const concl = TOPICS.filter(t => getTopicState(t.id).completedDate).length;
  const pct = Math.round(concl / TOPICS.length * 100);
  const gp = document.getElementById('global-progress-fill');
  if (gp) gp.style.width = pct + '%';
  const gpl = document.getElementById('global-progress-lbl');
  if (gpl) gpl.textContent = 'Edital: ' + pct + '%';
}

// Toast genérico
let _toastTimer = null;
function toast(msg, kind) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'toast show' + (kind === 'warn' ? ' warn' : '');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.className = 'toast' + (kind === 'warn' ? ' warn' : ''), 2800);
}

function showRankUp(rank) {
  let el = document.getElementById('rank-up-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'rank-up-toast';
    el.className = 'rank-up-toast';
    document.body.appendChild(el);
  }
  el.innerHTML = `<div class="rut-ico">${rank.ico}</div><div class="rut-title">PROMOVIDO!</div><div class="rut-sub">Voce e agora <strong>${rank.name}</strong></div>`;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

// ─── Migração de dados antigos (cbmmg_q2) ────────────────────
// Tenta importar sessões do app antigo de questões para ST.questoes
function migrateQuestoesLegado() {
  if (ST.questoesMigrated) return;
  let legado = null;
  try { legado = localStorage.getItem('cbmmg_q2'); } catch (e) {}
  if (!legado) { ST.questoesMigrated = true; saveState(); return; }
  let arr = [];
  try { arr = JSON.parse(legado) || []; } catch (e) {}
  if (!Array.isArray(arr) || !arr.length) { ST.questoesMigrated = true; saveState(); return; }

  // Fuzzy match texto livre -> topicId
  function fuzzyMatchTopic(mat, livre) {
    const candidatos = TOPICS.filter(t => t.mat === mat);
    const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const livreN = norm(livre);
    if (!livreN) return null;
    let best = null, bestScore = 0;
    candidatos.forEach(t => {
      const nomeN = norm(t.nome);
      const codN = norm(t.cod);
      // pontuação: substring match
      let score = 0;
      if (nomeN.includes(livreN) || livreN.includes(nomeN)) score = livreN.length * 2;
      else {
        // palavras em comum
        const wL = livreN.split(/\W+/).filter(Boolean);
        const wN = nomeN.split(/\W+/).filter(Boolean);
        wL.forEach(w => { if (w.length >= 3 && wN.some(x => x.includes(w) || w.includes(x))) score += w.length; });
      }
      if (codN.includes(livreN)) score += 5;
      if (score > bestScore) { bestScore = score; best = t; }
    });
    return bestScore >= 4 ? best.id : null;
  }

  if (!ST.questoes) ST.questoes = [];
  let imported = 0;
  arr.forEach(s => {
    const topicId = s.mat ? fuzzyMatchTopic(s.mat, s.topico) : null;
    ST.questoes.push({
      id: 'qm_' + (s.id || Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
      ts: s.ts || Date.now(),
      date: s.date || new Date().toLocaleDateString('pt-BR'),
      mat: s.mat,
      topicId,
      topicoLivre: topicId ? null : (s.topico || null),
      tipo: s.tipo || 'aula',
      tot: s.tot || 0,
      ac: s.ac || 0,
      sessions: s.sessions || 1
    });
    imported++;
  });
  ST.questoesMigrated = true;
  saveState();
  if (imported > 0 && typeof toast === 'function') {
    setTimeout(() => toast(imported + ' sessoes importadas do app antigo'), 600);
  }
}
