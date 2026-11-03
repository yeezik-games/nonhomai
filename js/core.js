// ===== Non ho mai · base comune (connessione, utility, identità) =====
const SB_URL='https://ncwuekrvibuynvozqyqx.supabase.co';
const SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jd3Vla3J2aWJ1eW52b3pxeXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2MDM0NTQsImV4cCI6MjEwOTE3OTQ1NH0.bQ84kmd0dDVTykZgCceOPjMHXE3y99lwP8RLEQozQJU';
const RECOVERY=/type=recovery/.test(location.hash);
const sbc=window.supabase?supabase.createClient(SB_URL,SB_KEY,{realtime:{params:{eventsPerSecond:20}}}):null;
function getClient(){if(!sbc)throw new Error('Libreria di connessione non caricata. Controlla la connessione internet e ricarica la pagina.');return sbc}
function setUrl(q){try{history.replaceState(null,'',q)}catch(e){}}
const webOk=/^https?:$/.test(location.protocol);

// ===== Utility =====
const ls={get(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function rid(n){const c='abcdefghijkmnpqrstuvwxyz23456789';let s='';for(let i=0;i<n;i++)s+=c[Math.floor(Math.random()*c.length)];return s}
function roomCode(){const c='ABCDEFGHJKLMNPQRSTUVWXYZ';let s='';for(let i=0;i<4;i++)s+=c[Math.floor(Math.random()*c.length)];return s}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function uuid(){try{return crypto.randomUUID()}catch(e){return'10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(c^Math.random()*16>>c/4).toString(16))}}
function toast(t,ms=2400){const el=$('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),ms)}
const buzz=ms=>{try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}};
const reduced=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}};
const inviteLink=()=>location.origin+location.pathname+'?r='+code;
const av=(p,cls='')=>`<span class="av ${cls}" style="--c:${p&&p.color||'#fff'}">${esc(((p&&(p.name||p.username))||'?').replace(/^anon_/,'')[0]?.toUpperCase()||'?')}</span>`;
let devIds=new Set();
const VBADGE='<svg class="vbadge" viewBox="0 0 24 24" role="img" aria-label="Sviluppatore verificato"><path fill="#4dd6ff" d="M12 1.5l2.6 1.9 3.2-.2 1 3.1 2.6 1.9-1 3.1 1 3.1-2.6 1.9-1 3.1-3.2-.2L12 22.5l-2.6-1.9-3.2.2-1-3.1-2.6-1.9 1-3.1-1-3.1 2.6-1.9 1-3.1 3.2.2z"/><path d="M7.6 12.3l3 3 5.8-6" fill="none" stroke="#120f1f" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const nm=p=>{const n=(p&&(p.name||p.username))||'?';const id=p&&(p.uid||p.id);return esc(n)+(id&&devIds.has(id)?VBADGE:'')};
const COLORS=['#ff5c8a','#4dd6ff','#ffd23f','#7cff6b','#b18cff','#ff9f43','#2ee6c5','#ff6bd6','#9ad1ff','#e8e8e8','#ff4f4f','#c6ff4d'];

// cuori delle vite
const HEART='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.4C.9 8.1 3 4 6.9 4c2.2 0 3.7 1.2 5.1 3 1.4-1.8 2.9-3 5.1-3C21 4 23.1 8.1 21.6 11.6 19.5 16.4 12 21 12 21z"/></svg>';
function hearts(n,max,cls=''){
  n=Math.max(0,n|0);max=Math.max(max|0,n);
  if(max>12)return`<span class="hearts ${cls}"><span class="h on">${HEART}</span><b class="hx">×${n}</b></span>`;
  let s='';for(let i=0;i<max;i++)s+=`<span class="h ${i<n?'on':''}">${HEART}</span>`;
  return`<span class="hearts ${cls}">${s}</span>`;
}

// stelline nello sfondo
(function(){const bg=$('.bg');for(let i=0;i<26;i++){const s=document.createElement('i');s.style.left=Math.random()*100+'%';s.style.top=Math.random()*100+'%';s.style.animationDelay=(Math.random()*4)+'s';s.style.animationDuration=(3+Math.random()*4)+'s';bg.appendChild(s)}})();

// coriandoli
function confetti(n=140,delay=0){
  setTimeout(()=>{
    if(reduced())return;
    const c=document.createElement('canvas');c.className='confetti';document.body.appendChild(c);
    const x=c.getContext('2d'),dpr=Math.min(2,window.devicePixelRatio||1),W=c.width=innerWidth*dpr,H=c.height=innerHeight*dpr;
    const cols=['#ff5c8a','#4dd6ff','#ffd23f','#7cff6b','#b18cff','#ff9f43'];
    const P=Array.from({length:n},(_,i)=>({x:W*(.2+Math.random()*.6),y:H*.38,vx:(Math.random()-.5)*16*dpr,vy:(-Math.random()*15-5)*dpr,s:(5+Math.random()*7)*dpr,r:Math.random()*6,vr:(Math.random()-.5)*.35,c:cols[i%cols.length],round:Math.random()<.3}));
    let t=0;(function f(){t++;x.clearRect(0,0,W,H);for(const p of P){p.vy+=.38*dpr;p.vx*=.985;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.globalAlpha=Math.max(0,1-t/170);x.fillStyle=p.c;if(p.round){x.beginPath();x.arc(0,0,p.s/2.6,0,7);x.fill()}else x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);x.restore()}if(t<170)requestAnimationFrame(f);else c.remove()})();
  },delay);
}

// ===== Identità =====
// Stesso dispositivo e stesso nome ospite degli altri giochi Yeezik (stesso sito).
const deviceId=(()=>{let d=ls.get('sintonia_device');if(!d||typeof d!=='string'||d.length<8){d='dev-'+rid(16);ls.set('sintonia_device',d)}return d})();
const guestSaved=ls.get('sintonia_guest')||{};
let me={id:deviceId,name:guestSaved.name||'',uid:null,color:guestSaved.color||COLORS[Math.floor(Math.random()*COLORS.length)]};
if(!guestSaved.color)ls.set('sintonia_guest',{...guestSaved,color:me.color});

// ===== Stato della stanza =====
let code=null,isHost=false,state=null,channel=null,online=new Set(),lastKey='',joinTimer=null,lastJoin=0;
let seenPlayers=new Set(),prevLives={};
function enterAnim(){const app=$('#app');app.classList.remove('enter');void app.offsetWidth;app.classList.add('enter')}
