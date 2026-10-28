/* js/sets.js — Repertórios (listas de músicas), datas e histórico de uso */
/* ---- datas e histórico: um repertório com data de hoje ou anterior conta como "tocado" ---- */
const pad2=n=>String(n).padStart(2,"0");
const todayISO=()=>{const d=new Date();return d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate())};
const dfmt=iso=>{const[y,m,d]=String(iso).split("-");return d+"/"+m+(+y!==new Date().getFullYear()?"/"+y.slice(2):"")};
const dfull=iso=>{const[y,m,d]=String(iso).split("-");return d+"/"+m+"/"+y};
function daysSince(iso,hoje){
 const a=String(iso).split("-").map(Number),b=String(hoje||todayISO()).split("-").map(Number);
 return Math.round((Date.UTC(b[0],b[1]-1,b[2])-Date.UTC(a[0],a[1]-1,a[2]))/864e5);
}
function agoTxt(d){
 return d<=0?"hoje":d===1?"ontem":d<14?"há "+d+" dias":d<60?"há "+Math.round(d/7)+" sem":d<730?"há "+Math.round(d/30)+" meses":"há "+Math.round(d/365)+" anos";
}
/* por música: quantos repertórios com data (até hoje) a incluem e a data do último */
function playStats(hoje){
 const t=hoje||todayISO(),m=new Map();let any=false;
 LIB.sets.forEach(st=>{
  if(!st.date||st.date>t)return;
  any=true;
  new Set((st.items||[]).map(i=>i.songId)).forEach(id=>{
   const r=m.get(id)||{n:0,last:""};r.n++;if(st.date>r.last)r.last=st.date;m.set(id,r);
  });
 });
 return{m,any};
}
/* texto da escala de músicos, pronto para mandar por mensagem */
function escalaTexto(c){
 const its=(c.items||[]).map(i=>songBy(i.songId)).filter(Boolean);
 const lines=[(c.name||"Repertório")+(c.date?" — "+dfull(c.date):""),""];
 const team=c.team||[];
 if(!team.length)lines.push("(Nenhuma pessoa na escala.)");
 team.forEach(p=>{
  const mine=its.map((s,i)=>p.s&&p.s.includes(s.id)?(i+1)+". "+(s.title||"(sem título)"):"").filter(Boolean);
  const todas=its.length>0&&mine.length===its.length;
  lines.push((p.n||"(sem nome)")+(p.r?" ("+p.r+")":"")+": "+(todas?"todas as músicas":mine.length?mine.join(" · "):"sem músicas marcadas"));
 });
 return lines.join("\n");
}

/* ---- repertórios ---- */
const touchSets=()=>{const c=curSet();if(c)c.updated=Date.now();persist();sets();if(VIEW==="set")preview()};
function sets(){
 const cs=curSet()||LIB.sets[0];if(cs)LIB.curSet=cs.id;$("sunfollow").hidden=!(cs&&cs.follow);
 $("scollab").hidden=!!(cs&&cs.follow);$("scollab").textContent=cs&&cs.collab?"👥 Equipe: ativo":"👥 Editar em equipe";
 /* mais recentes primeiro; sem data no fim */
 const ord=LIB.sets.slice().sort((a,b)=>(b.date||"").localeCompare(a.date||""));
 $("setsel").innerHTML=ord.map(x=>`<option value="${x.id}"${cs&&x.id===cs.id?" selected":""}>${x.follow?"🔗 ":""}${x.collab?"👥 ":""}${x.date?dfmt(x.date)+" · ":""}${esc(x.name||"(sem nome)")}</option>`).join("")||"<option>(nenhum repertório)</option>";
 if(document.activeElement!==$("sname"))$("sname").value=cs?cs.name:"";
 {const sd=$("sdate");if(sd&&document.activeElement!==sd)sd.value=cs&&cs.date||""}
 const pv=$("sadd").value,ps=playStats();
 const hint=s=>{if(!ps.any)return"";const p=ps.m.get(s.id);return p?" · tocada "+agoTxt(daysSince(p.last)):" · nunca tocada"};
 const sq=$("saq").value;$("sadd").innerHTML=LIB.songs.filter(s=>matchSong(s,sq)).sort(cmpSong).map(s=>`<option value="${s.id}">${esc(s.title||"(sem título)")}${s.artist?" — "+esc(s.artist):""}${esc(hint(s))}</option>`).join("")||'<option value="">(nenhuma música encontrada)</option>';
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
  d.innerHTML=`<span class="hd" title="Arraste">⠿</span><span class="n">${i+1}. ${esc(sg.title||"(sem título)")}${sg.dur?` <small>${esc(String(sg.dur))}</small>`:""}</span><button title="Tom −" aria-label="Tom meio tom abaixo">−</button><b>${esc(lab)}</b><button title="Tom +" aria-label="Tom meio tom acima">+</button><button title="Subir" aria-label="Subir música">↑</button><button title="Descer" aria-label="Descer música">↓</button><button title="Remover" aria-label="Remover música">✕</button><input class="snote" placeholder="Nota (ex: entrar no 2º refrão)" aria-label="Nota desta música no repertório">`;
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
$("sname").oninput=e=>{const c=curSet();if(c){c.name=e.target.value;c.updated=Date.now();persist();const o=$("setsel").selectedOptions[0];if(o)o.textContent=(c.date?dfmt(c.date)+" · ":"")+(c.name||"(sem nome)")}};
$("sdate").onchange=()=>{const c=curSet();if(!c)return;const v=$("sdate").value;if(v)c.date=v;else delete c.date;touchSets()};
/* duplica para montar o próximo culto a partir deste (sem a data, sem link de equipe e sem seguir) */
$("sdup").onclick=()=>{
 const c=curSet();if(!c){msg("Crie um repertório primeiro.");return}
 const x={...clone(c),id:uid(),name:(c.name||"Repertório")+" (cópia)",updated:Date.now()};
 ["collab","follow","followSig","date"].forEach(k=>delete x[k]);
 LIB.sets.push(x);LIB.curSet=x.id;touchSets();$("sname").focus();$("sname").select();
};
$("sdel").onclick=()=>{const c=curSet();if(!c||!armed($("sdel")))return;const g=clone(c);(LIB.trash=LIB.trash||[]).push({kind:"set",item:g,t:Date.now()});tomb("set",c.id,g);LIB.sets=LIB.sets.filter(x=>x!==c);LIB.curSet=null;touchSets()};
$("saddb").onclick=()=>{
 if(!LIB.songs.length||!$("sadd").value)return;
 let c=curSet();if(!c){c={id:uid(),name:"Repertório 1",items:[]};LIB.sets.push(c);LIB.curSet=c.id}
 c.items.push({songId:$("sadd").value,shift:0});touchSets();
};
$("sview").onclick=()=>{if(!curSet()){msg("Crie um repertório e adicione músicas primeiro.");return}VIEW="set";preview();go("song")};
$("back").onclick=()=>{VIEW="song";preview()};
