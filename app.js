import initialState from './data/initial-state.json' with { type: 'json' };

const CONFIG = window.CHaldeaConfig || {};
const CLASS_NAMES = ['Saber','Archer','Lancer','Rider','Caster','Assassin','Berserker','Extra'];
const state = structuredClone(initialState);
let currentPlayer = 'julien';
let currentView = 'dashboard';
let atlasDetails = new Map();
let useCloud = false;

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const toast = msg => { const el=$('#toast'); el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),1800); };
const pretty = n => n == null || n === '' ? '—' : Intl.NumberFormat('fr-FR').format(n);
const num = v => { if(v===''||v==null) return null; const n=Number(v); return Number.isFinite(n)?n:null; };
const pct = (n,d) => d ? Math.round(n/d*100) : 0;

function rosterById(id){ return state.roster.find(x => x.id === Number(id)); }
function profileStats(player,id){ return state.players[player]?.stats?.[String(id)] || {}; }
function isOwned(st){
  if(!st) return false;
  const scalar = ['level','bond','grail','np','fouHp','fouAtk','servantCoins'];
  if(scalar.some(k => st[k] != null)) return true;
  return [...(st.skills||[]),...(st.appendSkills||[])].some(v=>v!=null);
}
function progressScore(st){
  if(!isOwned(st)) return 0;
  const lv = st.level==null?0:Math.min(st.level/120,1);
  const sk = (st.skills||[]).reduce((a,v)=>a+(v||0),0)/30;
  const ap = (st.appendSkills||[]).reduce((a,v)=>a+(v||0),0)/50;
  const np = st.np==null?0:Math.min(st.np/5,1);
  const bond = st.bond==null?0:Math.min(st.bond/15,1);
  const grail = st.grail==null?0:Math.min(st.grail/7,1);
  return Math.round((lv*.28+sk*.28+ap*.10+np*.14+bond*.10+grail*.10)*100);
}
function isMaxed(st){ return isOwned(st) && progressScore(st)>=98; }
function classKey(c){ return (c||'Extra').split(/\s|\n/)[0].replace(/[^A-Za-z]/g,'') || 'Extra'; }
function classColor(c){ const k=classKey(c).toLowerCase(); return `var(--${['saber','archer','lancer','rider','caster','assassin','berserker'].includes(k)?k:'extra'})`; }
function classLabel(c){ return (c||'Extra').replace(/\s*\n.*$/,'').trim(); }
function artFromDetail(detail){
  const ea = detail?.extraAssets || {};
  const candidates = [
    ea.charaGraph?.ascension,
    ea.faces?.ascension,
    ea.charaGraph?.battle,
    ea.faces,
    ea.icon
  ];
  for(const obj of candidates){ if(!obj) continue; if(typeof obj==='string') return obj; const vals=Object.values(obj); const found=vals.find(v=>typeof v==='string' && /^https?:\/\//.test(v)); if(found) return found; }
  return null;
}
async function getAtlasDetail(id){
  id=Number(id); if(atlasDetails.has(id)) return atlasDetails.get(id);
  try{
    const r=await fetch(`https://api.atlasacademy.io/nice/NA/servant/${id}`,{cache:'force-cache'});
    if(!r.ok) return null;
    const d=await r.json(); atlasDetails.set(id,d); return d;
  }catch(e){ return null; }
}
async function hydrateImages(nodes){
  const ids=[...new Set(nodes.map(n=>Number(n.dataset.servantId)).filter(Boolean))].slice(0,24);
  await Promise.all(ids.map(async id=>{
    const d=await getAtlasDetail(id); const url=artFromDetail(d); if(!url) return;
    document.querySelectorAll(`[data-servant-id="${id}"] .card-art`).forEach(el=>{ if(el.querySelector('img')) return; const img=new Image(); img.src=url; img.onload=()=>{el.innerHTML=`<img src="${url}" alt=""> <div class="card-shade"></div>`}; });
  }));
}

function statsFor(player){
  const list = state.roster.map(r=>({r,st:profileStats(player,r.id)}));
  return list;
}
function ownedList(player){ return statsFor(player).filter(x=>isOwned(x.st)); }
function kpis(player){
  const rows=statsFor(player), owned=rows.filter(x=>isOwned(x.st));
  const ssr=owned.filter(x=>x.r.rarity==='SSR').length;
  const welfare=owned.filter(x=>x.r.rarity==='Welfare').length;
  const skillEntries=owned.flatMap(x=>x.st.skills||[]).filter(v=>v!=null);
  const skillAvg=skillEntries.length?Math.round(skillEntries.reduce((a,b)=>a+b,0)/skillEntries.length*10)/10:0;
  return {owned:ssr+welfare+owned.filter(x=>!['SSR','Welfare'].includes(x.r.rarity)).length,ssr,welfare,skillAvg,maxed:owned.filter(x=>isMaxed(x.st)).length};
}
function renderPlayerSwitcher(){
  $('#playerSwitcher').innerHTML=Object.entries(state.players).map(([id,p])=>`<button class="player-tab ${id===currentPlayer?'active':''}" data-player="${id}">${p.displayName}</button>`).join('');
  $$('#playerSwitcher .player-tab').forEach(b=>b.onclick=()=>{currentPlayer=b.dataset.player; renderAll();});
}
function renderKpis(){
 const k=kpis(currentPlayer); $('#kpiGrid').innerHTML=[['Servants possédés',k.owned,`${state.roster.length} dans la base`],['SSR',k.ssr,'de votre collection'],['Welfare',k.welfare,'dans votre roster'],['Skills moyens',k.skillAvg,'sur les skills connus']].map(([a,b,c])=>`<div class="kpi"><div class="kpi-label">${a}</div><div class="kpi-value">${b}</div><div class="kpi-sub">${c}</div></div>`).join('');
}
function renderDistribution(){
 const rows=ownedList(currentPlayer), counts={}; CLASS_NAMES.forEach(c=>counts[c]=0);
 rows.forEach(({r})=>{const k=classLabel(r.class); counts[k]=(counts[k]||0)+1;});
 const max=Math.max(...Object.values(counts),1);
 $('#collectionNote').textContent=`${rows.length} possédés / ${state.roster.length}`;
 $('#distribution').innerHTML=Object.entries(counts).map(([name,v])=>`<div class="dist-bar"><div class="dist-value">${v}</div><div class="dist-stick" style="height:${18+Math.round(v/max*130)}px;background:linear-gradient(180deg,${classColor(name)},#39445e)"></div><div class="dist-label">${name.slice(0,4)}</div></div>`).join('');
}
function renderSkills(){
 const rows=ownedList(currentPlayer), arr=(slot)=>rows.flatMap(x=>x.st.skills||[])[slot];
 const labels=['Skill 1','Skill 2','Skill 3'];
 $('#skillChart').innerHTML=labels.map((label,i)=>{let vals=rows.map(x=>x.st.skills?.[i]).filter(v=>v!=null);let avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0;return `<div class="bar-row"><div class="bar-top"><span>${label}</span><span>${avg.toFixed(1)} / 10</span></div><div class="bar-track"><div class="bar-fill" style="width:${avg*10}%"></div></div></div>`}).join('');
}
function renderPriority(){
 const list=ownedList(currentPlayer).filter(x=>!isMaxed(x.st)).sort((a,b)=>progressScore(a.st)-progressScore(b.st)).slice(-5).reverse();
 $('#priorityList').innerHTML=list.length?list.map(({r,st})=>`<div class="priority-item" data-servant-id="${r.id}"><div class="avatar-mini" style="--fallback:${classColor(r.class)}"><span style="font-size:15px;color:${classColor(r.class)}">${r.name.slice(0,1)}</span></div><div><div class="priority-name">${r.name}</div><div class="priority-meta">${classLabel(r.class)} · progression ${progressScore(st)}%</div></div><div class="score-badge">${progressScore(st)}%</div></div>`).join(''):'<div class="panel-note">Tout est au vert.</div>';
}
function renderHighlights(){
 const rows=ownedList(currentPlayer); const maxBond=rows.filter(x=>x.st.bond!=null).sort((a,b)=>b.st.bond-a.st.bond)[0]; const maxLevel=rows.filter(x=>x.st.level!=null).sort((a,b)=>b.st.level-a.st.level)[0]; const coins=rows.reduce((a,x)=>a+(x.st.servantCoins||0),0); const grails=rows.reduce((a,x)=>a+(x.st.grail||0),0);
 $('#highlightGrid').innerHTML=[['Niveau max',maxLevel?.st.level??'—',maxLevel?.r.name||''],['Bond le plus haut',maxBond?.st.bond??'—',maxBond?.r.name||''],['Servant coins',pretty(coins),'dans le roster renseigné'],['Graals investis',pretty(grails),'valeur totale']].map(([n,v,s])=>`<div class="highlight"><div class="highlight-number">${v}</div><div class="highlight-label">${n}<br>${s}</div></div>`).join('');
}
function renderDashboard(){renderKpis();renderDistribution();renderSkills();renderPriority();renderHighlights();}
function fillFilters(){
 const vals=[...new Set(state.roster.map(r=>classLabel(r.class)).filter(Boolean))].sort(); $('#classFilter').innerHTML='<option value="all">Toutes les classes</option>'+vals.map(v=>`<option>${v}</option>`).join('');
}
function renderRoster(){
 const q=($('#searchInput')?.value||'').trim().toLowerCase(), cl=$('#classFilter')?.value||'all', ra=$('#rarityFilter')?.value||'all', stf=$('#statusFilter')?.value||'all';
 let rows=statsFor(currentPlayer).filter(({r,st})=> (!q||r.name.toLowerCase().includes(q)) && (cl==='all'||classLabel(r.class)===cl) && (ra==='all'||r.rarity===ra) && (stf==='all'||(stf==='owned'&&isOwned(st))||(stf==='missing'&&!isOwned(st))||(stf==='maxed'&&isMaxed(st))));
 $('#rosterCount').textContent=`${rows.length} résultats`;
 $('#rosterCards').innerHTML=rows.map(({r,st})=>{const prog=progressScore(st);return `<article class="servant-card ${isOwned(st)?'owned':''}" data-servant-id="${r.id}"><div class="card-art"><div class="fallback-initial" style="color:${classColor(r.class)}">${r.name.slice(0,1)}</div><div class="card-shade"></div></div><div class="card-content"><div class="card-top"><span class="rarity">${r.rarity||'—'} · ${classLabel(r.class)}</span><span class="owned-dot"></span></div><div class="card-name">${r.name}</div><div class="card-meta"><span>Lv ${st.level??'—'}</span><span>NP ${st.np??'—'}</span><span>${prog}%</span></div><div class="progress-line"><span style="width:${prog}%"></span></div></div></article>`}).join('');
 $('#rosterTable').innerHTML=`<table class="table"><thead><tr><th>Servant</th><th>Classe</th><th>Rareté</th><th>Lv</th><th>NP</th><th>Skills</th><th>Append</th><th>Bond</th><th>Coins</th><th>Progression</th></tr></thead><tbody>${rows.map(({r,st})=>`<tr><td>${r.name}</td><td>${classLabel(r.class)}</td><td>${r.rarity}</td><td>${st.level??'—'}</td><td>${st.np??'—'}</td><td>${(st.skills||[]).map(v=>v??'—').join(' / ')}</td><td>${(st.appendSkills||[]).map(v=>v??'—').join(' / ')}</td><td>${st.bond??'—'}</td><td>${st.servantCoins??'—'}</td><td>${progressScore(st)}%</td></tr>`).join('')}</tbody></table>`;
 hydrateImages($$('#rosterCards .servant-card'));
 $$('#rosterCards .servant-card').forEach(el=>el.onclick=()=>openServantModal(Number(el.dataset.servantId)));
}
function renderCompare(){
 const ps=Object.entries(state.players); const rows=state.roster.map(r=>({r, data:ps.map(([p])=>profileStats(p,r.id))}));
 const metrics=[['Possédés',p=>rows.filter(x=>isOwned(x.data[ps.findIndex(([id])=>id===p)] )).length],['SSR',p=>rows.filter(x=>x.r.rarity==='SSR'&&isOwned(x.data[ps.findIndex(([id])=>id===p)])).length],['Welfare',p=>rows.filter(x=>x.r.rarity==='Welfare'&&isOwned(x.data[ps.findIndex(([id])=>id===p)])).length],['Skills moyens',p=>{const vals=rows.flatMap(x=>x.data[ps.findIndex(([id])=>id===p)]?.skills||[]).filter(v=>v!=null);return vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1):'—'}],['Servants maxés',p=>rows.filter(x=>isMaxed(x.data[ps.findIndex(([id])=>id===p)])).length]];
 $('#compareArea').innerHTML=`<div class="compare-grid"><div class="compare-head"><div class="compare-card"><div class="eyebrow">METRICS</div><h2>Vos comptes</h2></div>${ps.map(([id,p])=>`<div class="compare-card"><div class="eyebrow">MASTER</div><div style="font-family:'Space Grotesk';font-size:21px;margin-top:4px">${p.displayName}</div></div>`).join('')}</div><div class="compare-card">${metrics.map(([label,fn])=>{const values=ps.map(([id])=>fn(id));const nums=values.map(v=>Number(v)).filter(Number.isFinite);const best=Math.max(...nums);return `<div class="compare-metric"><div class="metric-label">${label}</div>${values.map(v=>`<div class="metric-number ${Number(v)===best?'leader':''}">${v}</div>`).join('')}</div>`}).join('')}</div></div>`;
}
function renderTodo(){
 const rows=ownedList(currentPlayer).filter(x=>!isMaxed(x.st)).sort((a,b)=>progressScore(a.st)-progressScore(b.st));
 $('#todoGrid').innerHTML=rows.slice(0,30).map(({r,st})=>`<article class="todo-card" data-servant-id="${r.id}"><h3>${r.name}</h3><div class="todo-score">${r.rarity} · ${classLabel(r.class)} · ${progressScore(st)}% overall</div><div class="todo-bars"><div class="todo-row"><span>Lv</span><div class="bar-track"><div class="bar-fill" style="width:${Math.min((st.level||0)/120*100,100)}%"></div></div><b>${st.level??0}</b></div><div class="todo-row"><span>Skills</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(((st.skills||[]).reduce((a,b)=>a+(b||0),0)/30)*100)}%"></div></div><b>${(st.skills||[]).filter(v=>v!=null).length}/3</b></div><div class="todo-row"><span>NP</span><div class="bar-track"><div class="bar-fill" style="width:${Math.min((st.np||0)/5*100,100)}%"></div></div><b>${st.np??0}</b></div></div></article>`).join('') || '<div class="panel-note">Aucun Servant à améliorer avec les données actuelles.</div>';
 $$('#todoGrid .todo-card').forEach(el=>el.onclick=()=>openServantModal(Number(el.dataset.servantId)));
}
function navigate(view){
 currentView=view; $$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${view}`)); $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view)); $('#pageTitle').textContent={dashboard:'Overview',roster:'Servants',compare:'Compare',todo:'Upgrade'}[view]; if(view==='dashboard')renderDashboard(); if(view==='roster')renderRoster(); if(view==='compare')renderCompare(); if(view==='todo')renderTodo(); $('#sidebar').classList.remove('open'); }
function renderAll(){renderPlayerSwitcher();renderDashboard();renderRoster();renderCompare();renderTodo();}

async function openServantModal(id){
 const r=rosterById(id); if(!r)return; const st=profileStats(currentPlayer,id); const modal=$('#modal');
 modal.innerHTML=`<div class="modal-hero"><div class="modal-art"><div class="fallback-initial" style="height:100%;display:grid;place-items:center;color:${classColor(r.class)};font-size:70px">${r.name.slice(0,1)}</div></div><div class="modal-info"><div class="eyebrow">${r.rarity||'—'} · ${classLabel(r.class)} · ${r.cardType||'—'}</div><h2>${r.name}</h2><div class="modal-sub">Master : ${state.players[currentPlayer].displayName}</div><div class="stat-grid"><div class="stat-box"><div class="stat-label">Niveau</div><div class="stat-value">${st.level??'—'}</div></div><div class="stat-box"><div class="stat-label">NP</div><div class="stat-value">${st.np??'—'}</div></div><div class="stat-box"><div class="stat-label">Bond</div><div class="stat-value">${st.bond??'—'}</div></div><div class="stat-box"><div class="stat-label">Coins</div><div class="stat-value">${st.servantCoins??'—'}</div></div></div><div class="skill-grid"><div class="skill-block"><div class="skill-title">Skills</div><div class="skill-values">${(st.skills||[]).map(v=>`<div class="skill-value">${v??'—'}</div>`).join('')}</div></div><div class="skill-block"><div class="skill-title">Append</div><div class="skill-values">${(st.appendSkills||[]).map(v=>`<div class="skill-value">${v??'—'}</div>`).join('')}</div></div></div></div></div><div class="modal-edit"><div class="eyebrow">QUICK EDIT</div><div class="edit-grid">${[['level','Level'],['np','NP'],['bond','Bond'],['grail','Grails'],['fouHp','Fou HP'],['fouAtk','Fou ATK'],['servantCoins','Coins']].map(([k,l])=>`<div class="field"><label>${l}</label><input id="edit-${k}" type="number" value="${st[k]??''}" min="0"></div>`).join('')}</div><div class="skill-grid" style="margin-top:10px"><div class="field"><label>Skills 1 / 2 / 3</label><input id="edit-skills" value="${(st.skills||[]).map(v=>v??'').join(',')}" placeholder="10,10,10"></div><div class="field"><label>Append 1 → 5</label><input id="edit-appends" value="${(st.appendSkills||[]).map(v=>v??'').join(',')}" placeholder="10,10,10,0,0"></div></div><div class="modal-actions"><button class="ghost-button" id="closeModal">Cancel</button><button class="primary-button" id="saveModal">Save changes</button></div></div>`;
 $('#modalBackdrop').classList.add('open');
 $('#closeModal').onclick=closeModal; $('#saveModal').onclick=()=>saveServant(id);
 const detail=await getAtlasDetail(id), art=artFromDetail(detail); if(art){const el=modal.querySelector('.modal-art');el.innerHTML=`<img src="${art}" alt=""><div class="card-shade"></div>`;}
}
function closeModal(){ $('#modalBackdrop').classList.remove('open'); }
function arrValues(s,n){ return s.split(',').map(x=>x.trim()).slice(0,n).map(v=>v===''?null:num(v)); }
async function saveServant(id){
 const st=profileStats(currentPlayer,id);
 ['level','np','bond','grail','fouHp','fouAtk','servantCoins'].forEach(k=>{st[k]=num($(`#edit-${k}`).value)});
 st.skills=arrValues($('#edit-skills').value,3); st.appendSkills=arrValues($('#edit-appends').value,5);
 persistLocal(); renderAll(); closeModal(); toast(`${rosterById(id).name} mis à jour`); await saveCloudStat(id);
}
function persistLocal(){localStorage.setItem('chaldea-state',JSON.stringify(state));}
function loadLocal(){try{const raw=localStorage.getItem('chaldea-state');if(raw){const x=JSON.parse(raw);if(x?.profiles) Object.assign(state.profiles,x.profiles); if(x?.players) Object.assign(state.players,x.players);}}catch(e){}}

// Optional Supabase connector. The app stays fully usable without it.
function cloudHeaders(){
  return { 'apikey': CONFIG.supabaseAnonKey, 'Authorization': `Bearer ${CONFIG.supabaseAnonKey}`, 'Content-Type':'application/json' };
}
async function cloudFetch(path, options={}){
  const r=await fetch(`${CONFIG.supabaseUrl.replace(/\/$/,'')}/rest/v1/${path}`,{...options,headers:{...cloudHeaders(),...(options.headers||{})}});
  if(!r.ok) throw new Error(`Cloud ${r.status}`);
  const text=await r.text(); return text?JSON.parse(text):null;
}
function mergeCloud(rows, stats){
  rows?.forEach(p=>{state.players[p.id] ||= {displayName:p.display_name,region:p.region||'NA',friendCode:p.friend_code||'',stats:{}}; Object.assign(state.players[p.id],{displayName:p.display_name,region:p.region||'NA',friendCode:p.friend_code||''});});
  stats?.forEach(x=>{
    state.players[x.player_id] ||= {displayName:x.player_id,region:'NA',friendCode:'',stats:{}};
    state.players[x.player_id].stats[String(x.servant_id)]={level:x.level,np:x.np,bond:x.bond,grail:x.grail,fouHp:x.fou_hp,fouAtk:x.fou_atk,servantCoins:x.servant_coins,skills:x.skills||[null,null,null],appendSkills:x.append_skills||[null,null,null,null,null],note:x.note||''};
  });
}
async function saveCloudStat(id){
  if(!useCloud) return;
  const st=profileStats(currentPlayer,id);
  const body={player_id:currentPlayer,servant_id:id,level:st.level??null,np:st.np??null,bond:st.bond??null,grail:st.grail??null,fou_hp:st.fouHp??null,fou_atk:st.fouAtk??null,servant_coins:st.servantCoins??null,skills:st.skills||[null,null,null],append_skills:st.appendSkills||[null,null,null,null,null],note:st.note||'',updated_at:new Date().toISOString()};
  try{await cloudFetch('chaldea_stats',{method:'POST',headers:{'Prefer':'resolution=merge-duplicates'},body:JSON.stringify(body)});$('#syncState').innerHTML='<span class="dot"></span><span>Cloud synced</span>';}catch(e){$('#syncState').innerHTML='<span class="dot" style="background:var(--warn)"></span><span>Sync error</span>';}}
async function initCloud(){
  if(!CONFIG.supabaseUrl||!CONFIG.supabaseAnonKey) return;
  try{
    useCloud=true; $('#syncState').innerHTML='<span class="dot"></span><span>Connecting…</span>';
    const [players,stats]=await Promise.all([cloudFetch('chaldea_players?select=*'),cloudFetch('chaldea_stats?select=*')]);
    mergeCloud(players,stats); persistLocal(); $('#syncState').innerHTML='<span class="dot"></span><span>Cloud synced</span>'; renderAll();
  }catch(e){useCloud=false; $('#syncState').innerHTML='<span class="dot" style="background:var(--warn)"></span><span>Local data</span>'; console.warn(e);}
}

$('#mobileMenu').onclick=()=>$('#sidebar').classList.toggle('open');
$('#settingsButton').onclick=()=>toast('Le mode cloud se configure dans config.js');
$('#editButton').onclick=()=>navigate('roster');
$$('.nav-item').forEach(b=>b.onclick=()=>navigate(b.dataset.view));
$$('[data-view-target]').forEach(b=>b.onclick=()=>navigate(b.dataset.viewTarget));
$('#searchInput').oninput=renderRoster; $('#classFilter').onchange=renderRoster; $('#rarityFilter').onchange=renderRoster; $('#statusFilter').onchange=renderRoster;
$$('.view-toggle button').forEach(b=>b.onclick=()=>{ $$('.view-toggle button').forEach(x=>x.classList.remove('active')); b.classList.add('active'); $('#rosterCards').classList.toggle('hidden',b.dataset.rosterView!=='cards'); $('#rosterTable').classList.toggle('hidden',b.dataset.rosterView!=='table'); });
$('#modalBackdrop').addEventListener('click',e=>{if(e.target.id==='modalBackdrop')closeModal()});

document.title='Chaldea Command — FGO Roster';
loadLocal(); fillFilters(); initCloud(); renderAll();
