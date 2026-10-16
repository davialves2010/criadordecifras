/* js/stage.js — Modo palco: rolagem, fonte, tela sempre acesa e atalhos */
/* ---- modo palco ---- */
let SI=[],SX=0,SS=0,FS=18,PLAY=false,ACC=0;
let WL=null,WANT=false;
async function wl(on){WANT=on;try{if(on&&navigator.wakeLock&&!WL){WL=await navigator.wakeLock.request("screen");WL.addEventListener("release",()=>{WL=null})}else if(!on&&WL){await WL.release();WL=null}}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&WANT&&!WL)wl(true)});
document.addEventListener("keydown",e=>{if($("stage").hidden||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName||""))return;if(e.key===" "){e.preventDefault();$("play").click()}else if(e.key==="ArrowRight")$("sn").click();else if(e.key==="ArrowLeft")$("sp").click()});
function stageRender(){
 const it=SI[SX];$("stg").innerHTML=sheetHTML(it.sg,it.x+SS);$("stg").style.setProperty("--fs",FS);
 $("tv").textContent=(SS>0?"+":"")+SS;$("sti").textContent=SI.length>1?(SX+1)+"/"+SI.length:"";$("stage").scrollTop=0;
}
function play(on){PLAY=on;$("play").textContent=on?"⏸ Pausar":"▶ Rolar";if(on)requestAnimationFrame(tick)}
function tick(){if(!PLAY)return;ACC+=$("spd").value*0.25;const n=Math.floor(ACC);if(n>0){$("stage").scrollTop+=n;ACC-=n}requestAnimationFrame(tick)}
$("stg0").onclick=()=>{
 const cs=curSet();
 SI=VIEW==="set"&&cs&&cs.items.length?cs.items.map(i=>({sg:songBy(i.songId),x:i.shift||0})).filter(i=>i.sg):[{sg:S,x:0}];
 wl(true);SX=0;SS=0;$("stage").hidden=false;document.body.style.overflow="hidden";stageRender();
};
const closeStage=()=>{wl(false);play(false);$("stage").hidden=true;document.body.style.overflow="";$("tip").style.display="none"};
$("sx").onclick=closeStage;
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("stage").hidden)closeStage()});
$("sp").onclick=()=>{if(SX>0){SX--;SS=0;stageRender()}};
$("sn").onclick=()=>{if(SX<SI.length-1){SX++;SS=0;stageRender()}};
$("tu").onclick=()=>{SS=(SS+1)%12;stageRender()};
$("td").onclick=()=>{SS=(SS-1)%12;stageRender()};
$("fu").onclick=()=>{FS=Math.min(48,FS+2);stageRender()};
$("fd").onclick=()=>{FS=Math.max(10,FS-2);stageRender()};
$("play").onclick=()=>play(!PLAY);
