/* js/sync.js — Sincronização com o Supabase (push/pull, conflitos, sessão) */
/* ---- sincronização ---- */
function setSync(s,d){
 const T={ok:"☁ Sincronizado",sync:"☁ Sincronizando…",err:"⚠ Erro ao sincronizar"},bad=s==="err";
 $("sv").textContent=T[s]||"";$("sv").title=d||"";$("sv").className="sv"+(bad?" bad":"");$("dot").className="dot"+(bad?" bad":"");
}
function tomb(kind,id,data){LIB.dels=(LIB.dels||[]).filter(t=>t.id!==id);LIB.dels.push({id,kind,t:Date.now(),data})}
function schedPush(){if(!USER)return;clearTimeout(PT);PT=setTimeout(push,1500);if(typeof schedLive==="function")schedLive()}
async function push(){
 if(!USER||!sb)return;if(PUSHING){AGAIN=true;return}
 PUSHING=true;
 try{
  LIB.synced=LIB.synced||{};LIB.dels=LIB.dels||[];
  const rows=[],add=(kind,o)=>{const u=o.updated||0;if(!(o.id in LIB.synced)||u>LIB.synced[o.id])rows.push({user_id:USER.id,id:o.id,kind,data:o,updated:u||Date.now(),deleted:false})};
  LIB.songs.forEach(s=>add("song",s));LIB.sets.forEach(s=>add("set",s));
  LIB.dels.forEach(t=>rows.push({user_id:USER.id,id:t.id,kind:t.kind,data:t.data||{},updated:t.t,deleted:true}));
  if(rows.length){
   setSync("sync");
   const{error}=await sb.from("cifras_items").upsert(rows,{onConflict:"user_id,id"});
   if(error)throw error;
   rows.forEach(r=>{LIB.synced[r.id]=r.updated});
   const done=new Set(rows.filter(r=>r.deleted).map(r=>r.id));LIB.dels=LIB.dels.filter(t=>!done.has(t.id));
   try{localStorage.setItem(LKEY,JSON.stringify(LIB))}catch(e){}
  }
  SYNCERR=null;setSync("ok");
 }catch(e){SYNCERR=e;setSync("err",e&&e.message||String(e))}
 finally{PUSHING=false;if(AGAIN){AGAIN=false;schedPush()}}
}
async function pull(){
 const{data,error}=await sb.from("cifras_items").select("id,kind,data,updated,deleted").eq("user_id",USER.id);
 if(error){SYNCERR=error;setSync("err",error.message);return false}
 LIB.synced=LIB.synced||{};LIB.dels=LIB.dels||[];
 const tb=new Map(LIB.dels.map(t=>[t.id,t]));let changed=false;
 data.forEach(r=>{
  const t=tb.get(r.id);
  if(t){if(!r.deleted&&r.updated>t.t)tb.delete(r.id);else return}
  const list=r.kind==="set"?LIB.sets:LIB.songs,i=list.findIndex(x=>x.id===r.id),lu=i>=0?(list[i].updated||0):-1;
  if(r.deleted){const gone=i<0||lu<=r.updated;if(i>=0&&gone){list.splice(i,1);changed=true}if(gone){const o=r.data;LIB.trash=LIB.trash||[];if(o&&o.id&&!LIB.trash.some(x=>x.item&&x.item.id===o.id)){LIB.trash.push({kind:r.kind==="set"?"set":"song",item:o,t:r.updated});changed=true}}LIB.synced[r.id]=r.updated;return}
  if(i<0||lu<r.updated){if(i>=0&&r.kind!=="set"&&lu>(LIB.synced[r.id]||0)){const c=clone(list[i]);c.id=uid();c.title=(c.title||"")+" (versão local – conflito)";c.updated=Date.now();list.push(c);CONF++}const o=r.data||{};o.id=r.id;o.updated=r.updated;if(i>=0)list[i]=o;else list.push(o);LIB.trash=(LIB.trash||[]).filter(x=>!x.item||x.item.id!==r.id);LIB.synced[r.id]=r.updated;changed=true}
  else if(lu===r.updated)LIB.synced[r.id]=r.updated;
 });
 LIB.dels=[...tb.values()];SYNCERR=null;
 return changed;
}
const blankSong=()=>({id:uid(),title:"Nova música",artist:"",key:"",time:"4/4",shift:0,sections:[{name:"Estrofe",text:""}]});
async function syncNow(manual){
 if(!USER||BUSY)return;BUSY=true;
 try{
  const changed=await pull();await push();
  if(changed){
   if(!LIB.songs.length)LIB.songs.push(blankSong());
   S=LIB.songs.find(x=>x.id===S.id)||LIB.songs[0];LIB.cur=S.id;
   try{localStorage.setItem(LKEY,JSON.stringify(LIB))}catch(e){}
   fields();editor();preview();lib();if(MODE==="text")$("ttxt").value=ser(S.sections);
  }
  setSync(SYNCERR?"err":"ok");
  try{await followSync()}catch(e){}
  if(CONF){msg("Atenção: "+CONF+" música(s) foi(ram) editada(s) em outro aparelho ao mesmo tempo. Sua versão local foi salva como cópia “conflito”.");CONF=0}else if(manual)msg(SYNCERR?"Não foi possível sincronizar agora.":"Tudo sincronizado.");
 }finally{BUSY=false}
}
function setAcct(u){
 const md=u.user_metadata||{},name=md.full_name||md.name||"",em=u.email||"",ini=((name||em||"?").trim()[0]||"?").toUpperCase(),pic=md.avatar_url||md.picture;
 $("acct").textContent=em;$("cfg-name").textContent=name||"Minha conta";
 [$("tmore"),$("cfg-av")].forEach(el=>{
  el.textContent=ini;
  if(pic){const i=document.createElement("img");i.src=pic;i.alt="";i.referrerPolicy="no-referrer";i.onerror=()=>{el.textContent=ini};el.textContent="";el.appendChild(i)}
 });
}
async function bootUser(user){
 USER=user;LKEY="cifras_lib_"+user.id;
 let loc=null;try{loc=JSON.parse(localStorage.getItem(LKEY)||"null")}catch(e){}
 if(!loc||!loc.songs){
  try{if(!localStorage.getItem("cifras_legacy_taken")){const old=JSON.parse(localStorage.getItem("cifras_lib")||"null");if(old&&old.songs&&old.songs.length){loc=old;localStorage.setItem("cifras_legacy_taken",user.id)}}}catch(e){}
 }
 LIB=loc&&loc.songs?loc:{songs:[],sets:[]};LIB.sets=LIB.sets||[];LIB.dels=LIB.dels||[];LIB.synced=LIB.synced||{};
 setSync("sync");await pull();
 if(!LIB.songs.length)LIB.songs.push({id:uid(),...clone(EX)});
 S=LIB.songs.find(x=>x.id===LIB.cur)||LIB.songs[0];LIB.cur=S.id;VIEW="song";
 try{localStorage.setItem(LKEY,JSON.stringify(LIB))}catch(e){}
 fields();editor();preview();lib();updUndo();setM("edit");
 setAcct(user);
 document.documentElement.classList.remove("locked");
 setSync(SYNCERR?"err":"ok");schedPush();
 try{const p=sessionStorage.getItem("cifras_pending");if(p){sessionStorage.removeItem("cifras_pending");importShare(JSON.parse(p))}}catch(e){}
 try{backupCheck()}catch(e){}
 try{followSync()}catch(e){}
}
async function startSession(user){if(BOOT||USER)return;BOOT=true;try{await bootUser(user)}catch(e){console.error(e);showForm();aerr("Erro ao carregar suas cifras: "+(e.message||e))}BOOT=false}
