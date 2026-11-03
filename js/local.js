// ===== Non ho mai · modalità un solo telefono =====
let L=null,lsetup=null;
ICON.swap='<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7h11l-3-3M17 17H6l3 3"/></svg>';
const LMODES={voce:{t:'Ad alta voce',d:'Leggete la frase e segnate voi chi l\'ha fatto. Velocissimo.'},segreto:{t:'In segreto',d:'Il telefono passa di mano: ognuno risponde senza farsi vedere.'}};

function myLocalName(){return profile?profile.username:(guestSaved.raw||'')}
function initSetup(){
  const saved=ls.get('nonhomai_local')||{};
  lsetup={mode:LMODES[saved.mode]?saved.mode:'voce',lives:LIVES_OPT.includes(saved.lives)?saved.lives:10,rounds:ROUNDS_OPT.includes(saved.rounds)?saved.rounds:15,
    unico:UNICO[saved.unico]?saved.unico:'pen',packs:Array.isArray(saved.packs)&&saved.packs.length?saved.packs.filter(k=>PACKS[k]):[...DEFAULT_PACKS],
    names:[myLocalName()],recent:(saved.names||[]).filter(Boolean).slice(0,20)};
}

// ----- preparazione -----
SCREENS.localsetup=()=>{
  if(!lsetup)initSetup();
  const S=lsetup,n=S.names.length;
  const seg=(k,opts,lab)=>`<div class="seg">${opts.map(v=>`<button type="button" data-go="l-set" data-k="${k}" data-v="${v}" class="${S[k]===v?'on':''}">${lab(v)}</button>`).join('')}</div>`;
  return`
  <div class="topline"><button type="button" class="iconbtn" data-go="back" aria-label="Indietro">${ICON.back}</button><b class="ttl">Un solo telefono</b><span style="width:44px"></span></div>
  <p class="sub tc">Tutti attorno a questo telefono: niente codici, niente connessione.</p>
  <h3>Giocatori</h3>
  <div class="flist">${S.names.map((v,i)=>{const col=COLORS[i%COLORS.length];
    if(i===0)return profile?`<div class="frow lname">${av({name:profile.username,color:col})}<div class="fi"><b>${nm(profile)}</b><small>Sei tu</small></div></div>`
      :`<div class="frow lname">${av({name:v||'?',color:col})}<input class="lnin" data-i="0" maxlength="14" placeholder="Il tuo nome" value="${esc(v)}" autocomplete="off" aria-label="Il tuo nome"><small class="youtag">tu</small></div>`;
    return`<div class="frow lname">${av({name:v,color:col})}<div class="fi"><b>${esc(v)}</b></div><button type="button" class="iconbtn sm" data-go="l-del" data-i="${i}" aria-label="Togli ${esc(v)}">${ICON.x}</button></div>`}).join('')}</div>
  ${n<2?'<p class="hint" style="margin:10px 0 0">Aggiungi almeno un altro giocatore per iniziare</p>':''}
  ${n<12?`<button type="button" class="btn ghost big addp" data-go="l-add">${ICON.plus}Aggiungi giocatore</button>`:''}
  <h3>Modalità</h3>
  <div class="modes">${Object.entries(LMODES).map(([k,m])=>`<button type="button" class="mode ${S.mode===k?'on':''}" data-go="l-mode" data-m="${k}"><b>${m.t}</b><small>${m.d}</small></button>`).join('')}</div>
  <h3>Regole</h3>
  <div class="cfgbox">
    <div class="setting"><span>❤️ Vite iniziali</span>${seg('lives',LIVES_OPT,v=>v)}</div>
    <div class="setting"><span>🃏 Frasi in partita</span>${seg('rounds',ROUNDS_OPT,v=>v)}</div>
    <div class="setting"><span>🦄 Unico al mondo</span><div class="seg">${Object.entries(UNICO).map(([k,u])=>`<button type="button" data-go="l-set" data-k="unico" data-v="${k}" class="${S.unico===k?'on':''}">${u.t}</button>`).join('')}</div></div>
    <div class="lbl" style="margin:16px 0 8px">Pacchetti di frasi</div>
    <div class="packs">${PACK_KEYS.map(k=>{const P=PACKS[k],on=S.packs.includes(k);return`<button type="button" class="pack ${on?'on':''}" data-go="l-pack" data-k="${k}"><span>${P.e}</span><b>${P.t}</b><small>${P.d}</small></button>`}).join('')}</div>
  </div>
  <button type="button" class="btn primary big" data-go="l-start" style="margin-top:18px">Inizia la partita</button>
  <p class="hint" style="margin-top:12px">${profile?'Le partite su un solo telefono finiscono nelle tue statistiche, separate da quelle online.':'Accedi con un account per salvare queste partite nelle statistiche.'}</p>`;
};
BIND.localsetup=()=>{document.querySelectorAll('.lnin').forEach(i=>{i.oninput=()=>{lsetup.names[+i.dataset.i]=i.value;const a=i.parentElement.querySelector('.av');if(a)a.textContent=(i.value||'?')[0].toUpperCase()}})};

