// ═══════════════════════════════════════════════
// UI-CONFIG — configuracoes (data prova, horas, backup, tema, etc.)
// ═══════════════════════════════════════════════

function renderConfig() {
  const body = document.getElementById('config-body');
  if (!body) return;
  const examDate = ST.examDate || DEFAULT_EXAM_DATE;
  const dailyHours = ST.dailyHours || 3;
  const skipSundays = !!ST.skipSundays;
  const blocked = ST.blockedDays || [];
  const notif = !!ST.notificationsEnabled;
  const theme = ST.theme || 'dark';
  const pomo = ST.pomodoroPreset || '';

  body.innerHTML = `
    <div class="cfg-section">
      <div class="cfg-title">📅 Cronograma</div>
      <div class="cfg-row">
        <label class="cfg-label">Data da prova</label>
        <input type="date" class="cfg-input" id="cfg-exam-date" value="${examDate}" onchange="cfgSet('examDate', this.value)"/>
      </div>
      <div class="cfg-row">
        <label class="cfg-label">Horas/dia padrao</label>
        <input type="number" class="cfg-input" id="cfg-hours" min="0.5" max="12" step="0.5" value="${dailyHours}" onchange="cfgSet('dailyHours', parseFloat(this.value))" style="width:80px"/>
      </div>
      <div class="cfg-row">
        <label class="cfg-label">Pular domingos</label>
        <input type="checkbox" id="cfg-sundays" ${skipSundays ? 'checked' : ''} onchange="cfgSet('skipSundays', this.checked)"/>
      </div>
      <div class="cfg-row" style="display:block">
        <label class="cfg-label">Dias bloqueados (sem estudo)</label>
        <div style="display:flex;gap:6px;margin-top:8px">
          <input type="date" class="cfg-input" id="cfg-block-date" style="flex:1"/>
          <button class="cfg-btn primary" onclick="cfgAddBlocked()">+ Add</button>
        </div>
        <div class="cfg-blocked-list">
          ${blocked.length ? blocked.map(d => `<div class="cfg-blocked-item"><span>${fmtDate(d)} (${d})</span><button class="cfg-btn danger" style="margin-left:auto" onclick="cfgDelBlocked('${d}')">✕</button></div>`).join('') : '<div style="font-size:11px;color:var(--t3);padding:6px 0">Nenhum dia bloqueado.</div>'}
        </div>
      </div>
    </div>

    <div class="cfg-section">
      <div class="cfg-title">🍅 Pomodoro</div>
      <div class="cfg-row">
        <label class="cfg-label">Preset padrao</label>
        <select class="cfg-input" id="cfg-pomo" onchange="cfgSet('pomodoroPreset', this.value || null)">
          <option value="" ${!pomo ? 'selected' : ''}>Off</option>
          <option value="25/5" ${pomo === '25/5' ? 'selected' : ''}>25 / 5</option>
          <option value="50/10" ${pomo === '50/10' ? 'selected' : ''}>50 / 10</option>
        </select>
      </div>
    </div>

    <div class="cfg-section">
      <div class="cfg-title">🔔 Notificacoes</div>
      <div class="cfg-row">
        <label class="cfg-label">Status</label>
        <span style="font-size:11px;color:var(--t2)" id="cfg-notif-status">${typeof Notification !== 'undefined' ? Notification.permission : 'indisponivel'}</span>
      </div>
      <div class="cfg-row">
        <label class="cfg-label">Ativar lembretes</label>
        <button class="cfg-btn primary" onclick="cfgRequestNotif()">Permitir</button>
      </div>
      <div class="cfg-row">
        <label class="cfg-label">Habilitado</label>
        <input type="checkbox" id="cfg-notif" ${notif ? 'checked' : ''} onchange="cfgSet('notificationsEnabled', this.checked)"/>
      </div>
    </div>

    <div class="cfg-section">
      <div class="cfg-title">🎨 Tema</div>
      <div class="cfg-row">
        <label class="cfg-label">Aparencia</label>
        <select class="cfg-input" id="cfg-theme" onchange="cfgSetTheme(this.value)">
          <option value="dark" ${theme === 'dark' ? 'selected' : ''}>Escuro</option>
          <option value="light" ${theme === 'light' ? 'selected' : ''}>Claro</option>
        </select>
      </div>
    </div>

    <div class="cfg-section">
      <div class="cfg-title">💾 Backup</div>
      <div class="cfg-row">
        <label class="cfg-label">Exportar todos os dados (JSON)</label>
        <button class="cfg-btn primary" onclick="cfgExportJSON()">Exportar</button>
      </div>
      <div class="cfg-row">
        <label class="cfg-label">Importar JSON (sobrescreve)</label>
        <button class="cfg-btn" onclick="document.getElementById('cfg-import-file').click()">Importar</button>
        <input type="file" id="cfg-import-file" accept="application/json" style="display:none" onchange="cfgImportJSON(event)"/>
      </div>
    </div>

    <div class="cfg-section">
      <div class="cfg-title">⚠ Zona perigosa</div>
      <div class="cfg-row">
        <label class="cfg-label">Resetar XP / streak</label>
        <button class="cfg-btn danger" onclick="cfgResetXP()">Resetar XP</button>
      </div>
      <div class="cfg-row">
        <label class="cfg-label">Limpar TODOS os dados</label>
        <button class="cfg-btn danger" onclick="cfgWipeAll()">Limpar tudo</button>
      </div>
    </div>
  `;
}

