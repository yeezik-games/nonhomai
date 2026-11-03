// ===== Non ho mai · gioco online (logica dell'host, rete, schermate della stanza) =====
const LIVES_OPT=[5,10,15],WRITE_OPT=[0,1,2,3],ROUNDS_OPT=[10,15,20,30];
const UNICO={pen:{t:'−2 vite',d:'Chi è l\'unico ad averlo fatto perde 2 vite'},bonus:{t:'+1 vita',d:'Chi è l\'unico ad averlo fatto guadagna 1 vita'}};
let myDraft=[];

// ===== Stato =====
function newState(){return{phase:'lobby',hostId:me.id,players:[mkPlayer(me.id,me.name,me.color||COLORS[0],me.uid||null)],
  cfg:{lives:10,write:2,rounds:15,unico:'pen',packs:[...DEFAULT_PACKS]},
  written:{},queue:[],round:0,total:0,cur:null,answers:{},last:null,history:[],usedPack:[],matchId:null,rematch:[]}}
function mkPlayer(id,name,color,uid){return{id,name,color,uid,lives:10,did:0,never:0,uniques:0,stolen:0,out:null}}
function pickColor(S,want){const used=new Set(S.players.map(p=>p.color));if(want&&/^#[0-9a-fA-F]{6}$/.test(want)&&!used.has(want))return want;return COLORS.find(c=>!used.has(c))||COLORS[S.players.length%COLORS.length]}
function ensureMe(){const p=state.players.find(x=>x.id===me.id);if(p){p.name=me.name;p.uid=me.uid||null}else state.players.push(mkPlayer(me.id,me.name,pickColor(state,me.color),me.uid||null));state.hostId=me.id}
const alive=S=>S.players.filter(p=>p.lives>0);
const here=()=>state.players.filter(p=>online.has(p.id)).map(p=>p.id);

function resetPlayers(S){S.players.forEach(p=>Object.assign(p,{lives:S.cfg.lives,did:0,never:0,uniques:0,stolen:0,out:null}))}
function startMatch(){
  const S=state;resetPlayers(S);
  S.matchId=uuid();S.history=[];S.written={};S.wdone=[];S.queue=[];S.round=0;S.total=0;S.cur=null;S.answers={};S.last=null;S.rematch=[];
  if(S.cfg.write>0)S.phase='write';else buildQueue();
}
function packPool(S){
  const pool=[];S.cfg.packs.forEach(k=>{const P=PACKS[k];if(P)P.f.forEach(t=>pool.push({t,pack:k}))});
  const used=new Set(S.usedPack||[]);let fresh=pool.filter(x=>!used.has(x.t));
  if(fresh.length<S.cfg.rounds){S.usedPack=[];fresh=pool}
  return shuffle(fresh);
}
function buildQueue(){
  const S=state;
  const mine=[];for(const [id,arr] of Object.entries(S.written||{}))(arr||[]).forEach(t=>{if(S.players.some(p=>p.id===id))mine.push({t,by:id})});
  const total=Math.min(40,Math.max(S.cfg.rounds,mine.length));
  const fill=packPool(S).slice(0,Math.max(0,total-mine.length));
  // le frasi dei giocatori sparse lungo la partita, mai due dello stesso autore di fila se possibile
  let q=shuffle([...mine,...fill]);
  for(let i=1;i<q.length;i++)if(q[i].by&&q[i].by===q[i-1].by){const j=q.findIndex((x,k)=>k>i&&x.by!==q[i].by);if(j>0)[q[i],q[j]]=[q[j],q[i]]}
  S.queue=q;S.total=q.length;S.round=0;
  if(!S.total){S.phase='lobby';return}
  ask();
}
function ask(){const S=state;S.cur=S.queue[S.round];S.answers={};S.last=null;S.phase='ask';if(S.cur&&S.cur.pack){S.usedPack=S.usedPack||[];S.usedPack.push(S.cur.t)}}

// ===== Calcolo della rivelazione (condiviso con la modalità un solo telefono) =====
// players: [{id,lives}], yes: id che l'hanno fatto, author: id o null, unico:'pen'|'bonus'
function scoreRound(players,yes,answered,author,unico){
  const delta={},by=Object.fromEntries(players.map(p=>[p.id,p]));
  const unique=yes.length===1&&answered>=3?yes[0]:null;
  let stolen=0;const victims=[];
  yes.forEach(id=>{const p=by[id];if(!p||p.lives<=0)return;
    let d=-1;if(id===unique)d=unico==='bonus'?1:-2;
    d=Math.max(d,-p.lives);delta[id]=d;
    if(d<0&&author&&id!==author){stolen++;victims.push(id)}});
  if(author&&by[author]&&stolen)delta[author]=(delta[author]||0)+stolen;
  return{delta,unique,stolen,victims};
}
function reveal(){
  const S=state;if(S.phase!=='ask')return;
  const yes=Object.keys(S.answers).filter(id=>S.answers[id]===true&&S.players.some(p=>p.id===id));
  const no=Object.keys(S.answers).filter(id=>S.answers[id]===false&&S.players.some(p=>p.id===id));
  const author=S.cur.by&&S.players.some(p=>p.id===S.cur.by)?S.cur.by:null;
  const before=Object.fromEntries(S.players.map(p=>[p.id,p.lives]));
  const r=scoreRound(S.players,yes,yes.length+no.length,author,S.cfg.unico);
  S.players.forEach(p=>{
    if(yes.includes(p.id))p.did++;else if(no.includes(p.id))p.never++;
    if(r.unique===p.id)p.uniques++;
    if(p.id===author)p.stolen+=r.stolen;
    p.lives=Math.max(0,Math.min(99,p.lives+(r.delta[p.id]||0)));
    if(before[p.id]>0&&p.lives===0&&p.out==null)p.out=S.round;
    if(p.lives>0)p.out=null;
  });
  const fell=S.players.filter(p=>before[p.id]>0&&p.lives===0).map(p=>p.id);
  const back=S.players.filter(p=>before[p.id]===0&&p.lives>0).map(p=>p.id);
  S.last={yes,no,delta:r.delta,unique:r.unique,stolen:r.stolen,author,fell,back};
  S.history.push({round:S.round,t:S.cur.t,by:author,pack:S.cur.pack||null,yes,no,delta:r.delta,unique:r.unique,stolen:r.stolen});
  S.phase='reveal';
}
function nextRound(){
  const S=state;S.round++;
  const al=alive(S).length;
  if(S.round>=S.total||(S.players.length>=2&&al<=1))S.phase='end';else ask();
}
function autoWrite(){const S=state;if(!S||S.phase!=='write')return;const h=here();if(h.length&&h.every(id=>(S.wdone||[]).includes(id)))buildQueue()}
function autoReveal(){const S=state;if(!S||S.phase!=='ask')return;const h=here();if(h.length&&h.every(id=>S.answers[id]!=null))reveal()}
function doRematch(){
  const S=state;S.players=S.players.filter(p=>online.has(p.id)||p.id===S.hostId);S.rematch=[];
  if(S.players.length<2){S.phase='lobby';return}
  startMatch();
}
function canStart(S){return S.players.length>=2&&(S.cfg.write>0||S.cfg.packs.length>0)}

function handle(a){
  const S=state;if(!S)return;const p=S.players.find(x=>x.id===a.from),isH=a.from===S.hostId;
  switch(a.type){
    case 'join':{const name=String(a.name||'?').trim().slice(0,22)||'?';const uid=typeof a.uid==='string'&&/^[0-9a-f-]{36}$/.test(a.uid)?a.uid:null;
      if(p){p.name=name;p.uid=uid}else{const np=mkPlayer(a.from,name,pickColor(S,a.color),uid);
        if(S.phase==='lobby')np.lives=S.cfg.lives;else{const al=alive(S).map(x=>x.lives);np.lives=al.length?Math.max(1,Math.min(...al)):S.cfg.lives}
        S.players.push(np)}break}
    case 'cfg':if(isH&&S.phase==='lobby'){const c=a.cfg||{};
      if(LIVES_OPT.includes(c.lives))S.cfg.lives=c.lives;if(WRITE_OPT.includes(c.write))S.cfg.write=c.write;if(ROUNDS_OPT.includes(c.rounds))S.cfg.rounds=c.rounds;
      if(UNICO[c.unico])S.cfg.unico=c.unico;if(Array.isArray(c.packs))S.cfg.packs=c.packs.filter(k=>PACKS[k]);
      S.players.forEach(x=>x.lives=S.cfg.lives)}break;
    case 'start':if(isH&&S.phase==='lobby'&&canStart(S))startMatch();break;
    case 'write':if(S.phase==='write'&&p){S.written[a.from]=(Array.isArray(a.list)?a.list:[]).map(cleanPhrase).filter(Boolean).slice(0,3);markDone(S,a.from);autoWrite()}break;
    case 'unwrite':if(S.phase==='write'){delete S.written[a.from];S.wdone=(S.wdone||[]).filter(x=>x!==a.from)}break;
    case 'gowrite':if(isH&&S.phase==='write')buildQueue();break;
    case 'answer':if(S.phase==='ask'&&p){S.answers[a.from]=!!a.v;autoReveal()}break;
    case 'unanswer':if(S.phase==='ask')delete S.answers[a.from];break;
    case 'reveal':if(isH&&S.phase==='ask')reveal();break;
    case 'next':if(isH&&S.phase==='reveal')nextRound();break;
    case 'skip':if(isH&&S.phase==='ask'){S.round++;if(S.round>=S.total)S.phase='end';else ask()}break;
    case 'endnow':if(isH&&(S.phase==='ask'||S.phase==='reveal'))S.phase='end';break;
    case 'kick':if(isH&&a.id!==S.hostId){S.players=S.players.filter(x=>x.id!==a.id);delete S.answers[a.id];delete S.written[a.id];S.wdone=(S.wdone||[]).filter(x=>x!==a.id);autoWrite();autoReveal()}break;
    case 'again':if(isH&&S.phase==='end'){S.phase='lobby';S.rematch=[];resetPlayers(S)}break;
    case 'rematch':if(S.phase==='end'&&p){if(!S.rematch.includes(a.from))S.rematch.push(a.from);
      const h=here();if(isH||(h.length>=2&&h.every(id=>S.rematch.includes(id))))doRematch()}break;
    default:return;
  }
  push();
}
function markDone(S,id){S.wdone=S.wdone||[];if(!S.wdone.includes(id))S.wdone.push(id)}
function cleanPhrase(t){let s=String(t||'').replace(/\s+/g,' ').trim().replace(/^non\s+ho\s+mai\s*/i,'').replace(/[.!]+$/,'').slice(0,90);return s}

// ===== Rete =====
function push(){if(!isHost||!state)return;ls.set('nonhomai_host',{code,state,at:Date.now()});if(channel)channel.send({type:'broadcast',event:'state',payload:state});render()}
function send(a){a.from=me.id;if(isHost)handle(a);else if(channel)channel.send({type:'broadcast',event:'action',payload:a})}
async function enterRoom(c,host){try{await enterRoomInner(c,host)}catch(e){console.error(e);leave();state=null;goHome('Impossibile collegarsi: '+(e&&e.message||e))}}
async function enterRoomInner(c,host){
  const client=getClient();
  code=c;isHost=host;online=new Set();lastKey='';seenPlayers=new Set();prevLives={};
  $('#tabs').innerHTML='';document.body.classList.remove('has-tabs');
  if(window.onEnteredRoom)onEnteredRoom(c);
  setUrl('?r='+c);
  if(channel){try{await client.removeChannel(channel)}catch(e){}}
  $('#top').innerHTML='';$('#app').className='';
  $('#app').innerHTML=`<div class="center"><div class="spin"></div>Connessione alla stanza ${esc(c)}…</div>`;lastKey='connecting';
  if(!host)state=null;
  channel=client.channel('nonhomai-'+c,{config:{broadcast:{self:false},presence:{key:me.id}}});
  channel
    .on('broadcast',{event:'state'},({payload})=>{
      if(isHost)return;clearTimeout(joinTimer);state=payload;
      if(!state.players.find(p=>p.id===me.id)&&Date.now()-lastJoin>2000){lastJoin=Date.now();send({type:'join',name:me.name,uid:me.uid,color:me.color})}
      render();
    })
    .on('broadcast',{event:'action'},({payload})=>{if(isHost)handle(payload)})
    .on('broadcast',{event:'hello'},()=>{if(isHost)push()})
    .on('presence',{event:'sync'},()=>{online=new Set(Object.keys(channel.presenceState()));if(isHost&&state){autoWrite();autoReveal();push()}else render()})
    .subscribe(async st=>{
      if(st==='SUBSCRIBED'){
        await channel.track({name:me.name});
        if(isHost){ensureMe();push()}
        else{
          lastJoin=Date.now();send({type:'join',name:me.name,uid:me.uid,color:me.color});
          channel.send({type:'broadcast',event:'hello',payload:{}});
          clearTimeout(joinTimer);
          joinTimer=setTimeout(()=>{if(!state){leave();goHome(`Stanza ${c} non trovata. Controlla il codice: chi l'ha creata deve avere la pagina aperta.`)}},6000);
        }
      }else if(st==='CHANNEL_ERROR'||st==='TIMED_OUT'){toast('Connessione instabile, riprovo…')}
    });
  if(host){clearTimeout(joinTimer);joinTimer=setTimeout(()=>{if(lastKey==='connecting'){leave();state=null;goHome("Il server di gioco non risponde. Apri il gioco dal suo link online (GitHub Pages) e non dall'anteprima o dal file sul computer, poi riprova.")}},9000)}
}
function leave(){clearTimeout(joinTimer);if(channel&&sbc){try{sbc.removeChannel(channel)}catch(e){}}channel=null;state=null;code=null;isHost=false;online=new Set();setUrl(location.pathname);if(window.onLeftRoom)onLeftRoom()}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&channel){try{channel.track({name:me.name})}catch(e){}if(!isHost)channel.send({type:'broadcast',event:'hello',payload:{}})}});

