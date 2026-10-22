/* js/metronome.js — Metrônomo do modo palco */
/* ---- metrônomo (modo palco) ---- */
let MT={on:false,bpm:80,per:4,ctx:null,nx:0,bt:0,id:null,sid:null,q:[],raf:0,fl:0};
function mClick(t,acc){const o=MT.ctx.createOscillator(),g=MT.ctx.createGain();o.frequency.value=acc?1500:1000;g.gain.setValueAtTime(.4,t);g.gain.exponentialRampToValueAtTime(.001,t+.05);o.connect(g);g.connect(MT.ctx.destination);o.start(t);o.stop(t+.06)}
/* o flash segue o relógio do áudio (ctx.currentTime), sem criar um setTimeout por batida */
function mFlash(){
 if(!MT.on){MT.raf=0;return}
 const n=MT.ctx.currentTime;
 while(MT.q.length&&MT.q[0]<=n){MT.q.shift();MT.fl=n+.09;$("mb").classList.add("tick")}
 if(MT.fl&&n>=MT.fl){$("mb").classList.remove("tick");MT.fl=0}
 MT.raf=requestAnimationFrame(mFlash);
}
function mSched(){
 while(MT.nx<MT.ctx.currentTime+.12){
  mClick(MT.nx,MT.bt%MT.per===0);
  MT.q.push(MT.nx);if(MT.q.length>16)MT.q.shift();
  MT.nx+=60/MT.bpm;MT.bt++;
 }
}
function mToggle(on){
 clearInterval(MT.id);cancelAnimationFrame(MT.raf);MT.raf=0;MT.on=false;MT.q=[];MT.fl=0;
 $("mt").classList.remove("on");$("mb").classList.remove("tick");
 if(!on)return;
 try{
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  MT.ctx=MT.ctx||new AC();if(MT.ctx.resume)MT.ctx.resume();
  MT.nx=MT.ctx.currentTime+.05;MT.bt=0;MT.on=true;$("mt").classList.add("on");
  MT.id=setInterval(mSched,25);MT.raf=requestAnimationFrame(mFlash);
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
