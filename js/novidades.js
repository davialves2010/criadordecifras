/* js/novidades.js — aviso "O que há de novo": aparece uma vez por versão, depois do login.
   Para anunciar uma novidade nova: troque NEWS.v (qualquer texto diferente do anterior) e edite NEWS.itens. */
(function(){
 const NEWS={v:"2026-10-26",itens:[
  "📱 Tela da música reorganizada para o celular: botões em grade e barra de tom sem rolagem lateral.",
  "🎵 A lista de músicas agora mostra o tom e a duração de cada uma.",
  "⌨️ Dá para navegar pela lista só com o teclado (Tab e Enter).",
  "🎤 No palco: deslize para os lados para trocar de música e toque na borda da tela para voltar ou avançar a página. Dá para desligar em Configurações.",
  "📽 Novo modo Projeção no palco: só a letra, em fonte grande, para telão ou TV (tecla P).",
  "🛡 Mais segurança por trás: limite nas importações por link e registro de erros para corrigirmos problemas mais rápido."
 ]};
 const g=id=>document.getElementById(id);
 const seen=()=>{PREFS.seenNews=NEWS.v;savePrefs()};
 function show(){
  const ul=g("newsl");ul.innerHTML="";
  NEWS.itens.forEach(t=>{const li=document.createElement("li");li.textContent=t;ul.appendChild(li)});
  seen(); /* marca como visto já ao abrir: não importa como a pessoa fecha */
  g("newsbox").hidden=false;
 }
 g("newsx").onclick=()=>{g("newsbox").hidden=true};
 g("newsbox").onclick=e=>{if(e.target===g("newsbox"))g("newsbox").hidden=true};
 const bt=g("m-news");if(bt)bt.onclick=show;

 /* espera o login terminar; quem acabou de chegar vê o guia de início, não as novidades */
 let n=0;
 const t=setInterval(()=>{
  if(++n>170){clearInterval(t);return} /* ~2 minutos */
  let ok=false;
  try{ok=!!USER&&!document.documentElement.classList.contains("locked")}catch(e){}
  if(!ok)return;
  clearInterval(t);
  if(PREFS.seenNews===NEWS.v)return;
  if(!PREFS.hideWelcome&&LIB.songs.length<=1){seen();return}
  setTimeout(show,800);
 },700);
})();
