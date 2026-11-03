// ===== Non ho mai · copertina, profilo e statistiche, regole, novità =====
let statsTab='online';

// carta della copertina che si scrive da sola
const HERO_LINES=['ballato sopra un tavolo','perso un aereo','mandato un messaggio alla persona sbagliata','visto l\'alba dopo una serata','mangiato un kebab alle 4 di notte','cantato al karaoke davanti a sconosciuti','dormito in aeroporto','finto di stare male per saltare un impegno'];
function heroCard(){return`<div class="herocard" aria-hidden="true"><span class="hcorner">🙊</span><div class="pnon">Non ho mai…</div><div class="ptype"><span id="ptype"></span><i class="caret"></i></div><div class="hearts-row">${hearts(3,5,'big')}</div></div>`}
(function typer(){
  let li=Math.floor(Math.random()*HERO_LINES.length),ci=0,dir=1,wait=0;
  setInterval(()=>{
    const el=document.getElementById('ptype');if(!el)return;
    if(reduced()){el.textContent=HERO_LINES[li];return}
    if(wait>0){wait--;return}
    const t=HERO_LINES[li];
    ci+=dir;el.textContent=t.slice(0,ci);
    if(dir>0&&ci>=t.length){dir=-1;wait=34}
    else if(dir<0&&ci<=0){dir=1;li=(li+1)%HERO_LINES.length;wait=6}
  },55);
})();

