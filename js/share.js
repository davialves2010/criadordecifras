/* js/share.js — Compartilhar por link e visualizador de links */
async function mkShare(kind,data){
 if(!USER){msg("Entre na conta para compartilhar.");return}
 const{data:r,error}=await sb.from("cifras_shares").insert({owner:USER.id,kind,data}).select("id").single();
 if(error){msg("Não foi possível criar o link: "+error.message);return}
 const url=location.origin+location.pathname+"?share="+r.id;
 try{if(navigator.share){await navigator.share({title:"Cifra",url});return}}catch(e){if(e&&e.name==="AbortError")return}
 try{await navigator.clipboard.writeText(url);msg("Link copiado: "+url)}catch(e){prompt("Copie o link:",url)}
}
$("shOne").onclick=()=>mkShare("song",{songs:[clone(S)]});
$("sshare").onclick=()=>{const c=curSet();if(!c){msg("Crie um repertório primeiro.");return}const ids=[...new Set(c.items.map(i=>i.songId))];mkShare("set",{songs:ids.map(songBy).filter(Boolean).map(clone),set:clone(c)})};
let SHD=null;
const shClose=()=>{$("shv").hidden=true;try{history.replaceState(null,"",location.pathname)}catch(e){}};
function showShare(d){
 SHD=d;const set=d.set,its=set?set.items:d.songs.map(x=>({songId:x.id,shift:0})),sh=$("shsheet");
 sh.innerHTML=its.map(it=>{const sg=d.songs.find(x=>x.id===it.songId);return sg?`<div class="pg">${sheetHTML(sg,it.shift||0)}</div>`:""}).join("");
 sh.style.setProperty("--z",Math.min(1,(innerWidth-24)/794));
 $("shttl").textContent=set?"Repertório: "+set.name:(d.songs[0]&&d.songs[0].title)||"Cifra";$("shv").hidden=false;
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
  const url=location.origin+location.pathname+"?share="+x.id,d0=x.data||{},t=x.kind==="set"?"📋 "+((d0.set||{}).name||"Repertório"):"🎵 "+(((d0.songs||[])[0]||{}).title||"Música");
  const d=document.createElement("div");d.className="sit";
  d.innerHTML=`<span class="n">${esc(t)}</span><small>${new Date(x.created).toLocaleDateString("pt-BR")}</small><button>Copiar</button><button title="Apagar link">✕</button>`;
  const[c,r]=d.querySelectorAll("button");
  c.onclick=async()=>{try{await navigator.clipboard.writeText(url);toast("Link copiado.")}catch(e){prompt("Copie o link:",url)}};
  r.onclick=async()=>{if(!armed(r))return;const{error}=await sb.from("cifras_shares").delete().eq("id",x.id);if(error){msg("Não foi possível apagar: "+error.message);return}loadLinks()};
  b.appendChild(d)});
 if(!data.length)b.innerHTML='<div class="help">Você ainda não criou links. Use 🔗 Compartilhar.</div>';
}
$("m-links").onclick=()=>{if(!USER||!sb)return;$("shlinks").hidden=false;loadLinks()};
$("shlc").onclick=()=>{$("shlinks").hidden=true};
$("shlinks").onclick=e=>{if(e.target===$("shlinks"))$("shlinks").hidden=true};
