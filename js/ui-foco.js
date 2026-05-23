// ═══════════════════════════════════════════════
// UI-FOCO — timer real + pomodoro
// ═══════════════════════════════════════════════

let focoState = {
  running: false,
  paused: false,
  selectedMat: null,
  startTs: null,
  accumulated: 0,
  intervalId: null,
  // pomodoro
  pomoActive: false,
  pomoMode: 'foco', // 'foco' | 'pausa'
  pomoTargetSecs: 0
};

function getFocoSessions() { return ST.focoSessions || []; }
function saveFocoSessions(arr) { ST.focoSessions = arr; saveState(); }

function fmtSeconds(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return h + 'h ' + String(m).padStart(2, '0') + 'min';
  return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
}
function fmtSecondsClock(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
}
function getElapsed() {
  if (!focoState.running || !focoState.startTs) return focoState.accumulated;
  return focoState.accumulated + Math.floor((Date.now() - focoState.startTs) / 1000);
}
function getTodaySeconds() {
  const td = today();
  const base = getFocoSessions().filter(s => s.date === td && (focoState.selectedMat ? s.mat === focoState.selectedMat : true))
    .reduce((a, s) => a + s.seconds, 0);
  return base + (focoState.running && focoState.selectedMat ? getElapsed() : 0);
}
function getWeekSeconds() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return getFocoSessions().filter(s => new Date(s.date) >= monday).reduce((a, s) => a + s.seconds, 0);
}

function selectFocoMat(mat) {
  if (focoState.running) { toast('Pare o timer antes de trocar'); return; }
  focoState.selectedMat = mat;
  focoState.accumulated = 0;
  focoState.startTs = null;
  updateFocoUI();
}

function focoToggle() {
  if (!focoState.selectedMat) { toast('Selecione uma materia primeiro!'); return; }
  if (focoState.running) {
    focoState.accumulated = getElapsed();
    focoState.startTs = null;
    focoState.running = false;
    focoState.paused = true;
    clearInterval(focoState.intervalId);
  } else {
    focoState.startTs = Date.now();
    focoState.running = true;
    focoState.paused = false;
    if (focoState.pomoActive && !focoState.pomoTargetSecs) {
      _startPomodoroPhase('foco');
    }
    focoState.intervalId = setInterval(tickFoco, 1000);
  }
  updateFocoUI();
}

function focoStop() {
  if (!focoState.running && !focoState.paused) return;
  const secs = getElapsed();
  if (secs < 5) { focoReset(); return; }
  const sess = getFocoSessions();
  sess.push({
    id: 'fs_' + Date.now(),
    mat: focoState.selectedMat,
    seconds: secs,
    date: today(),
    startTs: focoState.startTs || Date.now() - secs * 1000,
    endTs: Date.now(),
    timeLabel: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  });
  saveFocoSessions(sess);
  clearInterval(focoState.intervalId);
  toast('Sessao salva! ' + fmtSeconds(secs) + ' de ' + MATS[focoState.selectedMat].l);
  focoReset();
  renderFocoStats();
  renderFocoLog();
}

function focoLap() {
  if (!focoState.running && !focoState.paused) return;
  const secs = getElapsed();
  if (secs < 5) return;
  const sess = getFocoSessions();
  sess.push({
    id: 'fs_' + Date.now(),
    mat: focoState.selectedMat,
    seconds: secs,
    date: today(),
    endTs: Date.now(),
    timeLabel: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    lap: true
  });
  saveFocoSessions(sess);
  focoState.accumulated = 0;
  focoState.startTs = Date.now();
  toast('Parcial salvo!');
  renderFocoStats();
  renderFocoLog();
}

function focoReset() {
  clearInterval(focoState.intervalId);
  focoState.running = false;
  focoState.paused = false;
  focoState.startTs = null;
  focoState.accumulated = 0;
  focoState.pomoTargetSecs = 0;
  updateFocoUI();
}

function tickFoco() {
  // pomodoro: countdown
  if (focoState.pomoActive && focoState.pomoTargetSecs > 0) {
    const elapsed = getElapsed();
    const left = focoState.pomoTargetSecs - elapsed;
    const el = document.getElementById('foco-clock');
    if (el) el.textContent = fmtSecondsClock(Math.max(0, left));
    if (left <= 0) {
      _onPomodoroEnd();
      return;
    }
  } else {
    const el = document.getElementById('foco-clock');
    if (el) el.textContent = fmtSecondsClock(getElapsed());
  }
  const siSess = document.getElementById('fsi-sess');
  const siHoje = document.getElementById('fsi-hoje');
  if (siSess) siSess.textContent = fmtSeconds(getElapsed());
  if (siHoje) siHoje.textContent = fmtSeconds(getTodaySeconds());
}

