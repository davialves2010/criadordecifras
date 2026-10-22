/* js/sets.js — Repertórios (listas de músicas) */
/* ---- repertórios ---- */
const touchSets=()=>{const c=curSet();if(c)c.updated=Date.now();persist();sets();if(VIEW==="set")preview()};
function sets(){
 const cs=curSet()||LIB.sets[0];if(cs)LIB.curSet=cs.id;$("sunfollow").hidden=!(cs&&cs.follow);
 $("scollab").hidden=!!(cs&&cs.follow);$("scollab").textContent=cs&&cs.collab?"👥 Equipe: ativo":"👥 Editar em equipe";
 $("setsel").innerHTML=LIB.sets.map(x=>`<option value="${x.id}"${cs&&x.id===cs.id?" selected":""}>${x.follow?"🔗 ":""}${x.collab?"👥 ":""}${esc(x.name||"(sem nome)")}</option>`).join("")||"<option>(nenhum repertório)</option>";
 if(document.activeElement!==$("sname"))$("sname").value=cs?cs.name:"";
 const pv=$("sadd").value;
 const sq=$("saq").value;$("sadd").innerHTML=LIB.songs.filter(s=>matchSong(s,sq)).sort(cmpSong).map(s=>`<option value="${s.id}">${esc(s.title||"(sem título)")}${s.artist?" — "+esc(s.artist):""}</option>`).join("")||'<option value="">(nenhuma música encontrada)</option>';
 if(pv&&songBy(pv))$("sadd").value=pv;if(!$("sadd").value&&$("sadd").options.length)$("sadd").selectedIndex=0;
 $("sitems").innerHTML="";$("stot").textContent="";
 if(!cs)return;
 let tot=0,cnt=0;
 cs.items.forEach((it,i)=>{
  const sg=songBy(it.songId);if(!sg)return;
  const du=parseDur(sg.dur);if(du){tot+=du;cnt++}
  PREFER=sg.acc||null;const t2=(sg.shift||0)+(it.shift||0),root=(sg.key||"").match(/^[A-G][#b]?/);
  const lab=root?tn(root[0],t2):(t2>0?"+":"")+t2;
  const d=document.createElement("div");d.className="sit";
  d.innerHTML=`<span class="hd" title="Arraste">⠿</span><span class="n">${i+1}. ${esc(sg.title||"(sem título)")}${sg.dur?` <small>${esc(String(sg.dur))}</small>`:""}</span><button title="Tom −">−</button><b>${esc(lab)}</b><button title="Tom +">+</button><button title="Subir">↑</button><button title="Descer">↓</button><button title="Remover">✕</button><input class="snote" placeholder="Nota (ex: entrar no 2º refrão)" aria-label="Nota desta música no repertório">`;
  const [m,p,u,dn,rm]=d.querySelectorAll("button"),ni=d.querySelector(".snote");
  ni.value=it.note||"";
  ni.onchange=()=>{const v=ni.value.trim();if(v)it.note=v;else delete it.note;touchSets()};
  m.onclick=()=>{it.shift=((it.shift||0)-1)%12;touchSets()};
  p.onclick=()=>{it.shift=((it.shift||0)+1)%12;touchSets()};
  u.onclick=()=>{if(i>0){[cs.items[i-1],cs.items[i]]=[cs.items[i],cs.items[i-1]];touchSets()}};
  dn.onclick=()=>{if(i<cs.items.length-1){[cs.items[i+1],cs.items[i]]=[cs.items[i],cs.items[i+1]];touchSets()}};
  rm.onclick=()=>{cs.items.splice(i,1);touchSets()};
  dnd(d,d.querySelector(".hd"),"set",i,cs.items,touchSets);
  $("sitems").appendChild(d);
 });
 if(tot)$("stot").textContent="⏱ Duração estimada: "+fmtDur(tot)+(cnt<cs.items.length?" (só "+cnt+" de "+cs.items.length+" músicas têm duração)":"");
}
$("setsel").onchange=e=>{LIB.curSet=e.target.value;touchSets()};
$("snew").onclick=()=>{const x={id:uid(),name:"Novo repertório",items:[]};LIB.sets.push(x);LIB.curSet=x.id;touchSets();$("sname").focus();$("sname").select()};
$("sname").oninput=e=>{const c=curSet();if(c){c.name=e.target.value;c.updated=Date.now();persist();const o=$("setsel").selectedOptions[0];if(o)o.textContent=c.name||"(sem nome)"}};
$("sdel").onclick=()=>{const c=curSet();if(!c||!armed($("sdel")))return;const g=clone(c);(LIB.trash=LIB.trash||[]).push({kind:"set",item:g,t:Date.now()});tomb("set",c.id,g);LIB.sets=LIB.sets.filter(x=>x!==c);LIB.curSet=null;touchSets()};
$("saddb").onclick=()=>{
 if(!LIB.songs.length||!$("sadd").value)return;
 let c=curSet();if(!c){c={id:uid(),name:"Repertório 1",items:[]};LIB.sets.push(c);LIB.curSet=c.id}
 c.items.push({songId:$("sadd").value,shift:0});touchSets();
};
$("sview").onclick=()=>{if(!curSet()){msg("Crie um repertório e adicione músicas primeiro.");return}VIEW="set";preview();go("song")};
$("back").onclick=()=>{VIEW="song";preview()};
