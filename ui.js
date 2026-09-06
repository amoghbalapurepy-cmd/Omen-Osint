/* OMEN — reference dashboard behavior v2 */
(function(){
  'use strict';
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const iconMap={dashboard:'⌂',recon:'◌',email:'◈',intel:'⌕',url:'⌁',geo:'◎',net:'⌁',port:'◫',ssl:'◇',settings:'⚙',logs:'▤'};

  function build(){
    document.body.classList.add('omen-redesign');
    const app=q('.app');
    if(!app||q('.omen-ui'))return;

    const input=q('#searchInput'),scan=q('#scanBtn'),readoutBody=q('#readoutBody'),readoutModule=q('#readoutModule'),readoutTag=q('#readoutTag'),readoutLinks=q('#readoutLinks');
    if(!input||!scan)return;

    const ui=document.createElement('div');
    ui.className='omen-ui';
    ui.innerHTML=`
      <header class="omen-header">
        <div class="omen-brand">
          <div class="omen-brand-mark" aria-hidden="true"></div>
          <div class="omen-wordmark">OM<span>E</span>N</div>
          <div class="omen-tagline">SEE WHAT'S PUBLIC. &nbsp; UNDERSTAND THE EVIDENCE.</div>
        </div>
        <div class="omen-header-tools">
          <button class="omen-icon-btn" id="omenTheme" title="Toggle theme" aria-label="Toggle theme">◐</button>
          <button class="omen-icon-btn" id="omenActivityJump" title="Jump to recent activity" aria-label="Recent activity">◌</button>
          <button class="omen-icon-btn" id="omenSettingsJump" title="Open settings" aria-label="Settings">⚙</button>
          <div class="omen-mode"><i></i> Local Mode</div>
        </div>
      </header>

      <aside class="omen-sidebar">
        <div class="omen-nav-section">Workspace</div>
        <nav class="omen-nav" id="omenWorkspaceNav">
          <button class="active" data-target="dashboard"><span class="nav-ico">⌂</span>Dashboard</button>
        </nav>
        <div class="omen-nav-section">OSINT Tools</div><nav class="omen-nav" id="omenOsintNav"></nav>
        <div class="omen-nav-section">Security Tools</div><nav class="omen-nav" id="omenSecNav"></nav>
        <div class="omen-nav-section">Utilities</div>
        <nav class="omen-nav" id="omenUtilNav">
          <button data-target="settings"><span class="nav-ico">⚙</span>Settings</button>
          <button data-target="logs"><span class="nav-ico">▤</span>Logs</button>
        </nav>
        <div class="omen-side-spacer"></div>
        <div class="omen-privacy"><b>◈ &nbsp; Private • Local First</b><span>Your queries stay on your device until you start a public-source check.</span></div>
        <div class="omen-version">OMEN v1.0.0 · UI REV 6</div>
      </aside>

      <main class="omen-main">
        <div class="omen-main-grid">
          <section class="omen-center">
            <div class="omen-hero">
              <div class="omen-radar">
                <div class="omen-crosshair"></div><div class="omen-sweep"></div>
                <div class="omen-ring r1"></div><div class="omen-ring r2"></div><div class="omen-ring r3"></div>
                <div class="omen-diamond"></div>
                <div class="omen-core" id="omenEye" aria-label="OMEN eye"><div class="omen-core-logo"></div></div>
                <div class="omen-core-label"><strong>O M <span>E</span> N</strong><small>Open-source OSINT &amp; Defensive Security Console</small></div>
              </div>
              <div class="omen-hero-search"></div>
            </div>

            <div class="omen-action-row" id="omenActions"></div>

            <div class="omen-cards">
              <section class="omen-card"><div class="omen-card-head">Latest Scan Results <span class="live">LIVE</span></div><div class="omen-card-body" id="omenLatest"></div></section>
              <section class="omen-card"><div class="omen-card-head">Quick Tools</div><div class="omen-tool-grid" id="omenQuick"></div></section>
              <section class="omen-card"><div class="omen-card-head">Recent Searches</div><div class="omen-search-list" id="omenRecent"></div></section>
            </div>
            <div class="omen-footer"><span>ANALYZE &nbsp; / &nbsp; INVESTIGATE &nbsp; / &nbsp; STAY AWARE</span><span>BUILT FOR A SAFER INTERNET</span></div>
          </section>

          <aside class="omen-right">
            <section class="omen-side-card"><h3>System Status</h3><div id="omenStatus"></div></section>
            <section class="omen-side-card"><h3>Recent Activity</h3><div class="omen-activity" id="omenActivity"></div></section>
            <section class="omen-side-card"><div class="omen-quote"><p>Evidence first. No fabricated profiles. No private-account access. No identity guessing.</p><small>— OMEN</small></div></section>
          </aside>
        </div>
      </main>`;
    app.appendChild(ui);

    // Re-home the real search controls instead of cloning them, so the original engine remains authoritative.
    const searchBox=document.createElement('div');
    searchBox.className='omen-searchbox-functional';
    searchBox.append(input,scan);
    q('.omen-hero-search').appendChild(searchBox);

    const originalControls=qa('.dock-btn,.panel');
    const findOriginal=id=>originalControls.find(el=>el.dataset.module===id);
    const modules=[
      ['recon','Username Lookup','◌','osint'],
      ['intel','Domain / Email','⌕','osint'],
      ['url','Web Search','⌁','osint'],
      ['email','OSINT Sources','◈','osint'],
      ['net','Network Diagnostics','⌁','security'],
      ['url','URL Analysis','⌁','security'],
      ['port','Port Scanner','◫','security'],
      ['ssl','Whois Lookup','◇','security']
    ];

    function activate(id){
      const target=findOriginal(id);
      if(target)target.click();
      qa('#omenOsintNav button,#omenSecNav button').forEach(b=>b.classList.toggle('active',b.dataset.module===id));
      qa('.omen-action').forEach(b=>b.classList.toggle('active',b.dataset.module===id));
      if(id==='settings'||id==='logs'){
        const target2=qa('.dock-btn,.panel').find(el=>el.dataset.module===id);
        if(target2)target2.click();
      }
    }

    modules.forEach(([id,label,ico,group])=>{
      const b=document.createElement('button');b.dataset.module=id;b.innerHTML=`<span class="nav-ico">${ico}</span>${label}`;b.title=label;
      b.onclick=()=>activate(id);q(group==='osint'?'#omenOsintNav':'#omenSecNav').appendChild(b);
    });

    [['recon','Social Scan'],['intel','Domain Search'],['url','Web Search'],['net','Network Check']].forEach(([id,label])=>{
      const b=document.createElement('button');b.className='omen-action';b.dataset.module=id;b.textContent=label;b.onclick=()=>activate(id);q('#omenActions').appendChild(b);
    });

    [['recon','Social Scan','Public username signals','◌'],['intel','Domain / Email','Find public domain signals','⌕'],['url','URL Analysis','Inspect a public URL','⌁'],['net','Network Check','Test local connectivity','⌁']].forEach(([id,title,sub,ico])=>{
      const b=document.createElement('button');b.className='omen-tool';b.innerHTML=`<span class="tool-icon">${ico}</span><b>${title}</b><span>${sub}</span>`;b.onclick=()=>activate(id);q('#omenQuick').appendChild(b);
    });

    // Cursor-following eye.
    const eye=q('.omen-core-logo');let tx=0,ty=0,cx=0,cy=0;
    window.addEventListener('pointermove',e=>{const r=eye.getBoundingClientRect();tx=Math.max(-1,Math.min(1,(e.clientX-(r.left+r.width/2))/(r.width/2)));ty=Math.max(-1,Math.min(1,(e.clientY-(r.top+r.height/2))/(r.height/2)));},{passive:true});
    function eyeLoop(){cx+=(tx-cx)*.12;cy+=(ty-cy)*.12;eye.style.setProperty('--eye-x',`${cx*9}px`);eye.style.setProperty('--eye-y',`${cy*7}px`);requestAnimationFrame(eyeLoop)}eyeLoop();

    // Theme and utility shortcuts.
    q('#omenTheme').onclick=()=>document.body.classList.toggle('omen-bright');
    q('#omenActivityJump').onclick=()=>q('#omenActivity')?.scrollIntoView({behavior:'smooth',block:'center'});
    q('#omenSettingsJump').onclick=()=>activate('settings');
    qa('#omenWorkspaceNav button').forEach(b=>b.onclick=()=>{qa('#omenOsintNav button,#omenSecNav button').forEach(x=>x.classList.remove('active'));qa('.omen-action').forEach(x=>x.classList.remove('active'));});

    // Evidence drawer mirrors the existing scan engine's readout.
    const resultWindow=document.createElement('section');
    resultWindow.className='omen-results';
    resultWindow.innerHTML='<div class="omen-results-head"><span class="omen-results-title">QUERY OUTPUT</span><button class="omen-results-close" aria-label="Close results">×</button></div><div class="omen-results-body"><pre></pre><div class="omen-results-links"></div></div>';
    document.body.appendChild(resultWindow);
    const resultPre=q('pre',resultWindow),resultLinks=q('.omen-results-links',resultWindow);
    q('.omen-results-close',resultWindow).onclick=()=>resultWindow.classList.remove('open');

    const recentKey='omen.recentSearches.v2';
    const activityKey='omen.activity.v2';
    const readJSON=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch(_){return fallback}};
    const saveJSON=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch(_){} };
    let recent=readJSON(recentKey,[]),activity=readJSON(activityKey,[]);

    function renderRecent(){
      const box=q('#omenRecent');box.innerHTML='';
      const rows=recent.slice(0,4);
      if(!rows.length){box.innerHTML='<div class="omen-search-item"><b>No searches yet</b><span>Run a scan to create local history.</span></div>';return}
      rows.forEach(item=>{const row=document.createElement('div');row.className='omen-search-item';row.innerHTML=`<b>${esc(item.query)}</b><span>${esc(item.module||'Dashboard')} · ${esc(item.time||'recent')}</span>`;box.appendChild(row)});
    }
    function renderActivity(){
      const box=q('#omenActivity');box.innerHTML='';
      const rows=activity.slice(0,4);
      if(!rows.length){box.innerHTML='<div class="omen-activity-row"><i class="omen-feed-dot"></i><div><b>Ready</b><span>No checks have been run in this session.</span></div><time>now</time></div>';return}
      rows.forEach((item,i)=>{const row=document.createElement('div');row.className='omen-activity-row';row.innerHTML=`<i class="omen-feed-dot ${i===0?'green':''}"></i><div><b>${esc(item.title)}</b><span>${esc(item.detail||'Completed public-source check')}</span></div><time>${esc(item.time)}</time>`;box.appendChild(row)});
    }
    function addHistory(query,module){
      const clean=query.trim();if(!clean)return;
      const time=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
      recent=[{query:clean,module:module||'Dashboard',time},...recent.filter(x=>x.query!==clean)].slice(0,8);
      activity=[{title:module||'Scan',detail:`Query: ${clean}`,time:'now'},...activity].slice(0,8);
      saveJSON(recentKey,recent);saveJSON(activityKey,activity);renderRecent();renderActivity();
    }

    function updateCards(){
      const text=(readoutBody?.textContent||'').trim();const latest=q('#omenLatest');latest.innerHTML='';
      const lines=text.split(/\n+/).filter(Boolean).slice(0,4);
      (lines.length?lines:['No scan yet. Run a module to populate evidence.']).forEach((line,i)=>{const row=document.createElement('div');row.className='omen-feed-row';row.innerHTML=`<i class="omen-feed-dot ${i===0?'green':i===1?'yellow':''}"></i><span>${esc(line.slice(0,110))}</span>`;latest.appendChild(row)});
    }
    function mirror(){
      if(!readoutBody)return;
      resultPre.textContent=readoutBody.textContent||'';resultLinks.innerHTML='';
      qa('#readoutLinks a').forEach(a=>{const x=document.createElement('a');x.href=a.href;x.target='_blank';x.rel='noopener noreferrer';x.textContent=a.textContent||a.href;resultLinks.appendChild(x)});
      resultWindow.classList.add('open');
      q('.omen-results-title').textContent=`${readoutModule?.textContent||'QUERY OUTPUT'} · ${readoutTag?.textContent||'STANDBY'}`;
      updateCards();
    }
    if(readoutBody){new MutationObserver(()=>mirror()).observe(readoutBody,{childList:true,subtree:true,characterData:true});}
    scan.addEventListener('click',()=>{
      document.body.classList.add('omen-scan-active');
      addHistory(input.value,readoutModule?.textContent||'Scan');
      setTimeout(()=>document.body.classList.remove('omen-scan-active'),5000);
      setTimeout(mirror,120);
    });
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();scan.click()}});

    // Only show factual local/server capability state; no fabricated provider results.
    const status=q('#omenStatus');
    [['Backend Server','checking'],['Public Web Search','server-side'],['Provider Checks','public APIs'],['Local History','browser storage']].forEach(([label,value])=>{
      const row=document.createElement('div');row.className='omen-status-row';row.innerHTML=`<span>${label}</span><b>● ${value}</b>`;status.appendChild(row);
    });
    fetch('/api/health',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(()=>{const b=qa('.omen-status-row b',status)[0];if(b){b.textContent='● online';b.style.color='var(--omen-green)'}}).catch(()=>{const b=qa('.omen-status-row b',status)[0];if(b){b.textContent='● offline';b.style.color='var(--omen-red)'}});

    renderRecent();renderActivity();updateCards();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();
})();
