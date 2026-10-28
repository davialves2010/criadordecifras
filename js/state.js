/* js/state.js — Estado global, biblioteca de músicas, salvamento local e busca */
const EX={title:"Abra os Olhos do Meu Coração",artist:"David Quinlan",key:"C major",time:"4/4",shift:0,sections:[
{name:"Introdução",text:"| [C] [G/B] [F/A] [C] :||"},
{name:"Estrofe",text:"[C]Abra os olhos do meu coração, [G]Abra os olhos do meu coração\nQuero [F]ver, Quero [C]te [G]ver"},
{name:"Estrofe",text:"[C]Abra os olhos do meu coração, Abra os olhos do meu [G/B]coração\nQuero [F/A]ver, Quero [C]te ver"},
{name:"Refrão",text:"Exaltado e [G]bem alto, [Am]  [Am/G]    [Am/G]Brilhando a [F]luz da tua glória [G]\nDerrame seu [G#°]amor e [Am]poder, pois tu és [Dm]Santo, [C]Santo, [G]Santo [G4]  [G]"}]};
const $=id=>document.getElementById(id);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const clone=o=>JSON.parse(JSON.stringify(o));
/* campos pessoais: ficam só na sua conta (não vão em links, nem são trocados ao seguir/editar em equipe) */
const PRIV=["fav","myNotes","folder"];
const stripPriv=o=>{const c=clone(o);PRIV.forEach(k=>delete c[k]);return c};
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
/* a lista de músicas é refeita com um pequeno atraso: assim não é reconstruída a cada tecla */
let LD=null;const libSoon=(ms=250)=>{clearTimeout(LD);LD=setTimeout(lib,ms)};
const save=()=>{S.updated=Date.now();const ok=persist();libSoon();HID=S.id;clearTimeout(HT);HT=setTimeout(snap,500);updUndo();const sv=$("sv");sv.textContent=ok?(USER?"Salvando…":"✓ Salvo neste aparelho"):"⚠ Não foi possível salvar";sv.className="sv"+(ok?"":" bad");if(!ok&&!window.__sw){window.__sw=1;toast("⚠ O navegador não deixou salvar neste aparelho (armazenamento cheio, bloqueado ou aba privada). Exporte um backup e libere espaço.")}$("dot").className="dot"+(ok?"":" bad")};
let VIEW="song";
const curSet=()=>LIB.sets.find(x=>x.id===LIB.curSet);
const songBy=id=>LIB.songs.find(s=>s.id===id);
function armed(b){if(b._a){clearTimeout(b._t);b._a=0;b.textContent=b._o;return true}b._o=b.textContent;b._a=1;b.textContent="Confirmar?";b._t=setTimeout(()=>{b._a=0;b.textContent=b._o},3000);return false}
let TT=null;
function toast(t){const e=$("toast");if(!e)return;if(!t){e.hidden=true;return}e.textContent=t;e.hidden=false;clearTimeout(TT);TT=setTimeout(()=>{e.hidden=true},4500)}
const msg=t=>{const m=$("msg");m.textContent=t;m.style.display=t?"block":"none";toast(t)};
const nz=x=>(x||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const lyr=s=>(s.sections||[]).map(x=>(x.text||"").replace(/\[[^\]]+\]|\{[^}]*\}/g," ").replace(/\s+/g," ")).join(" / ");

/* ---- duração ("4:30" ou só minutos) ---- */
function parseDur(v){v=String(v==null?"":v).trim();if(!v)return 0;let m=v.match(/^(\d+)\s*:\s*(\d{1,2})$/);if(m)return +m[1]*60+Math.min(59,+m[2]);m=v.match(/^(\d+)\s*(?:min|m)?$/i);return m?+m[1]*60:0}
const fmtDur=s=>{s=Math.round(s||0);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h?h+":"+String(m).padStart(2,"0")+":"+String(x).padStart(2,"0"):m+":"+String(x).padStart(2,"0")};

