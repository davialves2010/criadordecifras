/* js/a11y.js — estados dinâmicos (aria-pressed), foco em diálogos e Esc em pilha.
   Os rótulos estáticos (aria-label, role="dialog", for=) ficam direto no index.html. */
(function(){
 const byId=id=>document.getElementById(id);

 /* ---- aria-pressed acompanha a classe "on" (só isto precisa ser dinâmico) ---- */
 const PRESS=".seg2 button,.chipb,.tabs button,.mbar [data-m],#tagbar button";
 let q=0;
 function press(){
  q=0;
  document.querySelectorAll(PRESS).forEach(b=>{
   const v=b.classList.contains("on")?"true":"false";
   if(b.getAttribute("aria-pressed")!==v)b.setAttribute("aria-pressed",v);
  });
 }
 new MutationObserver(()=>{if(!q)q=requestAnimationFrame(press)}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
 press();

 /* ---- camadas: diálogos (com foco preso) e menus (só Esc) ---- */
 const DLG=["helpbox","newsbox","histbox","teambox","livebox","joinbox","chordbox","shlinks","trashbox","verbox","notebox","collabbox","thbox","shv","cfg","stage"];
 const POP=["swp","pop"];
 const CLOSE={shv:"shx",cfg:"cfgback",stage:"sx"}; /* estes têm função própria de fechar */
 const isDlg=el=>DLG.includes(el.id);
 const stack=[],opener=new Map();
 let lastClick=null,lastT=0;

 /* quem abriu o diálogo = o último botão clicado (se foi há pouco) */
 document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("button,a,summary,[role=button]");
  if(b&&!b.closest(".pop")){lastClick=b;lastT=Date.now()}
 },true);

 const FOC='a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])';
 const focusables=el=>[...el.querySelectorAll(FOC)].filter(x=>!x.disabled&&!x.closest("[hidden]")&&x.getClientRects().length);
 const topDlg=()=>{for(let i=stack.length-1;i>=0;i--)if(isDlg(stack[i]))return stack[i];return null};

 function sync(el){
  const open=!el.hidden,i=stack.indexOf(el);
  if(open&&i<0){
   stack.push(el);
   if(!isDlg(el))return;
   opener.set(el,Date.now()-lastT<4000?lastClick:null);
   if(el.contains(document.activeElement))return; /* o código que abriu já escolheu o foco (ex.: campo de anotações) */
   if(el.id==="stage"){el.tabIndex=-1;el.focus({preventScroll:true});return} /* Espaço/setas do palco não devem "apertar" um botão */
   const f=focusables(el)[0];
   if(f)f.focus({preventScroll:true});else{el.tabIndex=-1;el.focus({preventScroll:true})}
  }else if(!open&&i>=0){
   stack.splice(i,1);
   if(!isDlg(el))return;
   const o=opener.get(el);opener.delete(el);
   const a=document.activeElement;
   /* só devolve o foco se a pessoa não clicou em outro lugar nesse meio-tempo */
   if(o&&document.contains(o)&&o.getClientRects().length&&(!a||a===document.body||el.contains(a)))o.focus({preventScroll:true});
  }
 }
 const mo=new MutationObserver(ms=>ms.forEach(m=>sync(m.target)));
 [...DLG,...POP].map(byId).filter(Boolean).forEach(el=>{mo.observe(el,{attributes:true,attributeFilter:["hidden"]});sync(el)});

 function close(el){
  const b=CLOSE[el.id]&&byId(CLOSE[el.id]);
  if(b)b.click();else el.hidden=true;
 }

 document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){
   const top=stack[stack.length-1];
   if(!top)return;
   e.preventDefault();e.stopPropagation();close(top); /* fecha só a camada do topo */
   return;
  }
  if(e.key!=="Tab")return;
  const top=topDlg();if(!top)return;
  const f=focusables(top);
  if(!f.length){e.preventDefault();return}
  const a=document.activeElement,first=f[0],last=f[f.length-1];
  if(!top.contains(a)||a===top){e.preventDefault();(e.shiftKey?last:first).focus();return}
  if(e.shiftKey&&a===first){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&a===last){e.preventDefault();first.focus()}
 },true);
})();
