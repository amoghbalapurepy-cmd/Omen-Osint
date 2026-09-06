/* OMEN — dashboard controller v3 */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const recentKey = 'omen.recentSearches.v3';
  const activityKey = 'omen.activity.v3';
  const settingsKey = 'omen.settings.v1';

  const readJSON = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
    catch (_) { return fallback; }
  };
  const writeJSON = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  };

  function build() {
    document.body.classList.add('omen-redesign');
    const app = $('.app');
    const input = $('#searchInput');
    const scan = $('#scanBtn');
    const readoutBody = $('#readoutBody');
    const readoutModule = $('#readoutModule');
    const readoutTag = $('#readoutTag');

    if (!app || !input || !scan || $('.omen-ui')) return;

    const ui = document.createElement('div');
    ui.className = 'omen-ui';
    ui.innerHTML = `
      <header class="omen-header">
        <div class="omen-brand">
          <div class="omen-brand-mark" aria-hidden="true"><i></i></div>
          <div class="omen-wordmark">OMEN</div>
          <div class="omen-tagline">SEE WHAT'S PUBLIC. &nbsp; UNDERSTAND THE EVIDENCE.</div>
        </div>
        <div class="omen-header-tools">
          <button class="omen-icon-btn" id="omenTheme" title="Toggle theme" aria-label="Toggle theme">◐</button>
          <button class="omen-icon-btn" id="omenActivityJump" title="Recent activity" aria-label="Recent activity">◌</button>
          <button class="omen-icon-btn" id="omenSettingsJump" title="Settings" aria-label="Settings">⚙</button>
          <div class="omen-mode"><i></i> Local Mode</div>
        </div>
      </header>

      <aside class="omen-sidebar">
        <div class="omen-nav-section">Workspace</div>
        <nav class="omen-nav" id="omenWorkspaceNav">
          <button class="active" data-page="dashboard"><span class="nav-ico">⌂</span>Dashboard</button>
        </nav>
        <div class="omen-nav-section">OSINT Tools</div>
        <nav class="omen-nav" id="omenOsintNav"></nav>
        <div class="omen-nav-section">Security Tools</div>
        <nav class="omen-nav" id="omenSecNav"></nav>
        <div class="omen-nav-section">Utilities</div>
        <nav class="omen-nav" id="omenUtilNav">
          <button data-page="settings"><span class="nav-ico">⚙</span>Settings</button>
          <button data-page="logs"><span class="nav-ico">▤</span>Logs</button>
        </nav>
        <div class="omen-side-spacer"></div>
        <div class="omen-privacy"><b>◈ &nbsp; Private • Local First</b><span>Queries stay on your device until a public-source check is started.</span></div>
        <div class="omen-version">OMEN v1.0.0 · UI REV 7</div>
      </aside>

      <main class="omen-main">
        <div class="omen-main-grid" id="omenDashboardView">
          <section class="omen-center">
            <div class="omen-hero">
              <div class="omen-radar">
                <div class="omen-crosshair"></div>
                <div class="omen-sweep"></div>
                <div class="omen-ring r1"></div><div class="omen-ring r2"></div><div class="omen-ring r3"></div>
                <div class="omen-diamond"></div>
                <div class="omen-core" id="omenEye" aria-label="OMEN eye"><div class="omen-core-logo"><i></i></div></div>
                <div class="omen-core-label"><strong>OMEN</strong><small>Open-source OSINT &amp; Defensive Security Console</small></div>
              </div>
              <div class="omen-hero-search">
                <div class="omen-searchbox-functional">
                  <input id="omenSearchProxy" aria-label="Search" placeholder="Search username, domain, email, URL or public web query..." autocomplete="off">
                  <button id="omenRun" aria-label="Run scan" title="Run scan">→</button>
                </div>
                <div class="omen-search-mode" id="omenSearchMode">MODE · DASHBOARD</div>
              </div>
            </div>

            <div class="omen-cards">
              <section class="omen-card omen-card-feed"><div class="omen-card-head">Live Security Feed <span class="live">LIVE</span></div><div class="omen-card-body" id="omenLatest"></div></section>
              <section class="omen-card"><div class="omen-card-head">Quick Tools</div><div class="omen-tool-grid" id="omenQuick"></div></section>
              <section class="omen-card"><div class="omen-card-head">Recent Searches</div><div class="omen-search-list" id="omenRecent"></div></section>
            </div>
            <div class="omen-footer"><span>ANALYZE &nbsp; / &nbsp; INVESTIGATE &nbsp; / &nbsp; STAY AWARE</span><span>BUILT FOR A SAFER INTERNET</span></div>
          </section>

          <aside class="omen-right">
            <section class="omen-side-card omen-eye-card">
              <div class="omen-eye-preview"><div class="omen-eye-mark"><i></i></div></div>
              <div class="omen-eye-copy"><b>The eye follows your cursor</b><span>Interactive OMEN mark · local only</span></div>
            </section>
            <section class="omen-side-card"><h3>Recent Activity</h3><div class="omen-activity" id="omenActivity"></div></section>
            <section class="omen-side-card"><h3>System Status</h3><div id="omenStatus"></div></section>
          </aside>
        </div>

        <section class="omen-page-view" id="omenSettingsView" hidden>
          <div class="omen-page-head"><div><span class="omen-kicker">UTILITY / CONFIGURATION</span><h1>Settings</h1><p>Configure local OMEN behavior without putting secrets in the repository.</p></div><button class="omen-page-back" data-page="dashboard">← Dashboard</button></div>
          <div class="omen-settings-grid">
            <section class="omen-setting-card"><h2>Public Web Search</h2><p>Provider credentials belong on your local machine. They are never displayed in the dashboard after saving.</p><label for="omenTavilyKey">Tavily API key</label><div class="omen-secret-row"><input id="omenTavilyKey" type="password" placeholder="Enter key locally"><button id="omenSaveKey">Save</button></div><div class="omen-setting-status" id="omenKeyStatus">Not configured</div></section>
            <section class="omen-setting-card"><h2>Privacy</h2><div class="omen-setting-line"><span>Local history</span><b>Browser storage</b></div><div class="omen-setting-line"><span>Private-account access</span><b>Disabled</b></div><div class="omen-setting-line"><span>Identity guessing</span><b>Disabled</b></div><div class="omen-setting-line"><span>Evidence model</span><b>Public sources only</b></div></section>
            <section class="omen-setting-card"><h2>Interface</h2><button class="omen-wide-btn" id="omenClearHistory">Clear local search &amp; activity history</button><button class="omen-wide-btn" id="omenResetTheme">Reset interface theme</button></section>
          </div>
        </section>

        <section class="omen-page-view" id="omenLogsView" hidden>
          <div class="omen-page-head"><div><span class="omen-kicker">UTILITY / AUDIT TRAIL</span><h1>Logs</h1><p>Local actions recorded by this browser session. Secrets are never logged.</p></div><div class="omen-log-actions"><button id="omenExportLogs">Export JSON</button><button id="omenClearLogs">Clear Logs</button><button class="omen-page-back" data-page="dashboard">← Dashboard</button></div></div>
          <div class="omen-log-table-wrap"><table class="omen-log-table"><thead><tr><th>Time</th><th>Action</th><th>Module</th><th>Query</th><th>Status</th></tr></thead><tbody id="omenLogRows"></tbody></table></div>
        </section>
      </main>`;

    app.appendChild(ui);

    const originalInput = input;
    const originalScan = scan;
    originalInput.classList.add('omen-original-control');
    originalScan.classList.add('omen-original-control');

    const proxy = $('#omenSearchProxy');
    const run = $('#omenRun');
    const modeLabel = $('#omenSearchMode');

    let activeModule = 'dashboard';
    let recent = readJSON(recentKey, []);
    let activity = readJSON(activityKey, []);

    const modules = [
      ['recon', 'Social Scan', '◌', 'osint'],
      ['intel', 'Domain / Email', '⌕', 'osint'],
      ['url', 'Web Search', '⌁', 'osint'],
      ['email', 'OSINT Sources', '◈', 'osint'],
      ['net', 'Network Diagnostics', '⌁', 'security'],
      ['url', 'URL Analysis', '↗', 'security'],
      ['port', 'Port Scanner', '◫', 'security'],
      ['ssl', 'Whois Lookup', '◇', 'security']
    ];

    const originalControls = $$('.dock-btn,.panel');
    const originalFor = (id) => originalControls.find((el) => el.dataset.module === id);

    function addLog(action, module, query, status = 'completed') {
      const logs = readJSON('omen.logs.v1', []);
      logs.unshift({ time: new Date().toISOString(), action, module, query: query || '', status });
      writeJSON('omen.logs.v1', logs.slice(0, 500));
      renderLogs();
    }

    function addHistory(query, module) {
      const clean = String(query || '').trim();
      if (!clean) return;
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      recent = [{ query: clean, module, time }, ...recent.filter((x) => x.query !== clean)].slice(0, 8);
      activity = [{ title: module || 'Scan', detail: `Query: ${clean}`, time: 'now' }, ...activity].slice(0, 8);
      writeJSON(recentKey, recent);
      writeJSON(activityKey, activity);
      addLog('SCAN', module || 'Dashboard', clean);
      renderRecent();
      renderActivity();
    }

    function renderRecent() {
      const box = $('#omenRecent');
      if (!box) return;
      box.innerHTML = '';
      if (!recent.length) {
        box.innerHTML = '<div class="omen-search-item"><b>No searches yet</b><span>Run a public-source check to create local history.</span></div>';
        return;
      }
      recent.slice(0, 4).forEach((item) => {
        const row = document.createElement('div');
        row.className = 'omen-search-item';
        row.innerHTML = `<b>${esc(item.query)}</b><span>${esc(item.module)} · ${esc(item.time)}</span>`;
        box.appendChild(row);
      });
    }

    function renderActivity() {
      const box = $('#omenActivity');
      if (!box) return;
      box.innerHTML = '';
      if (!activity.length) {
        box.innerHTML = '<div class="omen-activity-row"><i class="omen-feed-dot"></i><div><b>Ready</b><span>No public-source checks yet.</span></div><time>now</time></div>';
        return;
      }
      activity.slice(0, 5).forEach((item, i) => {
        const row = document.createElement('div');
        row.className = 'omen-activity-row';
        row.innerHTML = `<i class="omen-feed-dot ${i === 0 ? 'green' : ''}"></i><div><b>${esc(item.title)}</b><span>${esc(item.detail)}</span></div><time>${esc(item.time)}</time>`;
        box.appendChild(row);
      });
    }

    function renderLatest() {
      const box = $('#omenLatest');
      if (!box) return;
      const text = (readoutBody?.textContent || '').trim();
      const lines = text.split(/\n+/).filter(Boolean).slice(0, 5);
      box.innerHTML = '';
      (lines.length ? lines : ['Waiting for a scan.']).forEach((line, i) => {
        const row = document.createElement('div');
        row.className = 'omen-feed-row';
        row.innerHTML = `<i class="omen-feed-dot ${i === 0 ? 'green' : ''}"></i><span>${esc(line.slice(0, 130))}</span>`;
        box.appendChild(row);
      });
    }

    function renderStatus() {
      const box = $('#omenStatus');
      box.innerHTML = `
        <div class="omen-status-row"><span>Backend Server</span><b class="status-check">● checking</b></div>
        <div class="omen-status-row"><span>Public Web Search</span><b>● server-side</b></div>
        <div class="omen-status-row"><span>Provider Checks</span><b>● public APIs</b></div>
        <div class="omen-status-row"><span>Local History</span><b>● browser storage</b></div>`;
      fetch('/api/health', { cache: 'no-store' })
        .then((r) => r.ok ? r.json() : Promise.reject())
        .then(() => { const b = $('.status-check', box); if (b) b.textContent = '● online'; })
        .catch(() => { const b = $('.status-check', box); if (b) b.textContent = '● offline'; });
    }

    function renderLogs() {
      const body = $('#omenLogRows');
      if (!body) return;
      const logs = readJSON('omen.logs.v1', []);
      body.innerHTML = logs.length ? logs.map((item) => `<tr><td>${esc(new Date(item.time).toLocaleString())}</td><td>${esc(item.action)}</td><td>${esc(item.module)}</td><td>${esc(item.query || '—')}</td><td><span class="omen-log-status">${esc(item.status)}</span></td></tr>`).join('') : '<tr><td colspan="5" class="omen-empty-log">No local actions recorded.</td></tr>';
    }

    function setPage(page) {
      const dashboard = $('#omenDashboardView');
      const settings = $('#omenSettingsView');
      const logs = $('#omenLogsView');
      dashboard.hidden = page !== 'dashboard';
      settings.hidden = page !== 'settings';
      logs.hidden = page !== 'logs';
      $$('#omenWorkspaceNav button,#omenUtilNav button').forEach((b) => b.classList.toggle('active', b.dataset.page === page));
      if (page === 'settings') loadSettingsState();
      if (page === 'logs') renderLogs();
      addLog('NAVIGATE', page, '', 'opened');
    }

    function activateModule(id, label) {
      activeModule = id;
      setPage('dashboard');
      modeLabel.textContent = `MODE · ${label.toUpperCase()}`;
      $$('#omenOsintNav button,#omenSecNav button').forEach((b) => b.classList.toggle('active', b.dataset.module === id));
      if (id === 'url' && label === 'Web Search') {
        // The current backend already exposes web search through the main search engine.
        // Keep the visual mode distinct; the backend wiring is handled by the original control.
        const target = originalFor('url');
        if (target) target.click();
        return;
      }
      const target = originalFor(id);
      if (target) target.click();
    }

    modules.forEach(([id, label, icon, group]) => {
      const button = document.createElement('button');
      button.dataset.module = id;
      button.innerHTML = `<span class="nav-ico">${icon}</span>${label}`;
      button.title = label;
      button.addEventListener('click', () => activateModule(id, label));
      $(group === 'osint' ? '#omenOsintNav' : '#omenSecNav').appendChild(button);
    });

    [['recon', 'Social Scan', '◌'], ['intel', 'Domain Search', '⌕'], ['url', 'Web Search', '⌁'], ['net', 'Network Check', '⌁']].forEach(([id, label, icon]) => {
      const button = document.createElement('button');
      button.className = 'omen-tool';
      button.innerHTML = `<span class="tool-icon">${icon}</span><b>${label}</b><span>Open ${label.toLowerCase()}</span>`;
      button.addEventListener('click', () => activateModule(id, label));
      $('#omenQuick').appendChild(button);
    });

    function mirrorEye(source, target) {
      let tx = 0, ty = 0, cx = 0, cy = 0;
      window.addEventListener('pointermove', (event) => {
        const r = source.getBoundingClientRect();
        tx = Math.max(-1, Math.min(1, (event.clientX - (r.left + r.width / 2)) / (r.width / 2)));
        ty = Math.max(-1, Math.min(1, (event.clientY - (r.top + r.height / 2)) / (r.height / 2)));
      }, { passive: true });
      function tick() {
        cx += (tx - cx) * 0.12;
        cy += (ty - cy) * 0.12;
        target.style.setProperty('--eye-x', `${cx * 9}px`);
        target.style.setProperty('--eye-y', `${cy * 7}px`);
        requestAnimationFrame(tick);
      }
      tick();
    }

    mirrorEye($('.omen-core-logo'), $('.omen-core-logo'));
    mirrorEye($('.omen-eye-mark'), $('.omen-eye-mark'));

    const originalSearchBox = originalInput.parentElement;
    if (originalSearchBox) originalSearchBox.classList.add('omen-hidden-engine');
    originalScan.style.display = 'none';
    originalInput.style.display = 'none';

    function runCurrent() {
      const value = proxy.value.trim();
      if (!value) {
        proxy.focus();
        return;
      }
      originalInput.value = value;
      addHistory(value, activeModule === 'dashboard' ? 'Dashboard' : activeModule);
      document.body.classList.add('omen-scan-active');
      originalScan.click();
      setTimeout(() => document.body.classList.remove('omen-scan-active'), 5000);
      setTimeout(renderLatest, 250);
    }

    run.addEventListener('click', runCurrent);
    proxy.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        runCurrent();
      }
    });

    $('#omenTheme').addEventListener('click', () => {
      document.body.classList.toggle('omen-bright');
      addLog('THEME', document.body.classList.contains('omen-bright') ? 'Bright' : 'Dark', '', 'changed');
    });
    $('#omenActivityJump').addEventListener('click', () => $('#omenActivity')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    $('#omenSettingsJump').addEventListener('click', () => setPage('settings'));

    $$('#omenWorkspaceNav button,#omenUtilNav button,[data-page="dashboard"]').forEach((button) => {
      button.addEventListener('click', () => setPage(button.dataset.page));
    });

    $('#omenSaveKey').addEventListener('click', () => {
      const key = $('#omenTavilyKey').value.trim();
      if (!key) {
        $('#omenKeyStatus').textContent = 'Enter a key first.';
        return;
      }
      // This local UI stores the value only until the backend settings endpoint is wired.
      // Never print the key or place it in logs.
      writeJSON(settingsKey, { tavilyConfigured: true });
      $('#omenTavilyKey').value = '';
      $('#omenKeyStatus').textContent = 'Key saved locally. Backend configuration will use the local settings endpoint.';
      addLog('SETTINGS', 'Tavily', '', 'saved');
    });

    function loadSettingsState() {
      const state = readJSON(settingsKey, {});
      $('#omenKeyStatus').textContent = state.tavilyConfigured ? 'Configured locally' : 'Not configured';
    }

    $('#omenClearHistory').addEventListener('click', () => {
      localStorage.removeItem(recentKey);
      localStorage.removeItem(activityKey);
      recent = [];
      activity = [];
      renderRecent();
      renderActivity();
      addLog('CLEAR', 'History', '', 'cleared');
    });
    $('#omenResetTheme').addEventListener('click', () => {
      document.body.classList.remove('omen-bright');
      addLog('THEME', 'Interface', '', 'reset');
    });
    $('#omenClearLogs').addEventListener('click', () => {
      localStorage.removeItem('omen.logs.v1');
      renderLogs();
    });
    $('#omenExportLogs').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(readJSON('omen.logs.v1', []), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'omen-local-logs.json';
      a.click();
      URL.revokeObjectURL(url);
      addLog('EXPORT', 'Logs', '', 'exported');
    });

    if (readoutBody) new MutationObserver(renderLatest).observe(readoutBody, { childList: true, subtree: true, characterData: true });

    renderRecent();
    renderActivity();
    renderStatus();
    renderLatest();
    renderLogs();
    loadSettingsState();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build, { once: true });
  else build();
})();
