/* js/state.js — Estado global, biblioteca de músicas, salvamento local e busca */
const EX={title:"Abra os Olhos do Meu Coração",artist:"David Quinlan",key:"C major",time:"4/4",shift:0,sections:[
{name:"Introdução",text:"| [C] [G/B] [F/A] [C] :||"},
{name:"Estrofe",text:"[C]Abra os olhos do meu coração, [G]Abra os olhos do meu coração\nQuero [F]ver, Quero [C]te [G]ver"},
{name:"Estrofe",text:"[C]Abra os olhos do meu coração, Abra os olhos do meu [G/B]coração\nQuero [F/A]ver, Quero [C]te ver"},
{name:"Refrão",text:"Exaltado e [G]bem alto, [Am]  [Am/G]    [Am/G]Brilhando a [F]luz da tua glória [G]\nDerrame seu [G#°]amor e [Am]poder, pois tu és [Dm]Santo, [C]Santo, [G]Santo [G4]  [G]"}]};
const $=id=>document.getElementById(id);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const clone=o=>JSON.parse(JSON.stringify(o));
let LIB=null,S;
try{LIB=JSON.parse(localStorage.getItem("cifras_lib")||"null")}catch(e){}
if(!LIB||!LIB.songs||!LIB.songs.length){
 let old=null;try{old=JSON.parse(localStorage.getItem("cifra")||"null")}catch(e){}
 LIB={songs:[{id:uid(),...(old||clone(EX))}]};LIB.cur=LIB.songs[0].id;
}
S=LIB.songs.find(s=>s.id===LIB.cur)||LIB.songs[0];LIB.cur=S.id;LIB.sets=LIB.sets||[];
let DL=null;
try{if(window.claude)claude.use("downloads").then(d=>DL=d).catch(()=>{})}catch(e){}
let LKEY="cifras_lib_anon",USER=null,sb=null;
const persist=()=>{let ok=true;try{localStorage.setItem(LKEY,JSON.stringify(LIB))}catch(e){ok=false}if(typeof schedPush==="function")schedPush();return ok};
let HID=null,HT=null,MODE="cards";const HIST={};
const save=()=>{S.updated=Date.now();const ok=persist();lib();HID=S.id;clearTimeout(HT);HT=setTimeout(snap,500);updUndo();const sv=$("sv");sv.textContent=ok?(USER?"Salvando…":"✓ Salvo neste aparelho"):"⚠ Não foi possível salvar";sv.className="sv"+(ok?"":" bad");if(!ok&&!window.__sw){window.__sw=1;toast("⚠ O navegador não deixou salvar neste aparelho (armazenamento cheio, bloqueado ou aba privada). Exporte um backup e libere espaço.")}$("dot").className="dot"+(ok?"":" bad")};
let VIEW="song";
const curSet=()=>LIB.sets.find(x=>x.id===LIB.curSet);
const songBy=id=>LIB.songs.find(s=>s.id===id);
function armed(b){if(b._a){clearTimeout(b._t);b._a=0;b.textContent=b._o;return true}b._o=b.textContent;b._a=1;b.textContent="Confirmar?";b._t=setTimeout(()=>{b._a=0;b.textContent=b._o},3000);return false}
let TT=null;
function toast(t){const e=$("toast");if(!e)return;if(!t){e.hidden=true;return}e.textContent=t;e.hidden=false;clearTimeout(TT);TT=setTimeout(()=>{e.hidden=true},4500)}
const msg=t=>{const m=$("msg");m.textContent=t;m.style.display=t?"block":"none";toast(t)};
const nz=x=>(x||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const lyr=s=>(s.sections||[]).map(x=>(x.text||"").replace(/\[[^\]]+\]|\{[^}]*\}/g," ").replace(/\s+/g," ")).join(" / ");
function matchSong(s,q){q=nz(q).trim();if(!q)return true;return nz([s.title,s.artist,(s.tags||[]).join(" "),lyr(s)].join(" ")).includes(q)}
let FILT={fav:false,tag:"",sort:"title"};
const keyRoot=s=>{const m=(s.key||"").match(/^\s*([A-G][#b]?)/);return m?IDX[m[1]]:99};
const cmpSong=(a,b)=>{
 const t=(a.title||"").localeCompare(b.title||"","pt"),m=FILT.sort;
 if(m==="recent")return (b.updated||0)-(a.updated||0)||t;
 if(m==="artist")return (a.artist||"\uffff").localeCompare(b.artist||"\uffff","pt")||t;
 if(m==="key")return keyRoot(a)-keyRoot(b)||t;
 return t;
};
function lib(){
 const q=$("q").value,qn=nz(q).trim();
 $("cnt").textContent=LIB.songs.length;
 const tags=[...new Set(LIB.songs.flatMap(s=>s.tags||[]))].sort((a,b)=>a.localeCompare(b,"pt"));
 if(FILT.tag&&!tags.includes(FILT.tag))FILT.tag="";
 const tb=$("tagbar");tb.innerHTML="";
 if(LIB.songs.some(s=>s.fav)||tags.length){
  const mk=(t,on,fn)=>{const b=document.createElement("button");b.textContent=t;b.className=on?"on":"";b.onclick=fn;tb.appendChild(b)};
  mk("⭐ Favoritas",FILT.fav,()=>{FILT.fav=!FILT.fav;lib()});
  tags.forEach(t=>mk("#"+t,FILT.tag===t,()=>{FILT.tag=FILT.tag===t?"":t;lib()}));
 }
 const l=$("list");l.innerHTML="";
 LIB.songs.filter(s=>(!FILT.fav||s.fav)&&(!FILT.tag||(s.tags||[]).includes(FILT.tag))&&matchSong(s,q)).sort(cmpSong).forEach(s=>{
  const d=document.createElement("div");d.className="it"+(s===S?" on":"");
  let snip="";
  if(qn&&!nz((s.title||"")+" "+(s.artist||"")+" "+(s.tags||[]).join(" ")).includes(qn)){const ly=lyr(s),i=nz(ly).indexOf(qn);if(i>=0)snip="…"+ly.slice(Math.max(0,i-18),i+qn.length+28).trim()+"…"}
  d.innerHTML=`<span><b class="star" title="Favorita">${s.fav?"★":"☆"}</b> ${s.follow?"🔗 ":""}${esc(s.title||"(sem título)")}</span><small>${esc(s.artist||"")}</small>${snip?`<div class="snip">${esc(snip)}</div>`:""}`;
  d.querySelector(".star").onclick=e=>{e.stopPropagation();s.fav=!s.fav;s.updated=Date.now();if(s===S)$("fav").checked=!!s.fav;persist();lib()};
  d.onclick=()=>{S=s;LIB.cur=s.id;VIEW="song";fields();editor();preview();if(MODE==="text")$("ttxt").value=ser(S.sections);persist();go("song")};
  l.appendChild(d);
 });
 if(!l.children.length)l.innerHTML='<div class="help" style="margin-top:6px">Nenhuma música encontrada.</div>';
 sets();
}
function fields(){["title","artist","key","time","bpm"].forEach(f=>$(f).value=S[f]||"");$("capo").value=S.capo||0;$("capoS").checked=!!S.capoShapes;$("chart").checked=!!S.chart;$("acc").value=S.acc||"";$("tags").value=(S.tags||[]).join(", ");$("fav").checked=!!S.fav;{const n=$("fnote");if(n)n.hidden=!S.follow}hist();updUndo()}
async function out(name,obj){
 const data=JSON.stringify(obj,null,1);
 try{
  if(DL){await DL.save({filename:name,data});msg("Arquivo "+name+" pronto.");return}
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([data],{type:"application/json"}));a.download=name;a.click();msg("Arquivo "+name+" gerado.");
 }catch(e){msg(e&&e.code==="declined"?"Download cancelado.":"Não foi possível baixar o arquivo neste ambiente.")}
}
const fname=s=>(s||"cifra").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/gi,"-").toLowerCase().replace(/^-|-$/g,"")||"cifra";
const esc=s=>s.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
