/* js/ux.js — melhorias de usabilidade: toast com "Desfazer", confirmação mais longa, painel de layout,
   palco com barra inferior grande, alto contraste, quebra de linhas longas, estados vazios e termos unificados.
   Carregar DEPOIS de extras.js e ANTES de a11y.js. */
(function(){
 /* ---- feedback único: toast com ação opcional (ex.: Desfazer) ---- */
 toast=function(t,a){
  const e=$("toast");if(!e)return;
  if(!t){e.hidden=true;return}
  e.textContent=t;
  if(a){const b=document.createElement("button");b.className="tact";b.textContent=a.label||"Desfazer";b.onclick=()=>{e.hidden=true;a.fn()};e.appendChild(b)}
  e.hidden=false;clearTimeout(TT);
  TT=setTimeout(()=>{e.hidden=true},a?8000:Math.min(9000,Math.max(4500,t.length*70)));
 };
 /* ---- "Confirmar?" dura 6 s e muda de cor ---- */
 armed=function(b){
  if(b._a){clearTimeout(b._t);b._a=0;b.textContent=b._o;b.classList.remove("armed");return true}
  b._o=b.textContent;b._a=1;b.textContent="Confirmar?";b.classList.add("armed");
  b._t=setTimeout(()=>{b._a=0;b.textContent=b._o;b.classList.remove("armed")},6000);return false;
 };
 /* ---- tema: sem pergunta no primeiro acesso (Automático já funciona; muda em Configurações) ---- */
 askTheme=function(){};

 /* ---- desfazer exclusão de música / repertório ---- */
 function undoTrash(x,sn){
  const g=x.item;g.updated=Date.now();
  LIB.dels=(LIB.dels||[]).filter(t=>t.id!==g.id);LIB.trash=(LIB.trash||[]).filter(y=>y!==x);
  if(x.kind==="set"){g.items=(g.items||[]).filter(i=>songBy(i.songId));LIB.sets.push(g);LIB.curSet=g.id;touchSets();toast("Repertório restaurado.");return}
  LIB.songs.push(g);S=g;LIB.cur=g.id;
  sn.forEach(([st,it])=>{if(LIB.sets.includes(st)){st.items=it;st.updated=Date.now()}});
  fields();all();persist();lib();go("song");toast("Música restaurada.");
 }
 const d0=$("del").onclick;
 $("del").onclick=function(e){
  const n=(LIB.trash||[]).length,sn=LIB.sets.map(x=>[x,x.items.slice()]);
  d0.call(this,e);
  if((LIB.trash||[]).length>n){const x=LIB.trash[LIB.trash.length-1];toast("Música excluída.",{fn:()=>undoTrash(x,sn)})}
 };
 const s0=$("sdel").onclick;
 $("sdel").onclick=function(e){
  const n=(LIB.trash||[]).length;s0.call(this,e);
  if((LIB.trash||[]).length>n){const x=LIB.trash[LIB.trash.length-1];toast("Repertório excluído.",{fn:()=>undoTrash(x,[])})}
 };

 /* ---- tela da música: Colunas/Letra/Margem/Papel vão para "Layout de impressão" ---- */
 const vb=$("vbar"),grp=s=>{const e=vb.querySelector(s);return e&&e.closest(".vg")};
 const lay=document.createElement("div");lay.id="layp";lay.className="layp";lay.hidden=true;
 ["[data-cols]","#fdn","#msel","[data-ori]"].forEach(s=>{const g=grp(s);if(g){g.classList.remove("adv");lay.appendChild(g)}});
 const lb=document.createElement("div");lb.className="vg";
 lb.innerHTML='<button id="laybtn" aria-expanded="false">🖨 Layout de impressão ▾</button>';
 const mo=$("moreopt");(mo?mo.closest(".vg"):vb.firstElementChild).after(lb);vb.appendChild(lay);
 $("laybtn").onclick=()=>{
  lay.hidden=!lay.hidden;$("laybtn").textContent=lay.hidden?"🖨 Layout de impressão ▾":"🖨 Layout de impressão ▴";
  $("laybtn").setAttribute("aria-expanded",String(!lay.hidden));
 };

 /* ---- palco: barra inferior grande (◀ Rolar ▶) e o resto num menu ---- */
 const sbar=$("sbar"),keep=["sx","sti","sp","sn","play"],menu=document.createElement("div");menu.id="smenu";
 [...sbar.children].filter(c=>!keep.includes(c.id)).forEach(c=>menu.appendChild(c));
 const more=document.createElement("button");more.id="smore";more.textContent="⚙ Opções";more.setAttribute("aria-expanded","false");
 more.onclick=()=>{const o=sbar.classList.toggle("open");more.setAttribute("aria-expanded",String(o))};
 sbar.append(more,menu);
 const bot=document.createElement("div");bot.id="sbot";
 bot.append($("sp"),$("play"),$("sn"));$("stage").appendChild(bot);
 $("sx").addEventListener("click",()=>{sbar.classList.remove("open");more.setAttribute("aria-expanded","false")});

 /* alto contraste e fonte monoespaçada (Configurações → Modo palco) */
 const applyStage=()=>{$("stage").classList.toggle("hc",!!PREFS.shc);$("stage").classList.toggle("mono",!!PREFS.smono)};
 const anchor=$("pf-pedal")&&$("pf-pedal").closest(".crow");
 if(anchor){
  [["pf-hc","Alto contraste","Fundo preto, acordes amarelos e letra branca mais grossa.","shc"],
   ["pf-mono","Fonte monoespaçada","Letras com a mesma largura: ajuda a alinhar acordes sobre a letra.","smono"]].reverse().forEach(([id,t,s,k])=>{
   const d=document.createElement("div");d.className="crow";
   d.innerHTML=`<div><b>${t}</b><span class="muted">${s}</span></div><input type="checkbox" id="${id}" style="width:auto" aria-label="${t}">`;
   anchor.after(d);const c=d.querySelector("input");c.checked=!!PREFS[k];
   c.onchange=()=>{PREFS[k]=c.checked;savePrefs();applyStage()};
  });
 }
 applyStage();

 /* linhas longas: se algo ainda passar da largura, reduz a letra só nesta música (sem mexer na sua preferência) */
 const over=g=>g.scrollWidth>g.clientWidth+1||[...g.querySelectorAll(".ln")].some(l=>l.scrollWidth>l.clientWidth+1);
 function fitStage(){
  const g=$("stg");if(!g||$("stage").hidden)return;
  let f=FS;g.style.setProperty("--fs",f);
  for(let i=0;i<12&&f>12&&over(g);i++){f-=2;g.style.setProperty("--fs",f)}
 }
 const sr0=stageRender;
 stageRender=function(){sr0();try{fitStage()}catch(e){}};

 /* ---- termos: "Palco" (modo) e "Rolar" (rolagem automática) em todo lugar ---- */
 $("stg0").textContent="🎤 Palco";$("stg0").title="Abrir no modo palco (tocar ao vivo)";
 const li=document.querySelectorAll("#welcome li")[2];
 if(li)li.innerHTML=li.innerHTML.replace("Tocar ao vivo","Palco");

 /* ---- Repertórios: estado vazio com botão ---- */
 function emptySets(){
  const t=$("t-sets"),none=!LIB.sets.length;t.classList.toggle("noset",none);
  let e=$("sempty");
  if(!e){
   e=document.createElement("div");e.id="sempty";e.className="empty";
   e.innerHTML='<div class="eico">📋</div><b>Nenhum repertório ainda</b><p class="muted">Monte a lista de músicas de um culto ou ensaio, na ordem em que serão tocadas.</p><button class="p" id="sempty-b">+ Criar primeiro repertório</button>';
   t.appendChild(e);$("sempty-b").onclick=()=>$("snew").click();
  }
  e.hidden=!none;
  const cs=curSet()||LIB.sets[0];
  if(cs&&!cs.items.length&&!$("sitems").children.length)$("sitems").innerHTML='<div class="empty small">Este repertório está vazio. Busque uma música abaixo e toque em <b>+ Adicionar</b>.</div>';
 }
 const sets0=sets;
 sets=function(){sets0();try{emptySets()}catch(e){}};
 sets();
})();