// ===== Pezzi grafici =====
const playerOf=id=>state.players.find(x=>x.id===id)||{name:'?',color:'#fff'};
const packTag=c=>c&&c.pack&&PACKS[c.pack]?`<span class="ptagc">${PACKS[c.pack].e} ${esc(PACKS[c.pack].t)}</span>`:`<span class="ptagc mine">🤫 Scritta da uno di voi</span>`;
function phraseCard(t,o={}){
  return`<div class="pcard ${o.cls||''}">${o.tag||''}<div class="pnon">Non ho mai…</div><div class="ptext">${esc(t)}</div></div>`;
}
function writeLine(i,v){return`<label class="wline"><span class="wpre">Non ho mai</span><input class="win" data-i="${i}" maxlength="90" placeholder="${esc(IDEAS[(i*7+(state?state.players.length:0))%IDEAS.length])}…" value="${esc(v||'')}" autocomplete="off"></label>`}
const IDEAS=['mangiato un intero barattolo di Nutella','dormito in macchina','finto di essere malato','cantato in pubblico','perso un volo','urlato contro un arbitro','ballato da solo in cucina','fatto un tatuaggio','tagliato i capelli da solo','mangiato sushi a colazione'];
function deltaChip(d){if(!d)return'';return d>0?`<b class="dl up">+${d} ${HEART}</b>`:`<b class="dl down">${d} ${HEART}</b>`}