function addLocalName(raw){
  const n=String(raw||'').trim().slice(0,14);
  if(!n){toast('Scrivi un nome');return false}
  if(lsetup.names.some(x=>x.trim().toLowerCase()===n.toLowerCase())){toast(`${n} è già in partita`);return false}
  if(lsetup.names.length>=12){toast('Massimo 12 giocatori');return false}
  lsetup.names.push(n);buzz(12);SFX.tap();
  if(view==='localsetup')refresh();
  const m=document.querySelector('.modal.addp-m');if(m)drawAddPlayer(m);
  return true;
}
function drawAddPlayer(m){
  const added=lsetup.names.slice(1).filter(Boolean),recent=(lsetup.recent||[]).filter(r=>!lsetup.names.some(x=>x.toLowerCase()===r.toLowerCase())).slice(0,8);
  m.querySelector('#addlist').innerHTML=(added.length?`<div class="chips left" style="margin:0 0 12px">${added.map((x,i)=>`<span class="chip done">${av({name:x,color:COLORS[(i+1)%COLORS.length]},'sm')}${esc(x)}</span>`).join('')}</div>`:'')
    +(recent.length?`<p class="lbl" style="margin:14px 0 8px">Hanno già giocato</p><div class="chips left" style="margin:0">${recent.map(r=>`<span class="rchip"><button type="button" data-go="l-quick" data-n="${esc(r)}">+ ${esc(r)}</button><button type="button" class="rc-del" data-go="l-forget" data-n="${esc(r)}" aria-label="Togli ${esc(r)} dalla lista">${ICON.x}</button></span>`).join('')}</div>`:'');
}
function openAddPlayer(){
  if(lsetup.names.length>=12){toast('Massimo 12 giocatori');return}
  const m=document.createElement('div');m.className='modal addp-m';
  m.innerHTML=`<div class="sheet" role="dialog" aria-label="Aggiungi giocatore"><div class="grab"></div>
    <h2 style="text-align:left;margin:4px 0 4px">Aggiungi un giocatore</h2>
    <p class="hint" style="text-align:left;margin:0 0 14px">Scrivi il nome e premi Aggiungi. Puoi aggiungerne quanti vuoi, poi tocca Fatto.</p>
    <form id="addform"><input id="addname" maxlength="14" placeholder="Nome del giocatore" autocomplete="off" autocapitalize="words">
    <button type="submit" class="btn primary big" style="margin-top:12px">${ICON.plus}Aggiungi</button></form>
    <div id="addlist" style="margin-top:14px"></div>
    <button type="button" class="btn ghost big close" style="margin-top:12px">Fatto</button></div>`;
  const close=()=>{m.classList.add('closing');setTimeout(()=>m.remove(),200)};
  m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.close'))close()});
  const i=m.querySelector('#addname');
  m.querySelector('#addform').onsubmit=e=>{e.preventDefault();if(addLocalName(i.value)){i.value='';i.focus()}};
  document.body.appendChild(m);drawAddPlayer(m);setTimeout(()=>i.focus(),300);
}

