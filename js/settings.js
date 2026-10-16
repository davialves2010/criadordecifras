/* js/settings.js — Barra de topo, página de configurações e tema */
/* ---- barra de topo ---- */
function renderSw(){
 const q=$("swq").value.toLowerCase(),l=$("swl");l.innerHTML="";
 LIB.songs.filter(s=>matchSong(s,q)).sort((a,b)=>(a.title||"").localeCompare(b.title||"","pt")).forEach(s=>{
  const b=document.createElement("button");b.className=s===S?"cur":"";b.innerHTML=`<span>${esc(s.title||"(sem título)")}</span><small>${esc(s.artist||"")}</small>`;
  b.onclick=()=>{S=s;LIB.cur=s.id;VIEW="song";fields();all();$("swp").hidden=true};
  l.appendChild(b);
 });
 if(!l.children.length)l.innerHTML='<div class="help">Nenhuma música encontrada.</div>';
}
$("ttlbtn").onclick=e=>{e.stopPropagation();const p=$("swp");p.hidden=!p.hidden;if(!p.hidden){$("swq").value="";renderSw();$("swq").focus()}};
$("swq").oninput=renderSw;
$("swnew").onclick=()=>{$("swp").hidden=true;$("newtop").click()};
$("newtop").onclick=()=>{$("new").onclick();setM("edit")};
$("back2").onclick=()=>$("back").onclick();
/* ---- página de configurações ---- */
let PREFS={};try{PREFS=JSON.parse(localStorage.getItem("cifras_prefs")||"{}")}catch(e){}
if(PREFS.fs)FS=PREFS.fs;if(PREFS.spd)$("spd").value=PREFS.spd;
const savePrefs=()=>{try{localStorage.setItem("cifras_prefs",JSON.stringify(PREFS))}catch(e){}};
function openCfg(){
 const n=LIB.songs.length,m=LIB.sets.length;
 $("cfg-stats").textContent=n+" música"+(n===1?"":"s")+" · "+m+" repertório"+(m===1?"":"s");
 $("cfg-sync").textContent=$("sv").textContent;
 document.querySelectorAll("[data-th]").forEach(b=>b.classList.toggle("on",b.dataset.th===TH[thi]));
 $("pf-v").textContent=FS;$("pf-spd").value=$("spd").value;
 $("cfg").hidden=false;document.body.style.overflow="hidden";$("cfg").scrollTop=0;
}
function closeCfg(){$("cfg").hidden=true;document.body.style.overflow=""}
$("tmore").onclick=openCfg;$("cfgback").onclick=closeCfg;
$("m-exp").onclick=()=>$("expAll").click();$("m-expo").onclick=()=>$("expOne").click();
$("m-imp").onclick=()=>$("imp").click();
$("m-ex").onclick=()=>{$("ex").click();closeCfg();toast("Música de exemplo adicionada.")};
$("pfm").onclick=()=>{FS=Math.max(10,FS-2);PREFS.fs=FS;savePrefs();$("pf-v").textContent=FS};
$("pfp").onclick=()=>{FS=Math.min(48,FS+2);PREFS.fs=FS;savePrefs();$("pf-v").textContent=FS};
$("pf-spd").oninput=()=>{$("spd").value=$("pf-spd").value;PREFS.spd=+$("pf-spd").value;savePrefs()};
$("m-help").onclick=()=>{$("helpbox").hidden=false};
$("hclose").onclick=()=>{$("helpbox").hidden=true};
$("helpbox").onclick=e=>{if(e.target===$("helpbox"))$("helpbox").hidden=true};
document.addEventListener("keydown",e=>{if(e.key==="Escape"){$("helpbox").hidden=true;$("swp").hidden=true;closeCfg()}});
document.addEventListener("click",e=>{document.querySelectorAll(".pop").forEach(p=>{if(!p.parentElement.contains(e.target))p.hidden=true})});
const TH=["","light","dark"],THN=["Automático","Claro","Escuro"];let thi=0;
try{thi=Math.max(0,TH.indexOf(localStorage.getItem("cifras_theme")||""))}catch(e){}
function applyTheme(){const t=TH[thi];if(t)document.documentElement.dataset.theme=t;else delete document.documentElement.dataset.theme;document.querySelectorAll("[data-th]").forEach(b=>b.classList.toggle("on",b.dataset.th===TH[thi]))}
document.querySelectorAll("[data-th]").forEach(b=>b.onclick=()=>{thi=Math.max(0,TH.indexOf(b.dataset.th));try{localStorage.setItem("cifras_theme",TH[thi])}catch(x){}applyTheme()});
applyTheme();
