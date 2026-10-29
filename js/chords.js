/* js/chords.js — Diagramas de acordes (violão, ukulele e teclado) e balão ao passar o mouse */
/* ---- violão: formas simplificadas ---- */
const OPEN={C:[-1,3,2,0,1,0],G:[3,2,0,0,0,3],D:[-1,-1,0,2,3,2],Dm:[-1,-1,0,2,3,1],D7:[-1,-1,0,2,1,2],C7:[-1,3,2,3,1,0],G7:[3,2,0,0,0,1],B7:[-1,2,1,2,0,2],Cmaj7:[-1,3,2,0,0,0],Fmaj7:[-1,-1,3,2,1,0],Gmaj7:[3,2,0,0,0,2],Dsus4:[-1,-1,0,2,3,3],Dsus2:[-1,-1,0,2,3,0],Gsus4:[3,3,0,0,1,3]};
const EF={"":[0,2,2,1,0,0],m:[0,2,2,0,0,0],7:[0,2,0,1,0,0],m7:[0,2,0,0,0,0],maj7:[0,2,1,1,0,0],sus4:[0,2,2,2,0,0]};
const AF={"":[-1,0,2,2,2,0],m:[-1,0,2,2,1,0],7:[-1,0,2,0,2,0],m7:[-1,0,2,0,1,0],maj7:[-1,0,2,1,2,0],sus4:[-1,0,2,2,3,0],sus2:[-1,0,2,2,0,0],dim:[-1,0,1,2,1,-1]};
function shape(c){
 const m=c.split("/")[0].match(/^([A-G][#b]?)(.*)$/);if(!m)return null;
 const r=IDX[m[1]];if(r===undefined)return null;const q=m[2];let Q="";
 if(/^(dim|°|º)/.test(q))Q="dim";
 else if(/^m(?!aj)/.test(q))Q=/7|9|11/.test(q)?"m7":"m";
 else if(/^(maj|M|7M)/.test(q))Q="maj7";
 else if(/^sus2/.test(q))Q="sus2";
 else if(/^(sus|4)/.test(q))Q="sus4";
 else if(/^(7|9|11|13)/.test(q))Q="7";
 if(OPEN[SH[r]+Q])return{f:OPEN[SH[r]+Q],b:0};
 const fe=(r-4+12)%12,fa=(r-9+12)%12;
 if(EF[Q]&&(!AF[Q]||fe<=fa))return{f:EF[Q].map(v=>v+fe),b:fe};
 return{f:AF[Q].map(v=>v<0?-1:v+fa),b:fa};
}

/* ---- notas de um acorde (usado no ukulele e no teclado) ----
   devolve {r: tônica, set: notas (0–11), req: notas que não podem faltar, bass, names: nomes em ordem} */
function chordPcs(c){
 const parts=String(c).split("/"),h=parts[0].match(/^([A-G][#b]?)(.*)$/);
 if(!h||IDX[h[1]]===undefined)return null;
 const r=IDX[h[1]],q=h[2],qs=q.replace(/add\d+/g,"");
 let iv;
 if(/^(dim|°|º)/.test(q))iv=[0,3,6];
 else if(/^m(?!aj)/.test(q))iv=[0,3,7];
 else if(/^(aug|\+)/.test(q))iv=[0,4,8];
 else iv=[0,4,7];
 if(/^sus2/.test(q))iv=[0,2,7];
 else if(/^(sus|4)/.test(q))iv=[0,5,7];
 const set=new Set(iv);
 if(/^(dim7|°7|º7)/.test(q))set.add(9);
 else if(/^(maj|M|7M|Δ)/.test(q)||/7M|maj7|M7/.test(q))set.add(11);
 else if(/(7|9|11|13)/.test(qs))set.add(10);
 if(/b9/.test(q))set.add(1);else if(/#9/.test(q))set.add(3);else if(/9/.test(q))set.add(2);
 if(/#11/.test(q))set.add(6);else if(/11/.test(q))set.add(5);
 if(/b13/.test(q))set.add(8);else if(/13/.test(q))set.add(9);
 if(/^m?6/.test(q))set.add(9);
 if(/b5/.test(q)){set.delete(7);set.add(6)}
 if(/#5|5\+/.test(q)){set.delete(7);set.add(8)}
 const ivs=[...set].sort((a,b)=>a-b);
 const abs=new Set(ivs.map(x=>(r+x)%12));
 const bass=parts[1]&&/^[A-G][#b]?/.test(parts[1])?IDX[parts[1].match(/^[A-G][#b]?/)[0]]:null;
 if(bass!=null)abs.add(bass);
 const req=[r,(r+iv[1])%12];
 const sev=iv[1]===3&&iv[2]===6&&set.has(9)?9:set.has(11)?11:set.has(10)?10:null;
 if(sev!=null)req.push((r+sev)%12);
 const names=ivs.map(x=>SH[(r+x)%12]);
 if(bass!=null&&!names.includes(SH[bass]))names.unshift(SH[bass]);
 return{r,set:abs,req,bass,names};
}

/* ---- ukulele (afinação G C E A): procura a forma mais simples que usa só notas do acorde ---- */
const UB=[7,0,4,9],UMEMO={};
function ushape(c){
 if(c in UMEMO)return UMEMO[c];
 const t=chordPcs(c);if(!t)return UMEMO[c]=null;
 let best=null,bs=-1e9;
 for(let a=0;a<=7;a++)for(let b=0;b<=7;b++)for(let d=0;d<=7;d++)for(let e=0;e<=7;e++){
  const f=[a,b,d,e],pcs=f.map((v,i)=>(UB[i]+v)%12);
  if(!pcs.every(p=>t.set.has(p))||!t.req.every(p=>pcs.includes(p)))continue;
  const fr=f.filter(v=>v>0),mx=fr.length?Math.max(...fr):0,mn=fr.length?Math.min(...fr):0;
  if(mx-mn>3)continue;
  const sc=new Set(pcs).size*100-mx*5-f.reduce((x,y)=>x+y,0);
  if(sc>bs){bs=sc;best=f}
 }
 return UMEMO[c]=best?{f:best,b:0}:null;
}

/* ---- instrumento escolhido em Configurações ---- */
const instr=()=>(typeof PREFS!=="undefined"&&PREFS&&PREFS.inst)||"violao";
["tmore","mcfg"].forEach(id=>{const b=$(id);if(b)b.addEventListener("click",()=>{const s=$("pf-inst");if(s)s.value=instr()})});
{const s=$("pf-inst");if(s)s.onchange=()=>{PREFS.inst=s.value;savePrefs();preview()}}

/* ---- desenho: braço com 6 (violão) ou 4 (ukulele) cordas ---- */
function fretSvg(f,barB,n){
 const pr=f.filter(v=>v>0),mx=Math.max(0,...pr),mn=pr.length?Math.min(...pr):1,b=mx>4?mn:1,x0=18,y0=16,sx=n===4?10:7.5,sy=12,W=(n-1)*sx;
 let o=`<svg width="66" height="76" viewBox="0 0 66 76" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none" stroke-width="1" style="color:inherit">`;
 for(let i=0;i<n;i++)o+=`<line x1="${x0+i*sx}" y1="${y0}" x2="${x0+i*sx}" y2="${y0+5*sy}"/>`;
 for(let j=0;j<=5;j++)o+=`<line x1="${x0}" y1="${y0+j*sy}" x2="${x0+W}" y2="${y0+j*sy}"${j==0&&b==1?' stroke-width="2.6"':''}/>`;
 if(b>1)o+=`<text x="0" y="${y0+sy*.8}" font-size="9" fill="currentColor" stroke="none">${b}fr</text>`;
 if(barB>0){const ix=f.map((v,i)=>v===barB?i:-1).filter(i=>i>=0);if(ix.length>1)o+=`<rect x="${x0+ix[0]*sx-3.4}" y="${y0+(barB-b+1)*sy-sy/2-3.4}" width="${(ix[ix.length-1]-ix[0])*sx+6.8}" height="6.8" rx="3.4" fill="currentColor" stroke="none"/>`}
 f.forEach((v,i)=>{const x=x0+i*sx;
  if(v<0)o+=`<text x="${x-3}" y="${y0-4}" font-size="9" fill="currentColor" stroke="none">×</text>`;
  else if(v===0)o+=`<circle cx="${x}" cy="${y0-7}" r="2.6"/>`;
  else o+=`<circle cx="${x}" cy="${y0+(v-b+1)*sy-sy/2}" r="3.3" fill="currentColor" stroke="none"/>`});
 return o+"</svg>";
}
/* ---- desenho: teclado (11 teclas brancas, de C até o F seguinte) ---- */
const PW=[0,2,4,5,7,9,11,12,14,16,17],PB=[[0,1],[1,3],[3,6],[4,8],[5,10],[7,13],[8,15]];
function pianoSvg(c){
 const t=chordPcs(c);if(!t)return"";
 const kw=6,y0=12,h=34,hb=21;
 let o=`<svg width="66" height="76" viewBox="0 0 66 76" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none" stroke-width=".8" style="color:inherit">`;
 PW.forEach((s,i)=>{o+=`<rect x="${i*kw}" y="${y0}" width="${kw}" height="${h}"${t.set.has(s%12)?' fill="#c0112b"':""}/>`});
 PB.forEach(([i,s])=>{o+=`<rect x="${(i+1)*kw-1.9}" y="${y0}" width="3.8" height="${hb}" fill="${t.set.has(s%12)?"#c0112b":"currentColor"}"/>`});
 o+=`<text x="33" y="${y0+h+11}" font-size="8" text-anchor="middle" fill="currentColor" stroke="none">${esc(t.names.join(" "))}</text>`;
 return o+"</svg>";
}
function diag(c){
 const k=instr();
 if(k==="ukulele"){const s=ushape(c);return s?fretSvg(s.f,0,4):""}
 if(k==="teclado")return pianoSvg(c);
 const s=shape(c);return s?fretSvg(s.f,s.b,6):"";
}

/* ---- PDF: pdf.js chama pDiagAlt primeiro; devolve null para o violão (que segue o desenho original) ---- */
function pFret(doc,f,n,x,y,sc){
 const pr=f.filter(v=>v>0),mx=Math.max(0,...pr),mn=pr.length?Math.min(...pr):1,b=mx>4?mn:1,x0=18,y0=16,sx=n===4?10:7.5,sy=12,W=(n-1)*sx;
 const X=v=>x+v*sc,Y=v=>y+v*sc;
 doc.setDrawColor(40);doc.setFillColor(40,40,40);
 doc.setLineWidth(.12);for(let i=0;i<n;i++)doc.line(X(x0+i*sx),Y(y0),X(x0+i*sx),Y(y0+5*sy));
 for(let j=0;j<=5;j++){doc.setLineWidth(j===0&&b===1?.5:.12);doc.line(X(x0),Y(y0+j*sy),X(x0+W),Y(y0+j*sy))}
 if(b>1){doc.setFont("helvetica","normal");doc.setFontSize(6);doc.setTextColor(40);doc.text(b+"fr",X(0),Y(y0+sy*.8))}
 f.forEach((v,i)=>{
  const px=x0+i*sx;
  if(v===0){doc.setLineWidth(.15);doc.circle(X(px),Y(y0-7),2.6*sc,"S")}
  else if(v>0)doc.circle(X(px),Y(y0+(v-b+1)*sy-sy/2),3.3*sc,"F");
 });
 return true;
}
function pPiano(doc,c,x,y,sc){
 const t=chordPcs(c);if(!t)return false;
 const kw=6,y0=12,h=34,hb=21;
 doc.setDrawColor(40);doc.setLineWidth(.12);
 PW.forEach((s,i)=>{const on=t.set.has(s%12);if(on)doc.setFillColor(192,17,43);doc.rect(x+i*kw*sc,y+y0*sc,kw*sc,h*sc,on?"FD":"S")});
 PB.forEach(([i,s])=>{if(t.set.has(s%12))doc.setFillColor(192,17,43);else doc.setFillColor(40,40,40);doc.rect(x+((i+1)*kw-1.9)*sc,y+y0*sc,3.8*sc,hb*sc,"F")});
 doc.setFont("helvetica","normal");doc.setFontSize(5);doc.setTextColor(40);
 doc.text(String(t.names.join(" ")).replace(/[^\x20-\x7E]/g,""),x+33*sc,y+(y0+h+9)*sc,{align:"center"});
 return true;
}
function pDiagAlt(doc,c,x,y,sc){
 const k=instr();
 if(k==="ukulele"){const s=ushape(c);return s?pFret(doc,s.f,4,x,y,sc):false}
 if(k==="teclado")return pPiano(doc,c,x,y,sc);
 return null;
}

function tip(e){
 const t=$("tip"),el=e.target.closest&&e.target.closest(".c");
 const d=el&&el.closest("#sheet,#stg")?diag(el.dataset.n||el.textContent.trim()):"";
 if(!d){t.style.display="none";return}
 t.innerHTML=`<b>${esc(el.dataset.n||el.textContent.trim())}</b><br>${d}`;t.style.display="block";
 const r=el.getBoundingClientRect();t.style.left=Math.max(4,Math.min(r.left,innerWidth-90))+"px";t.style.top=(r.bottom+4>innerHeight-110?Math.max(4,r.top-108):r.bottom+4)+"px";
}
document.addEventListener("mouseover",tip);document.addEventListener("click",tip);
