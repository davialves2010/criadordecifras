/* js/versions.js — Histórico de versões por música (guardado neste aparelho, últimas 15) */
const VMAX=15,VGAP=5*60*1000;
const vKey=()=>"cifras_vers_"+(typeof LKEY==="string"?LKEY:"x");
function vLoad(){try{return JSON.parse(localStorage.getItem(vKey())||"{}")||{}}catch(e){return{}}}
function vStore(o){try{localStorage.setItem(vKey(),JSON.stringify(o));return true}catch(e){return false}}
/* guarda um estado (texto JSON da música) no histórico; ignora se for igual ao último */
function verPush(id,str,t){
 const all=vLoad(),a=all[id]||(all[id]=[]),last=a[a.length-1];
 if(last&&last.s===str)return false;
 a.push({t:t||Date.now(),s:str});while(a.length>VMAX)a.shift();
 if(!vStore(all)){ /* sem espaço: mantém só as 3 mais recentes de cada música */
  Object.keys(all).forEach(k=>{if(all[k].length>3)all[k]=all[k].slice(-3)});vStore(all);
 }
 return true;
}
/* a cada pausa de edição (>5 min desde a última versão), guarda o estado ANTERIOR às alterações */
const _snapV=snap;
snap=function(){_snapV();try{verTick()}catch(e){}};
function verTick(){
 const h=HIST[HID];if(!h||h.i<1)return;
 const sg=songBy(HID);if(!sg)return;
 const a=vLoad()[sg.id]||[],last=a[a.length-1];
 if(last&&Date.now()-last.t<VGAP)return;
 verPush(sg.id,h.a[h.i-1],Date.now());
}
function vList(){
 const b=$("verl");b.innerHTML="";
 const a=(vLoad()[S.id]||[]).slice().reverse();
 a.forEach(x=>{
  let o;try{o=JSON.parse(x.s)}catch(e){return}
  const secs=o.sections||[],d=document.createElement("div");d.className="sit";
  d.innerHTML=`<span class="n">${esc(new Date(x.t).toLocaleString("pt-BR"))} <small>${secs.length} seção(ões): ${esc(secs.map(s=>s.name).join(", "))}</small></span><button>Restaurar</button>`;
  const btn=d.querySelector("button");
  btn.onclick=()=>{
   if(!armed(btn))return;
   verPush(S.id,snapStr(S),Date.now()); /* guarda o estado atual, para dar para voltar */
   restore(x.s);HID=S.id;snap();
   $("verbox").hidden=true;toast("Versão restaurada. Use Desfazer (↶) para voltar.");
  };
  b.appendChild(d);
 });
 if(!a.length)b.innerHTML='<div class="help">Ainda não há versões anteriores desta música. Elas aparecem depois que você edita e faz uma pausa de alguns minutos.</div>';
}
$("verb").onclick=()=>{vList();$("verbox").hidden=false};
$("verc").onclick=()=>{$("verbox").hidden=true};
$("verbox").onclick=e=>{if(e.target===$("verbox"))$("verbox").hidden=true};
