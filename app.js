import initialState from './data/initial-state.json' with { type: 'json' };
import welfareData from './data/welfare-ids.json' with { type: 'json' };

const CONFIG=window.CHALDEA_CONFIG||{};
const CLASS_ORDER=['Saber','Archer','Lancer','Rider','Caster','Assassin','Berserker','Ruler','Avenger','Alter Ego','Moon Cancer','Foreigner','Pretender','Shielder','Extra'];
const PLAYERS=['julien','yanis','attmann'];
const state=structuredClone(initialState);
const saved=localStorage.getItem('chaldea-v3-state');
if(saved){try{const x=JSON.parse(saved);if(x?.players) Object.assign(state.players,x.players)}catch{}}
let currentPlayer='julien';
let currentView='overview';
let rosterMode='cards';
let atlasByCollection=new Map();
let imagePromises=new Map();
let cloud=null;let cloudEnabled=false;let currentAuth=null;

const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
const toast=m=>{const e=$('#toast');e.textContent=m;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1900)};
const n=v=>{const x=Number(v);return Number.isFinite(x)?x:null};
const cleanNum=v=>typeof v==='number'?v:(typeof v==='string'&&/^\s*\d+(?:\.\d+)?\s*$/.test(v)?Number(v):null);
function cleanState(){Object.values(state.players||{}).forEach(p=>Object.values(p.stats||{}).forEach(s=>{
  ['level','np','bond','grail','fouHp','fouAtk','servantCoins'].forEach(k=>s[k]=cleanNum(s[k]));
  ['skills','appendSkills'].forEach(k=>{const len=k==='skills'?3:5;const a=Array.isArray(s[k])?s[k]:[];s[k]=Array.from({length:len},(_,i)=>{const x=cleanNum(a[i]);return x!=null&&x>=0&&x<=10?x:null})});
}));}
cleanState();
function saveLocal(){localStorage.setItem('chaldea-v3-state',JSON.stringify(state));}
function rarityStars(r){const rr=r==='SSR'?5:r==='SR'?4:r==='R'?3:r==='UC'?2:1;return '★'.repeat(rr)+'☆'.repeat(5-rr)}
function rarityNum(r){return r==='SSR'?5:r==='SR'?4:r==='R'?3:r==='UC'?2:1}
function classLabel(c){return (c||'Extra').replace(/\s*\n.*$/,'').trim()}
function normName(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()}
const WELFARE_NAMES=new Set((welfareData.names||[]).map(normName));
function isWelfare(r){return r.rarity==='Welfare'||WELFARE_NAMES.has(normName(r.name));}
function stats(player,id){return state.players[player]?.stats?.[String(id)]||{skills:[null,null,null],appendSkills:[null,null,null,null,null]}}
function owned(s){if(!s)return false;return ['level','np','bond','grail','fouHp','fouAtk','servantCoins'].some(k=>s[k]!=null)||[...(s.skills||[]),...(s.appendSkills||[])].some(v=>v!=null)}
function skillValues(s){return (s?.skills||[]).filter(v=>Number.isFinite(v));}
function avgSkills(player){const vals=state.roster.flatMap(r=>skillValues(stats(player,r.id))).filter(v=>v>=1&&v<=10);return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0}
function skillDistribution(player){const c=Array(11).fill(0);state.roster.forEach(r=>skillValues(stats(player,r.id)).forEach(v=>{if(v>=1&&v<=10)c[v]++}));return c}
function countOwnedBy(player,pred){return state.roster.filter(r=>pred(r)&&owned(stats(player,r.id))).length}
function levelMax(player,target){return state.roster.filter(r=>owned(stats(player,r.id))&&Number(stats(player,r.id).level)===target).length}
function bond10(player){return state.roster.filter(r=>owned(stats(player,r.id))&&Number(stats(player,r.id).bond)>=10).length}
function maxSkillCount(player){return skillValuesAll(player).filter(v=>v===10).length}
function skillValuesAll(player){return state.roster.flatMap(r=>skillValues(stats(player,r.id)))}
function currentRows(player=currentPlayer){return state.roster.map(r=>({r,st:stats(player,r.id)}))}
function imageKey(r){return Number(r.id)}
async function atlasSearchByName(name){
  const key=name.toLowerCase(); if(atlasByCollection.has(key)) return atlasByCollection.get(key);
  const url='https://api.atlasacademy.io/basic/NA/servant/search?name='+encodeURIComponent(name);
  try{const resp=await fetch(url,{cache:'force-cache'});if(!resp.ok) throw new Error('atlas '+resp.status);const arr=await resp.json();const found=Array.isArray(arr)?(arr.find(x=>String(x.name).toLowerCase()===key)||arr[0]):null;atlasByCollection.set(key,found||null);return found||null}catch{atlasByCollection.set(key,null);return null}
}
async function getAtlasFull(r){
  const key=imageKey(r); if(imagePromises.has(key)) return imagePromises.get(key);
  const p=(async()=>{const basic=await atlasSearchByName(r.name); if(!basic?.id) return null;try{const resp=await fetch(`https://api.atlasacademy.io/nice/NA/servant/${basic.id}`,{cache:'force-cache'});if(!resp.ok)return null;return await resp.json()}catch{return null}})();imagePromises.set(key,p);return p;
}
function artUrl(detail){const a=detail?.extraAssets?.charaGraph?.ascension; if(!a)return null; if(typeof a==='string')return a;const vals=Object.values(a).filter(x=>typeof x==='string');return vals[0]||null}
async function hydrate(selector,items){const visible=items.slice(0,24);await Promise.all(visible.map(async r=>{const d=await getAtlasFull(r);const url=artUrl(d);if(!url)return;document.querySelectorAll(`${selector}[data-servant-id="${r.id}"] .card-art,${selector}[data-servant-id="${r.id}"] .compare-cover`).forEach(el=>{if(el.querySelector('img'))return;const img=new Image();img.src=url;img.alt=r.name;img.onload=()=>{el.innerHTML=`<img src="${url}" alt="${r.name}">${el.classList.contains('compare-cover')?'<div class="compare-overlay"></div>':''}`}})}))}
function renderMasterSwitch(){
 $('#masterSwitch').innerHTML=PLAYERS.map(id=>`<button class="master-tab ${id===currentPlayer?'active':''}" data-player="${id}">${state.players[id]?.displayName||id}</button>`).join('');
 $$('.master-tab').forEach(b=>b.onclick=()=>{currentPlayer=b.dataset.player;renderAll()});$('#heroMaster').textContent=state.players[currentPlayer]?.displayName||currentPlayer;
}
function renderOverview(){
 const p=currentPlayer;
 const five=countOwnedBy(p,r=>!isWelfare(r)&&r.rarity==='SSR');
 const four=countOwnedBy(p,r=>!isWelfare(r)&&r.rarity==='SR');
 const welfare=countOwnedBy(p,r=>isWelfare(r));
 const avg=avgSkills(p), dist=skillDistribution(p);
 const metrics=[['Servants possédés',countOwnedBy(p,()=>true),'sur '+state.roster.length],['5★',five,'possédés'],['4★',four,'hors Welfares'],['Welfares',welfare,'possédés'],['Niveau 120',levelMax(p,120),'servants'],['Niveau 100',levelMax(p,100),'servants'],['Bond 10+',bond10(p),'servants']];
 $('#overviewMetrics').innerHTML=metrics.map(([a,b,c])=>`<div class="metric"><div class="metric-label">${a}</div><div class="metric-value">${b}</div><div class="metric-sub">${c}</div></div>`).join('');
 // Put Bond in a highlighted detail card rather than dropping it from the dashboard.
 $('#collectionTotal').textContent=`${countOwnedBy(p,()=>true)} / ${state.roster.length}`;
 $('#rarityDisplay').innerHTML=[['★★★★★',five,'5 étoiles'],['★★★★',four,'4 étoiles'],['Welfare',welfare,'événements']].map(([s,v,l])=>`<div class="rarity-card"><div class="rarity-stars">${s==='Welfare'?'WELFARE':s}</div><div class="rarity-value">${v}</div><div class="rarity-label">${l}</div></div>`).join('');
 $('#skillsAverage').textContent=avg?avg.toFixed(1):'—';
 const max=Math.max(...dist.slice(1),1);$('#skillBars').innerHTML=dist.slice(1).map((v,i)=>`<div class="skill-axis"><span class="level">${i+1}</span><div class="bar-track"><div class="bar-fill" style="width:${v/max*100}%"></div></div><b class="bar-value">${v}</b></div>`).join('');
 $('#detailStats').innerHTML=[['Skills à 10',maxSkillCount(p)],['Skills renseignés',skillValuesAll(p).length],['Bond 10+',bond10(p)],['Niveau 120',levelMax(p,120)],['Niveau 100',levelMax(p,100)],['4★ + Welfare',four+welfare]].map(([a,b])=>`<div class="detail-cell"><span>${a}</span><strong>${b}</strong></div>`).join('');
 const max120=state.roster.filter(r=>stats(p,r.id).level===120).slice(0,4);const max100=state.roster.filter(r=>stats(p,r.id).level===100).slice(0,4);
 const cards=[...max120.map(r=>[r,120]),...max100.map(r=>[r,100])].slice(0,8);$('#levelHighlights').innerHTML=cards.length?cards.map(([r,l])=>`<div class="level-card"><span class="name">${r.name}</span><span class="lv">${l}</span></div>`).join(''):'<div class="level-card empty">Aucun Servant 100/120 dans les données.</div>';
}

