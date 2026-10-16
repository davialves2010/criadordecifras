/* js/pwa.js — Registro do service worker (modo offline) */
if("serviceWorker" in navigator&&location.protocol.startsWith("http"))addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));

/* ---- instalar como app ---- */
let DIP=null;
const standalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone;
addEventListener("beforeinstallprompt",e=>{e.preventDefault();DIP=e;if(!standalone())$("instbtn").hidden=false});
addEventListener("appinstalled",()=>{DIP=null;$("instbtn").hidden=true;toast("App instalado!")});
async function installApp(){
 if(DIP){DIP.prompt();await DIP.userChoice;DIP=null;$("instbtn").hidden=true;return}
 if(standalone()){toast("O app já está instalado.");return}
 const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
 msg(ios?"No iPhone/iPad: abra no Safari, toque em Compartilhar (□↑) e depois em “Adicionar à Tela de Início”.":"No Chrome: menu ⋮ → “Instalar app” (ou “Adicionar à tela inicial”).");
}
$("instbtn").onclick=installApp;
$("m-install").onclick=()=>{closeCfg();installApp()};
