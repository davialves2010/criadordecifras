/* js/collab.js — Editar em equipe: várias pessoas mantêm o mesmo repertório (a última edição de cada música vale) */
const CB={busy:false};
const rndTok=()=>{const a=new Uint8Array(18);crypto.getRandomValues(a);return[...a].map(b=>b.toString(16).padStart(2,"0")).join("")};
const cbBase=()=>location.origin+location.pathname;
const cbPayload=st=>{const p=setPayload(st);p.live=true;return p};
/* compara sem o id do repertório: cada aparelho tem um id local diferente para o mesmo repertório */
const cbSig=p=>{const o=clone(p);if(o.set)delete o.set.id;return sig(o)};

function collabRefresh(){
 clearTimeout(HT);HT=null;Object.keys(HIST).forEach(k=>delete HIST[k]);
 if(!LIB.songs.length)LIB.songs.push(blankSong());
 if(!songBy(S.id))S=LIB.songs[0];
 LIB.cur=S.id;persist();fields();editor();preview();lib();
 if(MODE==="text")$("ttxt").value=ser(S.sections);
}
/* junta o que veio da nuvem com a cópia local. Retorna true se algo local mudou.
   Cada música: vale a que tem "updated" mais novo. Repertório (nome e lista): idem. */
function collabMerge(st,d){
 let ch=false;LIB.synced=LIB.synced||{};
 (d.songs||[]).forEach(x=>{
  const l=songBy(x.id);
  if(!l){const o=clone(x);if(!o.updated)o.updated=Date.now();LIB.songs.push(o);delete LIB.synced[o.id];ch=true;return}
  if((x.updated||0)>(l.updated||0)&&sig(stripPriv(l))!==sig(x)){
   if(typeof verPush==="function")try{verPush(l.id,snapStr(l),Date.now())}catch(e){}
   const keep={};PRIV.forEach(k=>{if(l[k]!==undefined)keep[k]=l[k]});
   Object.keys(l).forEach(k=>delete l[k]);Object.assign(l,clone(x),keep);
   l.updated=x.updated;delete LIB.synced[l.id];ch=true;
  }
 });
 if(d.set&&(d.set.updated||0)>(st.updated||0)){
  const its=(d.set.items||[]).filter(i=>songBy(i.songId)).map(i=>mapItem(i,{[i.songId]:i.songId}));
  if(sig({n:d.set.name,i:its})!==sig({n:st.name,i:st.items})){st.name=d.set.name||st.name;st.items=its;ch=true}
  st.updated=d.set.updated;delete LIB.synced[st.id];
 }
 return ch;
}
/* uma rodada de sincronização de um repertório em equipe */
async function collabSync(st){
 const cb=st.collab;
 for(let tries=0;tries<3;tries++){
  const{data:g,error}=await sb.rpc("collab_get",{p_token:cb.token});
  if(error)throw error;
  if(!g||!g.data){delete st.collab;return"gone"}
  let changed=false;
  if(g.rev!==cb.rev)changed=collabMerge(st,g.data);
  const p=cbPayload(st),s=cbSig(p);
  if(s===cbSig(g.data)){cb.rev=g.rev;cb.sig=s;return changed?"merged":"same"}
  const{data:r,error:e2}=await sb.rpc("collab_put",{p_token:cb.token,p_data:p,p_rev:g.rev});
  if(e2)throw e2;
  if(r&&r.ok){cb.rev=r.rev;cb.sig=s;return changed?"merged":"pushed"}
  /* alguém salvou antes de nós: busca de novo e junta */
  cb.rev=-1;
 }
 return"retry";
}
async function collabAll(manual){
 if(!USER||!sb||CB.busy)return;
 const L=LIB.sets.filter(x=>x.collab);if(!L.length)return;
 CB.busy=true;let ch=false,err=null,gone=false;
 try{
  for(const st of L){
   try{const r=await collabSync(st);if(r==="merged")ch=true;if(r==="gone"){gone=true;ch=true}}catch(e){err=e}
  }
 }finally{CB.busy=false}
 if(ch)collabRefresh();else try{localStorage.setItem(LKEY,JSON.stringify(LIB))}catch(e){}
 if(gone)toast("O compartilhamento em equipe de um repertório foi encerrado. Ele continua na sua biblioteca.");
 else if(ch)toast("O repertório em equipe foi atualizado.");
 else if(manual)toast(err?"Não foi possível sincronizar a equipe agora.":"Equipe sincronizada.");
}
async function collabCreate(){
 const c=curSet();if(!c)return;
 const p=cbPayload(c),tok=rndTok();
 const{data:r,error}=await sb.from("cifras_shares").insert({owner:USER.id,kind:"set",data:p,live:true,edit_token:tok,rev:1}).select("id").single();
 if(error){msg("Não foi possível ativar a edição em equipe. Rode o supabase/schema.sql atualizado no Supabase. ("+error.message+")");return}
 c.collab={id:r.id,token:tok,rev:1,sig:cbSig(p),owner:true};c.updated=Date.now();persist();sets();collabBox();
}
async function collabJoin(token){
 if(LIB.sets.some(x=>x.collab&&x.collab.token===token)){toast("Você já participa deste repertório.");go("sets");return}
 const{data:g,error}=await sb.rpc("collab_get",{p_token:token});
 if(error||!g||!g.data||!g.data.set){toast("Link de edição inválido ou encerrado.");return}
 if(!confirm("Você foi convidado para editar o repertório “"+(g.data.set.name||"")+"”. As mudanças de todos ficam sincronizadas e, se duas pessoas mudarem a mesma música, vale a edição mais recente.\n\nParticipar?"))return;
 const st={id:uid(),name:g.data.set.name||"Repertório",updated:-1,items:[],collab:{id:g.id,token,rev:0,sig:"",owner:false}};
 LIB.sets.push(st);LIB.curSet=st.id;
 collabMerge(st,g.data);st.updated=Math.max(st.updated,0);
 st.collab.rev=g.rev;st.collab.sig=cbSig(cbPayload(st));
 collabRefresh();go("sets");toast("Você entrou no repertório em equipe.");
}
function collabBox(){
 const c=curSet();if(!c||!c.collab)return;
 const cb=c.collab,box=$("cbbody");box.innerHTML="";
 const row=(t,sub,url)=>{
  const d=document.createElement("div");d.className="crow2";
  d.innerHTML=`<b>${esc(t)}</b><small class="muted">${esc(sub)}</small><div class="row"><input readonly aria-label="${esc(t)}"><button>Copiar</button></div>`;
  const i=d.querySelector("input"),b=d.querySelector("button");i.value=url;i.onclick=()=>i.select();
  b.onclick=async()=>{try{await navigator.clipboard.writeText(url);toast("Link copiado.")}catch(e){prompt("Copie o link:",url)}};
  box.appendChild(d);
 };
 const intro=document.createElement("p");intro.className="muted";
 intro.textContent=cb.owner?"Quem abrir o link de edição (e entrar na conta) passa a editar este repertório e as músicas dele junto com você.":"Você participa deste repertório. As suas mudanças e as dos outros se juntam automaticamente.";
 box.appendChild(intro);
 if(cb.owner)row("Link de edição","Só envie para quem pode mudar o repertório.",cbBase()+"?edit="+cb.token);
 row("Link só de leitura","Quem recebe vê a versão mais nova, sem editar.",cbBase()+"?share="+cb.id);
 const bar=document.createElement("div");bar.className="bar";
 const sy=document.createElement("button");sy.textContent="🔄 Sincronizar agora";sy.onclick=()=>collabAll(true);
 const st=document.createElement("button");st.className="dng";st.textContent=cb.owner?"Parar de compartilhar":"Sair da edição em equipe";
 st.onclick=async()=>{
  if(!armed(st))return;
  if(cb.owner&&sb){const{error}=await sb.from("cifras_shares").delete().eq("id",cb.id);if(error){msg("Não foi possível encerrar: "+error.message);return}}
  delete c.collab;touchSets();$("collabbox").hidden=true;
  toast(cb.owner?"Compartilhamento encerrado. O repertório continua com você.":"Você saiu. O repertório continua na sua biblioteca.");
 };
 bar.append(sy,st);box.appendChild(bar);
 $("collabbox").hidden=false;
}
$("scollab").onclick=async()=>{
 const c=curSet();if(!c){msg("Crie um repertório primeiro.");return}
 if(c.collab){collabBox();return}
 if(!USER||!sb){msg("Entre na conta para compartilhar.");return}
 if(c.follow){msg("Você segue este repertório. Pare de seguir antes de editar em equipe.");return}
 if(!confirm("Quem receber o link de edição poderá alterar este repertório e as músicas dele, e as mudanças aparecem para todos (se duas pessoas mexerem na mesma música, vale a edição mais recente). Letras e cifras podem ter direitos autorais.\n\nAtivar a edição em equipe?"))return;
 await collabCreate();
};
$("cbclose").onclick=()=>{$("collabbox").hidden=true};
$("collabbox").onclick=e=>{if(e.target===$("collabbox"))$("collabbox").hidden=true};

/* link de edição (?edit=TOKEN): guarda e entra depois do login */
try{const t=new URLSearchParams(location.search).get("edit");if(t){localStorage.setItem("cifras_pending_edit",t);history.replaceState(null,"",location.pathname)}}catch(e){}
const _bootU=bootUser;
bootUser=async function(u){
 await _bootU(u);
 try{const t=localStorage.getItem("cifras_pending_edit");if(t){localStorage.removeItem("cifras_pending_edit");await collabJoin(t)}}catch(e){}
 collabAll();
};
setInterval(()=>{if(USER&&!document.hidden)collabAll()},30000);
addEventListener("online",()=>{if(USER)collabAll()});
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&USER)collabAll()});
