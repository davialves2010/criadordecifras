/* js/render.js — Transposição, graus, montagem da folha (HTML) e pré-visualização */
const SH=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"],FL=["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
const IDX={};SH.forEach((n,i)=>IDX[n]=i);FL.forEach((n,i)=>IDX[n]=i);
let PREFER=null;
function tn(n,k){const m=n.match(/^([A-G][#b]?)/);if(!m||(!k&&!PREFER))return n;const r=m[1],i=(IDX[r]+k+120)%12;return (PREFER==="flat"?FL:PREFER==="sharp"?SH:r.includes("b")?FL:SH)[i]+n.slice(r.length)}
let DEG=null,SW=794,PH=1030;
const DGN=["1","b2","2","b3","3","4","b5","5","b6","6","b7","7"];
const isMin=k=>/min|menor|^\s*[A-G][#b]?m(?!aj)/i.test(k||"");
function origIdx(sg){const m=(sg.key||"").match(/^\s*([A-G][#b]?)/);if(m)return IDX[m[1]];for(const s of sg.sections){const c=(s.text.match(/\[([A-G][#b]?)/)||[])[1];if(c)return IDX[c]}return 0}
function dgc(p){const m=p.match(/^([A-G][#b]?)(.*)$/);return m?DGN[(IDX[m[1]]-DEG+12)%12]+m[2]:p}
function tc(c,k){return c.split("/").map(p=>DEG!==null?dgc(p):tn(p,k)).join("/")}
function tcr(c,k){return c.split("/").map(p=>tn(p,k)).join("/")}
function line(t,k){if(/^\s*[eBGDAEb]\|[-\dhpbrx\/\\~()|\s]+$/.test(t))return `<div class="ln tabl">${esc(t)}</div>`;
 const segs=[];
 t.split(/(\[[^\]]+\])/).forEach(p=>{
  const m=p.match(/^\[([^\]]+)\]$/);
  if(m)segs.push({c:tc(m[1],k),r:tcr(m[1],k),t:"",n:[]});
  else if(p){if(!segs.length)segs.push({c:"",r:"",t:p,n:[]});else segs[segs.length-1].t+=p}
 });
 segs.forEach(s=>{s.t=s.t.replace(/\{([^}]*)\}/g,(_,x)=>{s.n.push(x);return ""})});
 const only=!/[a-zA-ZÀ-ú]/.test(t.replace(/\[[^\]]+\]|\{[^}]*\}/g,""));
 return `<div class="ln ${only?"ch":""}">`+segs.map(s=>`<span class="s"><span class="c"${s.r?` data-n="${esc(s.r).replace(/"/g,"&quot;")}"`:""}>${esc(s.c)}${s.n.map(x=>`<span class="nt">${esc(x)}</span>`).join("")}</span><span class="l">${esc(s.t)||" "}</span></span>`).join("")+"</div>";
}
function sheetHTML(sg,x=0){
 PREFER=sg.acc||null;DEG=sg.degrees?origIdx(sg):null;
 const t=(sg.shift||0)+x,k=t-(sg.capoShapes?(sg.capo||0):0);
 let key=sg.key||"";if(t)key=key?key.replace(/^([A-G][#b]?)/,m=>tn(m,t)):tn((PREFER==="flat"?FL:SH)[origIdx(sg)],t);
 let o=`<h2>${esc(sg.title||"")}</h2><div class="art">${esc(sg.artist||"")}</div><div class="meta">${key?`Tom: <b>${esc(key)}</b>`:""}${sg.time?` | Comp: <b>${esc(sg.time)}</b>`:""}${sg.bpm?` | BPM: <b>${esc(String(sg.bpm))}</b>`:""}${sg.capo?` | Capotraste: <b>${sg.capo}ª casa</b>`:""}${sg.degrees?` | <b>Graus</b>`:""}</div>`;
 o+=`<div class="body${sg.cols==2?" c2":""}">`+sg.sections.map(s=>`<div class="box"><span class="lb">${esc(s.name)}${s.rep?`<i>${esc(s.rep)}</i>`:""}</span>${s.text.split("\n").map(l=>line(l,k)).join("")}${s.note?`<div class="sn">${esc(s.note)}</div>`:""}</div>`).join("")+`</div>`;
 if(sg.chart){
  const u=[];sg.sections.forEach(s=>(s.text.match(/\[[^\]]+\]/g)||[]).forEach(m=>{const c=tcr(m.slice(1,-1),k);if(!u.includes(c))u.push(c)}));
  o+=`<div class="chart">`+u.map(c=>`<figure><figcaption>${esc(c)}</figcaption>${diag(c)}</figure>`).join("")+`</div>`;
 }
 return `<div class="song" style="--fz:${(sg.fs||100)/100}">${o}</div>`;
}
function preview(){
 const cs=curSet(),set=VIEW==="set",first=set&&cs&&cs.items.length?songBy(cs.items[0].songId):null,ps=first||S;
 const land=ps.ori==="l",MM={c:8,n:12,w:18}[ps.mar||"n"],pad={c:30,n:45,w:68}[ps.mar||"n"];
 SW=land?1123:794;PH=Math.round(((land?210:297)-2*MM)*3.7795);
 const sh=$("sheet");sh.style.setProperty("--sw",SW+"px");sh.style.setProperty("--pad",pad+"px");sh.style.setProperty("--mh",(land?700:1000)+"px");
 $("pgcss").textContent=`@page{size:A4 ${land?"landscape":"portrait"};margin:${MM}mm}`;
 if(set){
  const its=cs?cs.items:[];
  sh.innerHTML=its.map(it=>{const sg=songBy(it.songId);return sg?`<div class="pg">${sheetHTML(sg,it.shift||0)}</div>`:""}).join("")||"<p style='color:#888'>Repertório vazio. Adicione músicas no painel ao lado.</p>";
 }else sh.innerHTML=sheetHTML(S);
 $("vbar").style.display=set?"none":"";
 const sv=(((S.shift||0)%12)+12)%12,lab=sv>6?sv-12:sv;$("shift").textContent=lab?(lab>0?"+":"")+lab:"";
 const fl=S.acc==="flat"||(S.acc!=="sharp"&&/^\s*[A-G]b/.test(S.key||"")),mn=isMin(S.key),ks=$("ksel"),sig=fl+"|"+mn;
 if(ks.dataset.sig!==sig){ks.dataset.sig=sig;ks.innerHTML=(fl?FL:SH).map((n,i)=>`<option value="${i}">${n+(mn?"m":"")}</option>`).join("")}
 ks.value=String((origIdx(S)+sv)%12);
 document.querySelectorAll("[data-cols]").forEach(b=>b.classList.toggle("on",+b.dataset.cols===(S.cols==2?2:1)));
 document.querySelectorAll("[data-ori]").forEach(b=>b.classList.toggle("on",b.dataset.ori===(S.ori==="l"?"l":"p")));
 $("deg").classList.toggle("on",!!S.degrees);$("fval").textContent=(S.fs||100)+"%";$("msel").value=S.mar||"n";
 $("back").style.display=set?"":"none";$("back2").hidden=!set;
 try{guides()}catch(e){}
 $("ttl").textContent=set?"Repertório: "+(cs?cs.name:""):(S.title||"Sem título")+(S.artist?" — "+S.artist:"");
}
function guides(){
 const sh=$("sheet");sh.querySelectorAll(".pgd").forEach(e=>e.remove());
 const sr=sh.getBoundingClientRect();if(!sr.width||sh.querySelector(".c2"))return;
 const k=sr.width/SW,Y=el=>(el.getBoundingClientRect().top-sr.top)/k,H=el=>el.getBoundingClientRect().height/k;
 const add=(y,n)=>{const g=document.createElement("div");g.className="pgd";g.style.top=(y-9)+"px";g.innerHTML=`<span>página ${n}</span>`;sh.appendChild(g)};
 let n=1;
 [...sh.querySelectorAll(".song")].forEach((c,ci)=>{
  const kids=[...c.children].flatMap(x=>x.classList.contains("body")?[...x.children]:[x]);if(!kids.length)return;
  if(ci>0){n++;add(Y(kids[0]),n)}
  let ps=Y(kids[0]);
  kids.forEach(b=>{const y=Y(b),bt=y+H(b);if(bt>ps+PH&&y>ps+1){n++;add(y,n);ps=y}});
 });
}
function fit(){const w=document.querySelector(".wrap").clientWidth;if(w<60)return;$("sheet").style.setProperty("--z",Math.min(1,w/SW))}
function setM(m){document.body.className="m-"+m;document.querySelectorAll(".mbar [data-m]").forEach(b=>b.classList.toggle("on",b.dataset.m===m));setTimeout(()=>{fit();try{guides()}catch(e){}},30)}
document.querySelectorAll(".mbar [data-m]").forEach(b=>b.onclick=()=>setM(b.dataset.m));
$("mstage").onclick=()=>$("stg0").click();
try{new ResizeObserver(fit).observe(document.querySelector(".wrap"))}catch(e){addEventListener("resize",fit)}
try{document.fonts.ready.then(()=>{fit();guides()})}catch(e){}
addEventListener("load",()=>{fit();try{guides()}catch(e){}});
$("more").onclick=e=>{e.stopPropagation();$("pop").hidden=!$("pop").hidden};
$("pop").onclick=e=>{const b=e.target.closest("button");if(b&&b.id!=="del")$("pop").hidden=true};
document.addEventListener("click",e=>{if(!e.target.closest(".menuwrap"))$("pop").hidden=true});
$("acc").onchange=()=>{S.acc=$("acc").value;save();preview()};
