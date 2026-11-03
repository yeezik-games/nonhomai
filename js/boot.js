// ===== Non ho mai · avvio (dopo che tutti i file sono caricati) =====
// ===== Avvio =====
(async function boot(){
  renderVer();
  const qp=new URLSearchParams(location.search),hp=new URLSearchParams(location.hash.slice(1));
  const r=(qp.get('r')||'').toUpperCase().replace(/[^A-Z]/g,'');
  if(r.length===4)pendingRoom=r;
  const oerr=hp.get('error_description')||qp.get('error_description');
  if(sbc)loadBadges();
  if(!sbc){show('welcome','Libreria di connessione non caricata. Controlla la connessione internet e ricarica la pagina.');return}
  $('#app').innerHTML=`<div class="center"><div class="spin"></div>Avvio…</div>`;
  let recoveryShown=false;const recover=()=>{if(recoveryShown)return;recoveryShown=true;setTimeout(openNewPassword,600)};
  sbc.auth.onAuthStateChange((ev,sess)=>{if(ev==='PASSWORD_RECOVERY')recover();if(ev==='SIGNED_IN'||ev==='SIGNED_OUT'||ev==='PASSWORD_RECOVERY')setTimeout(()=>onSession(sess),0)});
  let s=null;try{const {data}=await sbc.auth.getSession();s=data.session}catch(e){}
  if(RECOVERY&&s)recover();
  if(s)await onSession(s);
  else if(pendingRoom&&me.name){const c=pendingRoom;pendingRoom=null;joinRoom(c)}
  else{show('welcome','',{root:true});if(pendingRoom)setTimeout(()=>{if(!code&&!profile&&pendingRoom)openNameSheet(()=>{const r=pendingRoom;pendingRoom=null;if(r)joinRoom(r)},pendingRoom)},350)}
  if(oerr)toast(decodeURIComponent(oerr).replace(/\+/g,' '),5000);
  if(location.hash&&/access_token|error/.test(location.hash))setUrl(location.pathname+location.search);
})();
