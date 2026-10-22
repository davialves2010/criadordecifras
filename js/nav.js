/* js/nav.js — telas: Músicas (início), Repertórios, Música (tocar/imprimir/tom) e Editar */
const _pv=preview;
preview=function(){_pv();document.body.dataset.set=VIEW==="set"?"1":""};
function go(v){
 document.body.dataset.v=v;
 tab(v==="home"?"songs":v==="sets"?"sets":"edit");
 setM(v==="song"?"sheet":"edit");
 document.querySelectorAll("[data-go]").forEach(b=>{
  const on=b.dataset.go===v||(v==="song"&&b.dataset.go==="home");
  b.classList.toggle("on",on);if(on)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");
 });
 scrollTo(0,0);
}
document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));
$("logo").onclick=()=>go("home");
$("gohome").onclick=()=>go("home");
$("goback").onclick=()=>{VIEW="song";preview();go("sets")};
$("goedit").onclick=()=>go("edit");
$("edone").onclick=()=>go("song");
$("mcfg").onclick=()=>openCfg();
/* botões principais ficam juntos na barra da música */
$("goedit").before($("stg0"),$("print"));
$("stg0").textContent="🎤 Tocar ao vivo";$("stg0").classList.add("p");$("print").classList.remove("p");
$("rs").textContent="↺ Tom original";
/* menu "Mais": fora do painel, para valer na tela da música também */
document.body.appendChild($("pop"));
$("more2").onclick=e=>{e.stopPropagation();const p=$("pop");p.hidden=!p.hidden;if(!p.hidden)placePop(e.currentTarget)};
const _del=$("del").onclick;
$("del").onclick=function(e){const t0=(LIB.trash||[]).length;_del.call(this,e);if((LIB.trash||[]).length>t0){$("pop").hidden=true;go("home")}};
/* opções avançadas da folha ficam escondidas */
const vb=$("vbar"),vgs=[...vb.querySelectorAll(".vg")];
vgs.slice(1).forEach(g=>g.classList.add("adv"));
const tg=document.createElement("div");tg.className="vg";tg.innerHTML='<button id="moreopt" aria-expanded="false">⚙ Mais opções ▾</button>';vgs[0].after(tg);
$("moreopt").onclick=()=>{const o=vb.classList.toggle("open");$("moreopt").textContent=o?"⚙ Menos opções ▴":"⚙ Mais opções ▾";$("moreopt").setAttribute("aria-expanded",o)};
go("home");