function normalizeClassName(c){
 const x=String(c||'').toLowerCase().replace(/[^a-z]/g,'');
 const m={saber:'Saber',archer:'Archer',lancer:'Lancer',rider:'Rider',caster:'Caster',assassin:'Assassin',berserker:'Berserker',ruler:'Ruler',avenger:'Avenger',alterego:'Alter Ego',mooncancer:'Moon Cancer',foreigner:'Foreigner',pretender:'Pretender',shielder:'Shielder',beast:'Beast'};
 return m[x]||'Extra';
}
async function syncNARoster(){
 try{
  const resp=await fetch('https://api.atlasacademy.io/export/NA/basic_servant.json',{cache:'no-cache'});
  if(!resp.ok) throw new Error('NA export '+resp.status);
  const incoming=await resp.json();
  if(!Array.isArray(incoming)) throw new Error('NA export format');
  const seen=new Set();
  const usable=incoming.filter(x=>{
    const id=Number(x.collectionNo);
    if(!id||id<2||seen.has(id)) return false; seen.add(id);
    return x.name && x.className;
  });
  const existing=new Set(state.roster.map(r=>Number(r.id)));
  let added=0;
  usable.forEach(x=>{
    const id=Number(x.collectionNo);
    if(existing.has(id)) return;
    state.roster.push({id,name:x.name,class:normalizeClassName(x.className),rarity:Number(x.rarity)>=5?'SSR':Number(x.rarity)===4?'SR':Number(x.rarity)===3?'R':Number(x.rarity)===2?'UC':'C',attribute:x.attribute||'',cardType:'',target:''});
    PLAYERS.forEach(p=>{state.players[p] ||= {displayName:p,stats:{}};state.players[p].stats[String(id)] ||= {skills:[null,null,null],appendSkills:[null,null,null,null,null]}});
    added++;
  });
  state.roster.sort((a,b)=>Number(a.id)-Number(b.id));
  if(added){saveLocal();fillClassFilter();renderAll();toast(`${added} nouveau${added>1?'x':''} Servant${added>1?'s':''} NA ajouté${added>1?'s':''}`)}
  updateSync(added?'NA à jour':'NA vérifié');
 }catch(e){console.warn('Atlas NA sync failed',e);updateSync(cloudEnabled&&currentAuth?'Cloud connecté':'Mode local',true)}
}