// ----- partita -----
function startLocal(){
  const S=lsetup;
  const names=S.names.map(x=>x.trim()).filter(Boolean);
  if(names.length<2){toast('Servono almeno 2 giocatori');return}
  const low=names.map(x=>x.toLowerCase());
  if(new Set(low).size!==low.length){toast('Ci sono due giocatori con lo stesso nome');return}
  if(!S.packs.length){toast('Scegli almeno un pacchetto di frasi');return}
  const keep=[...new Set([...names.slice(1),...(S.recent||[])])].slice(0,20);
  ls.set('nonhomai_local',{mode:S.mode,lives:S.lives,rounds:S.rounds,unico:S.unico,packs:S.packs,names:keep});
  if(!profile&&names[0]){guestSaved.raw=guestSaved.raw||names[0];ls.set('sintonia_guest',guestSaved)}
  const meFirst=!!profile&&S.names[0]===profile.username;
  const pool=[];S.packs.forEach(k=>PACKS[k].f.forEach(t=>pool.push({t,pack:k})));
  const used=new Set(ls.get('nonhomai_lused')||[]);let fresh=pool.filter(x=>!used.has(x.t));if(fresh.length<S.rounds){fresh=pool;ls.set('nonhomai_lused',[])}
  const queue=shuffle(fresh).slice(0,S.rounds);
  L={mode:S.mode,cfg:{lives:S.lives,unico:S.unico},queue,total:queue.length,round:0,history:[],matchId:uuid(),saved:false,
     players:names.map((n,i)=>({id:'p'+i,name:n,color:COLORS[i%COLORS.length],lives:S.lives,did:0,never:0,uniques:0,stolen:0,out:null,me:meFirst&&i===0,uid:meFirst&&i===0?profile.id:null}))};
  startLocalRound();show('local');buzz(30);SFX.chime();
}
function startLocalRound(){
  L.cur=L.queue[L.round];L.answers={};L.last=null;
  const u=ls.get('nonhomai_lused')||[];u.push(L.cur.t);ls.set('nonhomai_lused',u.slice(-400));
  if(L.mode==='segreto'){L.turns=L.players.map(p=>p.id);L.phase='pass'}else L.phase='voce';
}
const LP=id=>L.players.find(p=>p.id===id)||{name:'?',color:'#fff'};
function lReveal(){
  const yes=L.players.filter(p=>L.answers[p.id]===true).map(p=>p.id),no=L.players.filter(p=>L.answers[p.id]!==true).map(p=>p.id);
  const before=Object.fromEntries(L.players.map(p=>[p.id,p.lives]));
  const r=scoreRound(L.players,yes,L.players.length,null,L.cfg.unico);
  L.players.forEach(p=>{if(yes.includes(p.id))p.did++;else p.never++;if(r.unique===p.id)p.uniques++;
    p.lives=Math.max(0,Math.min(99,p.lives+(r.delta[p.id]||0)));if(before[p.id]>0&&p.lives===0&&p.out==null)p.out=L.round});
  const fell=L.players.filter(p=>before[p.id]>0&&p.lives===0).map(p=>p.id);
  L.last={yes,no,delta:r.delta,unique:r.unique,fell};
  L.history.push({round:L.round,t:L.cur.t,by:null,pack:L.cur.pack,yes,no,delta:r.delta,unique:r.unique,stolen:0});
  L.phase='reveal';
}
const lLives=()=>`<div class="scores lsc">${rank(L.players).map(p=>`<span class="sc ${p.lives<=0?'dead':''}">${av(p,'sm')}${nm(p)} <b class="hv sm">${HEART}${p.lives}</b></span>`).join('')}</div>`;
const lHead=()=>`<div class="lhead"><button type="button" class="exit" data-go="l-quit"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>Esci</button><span class="rnd">Frase ${Math.min(L.round+1,L.total)}/${L.total}<span class="prog"><span style="width:${Math.min(100,(L.round+1)/L.total*100)}%"></span></span></span>${soundBtn('iconbtn sm sndb')}</div>${lLives()}`;
const L_VIEWS={
  voce:()=>`${lHead()}${phraseCard(L.cur.t,{tag:packTag(L.cur)})}
    <p class="role" style="font-size:19px;margin-top:16px">Chi l'ha fatto? Toccate i nomi</p>
    <div class="pick">${L.players.map(p=>`<button type="button" class="pk ${L.answers[p.id]?'on':''} ${p.lives<=0?'dead':''}" data-go="l-toggle" data-id="${p.id}">${av(p)}<span>${nm(p)}</span><i>${L.answers[p.id]?'🙋':'😇'}</i></button>`).join('')}</div>
    <button type="button" class="btn primary big" data-go="l-reveal" style="margin-top:16px">Conferma e rivela</button>
    <p class="hint" style="margin-top:10px">Leggete la frase ad alta voce: chi l'ha fatto alza la mano 🙋</p>`,
  pass:()=>{const p=LP(L.turns[0]);return`<div class="pass">
    <div class="passicon">${ICON.swap}</div><p class="lbl tc">Passa il telefono a</p>${av(p,'xl')}<h1 class="headline tc">${nm(p)}</h1>
    <p class="sub tc">Rispondi in segreto alla prossima frase.</p>
    <button type="button" class="btn primary big" data-go="l-show">Sono io, mostra la frase</button><p class="hint">Gli altri non devono guardare lo schermo 🙈</p></div>`},
  secret:()=>{const p=LP(L.turns[0]);return`${phraseCard(L.cur.t,{tag:packTag(L.cur)})}
    <p class="role" style="margin-top:14px">${nm(p)}, l'hai fatto?</p>
    <div class="answers"><button class="abtn yes" data-go="l-ans" data-v="1"><span>🙋</span><b>L'ho fatto</b><small>Perdi una vita</small></button><button class="abtn no" data-go="l-ans" data-v="0"><span>😇</span><b>Mai fatto</b><small>Ti salvi</small></button></div>
    <p class="hint">Ancora ${L.turns.length-1} dopo di te</p>`},
  'pass-reveal':()=>`<div class="pass"><div class="passicon">${ICON.swap}</div><p class="lbl tc">Hanno risposto tutti</p><h1 class="headline tc">Riunitevi tutti<br>intorno al telefono</h1><p class="sub tc">Ora si scopre chi l'ha fatto 👀</p><button type="button" class="btn primary big" data-go="l-reveal2">Rivela</button></div>`,
  reveal:()=>{const R=L.last,last=L.round+1>=L.total||L.players.filter(p=>p.lives>0).length<=1;
    const col=(ids,cls)=>ids.map((id,i)=>{const p=LP(id);return`<div class="rp ${cls}" style="--d:${(.55+i*.12).toFixed(2)}s">${av(p)}<span class="rpn">${nm(p)}</span>${deltaChip(R.delta[id])}</div>`}).join('')||'<p class="empty">Nessuno</p>';
    let ban='';if(R.unique)ban+=`<div class="banner uni">🦄 <span><b>${nm(LP(R.unique))} è unico al mondo!</b><small>${L.cfg.unico==='bonus'?'Leggenda: guadagna una vita':'Unico ad averlo fatto: perde 2 vite'}</small></span></div>`;
    R.fell.forEach(id=>{ban+=`<div class="banner dead">💀 <span><b>${nm(LP(id))} è senza vite!</b></span></div>`});
    return`${lHead()}${phraseCard(L.cur.t,{tag:packTag(L.cur),cls:'small'})}
      <div class="cols"><div class="colr yes"><div class="colh">🙋 L'hanno fatto · ${R.yes.length}</div>${col(R.yes,'yes')}</div><div class="colr no"><div class="colh">😇 Mai fatto · ${R.no.length}</div>${col(R.no,'no')}</div></div>
      <div class="banners">${ban}</div>
      <button type="button" class="btn primary big" data-go="l-nextround">${last?'Vedi la classifica 🏆':'Prossima frase →'}</button>`},
  end:()=>{const s=rank(L.players);
    const top=[s[1],s[0],s[2]],cls=['p2','p1','p3'],delay=[.9,1.4,.5],medal=['🥈','🥇','🥉'];
    const pod=top.map((p,i)=>p?`<div class="pod ${cls[i]}" style="--d:${delay[i]}s">${i===1?'<div class="crown">👑</div>':''}${av(p,'lg')}<div class="nm">${nm(p)}</div><div class="col"><small>${medal[i]}</small><span class="hv">${HEART}${p.lives}</span></div></div>`:'').join('');
    const rest=s.slice(3).map((p,i)=>`<div class="ri" style="animation-delay:${(1.8+i*.1).toFixed(2)}s"><span class="pos">${p.pos}</span>${av(p)}${nm(p)}<b><span class="hv sm">${HEART}${p.lives}</span></b></div>`).join('');
    return`<h2>Classifica finale</h2><p class="hint">Vince chi ha più vite 😇</p><div class="podium">${pod}</div>${rest?`<div class="res rest">${rest}</div>`:''}
      <h3>I titoli della serata</h3>${titlesHtml(matchTitles(L.players,L.history,LP))}
      <button type="button" class="btn big sharebtn" data-go="share" style="margin-top:20px">📸 Condividi il risultato</button>
      <button type="button" class="btn primary big" data-go="l-again" style="margin-top:10px">🔁 Rivincita</button>
      <button type="button" class="btn ghost big" data-go="l-setup" style="margin-top:10px">Cambia giocatori o regole</button>
      <button type="button" class="btn ghost big" data-go="l-home" style="margin-top:10px">Torna alla home</button>`}
};
SCREENS.local=()=>L?L_VIEWS[L.phase]():'';
BIND.local=()=>{};
function lgo(phase){L.phase=phase;$('#app').innerHTML=SCREENS.local();enterAnim();window.scrollTo(0,0);
  if(phase==='reveal')revealFx(L.last,(L.players.find(p=>p.me)||{}).id);
  if(phase==='end'){confetti(200,1500);SFX.fanfare(1.2);setTimeout(()=>confetti(120),2600);recordLocal()}
  if(phase==='voce'||phase==='pass')SFX.chime();
}
async function recordLocal(){
  if(!profile||!L||L.saved||!L.history.length)return;const mp=L.players.find(p=>p.me);if(!mp)return;L.saved=true;
  rank(L.players);
  const {error}=await sbc.from('nonhomai_results').insert({match_id:L.matchId,mode:'offline',room_code:null,lives:Math.min(99,mp.lives),position:Math.min(30,mp.pos||1),players:Math.min(30,L.players.length),rounds:Math.max(1,L.history.length),
    did:mp.did,never:mp.never,uniques:mp.uniques,stolen:0,best_phrase:null,best_hits:0,others:L.players.filter(p=>!p.me).map(p=>p.name.slice(0,22)).slice(0,30)});
  if(error){console.warn(error);L.saved=false;return}
  statsCache=null;toast('Partita salvata nelle tue statistiche');
}
Object.assign(LOCAL_GO,{
  local:()=>{if(!lsetup)initSetup();else lsetup.names[0]=lsetup.names[0]||myLocalName();show('localsetup')},
  'l-add':()=>openAddPlayer(),
  'l-quick':el=>addLocalName(el.dataset.n),
  'l-forget':el=>{lsetup.recent=lsetup.recent.filter(x=>x!==el.dataset.n);const sv=ls.get('nonhomai_local')||{};sv.names=(sv.names||[]).filter(x=>x!==el.dataset.n);ls.set('nonhomai_local',sv);const m=document.querySelector('.modal.addp-m');if(m)drawAddPlayer(m)},
  'l-del':el=>{lsetup.names.splice(+el.dataset.i,1);refresh()},
  'l-mode':el=>{lsetup.mode=el.dataset.m;SFX.tap();refresh()},
  'l-set':el=>{const k=el.dataset.k;lsetup[k]=k==='unico'?el.dataset.v:+el.dataset.v;SFX.tap();refresh()},
  'l-pack':el=>{const k=el.dataset.k;lsetup.packs=lsetup.packs.includes(k)?lsetup.packs.filter(x=>x!==k):[...lsetup.packs,k];SFX.tap();refresh()},
  'l-start':()=>startLocal(),
  'l-toggle':el=>{const id=el.dataset.id;L.answers[id]=!L.answers[id];SFX.tap();buzz(8);el.classList.toggle('on',L.answers[id]);el.querySelector('i').textContent=L.answers[id]?'🙋':'😇'},
  'l-reveal':()=>{lReveal();lgo('reveal')},
  'l-show':()=>lgo('secret'),
  'l-ans':el=>{L.answers[L.turns[0]]=el.dataset.v==='1';L.turns.shift();buzz(20);SFX.pop();lgo(L.turns.length?'pass':'pass-reveal')},
  'l-reveal2':()=>{lReveal();lgo('reveal')},
  'l-nextround':()=>{L.round++;if(L.round>=L.total||L.players.filter(p=>p.lives>0).length<=1)lgo('end');else{startLocalRound();lgo(L.phase)}},
  'l-again':()=>{startLocal()},
  'l-setup':()=>{L=null;show('localsetup',null,{root:true})},
  'l-home':()=>{L=null;goHome()},
  'l-quit':()=>{if(confirm('Uscire dalla partita? Le vite di questa partita andranno perse.')){L=null;goHome()}}
});
function localGuard(){
  if(view==='local'&&L&&L.phase!=='end'){
    if(confirm('Uscire dalla partita? Le vite di questa partita andranno perse.')){L=null;return false}
    return true;
  }
  return false;
}
