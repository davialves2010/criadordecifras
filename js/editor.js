/* js/editor.js — Editor por cartões: seções, arrastar e soltar, dividir, tom de saída */
const OPENS=new Set();
let DRAG=null;
function dnd(el,hd,kind,i,arr,done){
 el.dataset.dk=kind;el.dataset.di=i;
 hd.onclick=e=>e.stopPropagation();
 hd.onpointerdown=e=>{
  e.preventDefault();e.stopPropagation();try{hd.setPointerCapture(e.pointerId)}catch(_){}
  el.classList.add("dragging");let tgt=null;
  const mv=ev=>{
   const t=document.elementFromPoint(ev.clientX,ev.clientY),o=t&&t.closest?t.closest('[data-dk="'+kind+'"]'):null;
   document.querySelectorAll(".over").forEach(x=>x.classList.remove("over"));
   tgt=o&&o!==el?o:null;if(tgt)tgt.classList.add("over");
   if(ev.clientY<90)scrollBy(0,-12);else if(ev.clientY>innerHeight-90)scrollBy(0,12);
  };
  const up=()=>{
   hd.removeEventListener("pointermove",mv);hd.removeEventListener("pointerup",up);hd.removeEventListener("pointercancel",up);
   el.classList.remove("dragging");document.querySelectorAll(".over").forEach(x=>x.classList.remove("over"));
   if(tgt){const j=+tgt.dataset.di;if(j!==i){const [m]=arr.splice(i,1);arr.splice(j,0,m);done()}}
  };
  hd.addEventListener("pointermove",mv);hd.addEventListener("pointerup",up);hd.addEventListener("pointercancel",up);
 };
}
function keyChords(){
 const k=S.key||"",m=k.match(/^\s*([A-G][#b]?)/);
 if(!m)return["C","G","Am","F","D","Em","G7"];
 const minor=/min|menor|^\s*[A-G][#b]?m(?!aj)/i.test(k);
 const fl=(minor?["D","G","C","F","Bb","Eb"]:["F","Bb","Eb","Ab","Db","Gb"]).includes(m[1]),NM=fl?FL:SH,r=IDX[m[1]];
 const dg=minor?[[0,"m"],[5,"m"],[7,"m"],[3,""],[8,""],[10,""],[7,"7"]]:[[0,""],[2,"m"],[4,"m"],[5,""],[7,""],[9,"m"],[7,"7"]];
 return dg.map(([n,q])=>NM[(r+n)%12]+q);
}
function ins(ta,t,back){const a=ta.selectionStart,b=ta.selectionEnd;ta.setRangeText(t,a,b,"end");const p=a+t.length-back;ta.setSelectionRange(p,p);ta.focus();ta.oninput()}
function editor(){
 const box=$("secs");box.innerHTML="";
 if(S.sections.length===1&&!S.sections[0].text)OPENS.add(S.sections[0]);
 S.sections.forEach((s,i)=>{
  const open=OPENS.has(s),d=document.createElement("div");d.className="card"+(open?" open":"");
  const pv=(s.text.split("\n")[0]||"").replace(/\[[^\]]+\]|\{[^}]*\}/g,"").trim().slice(0,40);
  d.innerHTML=`<div class="ch"><span class="hd" title="Arraste para reordenar">⠿</span><span class="chev">${open?"▾":"▸"}</span><b class="nm">${esc(s.name||"(sem nome)")}</b>${s.rep?`<span class="rp">${esc(s.rep)}</span>`:""}<span class="pv">${esc(pv)}</span><span class="acts"><button title="Subir" aria-label="Subir seção">↑</button><button title="Descer" aria-label="Descer seção">↓</button><button title="Dividir em duas partes, no cursor" aria-label="Dividir esta parte em duas, na linha do cursor">✂</button><button title="Duplicar" aria-label="Duplicar seção">⧉</button><button title="Remover" aria-label="Remover seção">✕</button></span></div>`+
  (open?`<div class="cb"><div class="row"><input class="in-n" placeholder="Nome da seção" aria-label="Nome da seção"><input class="in-r" placeholder="Repetição (2x)" aria-label="Repetição" style="max-width:110px"></div><input class="in-o" placeholder="Observação (ex: só voz e violão)" aria-label="Observação" style="margin-top:6px"><div class="chips"></div><textarea rows="${Math.max(4,s.text.split("\n").length+1)}" aria-label="Letra e acordes da seção"></textarea></div>`:"");
  const q=x=>d.querySelector(x),on=(b,fn)=>b.onclick=e=>{e.stopPropagation();fn()};
  q(".ch").onclick=()=>{open?OPENS.delete(s):OPENS.add(s);editor()};
  const [u,dn,sp,dp,rm]=d.querySelectorAll(".acts button");
  on(u,()=>{if(i>0){[S.sections[i-1],S.sections[i]]=[S.sections[i],S.sections[i-1]];all()}});
  on(dn,()=>{if(i<S.sections.length-1){[S.sections[i+1],S.sections[i]]=[S.sections[i],S.sections[i+1]];all()}});
  /* divide a parte antes da linha onde está o cursor: a segunda metade vira uma parte nova com o mesmo nome */
  on(sp,()=>{
   const ta=q("textarea");
   if(!ta){msg("Abra a parte e toque no texto, na linha onde quer dividir.");return}
   const pos=ta.selectionStart||0,ini=pos>0?s.text.lastIndexOf("\n",pos-1)+1:0;
   if(ini<=0||ini>=s.text.length){msg("Coloque o cursor numa linha do meio do texto: a divisão acontece antes dessa linha.");return}
   const ns={name:s.name,text:s.text.slice(ini).replace(/^\n+/,"")};
   if(s.rep)ns.rep=s.rep;
   s.text=s.text.slice(0,ini).replace(/\n+$/,"");
   S.sections.splice(i+1,0,ns);OPENS.add(ns);all();toast("Parte dividida em duas.");
  });
  on(dp,()=>{S.sections.splice(i+1,0,{...s});all()});
  on(rm,()=>{if(s.text.trim()&&!armed(rm))return;S.sections.splice(i,1);all()});
  dnd(d,q(".hd"),"sec",i,S.sections,all);
  if(open){
   const ta=q("textarea"),nI=q(".in-n"),rI=q(".in-r"),oI=q(".in-o");
   ta.value=s.text;nI.value=s.name||"";rI.value=s.rep||"";oI.value=s.note||"";
   nI.oninput=()=>{s.name=nI.value;q(".nm").textContent=s.name||"(sem nome)";save();preview()};
   rI.oninput=()=>{s.rep=rI.value;save();preview()};
   oI.oninput=()=>{s.note=oI.value;save();preview()};
   ta.oninput=()=>{s.text=ta.value;save();preview()};
   const mk=(t,fn,c)=>{const b=document.createElement("button");b.textContent=t;b.className=c||"";b.onmousedown=e=>e.preventDefault();b.onclick=fn;q(".chips").appendChild(b)};
   mk("[ ]",()=>ins(ta,"[]",1),"tool");mk("{ }",()=>ins(ta,"{}",1),"tool");
   mk("🎯 Posicionar",()=>{
    if(typeof chordEditorOpen!=="function"){toast("Recurso indisponível: falta carregar js/acordes-visual.js.");return}
    if(!s.text.trim()){toast("Escreva a letra primeiro; depois posicione os acordes.");return}
    chordEditorOpen(s,()=>{save();all()});
   },"tool");
   keyChords().forEach(c=>mk(c,()=>ins(ta,"["+c+"]",0)));
  }
  box.appendChild(d);
 });
}
function tab(t){document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("on",b.dataset.t===t));document.querySelectorAll(".tab").forEach(s=>s.hidden=s.id!=="t-"+t)}
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>tab(b.dataset.t));
function all(){save();editor();preview();if(MODE==="text")$("ttxt").value=ser(S.sections)}
["title","artist","key","time","bpm"].forEach(f=>{$(f).oninput=()=>{S[f]=$(f).value;save();preview()}});
$("up").onclick=()=>{S.shift=((S.shift||0)+13)%12;save();preview()};
$("dn").onclick=()=>{S.shift=((S.shift||0)+11)%12;save();preview()};
$("rs").onclick=()=>{S.shift=0;save();preview()};
$("ksel").onchange=()=>{S.shift=((+$("ksel").value)-origIdx(S)+12)%12;save();preview()};