function updateFocoUI() {
  const clock = document.getElementById('foco-clock');
  const status = document.getElementById('foco-status');
  const btnPlay = document.getElementById('foco-btn-play');
  const btnStop = document.getElementById('foco-btn-stop');
  const btnLap = document.getElementById('foco-btn-lap');
  const matName = document.getElementById('foco-mat-name');
  const matDot = document.getElementById('foco-mat-dot');

  if (clock) {
    if (focoState.pomoActive && focoState.pomoTargetSecs > 0) {
      clock.textContent = fmtSecondsClock(Math.max(0, focoState.pomoTargetSecs - getElapsed()));
    } else {
      clock.textContent = fmtSecondsClock(getElapsed());
    }
    clock.className = 'foco-clock ' + (focoState.running ? 'running' : focoState.paused ? 'paused' : 'idle');
  }
  if (status) {
    status.className = 'foco-status-badge ' + (focoState.running ? 'running' : focoState.paused ? 'paused' : 'idle');
    status.textContent = focoState.running ? (focoState.pomoActive ? (focoState.pomoMode === 'foco' ? 'FOCO' : 'PAUSA') : 'ESTUDANDO') : focoState.paused ? 'PAUSADO' : 'PRONTO';
  }
  if (btnPlay) {
    btnPlay.textContent = focoState.running ? '⏸' : '▶';
    btnPlay.className = 'foco-btn-play' + (focoState.running ? ' running' : '');
  }
  const active = focoState.running || focoState.paused;
  if (btnStop) { btnStop.style.opacity = active ? '1' : '0.4'; btnStop.style.pointerEvents = active ? 'auto' : 'none'; }
  if (btnLap) { btnLap.style.opacity = active ? '1' : '0.4'; btnLap.style.pointerEvents = active ? 'auto' : 'none'; }

  if (focoState.selectedMat) {
    const mat = MATS[focoState.selectedMat];
    if (matName) matName.textContent = mat.l;
    if (matDot) matDot.style.background = mat.c;
  } else {
    if (matName) matName.textContent = 'Selecione uma materia acima';
    if (matDot) matDot.style.background = '#555';
  }
  document.querySelectorAll('.foco-mat-btn').forEach(b => b.classList.toggle('selected', b.dataset.mat === focoState.selectedMat));

  const siSess = document.getElementById('fsi-sess');
  const siHoje = document.getElementById('fsi-hoje');
  const siSem = document.getElementById('fsi-semana');
  if (siSess) siSess.textContent = fmtSeconds(getElapsed());
  if (siHoje) siHoje.textContent = fmtSeconds(getTodaySeconds());
  if (siSem) siSem.textContent = fmtSeconds(getWeekSeconds());

  // pomodoro buttons highlight
  ['pomo-off','pomo-25','pomo-50'].forEach(id => {
    const b = document.getElementById(id);
    if (!b) return;
    const map = { 'pomo-off': null, 'pomo-25': '25/5', 'pomo-50': '50/10' };
    b.style.background = (ST.pomodoroPreset === map[id]) ? 'linear-gradient(135deg,var(--rdk),var(--r))' : 'var(--bg4)';
    b.style.color = (ST.pomodoroPreset === map[id]) ? '#fff' : 'var(--txt)';
  });
}

function renderFocoMatGrid() {
  const grid = document.getElementById('foco-mat-grid');
  if (!grid) return;
  grid.innerHTML = Object.keys(MATS).map(m => `
    <button class="foco-mat-btn${focoState.selectedMat === m ? ' selected' : ''}" data-mat="${m}" onclick="selectFocoMat('${m}')">
      <span class="fmb-ico">${MATS[m].ico}</span>
      <span class="fmb-name">${MATS[m].l}</span>
    </button>`).join('');
}

