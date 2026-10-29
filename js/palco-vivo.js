/* js/palco-vivo.js — Palco ao vivo: o líder transmite a música aberta no palco e os outros acompanham em tempo real.
   Usa o Realtime (broadcast) do Supabase; nada é gravado no banco. Carregar DEPOIS de stage.js e ux.js. */

/* código da sala: 10 letras/números sem I, L, O, 0, 1 (difícil de adivinhar e de confundir) */
const SALA_ALF="ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function novaSala(){
 const a=new Uint8Array(10);
 if(typeof crypto!=="undefined"&&crypto.getRandomValues)crypto.getRandomValues(a);else a.forEach((_,i)=>{a[i]=Math.floor(Math.random()*256)});
 return[...a].map(b=>SALA_ALF[b%SALA_ALF.length]).join("");
}
const salaNorm=t=>String(t||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
const salaOk=c=>/^[A-HJKMNP-Z2-9]{10}$/.test(c);

(function(){
 const g=id=>document.getElementById(id);
 const PV={ch:null,role:null,code:"",n:0,follow:true,last:null};
 const lider=()=>PV.role==="leader",seguidor=()=>PV.role==="follower";
 const canal=code=>sb.channel("palco:"+code,{config:{broadcast:{self:false},presence:{key:USER.id+"-"+uid()}}});

 /* ---- botões no palco ---- */
 const bt=document.createElement("button");bt.id="sbroad";bt.textContent="📡 Transmitir";bt.title="Os outros músicos acompanham esta música no celular deles";bt.setAttribute("aria-pressed","false");
 (g("smenu")||g("sbar")).appendChild(bt);
 const bf=document.createElement("button");bf.id="sfollow";bf.textContent="📡 Rolagem do líder: sim";
 const bl=document.createElement("button");bl.id="sleave";bl.textContent="Sair da transmissão";
 g("sbar").append(bf,bl);
 function botoes(){
  bt.textContent=lider()?"📡 Transmitindo ("+PV.n+")":"📡 Transmitir";
  bt.setAttribute("aria-pressed",String(lider()));
  bf.textContent="📡 Rolagem do líder: "+(PV.follow?"sim":"não");
 }

 /* ---- líder ---- */
 function enviarMusica(){
  if(!lider()||!PV.ch)return;
  const it=SI[SX];if(!it)return;
  const pl={sg:stripPriv(it.sg),x:it.x+SS,note:it.note||"",idx:SX+1,total:SI.length};
  if(JSON.stringify(pl).length>200000){toast("Esta música é grande demais para transmitir.");return}
  PV.last=pl;PV.ch.send({type:"broadcast",event:"song",payload:pl});
 }
 let tScroll=null,tLast=0;
 function enviarRolagem(){
  if(!lider()||!PV.ch)return;
  const s=g("stage"),max=s.scrollHeight-s.clientHeight;
  PV.ch.send({type:"broadcast",event:"scroll",payload:{f:max>0?s.scrollTop/max:0}});
 }
 g("stage").addEventListener("scroll",()=>{
  if(!lider())return;
  const now=Date.now();clearTimeout(tScroll);
  if(now-tLast>400){tLast=now;enviarRolagem()}else tScroll=setTimeout(()=>{tLast=Date.now();enviarRolagem()},450);
 },{passive:true});
 STAGE_HOOKS.push(()=>{if(lider())enviarMusica()});
 function contar(){
  let n=0;
  try{Object.values(PV.ch.presenceState()).forEach(a=>a.forEach(p=>{if(p.role==="follower")n++}))}catch(e){}
  PV.n=n;botoes();
 }
 function mostrarCodigo(){
  g("lvcode").textContent=PV.code.slice(0,5)+"-"+PV.code.slice(5);
  g("lvlink").value=location.origin+location.pathname+"?palco="+PV.code;
  g("livebox").hidden=false;
 }
 function iniciar(){
  if(!USER||!sb){msg("Entre na conta para transmitir.");return}
  if(!confirm("Quem tiver o código vai ver, em tempo real, as cifras que você abrir no palco. Letras e cifras podem ter direitos autorais. Compartilhe o código só com quem quiser.\n\nIniciar a transmissão?"))return;
  PV.role="leader";PV.code=novaSala();PV.follow=true;PV.n=0;PV.last=null;
  const ch=canal(PV.code);PV.ch=ch;
  ch.on("broadcast",{event:"hello"},()=>{if(PV.last)ch.send({type:"broadcast",event:"song",payload:PV.last});enviarRolagem()})
    .on("presence",{event:"sync"},contar)
    .subscribe(async st=>{
     if(st==="SUBSCRIBED"){await ch.track({role:"leader"});enviarMusica();botoes()}
     else if(st==="CHANNEL_ERROR"||st==="TIMED_OUT")toast("Sem conexão com a transmissão. Tentando de novo…");
    });
  botoes();mostrarCodigo();
 }

 /* ---- quem acompanha ---- */
 function abrirPalco(){
  wl(true);DURWARN=false;g("stage").hidden=false;document.body.style.overflow="hidden";
 }
 function receber(pl){
  if(!seguidor()||!pl||!pl.sg)return;
  const mesma=SI[0]&&SI[0].sg&&SI[0].sg.id===pl.sg.id,y=g("stage").scrollTop;
  SI=[{sg:pl.sg,x:pl.x,note:pl.note}];SX=0;SS=0;
  g("stage").classList.add("seg");
  if(g("stage").hidden)abrirPalco();
  stageRender();
  if(mesma)g("stage").scrollTop=y; /* o líder só mudou o tom: não volta ao topo */
  g("sti").textContent=pl.idx+"/"+pl.total;
 }
 function rolar(p){
  if(!seguidor()||!PV.follow||!p)return;
  const s=g("stage"),max=s.scrollHeight-s.clientHeight;
  s.scrollTop=Math.max(0,Math.min(1,p.f))*max;
 }
 async function entrar(code){
  code=salaNorm(code);
  if(!salaOk(code)){msg("Código inválido. Ele tem 10 letras e números (ex.: ABCDE-FGHJK).");return false}
  if(!USER||!sb){msg("Entre na sua conta primeiro.");return false}
  if(PV.ch)await parar();
  PV.role="follower";PV.code=code;PV.follow=true;
  const ch=canal(code);PV.ch=ch;
  ch.on("broadcast",{event:"song"},m=>receber(m.payload))
    .on("broadcast",{event:"scroll"},m=>rolar(m.payload))
    .on("broadcast",{event:"end"},()=>toast("O líder encerrou a transmissão. Toque em ✕ para sair."))
    .subscribe(async st=>{
     if(st==="SUBSCRIBED"){await ch.track({role:"follower"});ch.send({type:"broadcast",event:"hello",payload:{}});toast("Conectado. Aguardando o líder…")}
     else if(st==="CHANNEL_ERROR"||st==="TIMED_OUT")toast("Sem conexão com a transmissão. Tentando de novo…");
    });
  SI=[];g("stage").classList.add("seg");abrirPalco();
  g("stg").innerHTML='<h2>📡 Aguardando o líder…</h2><div class="art">Assim que ele abrir uma música no palco, ela aparece aqui.</div>';
  g("sti").textContent="";botoes();
  return true;
 }
 async function parar(){
  const ch=PV.ch,eraLider=lider();
  PV.ch=null;PV.role=null;PV.code="";PV.n=0;PV.last=null;
  g("stage").classList.remove("seg");
  if(ch){
   try{if(eraLider)await ch.send({type:"broadcast",event:"end",payload:{}})}catch(e){}
   try{await sb.removeChannel(ch)}catch(e){}
  }
  botoes();
 }

 bt.onclick=()=>{if(!PV.role)iniciar();else if(lider())mostrarCodigo()};
 bf.onclick=()=>{PV.follow=!PV.follow;botoes();if(PV.follow&&PV.last)rolar({f:g("stage").scrollTop/Math.max(1,g("stage").scrollHeight-g("stage").clientHeight)})};
 bl.onclick=()=>g("sx").click();
 g("sx").addEventListener("click",()=>{if(PV.role)parar()}); /* fechar o palco encerra a transmissão (líder) ou sai dela (quem acompanha) */

 /* janela do código (líder) */
 g("lvx").onclick=()=>{g("livebox").hidden=true};
 g("livebox").onclick=e=>{if(e.target===g("livebox"))g("livebox").hidden=true};
 g("lvcopy").onclick=async()=>{const t=g("lvlink").value;try{await navigator.clipboard.writeText(t);toast("Link copiado.")}catch(e){prompt("Copie o link:",t)}};
 g("lvstop").onclick=async()=>{g("livebox").hidden=true;await parar();toast("Transmissão encerrada.")};
 /* janela de entrar com código */
 const abrirEntrar=()=>{g("jcode").value="";g("joinbox").hidden=false;g("jcode").focus()};
 g("m-join").onclick=abrirEntrar;
 g("jx").onclick=()=>{g("joinbox").hidden=true};
 g("joinbox").onclick=e=>{if(e.target===g("joinbox"))g("joinbox").hidden=true};
 g("jgo").onclick=async()=>{if(await entrar(g("jcode").value)){g("joinbox").hidden=true;g("cfg").hidden||g("cfgback").click()}};
 g("jcode").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();g("jgo").click()}});

 /* link ?palco=CODIGO: guarda e entra depois do login */
 try{
  const c=new URLSearchParams(location.search).get("palco");
  if(c){localStorage.setItem("cifras_pending_palco",c);history.replaceState(null,"",location.pathname)}
 }catch(e){}
 let n=0;
 const espera=setInterval(()=>{
  if(++n>170){clearInterval(espera);return}
  let ok=false;
  try{ok=!!USER&&!document.documentElement.classList.contains("locked")}catch(e){}
  if(!ok)return;
  clearInterval(espera);
  let c=null;try{c=localStorage.getItem("cifras_pending_palco");localStorage.removeItem("cifras_pending_palco")}catch(e){}
  if(c&&confirm("Você foi convidado para acompanhar uma transmissão de palco ao vivo.\n\nEntrar agora?"))entrar(c);
 },700);
})();