// ===== Statistiche =====
function personality(pct){if(pct==null)return null;if(pct<25)return{e:'😇',t:'Angioletto',d:'Non hai fatto quasi niente… o menti benissimo'};if(pct<50)return{e:'🙂',t:'Tranquillo',d:'Qualche avventura, niente di scandaloso'};if(pct<75)return{e:'😏',t:'Vissuto',d:'Ne hai fatte parecchie'};return{e:'😈',t:'Senza freni',d:'Hai fatto praticamente tutto'}}
async function loadStats(){
  if(!profile)return;
  const {data,error}=await sbc.from('nonhomai_results').select('*').eq('user_id',profile.id).order('created_at',{ascending:false}).limit(500);
  if(error){console.warn(error);statsCache={xp:0,online:emptyStats(),offline:emptyStats()};return}
  const rows=data||[];
  const xp=rows.reduce((s,x)=>s+25+x.lives*10+x.stolen*15+(x.position===1?100:0),0);
  statsCache={xp,online:summarize(rows.filter(r=>r.mode==='online')),offline:summarize(rows.filter(r=>r.mode==='offline'))};
}
function emptyStats(){return{matches:0,wins:0,avgLives:null,pct:null,uniques:0,stolen:0,best:null,recent:[]}}
function summarize(rows){
  if(!rows.length)return emptyStats();
  const did=rows.reduce((s,x)=>s+x.did,0),tot=did+rows.reduce((s,x)=>s+x.never,0);
  const best=rows.filter(r=>r.best_phrase&&r.best_hits>0).sort((a,b)=>b.best_hits-a.best_hits)[0]||null;
  return{matches:rows.length,wins:rows.filter(x=>x.position===1).length,avgLives:Math.round(rows.reduce((s,x)=>s+x.lives,0)/rows.length*10)/10,
    pct:tot?Math.round(did/tot*100):null,uniques:rows.reduce((s,x)=>s+x.uniques,0),stolen:rows.reduce((s,x)=>s+x.stolen,0),best,recent:rows.slice(0,5)};
}
SCREENS.stats=()=>{const all=statsCache;
  if(!all)return`<div class="center"><div class="spin"></div>Carico le statistiche…</div>`;
  const L=level(all.xp),st=all[statsTab]||emptyStats(),pers=personality(st.pct);
  return`
  <div class="topline"><button type="button" class="iconbtn" data-go="back" aria-label="Indietro">${ICON.back}</button><b class="ttl">Profilo</b><span style="width:44px"></span></div>
  <div class="phead">${av({name:profile.username,color:profile.color},'xl')}<div class="pinfo"><b>${nm(profile)}</b><div class="lvrow"><span class="lv">LV ${L.lv}</span><span class="lvbar"><span style="width:${L.cur/5}%"></span></span></div><small>${L.cur} / 500 XP al livello ${L.lv+1}</small></div></div>
  <div class="seg wide stab"><button type="button" data-go="stab" data-t="online" class="${statsTab==='online'?'on':''}">🌐 Online</button><button type="button" data-go="stab" data-t="offline" class="${statsTab==='offline'?'on':''}">📱 Un solo telefono</button></div>
  <div class="sgrid"><div class="scard"><small>Partite</small><b>${st.matches}</b></div><div class="scard"><small>Vittorie</small><b class="y">${st.wins}</b></div><div class="scard"><small>Vite medie a fine partita</small><b class="p">${st.avgLives==null?'–':String(st.avgLives).replace('.',',')}</b></div><div class="scard"><small>${statsTab==='online'?'Vite rubate':'Volte unico al mondo'}</small><b class="c">${statsTab==='online'?st.stolen:st.uniques}</b></div></div>
  ${pers?`<div class="soul"><div class="ring"><svg width="66" height="66" viewBox="0 0 66 66" aria-hidden="true"><circle cx="33" cy="33" r="28" fill="none" stroke="#262044" stroke-width="7"/><circle cx="33" cy="33" r="28" fill="none" stroke="#ff5c8a" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(st.pct*1.76).toFixed(0)} 176" transform="rotate(-90 33 33)"/></svg><b>${st.pct}%</b></div><div><small class="pk">Il tuo profilo · ${pers.e} ${pers.t}</small><b>Hai fatto il ${st.pct}% delle cose</b><span>${pers.d}</span></div></div>`:''}
  ${statsTab==='online'&&st.uniques?`<div class="scard" style="margin-top:12px;display:flex;align-items:center;gap:12px"><span style="font-size:30px">🦄</span><div><small>Unico al mondo</small><b style="font-size:22px">${st.uniques} ${st.uniques===1?'volta':'volte'}</b></div></div>`:''}
  ${st.best?`<div class="bestclue"><small>La tua frase migliore</small><b>“Non ho mai ${esc(st.best.best_phrase)}”</b><span>L'hanno fatto in ${st.best.best_hits}: ${st.best.best_hits===1?'una vita rubata':st.best.best_hits+' vite rubate'}</span></div>`:''}
  <h3>Ultime partite</h3>
  <div class="flist">${st.recent.length?st.recent.map(r=>`<div class="frow"><span class="posb p${Math.min(r.position,4)}">${r.position}°</span><div class="fi"><b>${r.others.length?'Con '+esc(r.others.slice(0,3).join(', '))+(r.others.length>3?' e altri':''):'Partita'}</b><small>${ago(r.created_at)} · ${r.rounds} frasi · ${r.did} fatte</small></div><b class="ptsr hv sm">${HEART}${r.lives}</b></div>`).join(''):`<p class="empty">${statsTab==='online'?'Gioca una partita online con un account per vedere qui le statistiche':'Le partite su un solo telefono finite con un account compaiono qui'}</p>`}</div>
  <button type="button" class="btn ghost big danger" data-go="reset-stats" style="margin-top:22px">Azzera statistiche</button>
  ${profile.badge?`<p class="hint" style="margin-top:16px">${VBADGE} Account verificato: il nome utente non si può cambiare</p><button type="button" class="btn ghost big" data-go="logout" style="margin-top:10px">Esci</button>`:`<div class="grid2" style="margin-top:22px"><button type="button" class="btn" data-go="rename">Cambia nome</button><button type="button" class="btn ghost" data-go="logout">Esci</button></div>`}`};
BIND.stats=()=>{if(!statsCache)loadStats().then(()=>{if(view==='stats')refresh()})};
if(typeof LOCAL_GO==='undefined')window.LOCAL_GO={};
LOCAL_GO.stab=el=>{statsTab=el.dataset.t;refresh()};

async function recordMatch(){
  const S=state;if(!profile||!S||!S.matchId||recorded.has(S.matchId))return;
  const mp=S.players.find(p=>p.id===me.id);if(!mp||!(S.history||[]).length)return;
  recorded.add(S.matchId);ls.set('nonhomai_recorded',[...recorded].slice(-200));
  rank(S.players);
  const mine=(S.history||[]).filter(h=>h.by===me.id).sort((a,b)=>b.yes.filter(x=>x!==me.id).length-a.yes.filter(x=>x!==me.id).length)[0];
  const {error}=await sbc.from('nonhomai_results').insert({match_id:S.matchId,mode:'online',room_code:code,lives:Math.min(99,mp.lives),position:Math.min(30,mp.pos||1),players:Math.min(30,Math.max(2,S.players.length)),rounds:Math.max(1,S.history.length),
    did:mp.did,never:mp.never,uniques:mp.uniques,stolen:Math.min(500,mp.stolen),best_phrase:mine?String(mine.t).slice(0,120):null,best_hits:mine?mine.yes.filter(x=>x!==me.id).length:0,
    others:S.players.filter(p=>p.id!==me.id).map(p=>String(p.name).slice(0,22)).slice(0,30)});
  if(error){console.warn(error);return}
  statsCache=null;toast('Partita salvata nelle tue statistiche');
}
function openResetStats(){
  const m=document.createElement('div');m.className='modal';
  m.innerHTML=`<div class="sheet" role="dialog" aria-label="Azzera statistiche"><div class="grab"></div>
    <div class="warnic">⚠️</div>
    <h2 style="margin:6px 0 6px">Azzerare le statistiche?</h2>
    <p class="hint" style="margin:0 0 6px">Partite, vittorie, vite rubate, frase migliore e livello di Non ho mai ripartono da zero, sia online sia su un solo telefono.</p>
    <p class="hint" style="margin:0 0 16px"><b style="color:var(--text)">Non si può annullare.</b> Amici, nome utente e statistiche degli altri giochi restano.</p>
    <button type="button" class="btn big dangerfill" id="rsgo">Sì, azzera tutto</button>
    <button type="button" class="btn ghost big close" style="margin-top:10px">Annulla</button></div>`;
  const close=()=>{m.classList.add('closing');setTimeout(()=>m.remove(),200)};
  m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.close'))close()});
  m.querySelector('#rsgo').onclick=async e=>{
    const b=e.currentTarget;b.disabled=true;b.textContent='Azzero…';
    const {error}=await sbc.from('nonhomai_results').delete().eq('user_id',profile.id);
    if(error){b.disabled=false;b.textContent='Sì, azzera tutto';toast('Non sono riuscito ad azzerare, riprova');return}
    statsCache=null;close();buzz(30);toast('Statistiche azzerate');
    await loadStats();if(view==='stats'||view==='home')refresh();
  };
  document.body.appendChild(m);
}

// ===== Versione e novità =====
const VERSION='1.1';
const NOTES=[{v:'1.1',d:'3 novembre 2026',items:[['m','Di base si gioca solo con le frasi scritte da voi'],['n','Interruttore nella stanza per aggiungere le frasi già pronte dei pacchetti'],['m','Si possono scrivere fino a 5 frasi a testa']]},{v:'1.0',d:'3 novembre 2026',first:true,items:[]}];
const NTAG={n:['Nuovo','tn'],m:['Migliorato','tm'],c:['Corretto','tc2']};
function howtoHtml(){
  return`<div class="howto">
    <div class="hcard hero-h">${phraseCardStatic('fatto il bagno di mezzanotte')}<p style="margin-top:12px">Esce una frase. Chi <b>l'ha fatto</b> lo confessa in segreto dal telefono… e <b>perde una vita</b>.</p></div>
    <h3>Ogni partita</h3>
    <div class="hflow">
      <div class="hstep"><span class="hic">✍️</span><b>1. Scrivete</b><small>ognuno le sue frasi segrete</small></div>
      <div class="harr">→</div>
      <div class="hstep"><span class="hic">🤫</span><b>2. Confessate</b><small>“L'ho fatto” o “Mai fatto”</small></div>
      <div class="harr">→</div>
      <div class="hstep"><span class="hic">💔</span><b>3. Scoprite</b><small>chi l'ha fatto perde una vita</small></div>
    </div>
    <h3>Le regole speciali</h3>
    <div class="hex">
      <div class="hcard hwin"><span class="hic">❤️</span><p><b>Vite:</b> partite tutti con 10 vite (o 5, o 15). Ogni “L'ho fatto” ne costa una.</p></div>
      <div class="hcard hwin"><span class="hic">🎯</span><p><b>Colpo all'autore:</b> se la frase è tua, per ogni amico che l'ha fatto <b>gli rubi una vita</b>. Anche se eri a zero torni in gioco!</p></div>
      <div class="hcard hwin"><span class="hic">🦄</span><p><b>Unico al mondo:</b> se sei l'unico ad averlo fatto perdi 2 vite (o, se l'host sceglie così, ne guadagni una).</p></div>
      <div class="hcard hwin"><span class="hic">🃏</span><p><b>Le vostre frasi:</b> prima di iniziare ognuno scrive le sue frasi “Non ho mai…” e si gioca con quelle. Se l'host attiva le frasi già pronte, si aggiungono quelle dei pacchetti (Serate, Viaggi, Figuracce, Piccante…).</p></div>
    </div>
    <h3>Modalità</h3>
    <div class="hmodes">
      <div class="hcard"><span class="hic">🌐</span><b>Online</b><small>Ognuno dal suo telefono, risposte segrete. Entri con codice, QR o invito.</small></div>
      <div class="hcard"><span class="hic">📱</span><b>Un solo telefono</b><small>Leggete la frase ad alta voce e segnate chi l'ha fatto.</small></div>
    </div>
    <h3>Chi vince</h3>
    <div class="hcard hwin"><span class="hic">🏆</span><p>Quando finiscono le frasi, o resta in vita uno solo, <b>vince chi ha più vite</b>. A fine partita arrivano i titoli: il più vissuto, l'angioletto, il cecchino…</p></div>
  </div>`;
}
function phraseCardStatic(t){return`<div class="pcard small"><div class="pnon">Non ho mai…</div><div class="ptext">${esc(t)}</div></div>`}
function renderVer(){const b=$('#verBtn');if(!b)return;const seen=ls.get('nonhomai_ver')===VERSION;b.innerHTML=`Non ho mai - ver <b>${VERSION}</b>${seen?'':'<span class="dot"></span>'}`;b.setAttribute('aria-label','Novità della versione '+VERSION)}
function openNotes(){
  ls.set('nonhomai_ver',VERSION);renderVer();
  const m=document.createElement('div');m.className='modal';
  const news=NOTES.map((n,k)=>`<div class="pn ${k===0?'latest':''}"><div class="pnh"><span class="pnv">v${n.v}</span>${k===0?'<span class="pnnow">attuale</span>':''}<small>${esc(n.d)}</small></div>
      ${n.first?'<p class="pnfirst">🎉 Prima versione di Non ho mai. Benvenuto!</p>':`<ul class="pnl">${n.items.map(([t,x])=>`<li><span class="ptag ${NTAG[t][1]}">${NTAG[t][0]}</span><span>${esc(x)}</span></li>`).join('')}</ul>`}</div>`).join('');
  m.innerHTML=`<div class="sheet notes" role="dialog" aria-label="Novità"><div class="grab"></div><h2 style="margin:4px 0 14px">Novità</h2>${news}<button class="btn ghost big close" type="button" style="margin-top:18px">Chiudi</button></div>`;
  const close=()=>{m.classList.add('closing');setTimeout(()=>m.remove(),200)};
  m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.close'))close()});
  document.body.appendChild(m);
}