// ===== Schermate =====
const VIEWS={
  lobby:()=>{const S=state,c=S.cfg;return`
    <div class="card share"><div class="lbl">Codice stanza</div><div class="bigcode">${[...code].map((ch,i)=>`<span style="--i:${i}">${esc(ch)}</span>`).join('')}</div><div id="qr" class="qr"></div><button class="btn ghost sm" data-a="copy">Condividi link d'invito</button></div>
    <h3>Giocatori</h3>
    <div id="plist" class="plist"></div>
    <div id="invfr"></div>
    <h3>Regole della partita</h3>
    <div id="cfg"></div>
    ${isHost?`<button class="btn primary big" data-a="start" id="startBtn" style="margin-top:18px">Inizia la partita</button>`:`<p class="wait" style="margin-top:16px">In attesa che l'host avvii la partita…</p>`}`},
  write:()=>{
    const S=state,n=S.cfg.write,done=(S.wdone||[]).includes(me.id);
    if(!myDraft.length)myDraft=Array(n).fill('');
    if(done)return`<div class="role">Frasi inviate ✓</div><div class="orb"><div class="ring"></div><div class="ring r2"></div><span>🤫</span></div>
      <p class="hint">Restano segrete: nessuno saprà che sono tue finché non escono.</p><div id="status"></div>
      <button class="btn ghost big" data-a="unwrite" style="margin-top:14px">Modifica le mie frasi</button><div id="hostbar"></div>`;
    return`<div class="role">Scrivi ${n===1?'la tua frase':'le tue '+n+' frasi'} 🤫</div>
      <p class="hint">Pensa a cose che <b>tu non hai mai fatto</b> ma che sospetti abbiano fatto gli altri: per ogni amico che l'ha fatto, <b>gli rubi una vita</b>.</p>
      <div class="wlist">${Array.from({length:n},(_,i)=>writeLine(i,myDraft[i])).join('')}</div>
      <div class="row"><button class="btn ghost" data-a="idea">🎲 Ispirami</button><button class="btn primary" data-a="write">Invia</button></div>
      <div id="status"></div><div id="hostbar"></div>`;
  },
  ask:()=>{
    const S=state,mine=S.answers[me.id],mp=playerOf(me.id),mineAuthor=S.cur&&S.cur.by===me.id;
    const card=phraseCard(S.cur.t,{tag:mineAuthor?'<span class="ptagc gold">✍️ È la tua frase</span>':packTag(S.cur)});
    const dead=mp.lives<=0?`<p class="hint ghostn">💀 Sei senza vite: rispondi lo stesso, conta per le statistiche</p>`:'';
    if(mine!=null)return`${card}<div class="chosen ${mine?'yes':'no'}"><span>${mine?'🙋':'😇'}</span><b>${mine?"L'ho fatto":'Mai fatto'}</b><small>Risposta segreta, si scopre tra poco</small></div>
      <button class="btn ghost big" data-a="unanswer">Cambia risposta</button>${dead}<div id="status"></div><div id="hostbar"></div>`;
    return`${card}<div class="answers"><button class="abtn yes" data-a="yes"><span>🙋</span><b>L'ho fatto</b><small>${mineAuthor?'Anche se l\'hai scritta tu':'Perdi una vita'}</small></button><button class="abtn no" data-a="no"><span>😇</span><b>Mai fatto</b><small>Ti salvi</small></button></div>
      ${dead}<p class="hint">Rispondi in segreto e con onestà 🤞</p><div id="status"></div><div id="hostbar"></div>`;
  },
  reveal:()=>{
    const S=state,L=S.last,last=S.round+1>=S.total;
    const col=(ids,cls)=>ids.map((id,i)=>{const p=playerOf(id);return`<div class="rp ${cls}" style="--d:${(.55+i*.12).toFixed(2)}s">${av(p)}<span class="rpn">${nm(p)}</span>${deltaChip(L.delta[id])}</div>`}).join('')||'<p class="empty">Nessuno</p>';
    const ap=L.author?playerOf(L.author):null;
    let ban='';
    if(L.unique){const p=playerOf(L.unique);ban+=`<div class="banner uni">🦄 <span><b>${nm(p)} è unico al mondo!</b><small>${S.cfg.unico==='bonus'?'Leggenda: guadagna una vita':'Unico ad averlo fatto: perde 2 vite'}</small></span></div>`}
    if(ap)ban+=L.stolen?`<div class="banner steal">🎯 <span><b>Colpo di ${nm(ap)}!</b><small>Era sua la frase: ruba ${L.stolen} ${L.stolen===1?'vita':'vite'}</small></span></div>`:`<div class="banner miss">✍️ <span><b>Frase di ${nm(ap)}</b><small>Colpo a vuoto: nessuno l'ha fatto</small></span></div>`;
    L.fell.forEach(id=>{ban+=`<div class="banner dead">💀 <span><b>${nm(playerOf(id))} è senza vite!</b><small>Può tornare in gioco solo rubandone con le sue frasi</small></span></div>`});
    L.back.forEach(id=>{ban+=`<div class="banner back">✨ <span><b>${nm(playerOf(id))} torna in vita!</b></span></div>`});
    const al=alive(S).length,ending=last||(S.players.length>=2&&al<=1);
    return`${phraseCard(S.cur.t,{tag:ap?`<span class="ptagc gold">✍️ Scritta da ${nm(ap)}</span>`:packTag(S.cur),cls:'small'})}
      <div class="cols"><div class="colr yes"><div class="colh">🙋 L'hanno fatto · ${L.yes.length}</div>${col(L.yes,'yes')}</div><div class="colr no"><div class="colh">😇 Mai fatto · ${L.no.length}</div>${col(L.no,'no')}</div></div>
      <div class="banners">${ban}</div>
      ${isHost?`<button class="btn primary big" data-a="next">${ending?'Vedi la classifica 🏆':'Prossima frase →'}</button>`:`<p class="wait">In attesa dell'host…</p>`}`;
  },
  end:()=>{
    const S=state,sorted=rank(S.players);
    const top=[sorted[1],sorted[0],sorted[2]],cls=['p2','p1','p3'],delay=[.9,1.4,.5],medal=['🥈','🥇','🥉'];
    const pod=top.map((p,i)=>p?`<div class="pod ${cls[i]}" style="--d:${delay[i]}s">${i===1?'<div class="crown">👑</div>':''}${av(p,'lg')}<div class="nm">${nm(p)}</div><div class="col"><small>${medal[i]}</small><span class="hv">${HEART}${p.lives}</span></div></div>`:'').join('');
    const rest=sorted.slice(3).map((p,i)=>`<div class="ri" style="animation-delay:${(1.8+i*.1).toFixed(2)}s"><span class="pos">${p.pos}</span>${av(p)}${nm(p)}<b><span class="hv sm">${HEART}${p.lives}</span></b></div>`).join('');
    return`<h2>Classifica finale</h2><p class="hint">Vince chi ha più vite: il più “santo” del gruppo 😇</p><div class="podium">${pod}</div>${rest?`<div class="res rest">${rest}</div>`:''}
      <h3>I titoli della serata</h3>${titlesHtml(matchTitles(S.players,S.history,id=>playerOf(id)))}
      <button class="btn big sharebtn" data-go="share" style="margin-top:20px">📸 Condividi il risultato</button>
      <button class="btn primary big" data-a="rematch" id="rematchBtn" style="margin-top:10px">🔁 Rivincita</button>
      <div id="rematchst"></div>
      ${isHost?`<button class="btn ghost big" data-a="again" style="margin-top:10px">Cambia giocatori o regole</button>`:''}
      <button class="btn ghost big" data-a="exit-end" style="margin-top:10px">Torna alla home</button>`;
  }
};
// classifica: più vite, poi meno "l'ho fatto"
function rank(players){
  const s=[...players].sort((a,b)=>b.lives-a.lives||a.did-b.did);
  s.forEach(p=>p.pos=1+s.filter(q=>q.lives>p.lives||(q.lives===p.lives&&q.did<p.did)).length);
  return s;
}
// titoli di fine partita
function matchTitles(players,history,pOf){
  const T=[],n=players.length;if(!history||!history.length)return T;
  const mx=(k,min=1)=>{const v=Math.max(...players.map(p=>p[k]||0));if(v<min)return null;return players.filter(p=>(p[k]||0)===v)};
  const mn=k=>{const v=Math.min(...players.map(p=>p[k]||0));return players.filter(p=>(p[k]||0)===v)};
  const names=a=>a.map(p=>p.name);
  const v=mx('did');if(v&&v.length<n)T.push({e:'😈',t:'Il più vissuto',who:v,s:`${v[0].did} ${v[0].did===1?'cosa fatta':'cose fatte'}`});
  const a=mn('did');if(a.length<n)T.push({e:'😇',t:"L'angioletto",who:a,s:a[0].did?`solo ${a[0].did}`:'non ha fatto niente!'});
  const u=mx('uniques');if(u)T.push({e:'🦄',t:'Unico al mondo',who:u,s:`${u[0].uniques} ${u[0].uniques===1?'volta':'volte'} l'unico`});
  const c=mx('stolen');if(c)T.push({e:'🎯',t:'Il cecchino',who:c,s:`${c[0].stolen} ${c[0].stolen===1?'vita rubata':'vite rubate'}`});
  const f=[...players].filter(p=>p.out!=null).sort((x,y)=>x.out-y.out)[0];if(f&&f.lives===0)T.push({e:'💀',t:'Il primo a cadere',who:[f],s:`alla frase ${f.out+1}`});
  const best=[...history].sort((x,y)=>y.yes.length-x.yes.length)[0];
  if(best&&best.yes.length)T.push({e:'🔥',t:'La frase della serata',phrase:best.t,s:`l'hanno fatto in ${best.yes.length} su ${best.yes.length+best.no.length}`+(best.by?` · di ${(pOf(best.by)||{}).name||'?'}`:'')});
  return T;
}
function titlesHtml(T){
  if(!T.length)return'<p class="empty">Giocate qualche frase in più per sbloccare i titoli</p>';
  return`<div class="titles">${T.map((x,i)=>`<div class="tcard ${x.phrase?'wide':''}" style="--d:${(1.6+i*.12).toFixed(2)}s"><span class="te">${x.e}</span><div class="tt"><small>${x.t}</small>${x.phrase?`<b>“Non ho mai ${esc(x.phrase)}”</b>`:`<b>${x.who.map(p=>nm(p)).join(', ')}</b>`}<span>${esc(x.s)}</span></div></div>`).join('')}</div>`;
}

function renderTop(){
  const S=state,inGame=S.phase!=='lobby';
  const sorted=inGame?rank(S.players):S.players;
  const pct=S.total?Math.min(100,(S.round+1)/S.total*100):0;
  const lost=new Set(S.players.filter(p=>prevLives[p.id]!=null&&p.lives<prevLives[p.id]).map(p=>p.id));
  const gained=new Set(S.players.filter(p=>prevLives[p.id]!=null&&p.lives>prevLives[p.id]).map(p=>p.id));
  prevLives=Object.fromEntries(S.players.map(p=>[p.id,p.lives]));
  $('#top').innerHTML=`<div class="bar g3"><button class="exit" data-a="exit" aria-label="Esci dalla partita"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>Esci</button><button class="codechip" data-a="copy" aria-label="Condividi il codice ${esc(code)}">🔗 ${esc(code)}</button>${soundBtn('iconbtn sm sndb')}</div>${(S.phase==='ask'||S.phase==='reveal')?`<div class="rndrow"><span class="rnd">Frase ${Math.min(S.round+1,S.total)}/${S.total}<span class="prog"><span style="width:${pct}%"></span></span></span></div>`:''}
  ${inGame&&S.phase!=='write'?`<div class="scores">${sorted.map(p=>`<span class="sc ${online.has(p.id)?'':'off'} ${p.lives<=0?'dead':''} ${p.id===me.id?'me':''} ${lost.has(p.id)?'hit':''} ${gained.has(p.id)?'heal':''}">${av(p,'sm')}${nm(p)} <b class="hv sm">${HEART}${p.lives}</b></span>`).join('')}</div>`:''}`;
}
function render(){
  if(!state||!code)return;
  const S=state;
  if($('#tabs').innerHTML){$('#tabs').innerHTML='';document.body.classList.remove('has-tabs')}
  if(S.phase!=='write')myDraft=[];
  renderTop();
  const wd=(S.wdone||[]).includes(me.id),ans=S.answers&&S.answers[me.id];
  const key=[S.phase,S.round,S.matchId,isHost?'H':'',S.phase==='write'?wd:'',S.phase==='ask'?String(ans):''].join('#');
  if(key!==lastKey){
    const prevPhase=lastKey.split('#')[0];
    lastKey=key;
    $('#app').innerHTML=(VIEWS[S.phase]||VIEWS.lobby)();
    enterAnim();
    bindWrite();
    const qr=$('#qr');if(qr&&window.QRCode){try{new QRCode(qr,{text:inviteLink(),width:150,height:150,colorDark:'#120f1f',colorLight:'#ffffff'})}catch(e){}}
    if(S.phase==='ask'&&prevPhase!=='ask'){buzz(25);SFX.chime()}
    if(S.phase==='reveal'&&prevPhase!=='reveal'){revealFx(S.last,me.id)}
    if(S.phase==='end'&&prevPhase!=='end'){confetti(200,1500);SFX.fanfare(1.2);setTimeout(()=>confetti(120),2600);if(window.recordMatch)recordMatch()}
  }
  updateDyn();
}
function revealFx(L,myId){
  if(!L)return;buzz([20,60,20]);SFX.drum(.05,.45);
  L.yes.forEach((id,i)=>SFX.ding(i,.55+i*.12));
  const d=L.delta[myId];
  setTimeout(()=>{if(d<0){SFX.hurt();buzz([60,40,60])}else if(d>0)SFX.heal()},700+L.yes.length*120);
  if(L.unique)setTimeout(()=>{SFX.bull();confetti(90)},1200);
  else if(L.stolen)setTimeout(()=>SFX.steal(),1200);
}
function bindWrite(){document.querySelectorAll('.win').forEach(i=>{i.oninput=()=>{myDraft[+i.dataset.i]=i.value};i.onkeydown=e=>{if(e.key==='Enter'){const nx=document.querySelector(`.win[data-i="${+i.dataset.i+1}"]`);if(nx)nx.focus();else act('write')}}})}
function cfgHtml(S){
  const c=S.cfg,dis=isHost?'':'disabled';
  const seg=(k,opts,lab)=>`<div class="seg">${opts.map(v=>`<button type="button" ${dis} data-a="cfg" data-k="${k}" data-v="${v}" class="${c[k]===v?'on':''}">${lab(v)}</button>`).join('')}</div>`;
  return`<div class="cfgbox">
    <div class="setting"><span>❤️ Vite iniziali</span>${seg('lives',LIVES_OPT,v=>v)}</div>
    <div class="setting"><span>✍️ Frasi da scrivere a testa</span>${seg('write',WRITE_OPT,v=>v)}</div>
    <div class="setting"><span>🃏 Frasi in partita</span>${seg('rounds',ROUNDS_OPT,v=>v)}</div>
    <div class="setting"><span>🦄 Unico al mondo</span><div class="seg">${Object.entries(UNICO).map(([k,u])=>`<button type="button" ${dis} data-a="cfg" data-k="unico" data-v="${k}" class="${c.unico===k?'on':''}">${u.t}</button>`).join('')}</div></div>
    <div class="lbl" style="margin:16px 0 8px">Pacchetti di frasi</div>
    <div class="packs">${PACK_KEYS.map(k=>{const P=PACKS[k],on=c.packs.includes(k);return`<button type="button" ${dis} class="pack ${on?'on':''}" data-a="pack" data-k="${k}"><span>${P.e}</span><b>${P.t}</b><small>${P.d}</small></button>`}).join('')}</div>
    ${c.write>0?`<p class="hint small">Prima di iniziare ognuno scrive ${c.write} ${c.write===1?'frase':'frasi'}: le vostre escono tutte, il resto arriva dai pacchetti.</p>`:''}
  </div>`;
}
function updateDyn(){
  const S=state;
  const pl=$('#plist');if(pl){pl.innerHTML=S.players.map(p=>{const isNew=!seenPlayers.has(p.id);return`<div class="pl ${online.has(p.id)?'':'off'} ${isNew?'new':''}">${av(p)}<span>${nm(p)}</span>${p.id===S.hostId?'<em>host</em>':''}${p.id===me.id?'<em>tu</em>':''}${isHost&&!online.has(p.id)&&p.id!==S.hostId?`<button class="x" data-a="kick" data-id="${p.id}">rimuovi</button>`:''}</div>`}).join('');if(seenPlayers.size&&S.players.some(p=>!seenPlayers.has(p.id)&&p.id!==me.id))SFX.join();S.players.forEach(p=>seenPlayers.add(p.id))}
  const cf=$('#cfg');if(cf)cf.innerHTML=cfgHtml(S);
  const startB=$('#startBtn');if(startB){const few=S.players.length<2;startB.disabled=!canStart(S);startB.textContent=few?'Servono almeno 2 giocatori':!canStart(S)?'Scegli almeno un pacchetto':`Inizia la partita (${S.players.length} giocatori)`}
  const st=$('#status');if(st){
    const done=id=>S.phase==='write'?(S.wdone||[]).includes(id):S.answers[id]!=null;
    st.innerHTML=`<div class="chips">${S.players.map(p=>{const d=done(p.id);return`<span class="chip ${d?'done':''} ${online.has(p.id)?'':'off'}">${av(p,'sm')}${nm(p)} <span class="st">${d?'✅':'⏳'}</span></span>`}).join('')}</div>`}
  const rb=$('#rematchBtn');if(rb){const votes=(S.rematch||[]).filter(id=>S.players.some(p=>p.id===id)),mine=votes.includes(me.id),others=votes.filter(v=>v!==me.id).length;
    rb.disabled=!isHost&&mine;rb.textContent=isHost?(others?`🔁 Rivincita · ${others} ${others===1?'pronto':'pronti'}`:'🔁 Rivincita'):mine?'Pronto! Aspetto gli altri…':'🔁 Rivincita';
    const rs=$('#rematchst');if(rs)rs.innerHTML=votes.length?`<p class="hint" style="margin:10px 0 0">Vogliono la rivincita:</p><div class="chips" style="margin-top:6px">${votes.map(id=>{const p=playerOf(id);return`<span class="chip done">${av(p,'sm')}${nm(p)}</span>`}).join('')}</div>`:''}
  if(window.renderInviteFriends)renderInviteFriends();
  const hb=$('#hostbar');if(hb)hb.innerHTML=isHost?(S.phase==='write'?'<button class="btn ghost sm" data-a="gowrite">Inizia senza aspettare</button>':S.phase==='ask'?`${Object.keys(S.answers).length?'<button class="btn ghost sm" data-a="reveal">Rivela ora</button>':''}<button class="btn ghost sm" data-a="skip">Salta frase</button><button class="btn ghost sm" data-a="endnow">Termina</button>`:''):'';
}

// ===== Azioni UI =====
async function copyLink(){const link=inviteLink();if(navigator.share){try{await navigator.share({title:'Non ho mai',text:'Entra nella mia stanza di Non ho mai: '+code,url:link});return}catch(e){if(e&&e.name==='AbortError')return}}try{await navigator.clipboard.writeText(link);toast('Link copiato!')}catch(e){prompt('Copia il link:',link)}}
function act(a,el){
  const S=state;
  switch(a){
    case 'copy':copyLink();break;
    case 'exit':if(confirm(isHost?"Sei l'host: se esci la partita si ferma per tutti (potrai riprenderla dalla home). Uscire?":'Uscire dalla stanza?')){leave();goHome()}break;
    case 'cfg':{const k=el.dataset.k,v=k==='unico'?el.dataset.v:+el.dataset.v;send({type:'cfg',cfg:{...S.cfg,[k]:v}});SFX.tap();break}
    case 'pack':{const k=el.dataset.k,p=S.cfg.packs.includes(k)?S.cfg.packs.filter(x=>x!==k):[...S.cfg.packs,k];send({type:'cfg',cfg:{...S.cfg,packs:p}});SFX.tap();break}
    case 'start':buzz(30);send({type:'start'});break;
    case 'kick':send({type:'kick',id:el.dataset.id});break;
    case 'idea':{const ins=[...document.querySelectorAll('.win')];const empty=ins.find(i=>!i.value.trim())||ins[Math.floor(Math.random()*ins.length)];if(!empty)return;const pool=[].concat(...PACK_KEYS.filter(k=>k!=='piccante').map(k=>PACKS[k].f));empty.value=pool[Math.floor(Math.random()*pool.length)];myDraft[+empty.dataset.i]=empty.value;SFX.pop();empty.focus();break}
    case 'write':{const list=[...document.querySelectorAll('.win')].map(i=>cleanPhrase(i.value));if(list.some(x=>!x)){toast(list.length>1?'Completa tutte le frasi':'Completa la frase');const e=[...document.querySelectorAll('.win')].find(i=>!cleanPhrase(i.value));if(e)e.focus();return}
      if(new Set(list.map(x=>x.toLowerCase())).size<list.length){toast('Hai scritto due frasi uguali');return}
      buzz(20);SFX.whoosh();send({type:'write',list});break}
    case 'unwrite':send({type:'unwrite'});break;
    case 'gowrite':if(confirm('Iniziare adesso? Le frasi di chi non ha finito non entrano in partita.'))send({type:'gowrite'});break;
    case 'yes':buzz(25);SFX.pop();send({type:'answer',v:true});break;
    case 'no':buzz(25);SFX.pop();send({type:'answer',v:false});break;
    case 'unanswer':send({type:'unanswer'});break;
    case 'reveal':send({type:'reveal'});break;
    case 'skip':if(confirm('Saltare questa frase? Nessuno perde vite.'))send({type:'skip'});break;
    case 'endnow':if(confirm('Terminare la partita adesso e vedere la classifica?'))send({type:'endnow'});break;
    case 'next':send({type:'next'});break;
    case 'again':send({type:'again'});break;
    case 'rematch':buzz(20);SFX.pop();send({type:'rematch'});break;
    case 'exit-end':leave();goHome();break;
  }
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&!b.disabled)act(b.dataset.a,b)});
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b&&!b.disabled&&window.go)go(b.dataset.go,b)});