function fillClassFilter(){const vals=[...new Set(state.roster.map(r=>classLabel(r.class)))].sort((a,b)=>CLASS_ORDER.indexOf(a)-CLASS_ORDER.indexOf(b));$('#classFilter').innerHTML='<option value="all">Toutes les classes</option>'+vals.map(v=>`<option value="${v}">${v}</option>`).join('')}
function sortRows(rows,mode){return rows.sort((a,b)=>{const sa=a.st,sb=b.st; if(mode==='bond')return (sb.bond||-1)-(sa.bond||-1);if(mode==='np')return (sb.np||-1)-(sa.np||-1);if(mode==='level')return (sb.level||-1)-(sa.level||-1);if(mode==='rarity-level')return rarityNum(b.r.rarity)-rarityNum(a.r.rarity)||(sb.level||-1)-(sa.level||-1);return Number(b.r.id)-Number(a.r.id)});}
function renderRoster(){
 const q=($('#searchInput').value||'').toLowerCase().trim(),cl=$('#classFilter').value,ra=$('#rarityFilter').value,sort=$('#sortFilter').value;
 let rows=currentRows().filter(({r})=>(!q||r.name.toLowerCase().includes(q))&&(cl==='all'||classLabel(r.class)===cl)&&(ra==='all'||(ra==='welfare'?isWelfare(r):rarityNum(r.rarity)===Number(ra))));rows=sortRows(rows,sort);
 $('#rosterCount').textContent=`${rows.length} résultat${rows.length>1?'s':''}`;
 $('#rosterCards').classList.toggle('hidden',rosterMode!=='cards');$('#rosterTable').classList.toggle('hidden',rosterMode!=='table');
 if(rosterMode==='cards'){
  $('#rosterCards').innerHTML=rows.map(({r,st})=>{const own=owned(st);return `<article class="servant-card ${own?'owned':'missing'}" data-servant-id="${r.id}">${own?'<span class="owned-mark"></span>':'<span class="missing-ribbon">NON POSSÉDÉ</span>'}<div class="card-art"><div class="card-fallback">${r.name.slice(0,1)}</div></div><div class="card-info"><div class="card-stars">${rarityStars(r.rarity)}</div><div class="card-name" title="${r.name}">${r.name}</div><div class="card-line"><span>Lv ${st.level??'—'}</span><span class="np-chip">NP ${st.np??'—'}</span></div></div></article>`}).join('');
  $$('#rosterCards .servant-card').forEach(e=>e.onclick=()=>openModal(Number(e.dataset.servantId)));hydrate('.servant-card',rows);
 } else {
  $('#rosterTable').innerHTML=`<table class="table"><thead><tr><th>Servant</th><th>Classe</th><th>Rareté</th><th>Lv</th><th>NP</th><th>Skills</th><th>Bond</th><th>Coins</th><th>État</th></tr></thead><tbody>${rows.map(({r,st})=>`<tr class="${owned(st)?'':'missing-row'}" data-id="${r.id}"><td class="name">${r.name}</td><td>${classLabel(r.class)}</td><td class="stars">${rarityStars(r.rarity)}${isWelfare(r)?' · Welfare':''}</td><td>${st.level??'—'}</td><td class="table-np">${st.np??'—'}</td><td>${(st.skills||[]).map(v=>v??'—').join(' / ')}</td><td>${st.bond??'—'}</td><td>${st.servantCoins??'—'}</td><td>${owned(st)?'Possédé':'Manquant'}</td></tr>`).join('')}</tbody></table>`;
  $$('#rosterTable tbody tr').forEach(e=>e.onclick=()=>openModal(Number(e.dataset.id)));
 }
}
function compareStats(player){const five=countOwnedBy(player,r=>!isWelfare(r)&&r.rarity==='SSR'),four=countOwnedBy(player,r=>!isWelfare(r)&&r.rarity==='SR'),wf=countOwnedBy(player,isWelfare);return {owned:countOwnedBy(player,()=>true),five,four,wf,avg:avgSkills(player),lvl120:levelMax(player,120),bond10:bond10(player)}}
function renderCompareTop(){
 $('#compareTop').innerHTML=PLAYERS.map(p=>{const s=compareStats(p);return `<article class="master-summary"><div class="summary-head"><div class="summary-name">${state.players[p]?.displayName||p}</div><div class="summary-rank">MASTER</div></div><div class="summary-big">${s.owned}</div><div class="summary-sub">Servants possédés</div><div class="summary-grid"><div class="summary-cell"><small>5★</small><strong>${s.five}</strong></div><div class="summary-cell"><small>4★</small><strong>${s.four}</strong></div><div class="summary-cell"><small>Welfare</small><strong>${s.wf}</strong></div><div class="summary-cell"><small>Skills moy.</small><strong>${s.avg.toFixed(1)}</strong></div><div class="summary-cell"><small>Lv 120</small><strong>${s.lvl120}</strong></div><div class="summary-cell"><small>Bond 10+</small><strong>${s.bond10}</strong></div></div></article>`}).join('');
}
let compareFocusId=state.roster.find(r=>owned(stats(currentPlayer,r.id)))?.id||state.roster[0]?.id;
function renderCompareFocus(){const r=state.roster.find(x=>x.id===Number(compareFocusId));if(!r)return;$('#compareFocusTitle').textContent=r.name;$('#compareCards').innerHTML=PLAYERS.map(p=>{const st=stats(p,r.id);return `<article class="compare-player-card"><div class="compare-cover" data-compare-servant-id="${r.id}"><div class="card-fallback">${r.name.slice(0,1)}</div><div class="compare-overlay"></div><div class="compare-player-name">${state.players[p]?.displayName||p}</div></div><div class="compare-body"><div class="compare-statline"><span>État</span><b>${owned(st)?'POSSEDÉ':'MANQUANT'}</b></div><div class="compare-statline"><span>Niveau</span><b>${st.level??'—'}</b></div><div class="compare-statline"><span>NP</span><b>${st.np??'—'}</b></div><div class="compare-statline"><span>Bond</span><b>${st.bond??'—'}</b></div><div class="compare-skills">${(st.skills||[]).map(v=>`<div class="skill-pill ${v===10?'max':''}">${v??'—'}</div>`).join('')}</div></div></article>`}).join('');hydrate('.compare-player-card', [r]);}
function renderCompare(){renderCompareTop();renderCompareFocus()}
function navigate(view){currentView=view;$$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${view}`));$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));$('#pageName').textContent=view[0].toUpperCase()+view.slice(1);if(view==='overview')renderOverview();if(view==='servants')renderRoster();if(view==='compare')renderCompare();$('#sidebar').classList.remove('open')}
function renderAll(){renderMasterSwitch();renderOverview();renderRoster();renderCompare()}
function openModal(id){
 const r=state.roster.find(x=>x.id===Number(id));if(!r)return;const st=stats(currentPlayer,id);const canEdit=currentAuth?currentAuth.player_key===currentPlayer: true;
 $('#modal').innerHTML=`<div class="modal-top"><div class="modal-art"><div class="card-fallback">${r.name.slice(0,1)}</div></div><div class="modal-copy"><div class="kicker">${classLabel(r.class)} · ${rarityStars(r.rarity)}${isWelfare(r)?' · WELFARE':''}</div><h2>${r.name}</h2><div class="modal-sub">Compte : ${state.players[currentPlayer]?.displayName||currentPlayer}</div><div class="modal-stats"><div class="modal-stat"><small>Niveau</small><strong>${st.level??'—'}</strong></div><div class="modal-stat"><small>NP</small><strong>${st.np??'—'}</strong></div><div class="modal-stat"><small>Bond</small><strong>${st.bond??'—'}</strong></div><div class="modal-stat"><small>Coins</small><strong>${st.servantCoins??'—'}</strong></div></div></div></div><div class="edit-area"><div class="kicker">MISE À JOUR</div><div class="edit-grid"><div class="field"><label>Niveau</label><input id="e-level" type="number" min="1" max="120" value="${st.level??''}" ${canEdit?'':'disabled'}></div><div class="field"><label>NP</label><input id="e-np" type="number" min="1" max="5" value="${st.np??''}" ${canEdit?'':'disabled'}></div><div class="field"><label>Bond</label><input id="e-bond" type="number" min="1" max="15" value="${st.bond??''}" ${canEdit?'':'disabled'}></div><div class="field"><label>Grails</label><input id="e-grail" type="number" min="0" max="15" value="${st.grail??''}" ${canEdit?'':'disabled'}></div></div><div class="edit-skills"><div class="field"><label>Skills 1 / 2 / 3</label><input id="e-skills" value="${(st.skills||[]).map(v=>v??'').join(',')}" placeholder="10,10,10" ${canEdit?'':'disabled'}></div><div class="field"><label>Append 1 → 5</label><input id="e-append" value="${(st.appendSkills||[]).map(v=>v??'').join(',')}" placeholder="10,10,10,0,0" ${canEdit?'':'disabled'}></div></div><div class="modal-actions"><button class="button" id="closeModal">Fermer</button>${canEdit?'<button class="button bright" id="saveModal">Enregistrer</button>':''}</div></div>`;
 $('#modalBackdrop').classList.add('open');$('#closeModal').onclick=closeModal;if(canEdit)$('#saveModal').onclick=()=>saveModal(id);getAtlasFull(r).then(d=>{const u=artUrl(d);if(u)$('#modal .modal-art').innerHTML=`<img src="${u}" alt="${r.name}">`});
}
function closeModal(){$('#modalBackdrop').classList.remove('open')}
function parseArr(s,len){const a=s.split(',').map(x=>cleanNum(x.trim()));return Array.from({length:len},(_,i)=>{const v=a[i];return v!=null&&v>=0&&v<=10?v:null})}
async function saveModal(id){const st=stats(currentPlayer,id);st.level=cleanNum($('#e-level').value);st.np=cleanNum($('#e-np').value);st.bond=cleanNum($('#e-bond').value);st.grail=cleanNum($('#e-grail').value);st.skills=parseArr($('#e-skills').value,3);st.appendSkills=parseArr($('#e-append').value,5);saveLocal();renderAll();closeModal();toast(`${state.roster.find(r=>r.id===Number(id)).name} mis à jour`);await saveCloudStat(id)}
function closeOnBackdrop(e){if(e.target.id==='modalBackdrop')closeModal()}
async function saveCloudStat(id){if(!cloudEnabled||!cloud||!currentAuth)return;const st=stats(currentPlayer,id);const body={player_key:currentPlayer,servant_id:Number(id),level:st.level,np:st.np,bond:st.bond,grail:st.grail,skills:st.skills,append_skills:st.appendSkills,servant_coins:st.servantCoins,fou_hp:st.fouHp,fou_atk:st.fouAtk,updated_at:new Date().toISOString()};const {error}=await cloud.from('chaldea_stats').upsert(body,{onConflict:'player_key,servant_id'});if(error)toast('Erreur de synchronisation cloud');else updateSync('Synchronisé')}
function updateSync(label,warning=false){$('#syncPill').innerHTML=`<span class="pulse" style="background:${warning?'#f2be73':'var(--green)'}"></span><span>${label}</span>`}
async function initSupabase(){if(!CONFIG.supabaseUrl||!CONFIG.supabaseAnonKey||!window.supabase)return;try{cloud=window.supabase.createClient(CONFIG.supabaseUrl,CONFIG.supabaseAnonKey);cloudEnabled=true;updateSync('Cloud…');const {data:{session}}=await cloud.auth.getSession();currentAuth=await hydrateCloudSession(session);if(session){updateSync('Cloud connecté');await loadCloud()}else updateSync('Connexion requise',true)}catch(e){cloudEnabled=false;updateSync('Mode local',true);console.warn(e)}}
async function hydrateCloudSession(session){if(!session?.user)return null;const {data,error}=await cloud.from('chaldea_members').select('player_key,display_name,email').eq('auth_user_id',session.user.id).maybeSingle();if(error||!data)return null;currentPlayer=data.player_key;return data}
async function loadCloud(){if(!cloudEnabled||!currentAuth)return;try{const {data,error}=await cloud.from('chaldea_stats').select('*');if(error)throw error;data.forEach(x=>{state.players[x.player_key] ||= {displayName:x.player_key,stats:{}};state.players[x.player_key].stats[String(x.servant_id)]={level:x.level,np:x.np,bond:x.bond,grail:x.grail,skills:x.skills||[null,null,null],appendSkills:x.append_skills||[null,null,null,null,null],servantCoins:x.servant_coins,fouHp:x.fou_hp,fouAtk:x.fou_atk}});saveLocal();renderAll();}catch(e){updateSync('Cloud indisponible',true)}}
async function loginUI(){
 if(!cloudEnabled){toast('Configure Supabase dans config.js');return}
 const existing=cloud.auth.getSession?await cloud.auth.getSession():{data:{session:null}};const session=existing.data?.session;
 $('#modal').innerHTML=`<div style="padding:25px"><div class="kicker">CLOUD</div><h2 style="font:700 30px 'Space Grotesk';margin:8px 0 5px">${session?'Compte connecté':'Connexion Masters'}</h2><p style="color:#8591a3;font-size:12px;line-height:1.6">${session?'Votre compte est relié à un profil Chaldea.':'Chaque Master se connecte avec son compte. Les droits d’écriture sont attribués côté Supabase.'}</p>${session?`<div style="margin-top:18px;font-size:12px;color:#bbc4d0">${session.user.email}</div><div class="modal-actions"><button class="button" id="cloudClose">Fermer</button><button class="button bright" id="logout">Se déconnecter</button></div>`:`<div class="edit-grid" style="margin-top:18px"><div class="field"><label>Email</label><input id="loginEmail" type="email"></div><div class="field"><label>Mot de passe</label><input id="loginPassword" type="password"></div></div><div class="modal-actions"><button class="button" id="cloudClose">Annuler</button><button class="button bright" id="login">Se connecter</button></div>`}</div>`;
 $('#modalBackdrop').classList.add('open');$('#cloudClose').onclick=closeModal;
 if(session){$('#logout').onclick=async()=>{await cloud.auth.signOut();currentAuth=null;updateSync('Connexion requise',true);closeModal();toast('Déconnecté')}}else $('#login').onclick=async()=>{const {data,error}=await cloud.auth.signInWithPassword({email:$('#loginEmail').value,password:$('#loginPassword').value});if(error){toast(error.message);return}currentAuth=await hydrateCloudSession(data.session);if(currentAuth){currentPlayer=currentAuth.player_key;await loadCloud();updateSync('Cloud connecté');closeModal();renderAll();toast(`Bienvenue ${state.players[currentPlayer].displayName}`)}else toast('Compte non autorisé')};
}
$('#mobileMenu').onclick=()=>$('#sidebar').classList.toggle('open');$('#accountBtn').onclick=loginUI;$('#editRosterBtn').onclick=()=>navigate('servants');$$('.nav-item').forEach(b=>b.onclick=()=>navigate(b.dataset.view));$$('[data-goto]').forEach(b=>b.onclick=()=>navigate(b.dataset.goto));$('#searchInput').oninput=renderRoster;$('#classFilter').onchange=renderRoster;$('#rarityFilter').onchange=renderRoster;$('#sortFilter').onchange=renderRoster;$$('[data-roster-mode]').forEach(b=>b.onclick=()=>{rosterMode=b.dataset.rosterMode;$$('[data-roster-mode]').forEach(x=>x.classList.toggle('active',x===b));renderRoster()});$('#modalBackdrop').addEventListener('click',closeOnBackdrop);$('#compareSearch').oninput=e=>{const q=e.target.value.toLowerCase().trim();const found=state.roster.find(r=>r.name.toLowerCase().includes(q));if(found){compareFocusId=found.id;renderCompareFocus()}}
fillClassFilter();renderAll();initSupabase();syncNARoster();