function renderFocoStats() {
  const sess = getFocoSessions();
  const body = document.getElementById('foco-stats-body');
  const totalEl = document.getElementById('foco-total-time');
  if (!body) return;
  const byMat = {};
  sess.forEach(s => { if (!byMat[s.mat]) byMat[s.mat] = 0; byMat[s.mat] += s.seconds; });
  const total = Object.values(byMat).reduce((a, v) => a + v, 0);
  if (totalEl) totalEl.textContent = fmtSeconds(total) + ' total';
  const mats = Object.keys(byMat).sort((a, b) => byMat[b] - byMat[a]);
  if (!mats.length) { body.innerHTML = '<div style="text-align:center;padding:20px;color:var(--t3);font-size:12px">Nenhuma sessao registrada ainda.</div>'; return; }
  const maxSec = Math.max(...Object.values(byMat));
  body.innerHTML = mats.map(m => {
    const mat = MATS[m] || { l: m, ico: '📖', c: '#888' };
    const secs = byMat[m];
    const pct = Math.round(secs / maxSec * 100);
    return `<div class="foco-stat-mat-row">
      <div class="fsm-ico">${mat.ico}</div>
      <div class="fsm-info">
        <div class="fsm-name">${mat.l}</div>
        <div class="fsm-bar-bg"><div class="fsm-bar-fill" style="width:${pct}%;background:${mat.c}"></div></div>
      </div>
      <div class="fsm-time">${fmtSeconds(secs)}</div>
    </div>`;
  }).join('');
}

function renderFocoLog() {
  const sess = [...getFocoSessions()].sort((a, b) => (b.endTs || 0) - (a.endTs || 0));
  const body = document.getElementById('foco-log-body');
  if (!body) return;
  if (!sess.length) { body.innerHTML = '<div style="text-align:center;padding:16px;color:var(--t3);font-size:12px">Nenhuma sessao ainda.</div>'; return; }
  body.innerHTML = sess.slice(0, 30).map(s => {
    const mat = MATS[s.mat] || { l: s.mat, ico: '📖', c: '#888' };
    return `<div class="foco-log-item">
      <div class="fli-color" style="background:${mat.c}"></div>
      <div class="fli-info">
        <div class="fli-mat">${mat.ico} ${mat.l}${s.lap ? ' <span style="font-size:9px;background:rgba(212,175,55,.15);color:var(--gold2);padding:1px 5px;border-radius:3px">parcial</span>' : ''}</div>
        <div class="fli-date">${s.date} ${s.timeLabel || ''}</div>
      </div>
      <div class="fli-time">${fmtSeconds(s.seconds)}</div>
      <button class="fli-del" onclick="focoDelSession('${s.id}')">✕</button>
    </div>`;
  }).join('');
}

function focoDelSession(id) {
  saveFocoSessions(getFocoSessions().filter(s => s.id !== id));
  renderFocoStats(); renderFocoLog();
}

function focoClearLog() {
  if (!confirm('Apagar todo o historico de sessoes?')) return;
  saveFocoSessions([]);
  renderFocoStats(); renderFocoLog();
  toast('Historico apagado.');
}

function renderFoco() {
  renderFocoMatGrid();
  updateFocoUI();
  renderFocoStats();
  renderFocoLog();
}

// ─── Pomodoro ───────────────────────────────────
function pomoSet(preset) {
  ST.pomodoroPreset = preset;
  saveState();
  focoState.pomoActive = !!preset;
  focoState.pomoTargetSecs = 0;
  focoState.pomoMode = 'foco';
  toast(preset ? 'Pomodoro ' + preset : 'Pomodoro desligado');
  updateFocoUI();
}

function _startPomodoroPhase(mode) {
  const preset = ST.pomodoroPreset;
  if (!preset) return;
  const [foco, pausa] = preset.split('/').map(Number);
  focoState.pomoMode = mode;
  focoState.pomoTargetSecs = (mode === 'foco' ? foco : pausa) * 60;
  focoState.accumulated = 0;
  focoState.startTs = Date.now();
}

function _onPomodoroEnd() {
  // beep
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880; osc.type = 'sine';
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(); osc.stop(ctx.currentTime + 0.6);
  } catch (e) {}
  // notification
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      new Notification('CBMMG — Pomodoro', {
        body: focoState.pomoMode === 'foco' ? 'Hora da pausa!' : 'Voltar ao foco!',
        icon: 'icons/icon-192.png'
      });
    } catch (e) {}
  }
  // salva sessao se foco
  if (focoState.pomoMode === 'foco') {
    const secs = focoState.pomoTargetSecs;
    const sess = getFocoSessions();
    sess.push({
      id: 'fs_' + Date.now(), mat: focoState.selectedMat, seconds: secs,
      date: today(), endTs: Date.now(),
      timeLabel: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });
    saveFocoSessions(sess);
  }
  // alterna estado
  _startPomodoroPhase(focoState.pomoMode === 'foco' ? 'pausa' : 'foco');
  toast(focoState.pomoMode === 'foco' ? '🍅 Foco iniciado' : '☕ Pausa');
  updateFocoUI();
}
