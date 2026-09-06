(function(){
  'use strict';
  const q=(s,root=document)=>root.querySelector(s);
  const qa=(s,root=document)=>[...root.querySelectorAll(s)];
  function build(){
    document.body.classList.add('omen-redesign');
    const app=q('.app'); if(!app||q('.omen-ui')) return;
    const input=q('#searchInput'), scan=q('#scanBtn'), readoutBody=q('#readoutBody'), readoutModule=q('#readoutModule'), readoutTag=q('#readoutTag'), readoutLinks=q('#readoutLinks');
    const ui=document.createElement('div'); ui.className='omen-ui';
    ui.innerHTML=`
      <header class="omen-header">
        <div class="omen-brand"><div class="omen-wordmark">OM<span>E</span>N</div><div class="omen-tagline">SEE WHAT'S PUBLIC. &nbsp; UNDERSTAND THE EVIDENCE.</div></div>
        <div class="omen-header-tools"><button class="omen-icon-btn" title="Toggle visual theme" id="omenTheme">◐</button><button class="omen-icon-btn" title="Activity">♧</button><button class="omen-icon-btn" title="Settings">⚙</button><div class="omen-mode"><i></i> Local Mode</div></div>
      </header>
      <aside class="omen-sidebar">
        <div class="omen-nav-section">Workspace</div><nav class="omen-nav"><button class="active" data-target="dashboard"><span class="nav-ico">⌂</span>Dashboard</button></nav>
        <div class="omen-nav-section">OSINT Tools</div><nav class="omen-nav" id="omenOsintNav"></nav>
        <div class="omen-nav-section">Security Tools</div><nav class="omen-nav" id="omenSecNav"></nav>
        <div class="omen-nav-section">Utilities</div><nav class="omen-nav"><button data-target="settings"><span class="nav-ico">⚙</span>Settings</button><button data-target="logs"><span class="nav-ico">▤</span>Logs</button></nav>
        <div class="omen-side-spacer"></div><div class="omen-privacy"><b>◈ &nbsp; Private • Local First</b><span>Your data stays on your device. Public-source queries run only when you start a check.</span></div><div class="omen-version">OMEN v1.0.0 · UI REV 5</div>
      </aside>
      <main class="omen-main"><div class="omen-main-grid"><section class="omen-center">
        <div class="omen-hero"><div class="omen-radar"><div class="omen-sweep"></div><div class="omen-ring r1"></div><div class="omen-ring r2"></div><div class="omen-ring r3"></div><div class="omen-diamond"></div><div class="omen-core" id="omenEye"><div class="omen-core-logo"></div></div><div class="omen-core-label"><strong>O M <span>E</span> N</strong><small>Open-source OSINT & Defensive Security Console</small></div></div><div class="omen-hero-search"></div></div>
        <div class="omen-action-row" id="omenActions"></div>
        <div class="omen-cards"><section class="omen-card"><div class="omen-card-head">Latest Scan Results <span class="live">LIVE</span></div><div class="omen-card-body" id="omenLatest"></div></section><section class="omen-card"><div class="omen-card-head">Quick Tools</div><div class="omen-tool-grid" id="omenQuick"></div></section><section class="omen-card"><div class="omen-card-head">Recent Searches</div><div class="omen-search-list" id="omenRecent"></div></section></div>
        <div class="omen-footer"><span>ANALYZE &nbsp; / &nbsp; INVESTIGATE &nbsp; / &nbsp; STAY AWARE</span><span>BUILT FOR A SAFER INTERNET</span></div>
      </section><aside class="omen-right"><section class="omen-side-card"><h3>System Status</h3><div id="omenStatus"></div></section><section class="omen-side-card"><h3>Recent Activity</h3><div class="omen-activity" id="omenActivity"></div></section><section class="omen-side-card"><div class="omen-quote"><p>Evidence first. No fabricated profiles. No private-account access. No identity guessing.</p><small>— OMEN</small></div></section></aside></div></main>`;
    app.appendChild(ui);

    const oldSearch=input.parentElement; const box=document.createElement('div'); box.className='omen-searchbox-functional'; box.append(input,scan); q('.omen-hero-search').appendChild(box); if(oldSearch&&oldSearch!==box) oldSearch.remove();
    const originalControls=qa('.dock-btn,.panel'); const findOriginal=id=>originalControls.find(el=>el.dataset.module===id);
    const modules=[['recon','Social Scan','◌','osint'],['email','Password / Breach','◈','osint'],['intel','Domain / Email','✉','osint'],['url','Web / URL Safety','⌁','osint'],['geo','Geolocation','◎','security'],['net','Network Diagnostics','⌁','security'],['port','Reachability & Latency','◫','security'],['ssl','SSL / Cert History','◇','security']];
    function activate(id){const t=findOriginal(id);if(t)t.click();qa('#omenOsintNav button,#omenSecNav button').forEach(b=>b.classList.toggle('active',b.dataset.module===id));qa('.omen-action').forEach(b=>b.classList.toggle('active',b.dataset.module===id));}
    modules.forEach(([id,label,icon,group])=>{const b=document.createElement('button');b.dataset.module=id;b.innerHTML=`<span class="nav-ico">${icon}</span>${label}`;b.onclick=()=>activate(id);q(group==='osint'?'#omenOsintNav':'#omenSecNav').appendChild(b);});
    [['recon','Social Scan'],['geo','IP / Geo'],['intel','Domain Search'],['url','URL Check']].forEach(([id,label])=>{const b=document.createElement('button');b.className='omen-action';b.dataset.module=id;b.textContent=label;b.onclick=()=>activate(id);q('#omenActions').appendChild(b)});
    [['recon','Social Scan','Find public mentions'],['net','Network Check','Test your connection'],['url','URL Analysis','Check public signals'],['ssl','SSL History','Review certificates']].forEach(([id,title,sub])=>{const b=document.createElement('button');b.className='omen-tool';b.innerHTML=`<span style="font-size:17px;color:var(--omen-cyan)">◈</span><b>${title}</b><span>${sub}</span>`;b.onclick=()=>activate(id);q('#omenQuick').appendChild(b)});

    // The cyan diamond is OMEN's eye. It follows the pointer with spring smoothing.
    const eye=q('.omen-core-logo'); let tx=0,ty=0,cx=0,cy=0;
    window.addEventListener('pointermove',e=>{const r=eye.getBoundingClientRect();tx=Math.max(-1,Math.min(1,(e.clientX-(r.left+r.width/2))/(r.width/2)));ty=Math.max(-1,Math.min(1,(e.clientY-(r.top+r.height/2))/(r.height/2)));},{passive:true});
    function eyeLoop(){cx+=(tx-cx)*.12;cy+=(ty-cy)*.12;eye.style.setProperty('--eye-x',`${cx*9}px`);eye.style.setProperty('--eye-y',`${cy*7}px`);requestAnimationFrame(eyeLoop)} eyeLoop();
    q('#omenTheme').onclick=()=>document.body.classList.toggle('omen-bright');

    // Mirror the real readout into a dashboard drawer without replacing the existing scan engine.
    const resultWindow=document.createElement('section'); resultWindow.className='omen-results'; resultWindow.innerHTML='<div class="omen-results-head"><span class="omen-results-title">QUERY OUTPUT</span><button class="omen-results-close">×</button></div><div class="omen-results-body"><pre></pre><div class="omen-results-links"></div></div>'; document.body.appendChild(resultWindow);
    const resultPre=q('pre',resultWindow), resultLinks=q('.omen-results-links',resultWindow); q('.omen-results-close',resultWindow).onclick=()=>resultWindow.classList.remove('open');
    function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
    function mirror(){resultPre.textContent=readoutBody.textContent||'';resultLinks.innerHTML='';qa('#readoutLinks a').forEach(a=>{const x=document.createElement('a');x.href=a.href;x.target='_blank';x.rel='noopener noreferrer';x.textContent=a.textContent;resultLinks.appendChild(x)});resultWindow.classList.add('open');q('.omen-results-title').textContent=(readoutModule.textContent||'QUERY OUTPUT')+' · '+(readoutTag.textContent||'STANDBY');updateCards();}
    const observer=new MutationObserver(()=>mirror()); observer.observe(readoutBody,{childList:true,subtree:true,characterData:true}); scan.addEventListener('click',()=>{document.body.classList.add('omen-scan-active');setTimeout(()=>document.body.classList.remove('omen-scan-active'),4500);setTimeout(mirror,80)});
    function updateCards(){const text=(readoutBody.textContent||'').trim();const latest=q('#omenLatest');latest.innerHTML='';const lines=text.split(/\n+/).filter(Boolean).slice(0,4);(lines.length?lines:['No scan yet. Run a module to populate evidence.']).forEach((line,i)=>{const row=document.createElement('div');row.className='omen-feed-row';row.innerHTML=`<i class="omen-feed-dot ${i===0?'green':i===1?'yellow':''}"></i><span>${esc(line.slice(0,96))}</span>`;latest.appendChild(row)});const recent=q('#omenRecent');recent.innerHTML='';const query=input.value.trim();(query?[query]:['Pokemon','example.com','8.8.8.8']).slice(0,4).forEach(x=>{const row=document.createElement('div');row.className='omen-search-item';row.innerHTML=`<b>${esc(x)}</b><span>${esc(readoutModule.textContent||'Dashboard')} · recent</span>`;recent.appendChild(row)});}
    [['Backend Server','Ready'],['Tavily API','Public-web search'],['Network Tools','Browser-guided'],['Local Storage','In-memory']].forEach(([a,b])=>{const row=document.createElement('div');row.className='omen-status-row';row.innerHTML=`<span>${a}</span><b>● ${b}</b>`;row.title=b;q('#omenStatus').appendChild(row)});
    [['Social Scan','Searching public sources…','2m ago'],['Network Check','Checking your connection…','5m ago'],['URL Analysis','Waiting for a URL…','8m ago'],['Domain Lookup','Waiting for a domain…','12m ago']].forEach(([a,b,c],i)=>{const row=document.createElement('div');row.className='omen-activity-row';row.innerHTML=`<i class="omen-feed-dot ${i===1?'green':''}"></i><div><b>${a}</b><span>${b}</span></div><time>${c}</time>`;q('#omenActivity').appendChild(row)});
    updateCards();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();
})();
