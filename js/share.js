/* js/share.js — Compartilhar por link e visualizador de links */
const shareAck=()=>{
 if(PREFS.shareAck)return true;
 if(!confirm("Atenção: o link é público. Quem receber poderá ler as letras e cifras, e elas podem ter direitos autorais. Compartilhe só com quem quiser e apenas conteúdo que você pode distribuir.\n\nCriar o link?"))return false;
 PREFS.shareAck=1;savePrefs();return true;
};
async function shareOut(id){
 const url=location.origin+location.pathname+"?share="+id;
 try{if(navigator.share){await navigator.share({title:"Cifra",url});return}}catch(e){if(e&&e.name==="AbortError")return}
 try{await navigator.clipboard.writeText(url);msg("Link copiado: "+url)}catch(e){prompt("Copie o link:",url)}
}
async function mkShare(kind,data){
 if(!USER){msg("Entre na conta para compartilhar.");return}
 if(!shareAck())return;
 const{data:r,error}=await sb.from("cifras_shares").insert({owner:USER.id,kind,data}).select("id").single();
 if(error){msg("Não foi possível criar o link: "+error.message);return}
 shareOut(r.id);
}
const setPayload=c=>{const ids=[...new Set(c.items.map(i=>i.songId))];return{songs:ids.map(songBy).filter(Boolean).map(clone),set:clone(c)}};
$("shOne").onclick=()=>mkShare("song",{songs:[clone(S)]});
$("sshare").onclick=()=>{const c=curSet();if(!c){msg("Crie um repertório primeiro.");return}mkShare("set",setPayload(c))};
let SHD=null;
const shClose=()=>{$("shv").hidden=true;try{history.replaceState(null,"",location.pathname)}catch(e){}};
function showShare(d,id){SHID=id||null;
 SHD=d;const set=d.set,its=set?set.items:d.songs.map(x=>({songId:x.id,shift:0})),sh=$("shsheet");
 sh.innerHTML=its.map(it=>{const sg=d.songs.find(x=>x.id===it.songId);return sg?`<div class="pg">${sheetHTML(sg,it.shift||0)}</div>`:""}).join("");
 sh.style.setProperty("--z",Math.min(1,(innerWidth-24)/794));
 $("shttl").textContent=set?"Repertório: "+set.name+(d.live?" · 🔴 ao vivo":""):(d.songs[0]&&d.songs[0].title)||"Cifra";$("shv").hidden=false;
}
function importShare(d){
 const idm={};d.songs.forEach(x=>{const id=uid();idm[x.id]=id;LIB.songs.push({...x,id,updated:Date.now()})});
 if(d.set)LIB.sets.push({id:uid(),name:d.set.name,updated:Date.now(),items:d.set.items.filter(i=>idm[i.songId]).map(i=>({songId:idm[i.songId],shift:i.shift||0}))});
 S=songBy(idm[d.songs[0].id])||S;LIB.cur=S.id;VIEW="song";fields();all();lib();shClose();toast("Salvo na sua biblioteca.");
}
$("shx").onclick=shClose;
$("shimp").onclick=()=>{if(!USER){try{sessionStorage.setItem("cifras_pending",JSON.stringify(SHD))}catch(e){}shClose();toast("Entre ou crie sua conta: a cifra será salva ao entrar.");return}importShare(SHD)};

/* ---- gerenciar links criados ---- */
async function loadLinks(){
 const b=$("shll");b.innerHTML='<div class="help">Carregando…</div>';
 const{data,error}=await sb.from("cifras_shares").select("id,kind,created,data").order("created",{ascending:false});
 if(error){b.innerHTML='<div class="help">Erro: '+esc(error.message)+'</div>';return}
 b.innerHTML="";
 data.forEach(x=>{
  const url=location.origin+location.pathname+"?share="+x.id,d0=x.data||{},t=x.kind==="set"?(d0.live?"🔴 ":"📋 ")+((d0.set||{}).name||"Repertório"):"🎵 "+(((d0.songs||[])[0]||{}).title||"Música");
  const d=document.createElement("div");d.className="sit";
  d.innerHTML=`<span class="n">${esc(t)}</span><small>${new Date(x.created).toLocaleDateString("pt-BR")}</small><button>Copiar</button><button title="Apagar link">✕</button>`;
  const[c,r]=d.querySelectorAll("button");
  c.onclick=async()=>{try{await navigator.clipboard.writeText(url);toast("Link copiado.")}catch(e){prompt("Copie o link:",url)}};
  r.onclick=async()=>{if(!armed(r))return;const{error}=await sb.from("cifras_shares").delete().eq("id",x.id);if(error){msg("Não foi possível apagar: "+error.message);return}LIVE=null;loadLinks()};
  b.appendChild(d)});
 if(!data.length)b.innerHTML='<div class="help">Você ainda não criou links. Use 🔗 Compartilhar.</div>';
}
$("m-links").onclick=()=>{if(!USER||!sb)return;$("shlinks").hidden=false;loadLinks()};
$("shlc").onclick=()=>{$("shlinks").hidden=true};
$("shlinks").onclick=e=>{if(e.target===$("shlinks"))$("shlinks").hidden=true};

/* ---- link ao vivo: o dono edita, quem tem o link vê a versão mais nova (somente leitura) ---- */
let SHID=null,LIVE=null,LASTLIVE={},LT=null;
const sig=p=>JSON.stringify(p,(k,v)=>k==="updated"?undefined:v);
async function mkLive(){
 const c=curSet();if(!c){msg("Crie um repertório primeiro.");return}
 if(!USER){msg("Entre na conta para compartilhar.");return}
 if(!shareAck())return;
 const p=setPayload(c);p.live=true;
 const{data:r,error}=await sb.from("cifras_shares").insert({owner:USER.id,kind:"set",data:p,set_id:c.id,live:true}).select("id").single();
 if(error){msg("Não foi possível criar o link ao vivo. Rode o supabase/schema.sql atualizado no Supabase. ("+error.message+")");return}
 LIVE=null;LASTLIVE[r.id]=sig(p);shareOut(r.id);
}
$("slive").onclick=mkLive;
function schedLive(){if(!USER||!sb)return;clearTimeout(LT);LT=setTimeout(liveSync,4000)}
async function liveSync(){
 if(!USER||!sb)return;
 try{
  if(LIVE===null){const{data,error}=await sb.from("cifras_shares").select("id,set_id").eq("live",true);LIVE=error?[]:(data||[])}
  for(const l of LIVE){
   const c=LIB.sets.find(x=>x.id===l.set_id);if(!c)continue;
   const p=setPayload(c);p.live=true;const g=sig(p);if(LASTLIVE[l.id]===g)continue;
   const{error}=await sb.from("cifras_shares").update({data:p,updated:new Date().toISOString()}).eq("id",l.id);
   if(!error)LASTLIVE[l.id]=g;
  }
 }catch(e){}
}
async function refreshShare(){
 if($("shv").hidden||!SHID||!sb)return;
 try{
  const{data:d}=await sb.rpc("get_share",{p_id:SHID});
  if(d&&d.songs&&sig(d)!==sig(SHD)){const y=$("shv").scrollTop;showShare(d,SHID);$("shv").scrollTop=y;toast("Repertório atualizado.")}
 }catch(e){}
}
setInterval(refreshShare,60000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshShare()});