function cfgSet(key, value) {
  ST[key] = value;
  saveState();
  toast('Configuracao salva');
  if (typeof renderXP === 'function') renderXP();
}

function cfgSetTheme(v) {
  ST.theme = v;
  document.documentElement.dataset.theme = v;
  saveState();
}

function cfgAddBlocked() {
  const inp = document.getElementById('cfg-block-date');
  if (!inp || !inp.value) return;
  if (!ST.blockedDays) ST.blockedDays = [];
  if (!ST.blockedDays.includes(inp.value)) ST.blockedDays.push(inp.value);
  ST.blockedDays.sort();
  saveState();
  inp.value = '';
  renderConfig();
}

function cfgDelBlocked(d) {
  ST.blockedDays = (ST.blockedDays || []).filter(x => x !== d);
  saveState();
  renderConfig();
}

function cfgRequestNotif() {
  if (typeof Notification === 'undefined') { toast('Notificacoes nao suportadas'); return; }
  Notification.requestPermission().then(p => {
    document.getElementById('cfg-notif-status').textContent = p;
    if (p === 'granted') { ST.notificationsEnabled = true; saveState(); toast('Notificacoes ativadas!'); renderConfig(); }
    else toast('Permissao negada', 'warn');
  });
}

// ─── Backup ─────────────────────────────────────
function cfgExportJSON() {
  const data = JSON.stringify(ST, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cbmmg-backup-' + today() + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('Backup exportado');
}

function cfgImportJSON(ev) {
  const f = ev.target.files[0];
  if (!f) return;
  if (!confirm('Importar este arquivo vai SOBRESCREVER seus dados atuais. Continuar?')) {
    ev.target.value = ''; return;
  }
  const r = new FileReader();
  r.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      ST = Object.assign(ST, data);
      saveState();
      toast('Importado!');
      if (typeof renderAll === 'function') renderAll();
      renderConfig();
    } catch (err) {
      toast('Arquivo invalido', 'warn');
    }
  };
  r.readAsText(f);
  ev.target.value = '';
}

function cfgResetXP() {
  if (!confirm('Resetar XP, patente e streak? (topicos e questoes serao mantidos)')) return;
  ST.xp = 0; ST.streak = 0; ST.lastActivity = null;
  saveState();
  if (typeof renderXP === 'function') renderXP();
  toast('XP resetado');
}

function cfgWipeAll() {
  if (!confirm('LIMPAR TODOS OS DADOS? Topicos, revisoes, questoes, foco — TUDO sera apagado.')) return;
  if (!confirm('Tem certeza? Esta acao NAO pode ser desfeita.')) return;
  try { localStorage.removeItem('cbmmg_cron2'); } catch (e) {}
  try { localStorage.removeItem('cbmmg_q2'); } catch (e) {}
  location.reload();
}
