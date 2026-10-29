/* js/acordes-visual.js — "🎯 Posicionar": mova acordes tocando ou arrastando sobre a letra, sem digitar colchetes.
   Cada linha da seção aparece em fonte monoespaçada (1 caractere = 1 posição). */

/* separa uma linha "[C]Abra os [G]olhos" em letra pura + acordes {p: posição na letra, c: acorde, n: nota} */
function chordLineParse(line){
 const toks=[];let lyr="",i=0;
 while(i<line.length){
  if(line[i]==="["){
   const e=line.indexOf("]",i);
   if(e>0){
    const c=line.slice(i+1,e);i=e+1;let n="";
    if(line[i]==="{"){const e2=line.indexOf("}",i);if(e2>0){n=line.slice(i+1,e2);i=e2+1}}
    toks.push({p:lyr.length,c,n});continue;
   }
  }
  lyr+=line[i];i++;
 }
 return{lyr,toks};
}
/* o contrário: junta letra e acordes de volta no formato [C]letra */
function chordLineSer(lyr,toks){
 const by=toks.slice().sort((a,b)=>a.p-b.p);
 let out="";
 for(let i=0;i<=lyr.length;i++){
  by.forEach(t=>{if(Math.min(t.p,lyr.length)===i)out+="["+t.c+"]"+(t.n?"{"+t.n+"}":"")});
  if(i<lyr.length)out+=lyr[i];
 }
 return out;
}

function chordEditorOpen(s,done){
 const g=id=>document.getElementById(id),box=g("chordbox"),body=g("cvbody"),pal=g("cvpal");
 const mk=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!==undefined)e.textContent=x;return e};
 const lines=(s.text||"").split("\n").map(chordLineParse);
 let sel=null; /* {k:"pal",c} ou {k:"tok",l,t} */
 const ordenar=L=>{L.toks.sort((a,b)=>a.p-b.p)};
 lines.forEach(ordenar);

 function paleta(){
  pal.innerHTML="";
  keyChords().forEach(c=>{
   const b=mk("button",sel&&sel.k==="pal"&&sel.c===c?"on":"",c);
   b.onclick=()=>{sel=sel&&sel.k==="pal"&&sel.c===c?null:{k:"pal",c};paleta();marcar()};
   pal.appendChild(b);
  });
  const o=mk("button","","+ Outro");
  o.onclick=()=>{const c=(prompt("Qual acorde? (ex.: Am7, G/B)")||"").trim();if(c){sel={k:"pal",c};paleta();marcar()}};
  pal.appendChild(o);
 }
 function marcar(){
  body.querySelectorAll(".cvk.on").forEach(x=>x.classList.remove("on"));
  if(sel&&sel.k==="tok"){const x=body.querySelector('.cvk[data-l="'+sel.l+'"][data-t="'+sel.t+'"]');if(x)x.classList.add("on")}
 }
 function aplicar(li,i){
  const L=lines[li];
  if(sel&&sel.k==="pal"){L.toks.push({p:i,c:sel.c,n:""});ordenar(L)}
  else if(sel&&sel.k==="tok"&&sel.l===li){const t=L.toks[sel.t];t.p=i;ordenar(L);sel={k:"tok",l:li,t:L.toks.indexOf(t)}}
  else return;
  render();
 }
 function arrastar(e,li,ti,chip,txt){
  e.preventDefault();e.stopPropagation();
  sel={k:"tok",l:li,t:ti};paleta();marcar();
  const L=lines[li],t=L.toks[ti],x0=e.clientX,y0=e.clientY;
  const c0=txt.querySelector(".cvc"),cw=c0.getBoundingClientRect().width,left=c0.getBoundingClientRect().left;
  let moved=false,idx=t.p;
  try{chip.setPointerCapture(e.pointerId)}catch(_){}
  const posic=ev=>Math.max(0,Math.min(L.lyr.length,Math.floor((ev.clientX-left)/cw+.5)));
  const mv=ev=>{
   if(Math.abs(ev.clientX-x0)+Math.abs(ev.clientY-y0)>6)moved=true;
   if(!moved)return;
   idx=posic(ev);chip.style.left="calc("+idx+"*1ch)";
  };
  const up=()=>{
   chip.removeEventListener("pointermove",mv);chip.removeEventListener("pointerup",up);chip.removeEventListener("pointercancel",up);
   if(moved){t.p=idx;ordenar(L);sel={k:"tok",l:li,t:L.toks.indexOf(t)};render()}
  };
  chip.addEventListener("pointermove",mv);chip.addEventListener("pointerup",up);chip.addEventListener("pointercancel",up);
 }
 function render(){
  body.innerHTML="";
  lines.forEach((L,li)=>{
   const row=mk("div","cvline"),rail=mk("div","cvrail"),txt=mk("div","cvtxt");
   for(let i=0;i<=L.lyr.length;i++){
    const sp=mk("span","cvc",i<L.lyr.length&&L.lyr[i]!==" "?L.lyr[i]:"\u00A0");
    sp.dataset.l=li;sp.dataset.i=i;txt.appendChild(sp);
   }
   L.toks.forEach((t,ti)=>{
    const ch=mk("span","cvk",t.c);ch.dataset.l=li;ch.dataset.t=ti;
    ch.style.left="calc("+t.p+"*1ch)";ch.style.top=ti%2?"1.55em":"0";
    ch.onpointerdown=e=>arrastar(e,li,ti,ch,txt);
    rail.appendChild(ch);
   });
   txt.onclick=e=>{const c=e.target.closest&&e.target.closest(".cvc");if(c)aplicar(+c.dataset.l,+c.dataset.i)};
   row.append(rail,txt);body.appendChild(row);
  });
  marcar();
 }
 g("cvdel").onclick=()=>{
  if(!(sel&&sel.k==="tok")){toast("Toque num acorde para escolher qual remover.");return}
  lines[sel.l].toks.splice(sel.t,1);sel=null;render();
 };
 g("cvcancel").onclick=()=>{box.hidden=true};
 g("cvok").onclick=()=>{
  s.text=lines.map(L=>chordLineSer(L.lyr,L.toks)).join("\n");
  box.hidden=true;done();
 };
 paleta();render();box.hidden=false;
}
