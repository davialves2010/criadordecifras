/* js/erros.js — registra erros de JavaScript do app na tabela cifras_erros (via função registrar_erro).
   Carregar PRIMEIRO, antes de config.js, para pegar até erros de carregamento dos outros scripts.
   Só envia quando há login (a função do banco exige). Antes disso guarda até 5 erros na aba. */
(function(){
 const MAX=5,QK="cifras_errq",seen=new Set();
 let q=[];
 const noise=/ResizeObserver loop|^Script error\.?$|extension:\/\//i;
 try{q=JSON.parse(sessionStorage.getItem(QK)||"[]")||[]}catch(e){q=[]}
 const keep=()=>{try{sessionStorage.setItem(QK,JSON.stringify(q.slice(-MAX)))}catch(e){}};
 /* mensagens e rastros são cortados: o objetivo é achar o bug, não guardar conteúdo das cifras */
 function add(msg,src,stack){
  msg=String(msg||"").slice(0,300);src=String(src||"").slice(0,200);
  if(!msg||noise.test(msg)||noise.test(src))return;
  const k=msg+"|"+src;
  if(seen.has(k)||seen.size>=MAX*2)return;
  seen.add(k);
  q.push({p_msg:msg,p_src:src,p_stack:String(stack||"").slice(0,1500),p_ua:String((navigator&&navigator.userAgent)||"").slice(0,200),p_page:String(location.pathname||"").slice(0,100)});
  q=q.slice(-MAX);keep();flush();
 }
 async function flush(){
  let ok=false;
  try{ok=typeof USER!=="undefined"&&!!USER&&typeof sb!=="undefined"&&!!sb}catch(e){}
  if(!ok||!q.length)return;
  const a=q;q=[];keep();
  for(const x of a){try{await sb.rpc("registrar_erro",x)}catch(e){}}
 }
 addEventListener("error",e=>{
  if(e&&e.target&&e.target!==window)return; /* falha ao carregar imagem/fonte: não é erro de código */
  add(e.message,(e.filename||"")+":"+e.lineno+":"+e.colno,e.error&&e.error.stack);
 });
 addEventListener("unhandledrejection",e=>{const r=e&&e.reason;add((r&&r.message)||String(r),"promise",r&&r.stack)});
 setInterval(flush,15000);addEventListener("online",flush);
 /* para erros que o app já captura (try/catch) mas que valem ser vistos */
 window.logErro=(e,ctx)=>add((ctx?ctx+": ":"")+((e&&e.message)||e),"manual",e&&e.stack);
})();
