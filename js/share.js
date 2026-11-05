// ===== Non ho mai · immagine del risultato da condividere (formato storia 1080×1920) =====
// data: {mode:'solo'|'team', players:[{name,color,score,uid}], team, max, best:{clue,card,line}}
async function makeResultImage(data){
  const W=1080,H=1920,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  try{await document.fonts.load('900 80px Rubik');await document.fonts.load('600 40px Rubik')}catch(e){}
  const F=(w,s)=>`${w} ${s}px Rubik, system-ui, sans-serif`;
  // sfondo
  let g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#3d2287');g.addColorStop(.45,'#1d1342');g.addColorStop(1,'#0e0a1c');x.fillStyle=g;x.fillRect(0,0,W,H);
  const blob=(cx,cy,r,col)=>{const rg=x.createRadialGradient(cx,cy,0,cx,cy,r);rg.addColorStop(0,col);rg.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=rg;x.fillRect(0,0,W,H)};
  blob(900,180,620,'rgba(255,92,138,.35)');blob(120,1500,700,'rgba(42,111,214,.28)');
  // pallini colorati come nell'icona
  const cols=['#4dd6ff','#ff5c8a','#ffd23f','#7cff6b','#b18cff','#ff9f43'];
  const dots=[[90,140,14],[260,70,8],[980,90,12],[1020,420,9],[60,560,10],[1030,760,7],[50,1060,12],[1040,1180,10],[70,1720,9],[1010,1640,14],[540,1860,7],[300,1820,10],[820,1830,8]];
  dots.forEach(([dx,dy,r],i)=>{const col=cols[i%cols.length];x.save();x.shadowColor=col;x.shadowBlur=r*3;x.fillStyle=col;x.beginPath();x.arc(dx,dy,r,0,7);x.fill();x.restore();x.fillStyle='rgba(255,255,255,.55)';x.beginPath();x.arc(dx-r*.3,dy-r*.35,r*.28,0,7);x.fill()});
  for(let i=0;i<40;i++){x.fillStyle=`rgba(255,255,255,${.15+Math.random()*.45})`;x.beginPath();x.arc(Math.random()*W,Math.random()*H,1.5+Math.random()*2.5,0,7);x.fill()}
  // icona
  await new Promise(res=>{const im=new Image();im.onload=()=>{x.save();x.shadowColor='rgba(0,0,0,.5)';x.shadowBlur=40;x.shadowOffsetY=16;x.drawImage(im,W/2-115,80,230,230);x.restore();res()};im.onerror=res;im.src='icons/icon-512.png'});
  // titolo
  x.textAlign='center';x.textBaseline='alphabetic';
  x.font=F(900,118);let tg=x.createLinearGradient(W/2-330,0,W/2+330,0);tg.addColorStop(0,'#4dd6ff');tg.addColorStop(.5,'#ff5c8a');tg.addColorStop(1,'#ffd23f');x.fillStyle=tg;x.fillText('Non ho mai',W/2,440);
  x.font=F(600,42);x.fillStyle='#c9c3e6';x.fillText(data.offline?'Classifica · un solo telefono':'Classifica finale',W/2,505);
  const rr=(X,Y,w,h,r)=>{x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()};
  const avatar=(cx,cy,r,p)=>{x.save();x.shadowColor=p.color;x.shadowBlur=30;x.fillStyle=p.color;x.beginPath();x.arc(cx,cy,r,0,7);x.fill();x.restore();
    const hg=x.createRadialGradient(cx-r*.35,cy-r*.4,0,cx-r*.35,cy-r*.4,r);hg.addColorStop(0,'rgba(255,255,255,.55)');hg.addColorStop(.5,'rgba(255,255,255,0)');x.fillStyle=hg;x.beginPath();x.arc(cx,cy,r,0,7);x.fill();
    x.lineWidth=6;x.strokeStyle='#120f1f';x.beginPath();x.arc(cx,cy,r,0,7);x.stroke();
    x.fillStyle='#120f1f';x.font=F(900,r*.95);x.textBaseline='middle';x.fillText((p.name||'?').replace(/^anon_/,'')[0].toUpperCase(),cx,cy+r*.04);x.textBaseline='alphabetic'};
  const nameFit=(t,max,size)=>{x.font=F(800,size);let s=t;while(x.measureText(s).width>max&&s.length>2)s=s.slice(0,-2)+'…';return s};
  const verified=(tx,ty,size,p)=>{if(!(p.uid&&typeof devIds!=='undefined'&&devIds.has(p.uid)))return;x.font=F(800,size);const w=x.measureText(p._shown).width;const cx=tx+w/2+size*.55,cy=ty-size*.35,r=size*.42;x.fillStyle='#4dd6ff';x.beginPath();x.arc(cx,cy,r,0,7);x.fill();x.strokeStyle='#120f1f';x.lineWidth=size*.1;x.lineCap='round';x.lineJoin='round';x.beginPath();x.moveTo(cx-r*.45,cy);x.lineTo(cx-r*.1,cy+r*.35);x.lineTo(cx+r*.5,cy-r*.35);x.stroke()};
  let y=560;
  {
    const s=[...data.players].sort((a,b)=>b.lives-a.lives||a.did-b.did);
    const cols3=[{p:s[1],x:250,h:210,m:'2°',c1:'#d9d6f0',c2:'#8e88b8',t:'#24204a'},{p:s[0],x:540,h:300,m:'1°',c1:'#ffd23f',c2:'#e0a500',t:'#3a2a00'},{p:s[2],x:830,h:160,m:'3°',c1:'#ffae73',c2:'#c8692a',t:'#3d1a00'}];
    cols3.forEach(k=>{if(k.p)k.pos=1+s.filter(q=>q.lives>k.p.lives||(q.lives===k.p.lives&&q.did<k.p.did)).length});
    const base=y+560;
    cols3.forEach(k=>{if(!k.p)return;const top=base-k.h;
      const cg=x.createLinearGradient(0,top,0,base);cg.addColorStop(0,k.c1);cg.addColorStop(1,k.c2);rr(k.x-120,top,240,k.h+20,28);x.fillStyle=cg;x.fill();
      x.fillStyle=k.t;x.font=F(900,64);x.fillText('♥ '+k.p.lives,k.x,top+90);x.font=F(800,34);x.fillText(k.pos+'°',k.x,top+135);
      avatar(k.x,top-(k.m==='1°'?150:132),k.m==='1°'?82:66,k.p);
      const shown=nameFit(k.p.name,250,40);k.p._shown=shown;x.fillStyle='#f5f3ff';x.font=F(800,40);x.fillText(shown,k.x,top-22);verified(k.x,top-22,40,k.p);
      if(k.m==='1°'){x.font=F(400,70);x.fillText('👑',k.x,top-246)}
    });
    y=base+50;
    s.slice(3,5).forEach((p,i)=>{rr(160,y,760,84,24);x.fillStyle='rgba(29,24,51,.85)';x.fill();x.fillStyle='#a59fc4';x.font=F(900,36);x.textAlign='left';x.fillText(`${1+s.filter(q=>q.lives>p.lives||(q.lives===p.lives&&q.did<p.did)).length}°`,190,y+56);avatar(290,y+42,28,p);x.textAlign='left';x.fillStyle='#f5f3ff';x.font=F(700,36);x.fillText(nameFit(p.name,420,36),340,y+55);x.textAlign='right';x.fillStyle='#ffd23f';x.font=F(900,40);x.fillText('♥ '+p.lives,890,y+57);x.textAlign='center';y+=96});
    if(s.length>5){x.fillStyle='#a59fc4';x.font=F(600,30);x.fillText(s.length-5===1?'e un altro giocatore':`e altri ${s.length-5} giocatori`,W/2,y+30);y+=50}
    y+=20;
  }
  // frase della serata
  if(data.best&&data.best.t){
    const by=Math.min(Math.max(y,1280),H-470);rr(110,by,860,290,40);x.fillStyle='rgba(29,24,51,.88)';x.fill();x.setLineDash([14,10]);x.lineWidth=3;x.strokeStyle='rgba(255,92,138,.6)';x.stroke();x.setLineDash([]);
    x.fillStyle='#ff7d8f';x.font=F(800,30);x.fillText('🔥 LA FRASE DELLA SERATA',W/2,by+66);
    x.fillStyle='#c9c3e6';x.font=F(700,36);x.fillText('Non ho mai…',W/2,by+120);
    // a capo su più righe
    let fs=56;const words=String(data.best.t).split(' ');let lines=[];
    for(;fs>=34;fs-=4){x.font=F(900,fs);lines=[];let cur='';for(const w of words){const t=cur?cur+' '+w:w;if(x.measureText(t).width>780&&cur){lines.push(cur);cur=w}else cur=t}if(cur)lines.push(cur);if(lines.length<=2)break}
    x.fillStyle='#ffffff';lines.slice(0,2).forEach((l,i)=>x.fillText(l,W/2,by+182+i*(fs+8)));
    x.fillStyle='#b9b3d9';x.font=F(500,30);x.fillText(data.best.line||'',W/2,by+268);
  }
  // piè di pagina
  x.fillStyle='#a59fc4';x.font=F(500,30);x.fillText(new Date().toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'}),W/2,H-120);
  x.fillStyle='#f5f3ff';x.font=F(700,36);x.fillText('Gioca anche tu: yeezik-games.github.io/nonhomai',W/2,H-70);
  return new Promise(res=>c.toBlob(res,'image/png'));
}
function bestPhrase(history,nameOf){
  const h=[...(history||[])].sort((a,b)=>b.yes.length-a.yes.length)[0];if(!h||!h.yes.length)return null;
  return{t:h.t,line:`l'hanno fatto in ${h.yes.length} su ${h.yes.length+h.no.length}`+(h.by?` · frase di ${nameOf(h.by)}`:'')};
}
async function shareResult(data){
  toast('Preparo l’immagine…',1500);
  const blob=await makeResultImage(data);if(!blob){toast('Non riesco a creare l’immagine');return}
  const file=new File([blob],'nonhomai-risultato.png',{type:'image/png'});
  try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'Non ho mai',text:'Guarda com’è andata a Non ho mai! https://yeezik-games.github.io/nonhomai/'});return}}catch(e){if(e&&e.name==='AbortError')return}
  const url=URL.createObjectURL(blob);
  const m=document.createElement('div');m.className='modal center-modal';
  m.innerHTML=`<div class="sharebox"><img src="${url}" alt="Immagine del risultato"><p class="hint">Tieni premuto sull’immagine per salvarla, oppure scaricala.</p><div class="grid2"><a class="btn primary" href="${url}" download="nonhomai-risultato.png">Scarica</a><button class="btn ghost close" type="button">Chiudi</button></div></div>`;
  m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.close')){m.remove();URL.revokeObjectURL(url)}});
  document.body.appendChild(m);
}
function shareOnline(){
  const S=state;if(!S)return;
  shareResult({players:S.players.map(p=>({name:p.name,color:p.color,lives:p.lives,did:p.did,uid:p.uid})),best:bestPhrase(S.history,id=>playerOf(id).name)});
}
function shareLocal(){
  if(!L)return;
  shareResult({offline:true,players:L.players.map(p=>({name:p.name,color:p.color,lives:p.lives,did:p.did,uid:p.uid})),best:bestPhrase(L.history,id=>LP(id).name)});
}
