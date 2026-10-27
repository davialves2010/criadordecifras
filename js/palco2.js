/* js/palco2.js — palco: gestos (deslizar / tocar nas bordas) e modo Projeção (só a letra, fonte grande).
   Carregar DEPOIS de ux.js e ANTES de a11y.js (o Esc daqui precisa vir antes do Esc de a11y.js). */
(function(){
 const g=id=>document.getElementById(id),stage=g("stage");
 const open=()=>!stage.hidden;
 const gestOn=()=>typeof PREFS==="undefined"||PREFS.sgest!==false;
 const skip=el=>!!(el&&el.closest&&el.closest("#sbar,#sbot,#sproj-ctl,select,input,textarea"));

 /* ---- opção em Configurações ---- */
 const cb=g("pf-gest");
 if(cb){cb.checked=gestOn();cb.onchange=()=>{PREFS.sgest=cb.checked;savePrefs()}}

 /* ---- deslizar para os lados: próxima / anterior ---- */
 let t0=null;
 stage.addEventListener("touchstart",e=>{
  if(e.touches.length!==1||skip(e.target)){t0=null;return}
  const t=e.touches[0];t0={x:t.clientX,y:t.clientY,t:Date.now()};
 },{passive:true});
 stage.addEventListener("touchend",e=>{
  if(!t0||!gestOn())return;
  const s=t0,t=e.changedTouches[0];t0=null;
  const dx=t.clientX-s.x,dy=t.clientY-s.y;
  if(Date.now()-s.t>700||Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*1.8)return; /* só gesto rápido e bem horizontal */
  (dx<0?g("sn"):g("sp")).click();
 },{passive:true});

 /* ---- tocar na borda: volta / avança uma página (só em telas de toque) ---- */
 const touch=()=>{try{return matchMedia("(pointer:coarse)").matches}catch(e){return false}};
 stage.addEventListener("click",e=>{
  if(!open()||!gestOn()||!touch()||skip(e.target)||(e.target.closest&&e.target.closest("button,a,.c")))return;
  const f=e.clientX/innerWidth;
  if(f<.2||f>.8){e.stopPropagation();pageScroll(f>.8?1:-1)} /* pageScroll vem de stage.js */
 },true);

 /* ---- modo Projeção ---- */
 let proj=false;
 const ctl=document.createElement("div");ctl.id="sproj-ctl";ctl.hidden=true;
 ctl.innerHTML='<button id="sproj-p" aria-label="Música anterior">◀</button><button id="sproj-n" aria-label="Próxima música">▶</button><button id="sproj-x" aria-label="Sair da projeção">✕</button>';
 stage.appendChild(ctl);
 const btn=document.createElement("button");
 btn.id="sproj";btn.textContent="📽 Projeção";btn.title="Só a letra, em fonte grande (tecla P)";btn.setAttribute("aria-pressed","false");
 (g("smenu")||g("sbar")).appendChild(btn);
 function setProj(v){
  proj=!!v;stage.classList.toggle("proj",proj);ctl.hidden=!proj;
  btn.setAttribute("aria-pressed",String(proj));
 }
 btn.onclick=()=>setProj(!proj);
 g("sproj-p").onclick=()=>g("sp").click();
 g("sproj-n").onclick=()=>g("sn").click();
 g("sproj-x").onclick=()=>setProj(false);
 g("sx").addEventListener("click",()=>setProj(false));
 document.addEventListener("keydown",e=>{
  if(!open()||e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName||""))return;
  if(e.key==="p"||e.key==="P")setProj(!proj);
 });
 /* Esc na projeção sai só da projeção; outro Esc fecha o palco (a11y.js) */
 document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&proj&&open()){e.preventDefault();e.stopImmediatePropagation();setProj(false)}
 },true);
})();
