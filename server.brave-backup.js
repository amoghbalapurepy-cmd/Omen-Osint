const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 8787);
const ROOT = __dirname;
const INDEX = path.join(ROOT, 'index.html');
const UA = 'OMEN-OSINT/4.0 (public-profile-research; local-user-run)';

function send(res, status, body, type='application/json; charset=utf-8') {
  res.writeHead(status, {'Content-Type': type, 'Cache-Control':'no-store'});
  res.end(body);
}

async function getJson(url, timeout=8000, extraHeaders={}) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeout);
  try {
    const r = await fetch(url, {
      headers: { 'Accept':'application/json', 'User-Agent':UA, ...extraHeaders },
      signal: ac.signal,
      redirect: 'follow'
    });
    let data = null;
    try { data = await r.json(); } catch (_) {}
    return { ok:r.ok, status:r.status, data, finalUrl:r.url };
  } catch (e) {
    return { error: e && e.name === 'AbortError' ? 'timeout' : (e.message || 'network error') };
  } finally { clearTimeout(timer); }
}

function writeEvent(res, event) {
  res.write(JSON.stringify(event) + '\n');
}


function makeSearchQueries(input) {
  const q = input.trim();
  const queries = [];
  const add = x => { if (x && !queries.includes(x)) queries.push(x); };
  add('"' + q.replace(/"/g, '') + '"');
  add(q);
  // For handle-like input, search punctuation/spacing variants without claiming they are the same identity.
  if (/^[A-Za-z0-9._-]+$/.test(q)) {
    const normalized = q.replace(/[._-]+/g, ' ').trim();
    if (normalized && normalized !== q) add('"' + normalized + '"');
    add('@' + q);
  }
  return queries.slice(0, 4);
}

async function braveSearch(q, apiKey, count=20) {
  const endpoint = new URL('https://api.search.brave.com/res/v1/web/search');
  endpoint.searchParams.set('q', q);
  endpoint.searchParams.set('count', String(Math.min(20, count)));
  endpoint.searchParams.set('safesearch', 'moderate');
  endpoint.searchParams.set('search_lang', 'en');
  return getJson(endpoint.toString(), 12000, {
    'Accept':'application/json',
    'X-Subscription-Token':apiKey,
    'Accept-Encoding':'gzip'
  });
}

function validUsername(u) {
  return /^[A-Za-z0-9._-]{2,64}$/.test(u);
}

async function checkProvider(spec, res) {
  writeEvent(res, {type:'checking', provider:spec.name});
  const r = await getJson(spec.url, spec.timeout || 8000);
  if (r.error) {
    writeEvent(res, {type:'result', provider:spec.name, status:'unverified', reason:r.error, profile:spec.profile});
    return;
  }
  if (spec.miss && spec.miss(r)) {
    writeEvent(res, {type:'result', provider:spec.name, status:'miss', http:r.status, profile:spec.profile});
    return;
  }
  if (!r.ok) {
    writeEvent(res, {type:'result', provider:spec.name, status:'unverified', http:r.status, reason:'provider returned a non-success response; not treated as a miss', profile:spec.profile});
    return;
  }
  try {
    const parsed = spec.parse(r.data);
    writeEvent(res, {type:'result', provider:spec.name, status:parsed.exists?'confirmed':'miss', http:r.status, detail:parsed.detail||'', extra:parsed.extra||'', profile:spec.profile});
  } catch(e) {
    writeEvent(res, {type:'result', provider:spec.name, status:'unverified', http:r.status, reason:'response format could not be verified', profile:spec.profile});
  }
}

async function runRecon(username, res) {
  const enc = encodeURIComponent(username);
  const specs = [
    {
      name:'GitHub',
      url:`https://api.github.com/users/${enc}`,
      profile:`https://github.com/${enc}`,
      miss:r=>r.status===404,
      parse:d=>({exists:!!(d&&d.login),detail:d?.login?`@${d.login} (${d.type||'User'})`:'',extra:d?.public_repos!=null?`public repos: ${d.public_repos}`:''})
    },
    {
      name:'GitLab',
      url:`https://gitlab.com/api/v4/users?username=${enc}`,
      profile:`https://gitlab.com/${enc}`,
      parse:d=>{const hit=Array.isArray(d)?d.find(x=>String(x.username||'').toLowerCase()===username.toLowerCase()):null;return {exists:!!hit,detail:hit?`@${hit.username}`:''};}
    },
    {
      name:'Bluesky',
      url:`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${enc}`,
      profile:`https://bsky.app/profile/${enc}`,
      miss:r=>r.status===400||r.status===404,
      parse:d=>({exists:!!(d&&d.handle),detail:d?.handle?`@${d.handle}`:'',extra:d?.displayName?`display: ${d.displayName}`:''})
    },
    {
      name:'Keybase',
      url:`https://keybase.io/_/api/1.0/user/lookup.json?usernames=${enc}&fields=basics,proofs_summary`,
      profile:`https://keybase.io/${enc}`,
      parse:d=>{const them=Array.isArray(d?.them)?d.them:[];const hit=them.find(x=>x?.basics&&String(x.basics.username||'').toLowerCase()===username.toLowerCase());const n=hit?.proofs_summary?.all?.length;return {exists:!!hit,detail:hit?`@${hit.basics.username}`:'',extra:Number.isInteger(n)?`public identity proofs: ${n}`:''};}
    },
    {
      name:'Reddit',
      url:`https://www.reddit.com/user/${enc}/about.json?raw_json=1`,
      profile:`https://www.reddit.com/user/${enc}/`,
      miss:r=>r.status===404,
      parse:d=>({exists:!!(d?.data?.name&&String(d.data.name).toLowerCase()===username.toLowerCase()),detail:d?.data?.name?`@${d.data.name}`:''})
    }
  ];

  const npmUrl=`https://registry.npmjs.org/-/v1/search?text=maintainer:${enc}&size=20`;
  const tasks = specs.map(s=>checkProvider(s,res));
  tasks.push((async()=>{
    writeEvent(res,{type:'checking',provider:'npm'});
    const r=await getJson(npmUrl);
    if(r.error){writeEvent(res,{type:'result',provider:'npm',status:'unverified',reason:r.error});return;}
    if(!r.ok){writeEvent(res,{type:'result',provider:'npm',status:'unverified',http:r.status,reason:'registry response unavailable; not treated as a miss'});return;}
    const objects=Array.isArray(r.data?.objects)?r.data.objects:[];
    const exact=objects.filter(o=>(o?.package?.maintainers||[]).some(m=>String(m.username||'').toLowerCase()===username.toLowerCase()));
    writeEvent(res,{type:'result',provider:'npm',status:exact.length?'evidence':'none',http:r.status,count:exact.length,packages:exact.slice(0,10).map(o=>o.package?.name).filter(Boolean)});
  })());

  await Promise.allSettled(tasks);
  writeEvent(res,{type:'done'});
}

const server=http.createServer(async (req,res)=>{
  const u=new URL(req.url,`http://${req.headers.host}`);
  if(req.method==='GET' && u.pathname==='/api/health') return send(res,200,JSON.stringify({ok:true,service:'OMEN OSINT backend',version:'4.0'}));
  if(req.method==='GET' && u.pathname==='/api/recon'){
    const username=(u.searchParams.get('username')||'').trim().replace(/^@+/,'');
    if(!validUsername(username)) return send(res,400,JSON.stringify({error:'Invalid username. Use 2-64 letters, numbers, dots, underscores, or hyphens.'}));
    res.writeHead(200,{'Content-Type':'application/x-ndjson; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Transfer-Encoding':'chunked'});
    writeEvent(res,{type:'meta',username,mode:'server-side public API verification',note:'A confirmed result means the provider itself returned an exact matching public account. HTTP errors are never converted into misses.'});
    await runRecon(username,res);
    res.end();
    return;
  }
  if(req.method==='GET' && (u.pathname==='/' || u.pathname==='/index.html')){
    fs.createReadStream(INDEX).on('error',()=>send(res,500,'OMEN index unavailable','text/plain')).pipe(res);
    return;
  }
  send(res,404,'Not found','text/plain; charset=utf-8');
});

server.listen(PORT,()=>console.log(`OMEN OSINT running at http://localhost:${PORT}`));
