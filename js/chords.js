/* js/chords.js — Diagramas de acordes (violão) e balão ao passar o mouse */
/* ---- diagramas de acordes (formas simplificadas de violão) ---- */
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
function diag(c){
 const s=shape(c);if(!s)return"";
 const f=s.f,pr=f.filter(v=>v>0),mx=Math.max(0,...pr),mn=pr.length?Math.min(...pr):1,b=mx>4?mn:1,x0=18,y0=16,sx=7.5,sy=12;
 let o=`<svg width="66" height="76" viewBox="0 0 66 76" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none" stroke-width="1" style="color:inherit">`;
 for(let i=0;i<6;i++)o+=`<line x1="${x0+i*sx}" y1="${y0}" x2="${x0+i*sx}" y2="${y0+5*sy}"/>`;
 for(let j=0;j<=5;j++)o+=`<line x1="${x0}" y1="${y0+j*sy}" x2="${x0+5*sx}" y2="${y0+j*sy}"${j==0&&b==1?' stroke-width="2.6"':''}/>`;
 if(b>1)o+=`<text x="0" y="${y0+sy*.8}" font-size="9" fill="currentColor" stroke="none">${b}fr</text>`;
 if(s.b>0){const ix=f.map((v,i)=>v===s.b?i:-1).filter(i=>i>=0);if(ix.length>1)o+=`<rect x="${x0+ix[0]*sx-3.4}" y="${y0+(s.b-b+1)*sy-sy/2-3.4}" width="${(ix[ix.length-1]-ix[0])*sx+6.8}" height="6.8" rx="3.4" fill="currentColor" stroke="none"/>`}
 f.forEach((v,i)=>{const x=x0+i*sx;
  if(v<0)o+=`<text x="${x-3}" y="${y0-4}" font-size="9" fill="currentColor" stroke="none">×</text>`;
  else if(v===0)o+=`<circle cx="${x}" cy="${y0-7}" r="2.6"/>`;
  else o+=`<circle cx="${x}" cy="${y0+(v-b+1)*sy-sy/2}" r="3.3" fill="currentColor" stroke="none"/>`});
 return o+"</svg>";
}
function tip(e){
 const t=$("tip"),el=e.target.closest&&e.target.closest(".c");
 const d=el&&el.closest("#sheet,#stg")?diag(el.dataset.n||el.textContent.trim()):"";
 if(!d){t.style.display="none";return}
 t.innerHTML=`<b>${esc(el.dataset.n||el.textContent.trim())}</b><br>${d}`;t.style.display="block";
 const r=el.getBoundingClientRect();t.style.left=Math.max(4,Math.min(r.left,innerWidth-90))+"px";t.style.top=(r.bottom+4>innerHeight-110?Math.max(4,r.top-108):r.bottom+4)+"px";
}
document.addEventListener("mouseover",tip);document.addEventListener("click",tip);
