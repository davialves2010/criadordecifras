/* js/a11y.js — acessibilidade: rótulos de botões, estados (aria-pressed) e diálogos */
(function(){
 const L={td:"Tom meio tom abaixo",tu:"Tom meio tom acima",dn:"Tom meio tom abaixo",up:"Tom meio tom acima",fd:"Diminuir letra",fu:"Aumentar letra",sp:"Música anterior",sn:"Próxima música",sx:"Fechar modo palco",mm:"Diminuir BPM",mp:"Aumentar BPM",pfm:"Diminuir letra inicial",pfp:"Aumentar letra inicial",cfgback:"Voltar"};
 for(const id in L){const e=document.getElementById(id);if(e)e.setAttribute("aria-label",L[id])}
 document.querySelectorAll(".modal,.shv").forEach(m=>{m.setAttribute("role","dialog");m.setAttribute("aria-modal","true")});
 const t=document.getElementById("toast");if(t){t.setAttribute("role","status");t.setAttribute("aria-live","polite")}
 document.querySelectorAll(".seg2").forEach(g=>g.setAttribute("role","group"));
 let q=0;
 function run(){
  q=0;
  document.querySelectorAll("button[title]:not([aria-label])").forEach(b=>b.setAttribute("aria-label",b.title));
  document.querySelectorAll("input[placeholder]:not([aria-label]),textarea[placeholder]:not([aria-label])").forEach(i=>i.setAttribute("aria-label",i.placeholder.split("\n")[0]));
  document.querySelectorAll(".seg2 button,.chipb,.tabs button,.mbar [data-m],#tagbar button").forEach(b=>b.setAttribute("aria-pressed",b.classList.contains("on")?"true":"false"));
 }
 new MutationObserver(()=>{if(!q)q=requestAnimationFrame(run)}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
 run();
})();
