/* js/metronome.js — Metrônomo do modo palco */
/* ---- metrônomo (modo palco) ---- */
let MT={on:false,bpm:80,per:4,ctx:null,nx:0,bt:0,id:null,sid:null};
function mClick(t,acc){const o=MT.ctx.createOscillator(),g=MT.ctx.createGain();o.frequency.value=acc?1500:1000;g.gain.setValueAtTime(.4,t);g.gain.exponentialRampToValueAtTime(.001,t+.05);o.connect(g);g.connect(MT.ctx.destination);o.start(t);o.stop(t+.06)}
function mSched(){
 while(MT.nx<MT.ctx.currentTime+.12){
  mClick(MT.nx,MT.bt%MT.per===0);
  const d=Math.max(0,(MT.nx-MT.ctx.currentTime)*1000);
  setTimeout(()=>{$("mb").classList.add("tick");setTimeout(()=>$("mb").classList.remove("tick"),90)},d);
  MT.nx+=60/MT.bpm;MT.bt++;
 }
}
function mToggle(on){
 clearInterval(MT.id);MT.on=false;$("mt").classList.remove("on");
 if(!on)return;
 try{
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  MT.ctx=MT.ctx||new AC();if(MT.ctx.resume)MT.ctx.resume();
  MT.nx=MT.ctx.currentTime+.05;MT.bt=0;MT.on=true;$("mt").classList.add("on");MT.id=setInterval(mSched,25);
 }catch(e){}
}
const _stageRender=stageRender;
stageRender=function(){
 _stageRender();
 const sg=SI[SX]&&SI[SX].sg;
 if(sg&&MT.sid!==sg.id){MT.sid=sg.id;MT.bpm=+sg.bpm||80;MT.per=Math.max(1,parseInt((sg.time||"4/4").split("/")[0])||4);MT.bt=0}
 $("mb").textContent=MT.bpm;
};
$("mt").onclick=()=>mToggle(!MT.on);
$("mm").onclick=()=>{MT.bpm=Math.max(30,MT.bpm-2);$("mb").textContent=MT.bpm};
$("mp").onclick=()=>{MT.bpm=Math.min(240,MT.bpm+2);$("mb").textContent=MT.bpm};
$("sx").addEventListener("click",()=>mToggle(false));
document.addEventListener("keydown",e=>{if(e.key==="Escape")mToggle(false)});
