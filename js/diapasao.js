/* js/diapasao.js — Nota de referência no palco: toca a tônica do tom atual até você desligar. Carregar DEPOIS de stage.js e ux.js. */

/* frequência da tônica: notas de C a F# ficam na oitava de C4; de G a B, na oitava de baixo (G3 ≈ 196 Hz) */
function tonicFreq(pc){
 pc=((pc%12)+12)%12;
 return 261.6256*Math.pow(2,(pc>=7?pc-12:pc)/12);
}

(function(){
 const g=id=>document.getElementById(id);
 let ctx=null,osc=null,gain=null,on=false;
 const bt=document.createElement("button");
 bt.id="snote";bt.textContent="🎵 Nota do tom";bt.title="Toca a nota do tom (tônica) como referência para afinar a voz";bt.setAttribute("aria-pressed","false");
 (g("smenu")||g("sbar")).appendChild(bt);

 /* tônica do que está na tela: tom original + transposição da música + transposição do palco */
 function tonica(){
  const it=SI[SX];if(!it)return null;
  const sg=it.sg,t=(sg.shift||0)+it.x+SS,pc=(((origIdx(sg)+t)%12)+12)%12;
  return{pc,nome:((sg.acc==="flat"||/^\s*[A-G]b/.test(sg.key||""))?FL:SH)[pc]};
 }
 function atualizar(){
  if(!on||!osc)return;
  const t=tonica();if(!t)return;
  osc.frequency.setTargetAtTime(tonicFreq(t.pc),ctx.currentTime,.03);
  bt.textContent="🎵 Nota: "+t.nome;
 }
 function ligar(){
  const t=tonica();if(!t){toast("Abra uma música no palco primeiro.");return}
  try{
   const AC=window.AudioContext||window.webkitAudioContext;if(!AC){toast("Este navegador não toca áudio.");return}
   ctx=ctx||new AC();if(ctx.resume)ctx.resume();
   osc=ctx.createOscillator();gain=ctx.createGain();
   osc.type="sine";osc.frequency.value=tonicFreq(t.pc);
   gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.2,ctx.currentTime+.08);
   osc.connect(gain);gain.connect(ctx.destination);osc.start();
   on=true;bt.setAttribute("aria-pressed","true");bt.textContent="🎵 Nota: "+t.nome;
  }catch(e){on=false;osc=null}
 }
 function desligar(){
  if(osc){
   try{gain.gain.cancelScheduledValues(ctx.currentTime);gain.gain.setValueAtTime(Math.max(gain.gain.value,.0001),ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.12);osc.stop(ctx.currentTime+.15)}catch(e){}
  }
  osc=null;gain=null;on=false;bt.setAttribute("aria-pressed","false");bt.textContent="🎵 Nota do tom";
 }
 bt.onclick=()=>on?desligar():ligar();
 STAGE_HOOKS.push(atualizar);
 g("sx").addEventListener("click",desligar);
 document.addEventListener("visibilitychange",()=>{if(document.hidden)desligar()});
})();