/* ---- busca por acordes: "tom:G", "acorde:Em,C", "prog:C-G-Am-F" (podem ser misturados com texto) ---- */
const chBase=c=>String(c).split("/")[0].trim();
function songChords(s){const o=[];(s.sections||[]).forEach(x=>((x.text||"").match(/\[[^\]]+\]/g)||[]).forEach(m=>{const c=chBase(m.slice(1,-1));if(c)o.push(c)}));return o}
function keyParts(k){const m=String(k||"").match(/^\s*([A-G][#b]?)(.*)$/);if(!m)return null;return{r:m[1],m:/^(m(?!aj)|\s*(min|menor))/i.test(m[2])}}
function parseQ(q){
 const o={txt:[],key:null,has:[],prog:null};
 String(q||"").trim().split(/\s+/).filter(Boolean).forEach(t=>{
  const m=t.match(/^(tom|key|acordes?|chords?|prog|progressao|progressão):(.*)$/i);
  if(!m){o.txt.push(t);return}
  const k=m[1].toLowerCase(),v=m[2].trim();
  if(!v)return;
  if(k==="tom"||k==="key"){const kp=keyParts(v);if(kp)o.key=kp}
  else if(/^acorde|^chord/.test(k)){v.split(",").map(chBase).filter(Boolean).forEach(c=>o.has.push(c))}
  else{const p=v.split(/[-–>→]+/).map(chBase).filter(Boolean);if(p.length)o.prog=p}
 });
 return o;
}
function hasProg(cs,p){
 const d=cs.filter((c,i)=>c!==cs[i-1]);
 for(let i=0;i+p.length<=d.length;i++){if(p.every((c,j)=>d[i+j]===c))return true}
 return false;
}
/* índice de busca por música: texto normalizado e acordes só são recalculados quando a música muda */
const SIX=new WeakMap();
function sIdx(s){
 const k=[s.title||"",s.artist||"",(s.tags||[]).join(" "),s.folder||""].concat((s.sections||[]).map(x=>x.text||"")).join("\u0001");
 let c=SIX.get(s);
 if(!c||c.k!==k){
  const ly=lyr(s),nm=[s.title,s.artist,(s.tags||[]).join(" "),s.folder].join(" ");
  c={k,ly,nly:nz(ly),head:nz(nm),full:nz(nm+" "+ly),ch:songChords(s)};SIX.set(s,c);
 }
 return c;
}
let PQ={q:null,p:null};
function pq(q){if(PQ.q!==q){const p=parseQ(q);p.t=nz(p.txt.join(" ")).trim();PQ={q,p}}return PQ.p}
function matchSong(s,q){
 const p=pq(q),c=sIdx(s);
 if(p.key){const k=keyParts(s.key);if(!k||IDX[k.r]!==IDX[p.key.r]||k.m!==p.key.m)return false}
 if(p.has.length||p.prog){
  const cs=c.ch;
  if(!p.has.every(c=>cs.includes(c)))return false;
  if(p.prog&&!hasProg(cs,p.prog))return false;
 }
 const t=p.t;if(!t)return true;
 return c.full.includes(t);
}
const NOFOLD="__sem_pasta__";
let FILT={fav:false,tag:"",sort:"title",folder:""};
const keyRoot=s=>{const m=(s.key||"").match(/^\s*([A-G][#b]?)/);return m?IDX[m[1]]:99};
const cmpSong=(a,b)=>{
 const t=(a.title||"").localeCompare(b.title||"","pt"),m=FILT.sort;
 if(m==="recent")return (b.updated||0)-(a.updated||0)||t;
 if(m==="artist")return (a.artist||"\uffff").localeCompare(b.artist||"\uffff","pt")||t;
 if(m==="key")return keyRoot(a)-keyRoot(b)||t;
 return t;
};
/* texto de apoio de cada linha da lista: artista · tom · duração */
const libMeta=s=>{const k=keyParts(s.key);return[s.artist,k?k.r+(k.m?"m":""):"",s.dur].filter(Boolean).join(" · ")};
const attrEsc=s=>esc(s).replace(/"/g,"&quot;");
function lib(){
 const q=$("q").value,qn=nz(parseQ(q).txt.join(" ")).trim();
 $("cnt").textContent=LIB.songs.length;
 const tags=[...new Set(LIB.songs.flatMap(s=>s.tags||[]))].sort((a,b)=>a.localeCompare(b,"pt"));
 if(FILT.tag&&!tags.includes(FILT.tag))FILT.tag="";
 const tb=$("tagbar");tb.innerHTML="";
 if(LIB.songs.some(s=>s.fav)||tags.length){
  const mk=(t,on,fn)=>{const b=document.createElement("button");b.textContent=t;b.className=on?"on":"";b.onclick=fn;tb.appendChild(b)};
  mk("⭐ Favoritas",FILT.fav,()=>{FILT.fav=!FILT.fav;lib()});
  tags.forEach(t=>mk("#"+t,FILT.tag===t,()=>{FILT.tag=FILT.tag===t?"":t;lib()}));
 }
 /* pastas */
 const folders=[...new Set(LIB.songs.map(s=>s.folder).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt"));
 if(FILT.folder&&FILT.folder!==NOFOLD&&!folders.includes(FILT.folder))FILT.folder="";
 const fs=$("foldersel");
 if(fs){
  fs.hidden=!folders.length;
  fs.innerHTML='<option value="">📁 Todas as pastas</option><option value="'+NOFOLD+'">Sem pasta</option>'+folders.map(f=>'<option value="'+attrEsc(f)+'">'+esc(f)+"</option>").join("");
  fs.value=FILT.folder;
 }
 const fl=$("folderlist");if(fl)fl.innerHTML=folders.map(f=>'<option value="'+attrEsc(f)+'">').join("");
 const l=$("list");l.innerHTML="";
 LIB.songs.filter(s=>(!FILT.fav||s.fav)&&(!FILT.tag||(s.tags||[]).includes(FILT.tag))&&(!FILT.folder||(FILT.folder===NOFOLD?!s.folder:s.folder===FILT.folder))&&matchSong(s,q)).sort(cmpSong).forEach(s=>{
  const d=document.createElement("div");d.className="it"+(s===S?" on":"");
  let snip="";
  if(qn&&!sIdx(s).head.includes(qn)){const ly=sIdx(s).ly,i=sIdx(s).nly.indexOf(qn);if(i>=0)snip="…"+ly.slice(Math.max(0,i-18),i+qn.length+28).trim()+"…"}
  d.innerHTML=`<span><b class="star" role="button" tabindex="0" aria-label="Favorita" aria-pressed="${s.fav?"true":"false"}" title="Favorita">${s.fav?"★":"☆"}</b> ${s.follow?"🔗 ":""}${esc(s.title||"(sem título)")}</span><small>${esc(libMeta(s))}</small>${snip?`<div class="snip">${esc(snip)}</div>`:""}`;
  const st=d.querySelector(".star"),tf=e=>{e.stopPropagation();s.fav=!s.fav;s.updated=Date.now();if(s===S)$("fav").checked=!!s.fav;persist();lib()};
  st.onclick=tf;st.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();tf(e)}};
  d.onclick=()=>{S=s;LIB.cur=s.id;VIEW="song";fields();editor();preview();if(MODE==="text")$("ttxt").value=ser(S.sections);persist();go("song")};
  d.tabIndex=0;d.setAttribute("role","button");
  d.onkeydown=e=>{if(e.target===d&&(e.key==="Enter"||e.key===" ")){e.preventDefault();d.click()}};
  l.appendChild(d);
 });
 if(!l.children.length)l.innerHTML='<div class="help" style="margin-top:6px">Nenhuma música encontrada.</div>';
 sets();
}
function fields(){["title","artist","key","time","bpm"].forEach(f=>$(f).value=S[f]||"");$("capo").value=S.capo||0;$("capoS").checked=!!S.capoShapes;$("chart").checked=!!S.chart;$("acc").value=S.acc||"";$("tags").value=(S.tags||[]).join(", ");$("fav").checked=!!S.fav;$("dur").value=S.dur||"";$("link").value=S.link||"";{const fo=$("folder");if(fo)fo.value=S.folder||""}{const n=$("fnote");if(n)n.hidden=!S.follow}if(typeof onFields==="function")onFields();hist();updUndo()}
async function out(name,obj){
 const data=JSON.stringify(obj,null,1);
 try{
  if(DL){await DL.save({filename:name,data});msg("Arquivo "+name+" pronto.");return}
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([data],{type:"application/json"}));a.download=name;a.click();msg("Arquivo "+name+" gerado.");
 }catch(e){msg(e&&e.code==="declined"?"Download cancelado.":"Não foi possível baixar o arquivo neste ambiente.")}
}
const fname=s=>(s||"cifra").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/gi,"-").toLowerCase().replace(/^-|-$/g,"")||"cifra";
const esc=s=>s.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
