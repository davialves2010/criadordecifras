/* js/stage.js — Modo palco: rolagem, fonte, tela sempre acesa, pedal e atalhos */
/* ---- modo palco ---- */
let SI=[],SX=0,SS=0,FS=18,PLAY=false,ACC=0,LT0=0,SMODE="manual",BPL=2,DURWARN=false;
let WL=null,WANT=false;
/* funções que outros arquivos pedem para rodar depois de cada desenho do palco (palco ao vivo, diapasão…) */
const STAGE_HOOKS=[];
async function wl(on){WANT=on;try{if(on&&navigator.wakeLock&&!WL){WL=await navigator.wakeLock.request("screen");WL.addEventListener("release",()=>{WL=null})}else if(!on&&WL){await WL.release();WL=null}}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&WANT&&!WL)wl(true)});
/* pedal Bluetooth: a maioria envia PageDown/PageUp ou as setas. Em Configurações dá para escolher
   se as setas ◀ ▶ trocam de música (padrão) ou viram "página anterior/próxima" */
function pageScroll(d){const st=$("stage");st.scrollBy({top:d*st.clientHeight*.85,behavior:"smooth"})}
document.addEventListener("keydown",e=>{
 if($("stage").hidden||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName||""))return;
 const k=e.key,pg=typeof PREFS!=="undefined"&&PREFS.pedal==="page";
 if(k===" "){e.preventDefault();$("play").click()}
 else if(k==="PageDown"){e.preventDefault();pageScroll(1)}
 else if(k==="PageUp"){e.preventDefault();pageScroll(-1)}
 else if(k==="ArrowRight"){e.preventDefault();pg?pageScroll(1):$("sn").click()}
 else if(k==="ArrowLeft"){e.preventDefault();pg?pageScroll(-1):$("sp").click()}
});
function stageRender(){
 const it=SI[SX];if(!it)return;$("stg").innerHTML=sheetHTML(it.sg,it.x+SS,it.note||"");$("stg").style.setProperty("--fs",FS);
 $("tv").textContent=(SS>0?"+":"")+SS;$("sti").textContent=SI.length>1?(SX+1)+"/"+SI.length:"";$("stage").scrollTop=0;secList();
 STAGE_HOOKS.forEach(f=>{try{f()}catch(e){}});
}
/* velocidade em pixels por segundo, conforme o modo escolhido */
function scrollSpeed(){
 const it=SI[SX],sg=it&&it.sg,st=$("stage");
 if(SMODE==="bpm"&&sg){
  /* cada linha de letra dura BPL compassos: velocidade = altura da linha ÷ duração dela */
  const bpm=+sg.bpm||80,per=Math.max(1,parseInt((sg.time||"4/4").split("/")[0])||4),ln=$("stg").querySelector(".ln");
  if(ln){const h=ln.getBoundingClientRect().height+2;if(h>2)return h/(BPL*per*60/bpm)}
 }
 if(SMODE==="dur"&&sg){
  const d=parseDur(sg.dur);
  if(d>0)return Math.max(0,st.scrollHeight-st.clientHeight*1.5)/d;
  if(!DURWARN){DURWARN=true;toast("Esta música não tem duração (Editar › Mais detalhes). Usando a velocidade manual.")}
 }
 return $("spd").value*15;
}
function play(on){PLAY=on;LT0=0;$("play").textContent=on?"⏸ Pausar":"▶ Rolar";if(on)requestAnimationFrame(tick)}
function tick(ts){
 if(!PLAY)return;
 const dt=LT0?Math.min(100,ts-LT0):16;LT0=ts;
 ACC+=scrollSpeed()*dt/1000;const n=Math.floor(ACC);if(n>0){$("stage").scrollTop+=n;ACC-=n}
 requestAnimationFrame(tick);
}
function updSmode(){$("spd").hidden=SMODE!=="manual";$("sbpl").hidden=SMODE!=="bpm"}
$("smode").onchange=()=>{SMODE=$("smode").value;DURWARN=false;PREFS.smode=SMODE;savePrefs();updSmode()};
$("sbpl").onchange=()=>{BPL=+$("sbpl").value||2;PREFS.bpl=BPL;savePrefs()};
$("stg0").onclick=()=>{
 const cs=curSet();
 SI=VIEW==="set"&&cs&&cs.items.length?cs.items.map(i=>({sg:songBy(i.songId),x:i.shift||0,note:i.note||""})).filter(i=>i.sg):[{sg:S,x:0,note:""}];
 wl(true);SX=0;SS=0;DURWARN=false;$("stage").hidden=false;document.body.style.overflow="hidden";stageRender();
};
const closeStage=()=>{wl(false);play(false);$("stage").hidden=true;document.body.style.overflow="";$("tip").style.display="none"};
$("sx").onclick=closeStage;
/* o Esc é tratado em a11y.js: fecha só a camada do topo */
$("sp").onclick=()=>{if(SX>0){SX--;SS=0;stageRender()}};
$("sn").onclick=()=>{if(SX<SI.length-1){SX++;SS=0;stageRender()}};
/* transposição no palco fica entre −6 e +5 (o rótulo mostra "−1", não "+11") */
const normS=n=>((n%12+18)%12)-6;
$("tu").onclick=()=>{SS=normS(SS+1);stageRender()};
$("td").onclick=()=>{SS=normS(SS-1);stageRender()};
$("fu").onclick=()=>{FS=Math.min(48,FS+2);stageRender()};
$("fd").onclick=()=>{FS=Math.max(10,FS-2);stageRender()};
$("play").onclick=()=>play(!PLAY);

/* ---- palco: pular para seção, toque para pausar, tela cheia ---- */
function secList(){
 const sel=$("ssec"),bx=[...$("stg").querySelectorAll(".box")];
 sel.innerHTML='<option value="">Ir para…</option>'+bx.map((b,i)=>`<option value="${i}">${i+1}. ${esc(((b.querySelector(".lb")||{}).firstChild||{}).textContent||"")}</option>`).join("");
 sel.hidden=bx.length<2;
}
$("ssec").onchange=()=>{const v=$("ssec").value;if(v==="")return;const b=$("stg").querySelectorAll(".box")[+v];if(b)b.scrollIntoView({behavior:"smooth",block:"start"});$("ssec").value=""};
let TAPPED=false;
$("stg").addEventListener("click",e=>{if(e.target.closest(".c"))return;if(PLAY){play(false);TAPPED=true}else if(TAPPED){play(true);TAPPED=false}});
$("play").addEventListener("click",()=>{TAPPED=false});
const FSE=document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen;
if(!FSE)$("sfs").hidden=true;
$("sfs").onclick=()=>{try{if(document.fullscreenElement||document.webkitFullscreenElement)(document.exitFullscreen||document.webkitExitFullscreen).call(document);else FSE.call($("stage"))}catch(e){}};
$("sx").addEventListener("click",()=>{try{if(document.fullscreenElement)document.exitFullscreen()}catch(e){}});
