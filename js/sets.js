/* js/sets.js — Repertórios (listas de músicas) */
/* ---- repertórios ---- */
const touchSets=()=>{const c=curSet();if(c)c.updated=Date.now();persist();sets();if(VIEW==="set")preview()};
function sets(){
 const cs=curSet()||LIB.sets[0];if(cs)LIB.curSet=cs.id;
 $("setsel").innerHTML=LIB.sets.map(x=>`<option value="${x.id}"${cs&&x.id===cs.id?" selected":""}>${esc(x.name||"(sem nome)")}</option>`).join("")||"<option>(nenhum repertório)</option>";
 if(document.activeElement!==$("sname"))$("sname").value=cs?cs.name:"";
 const pv=$("sadd").value;
 $("sadd").innerHTML=LIB.songs.map(s=>`<option value="${s.id}">${esc(s.title||"(sem título)")}</option>`).join("");
 if(pv&&songBy(pv))$("sadd").value=pv;
 $("sitems").innerHTML="";
 if(!cs)return;
 cs.items.forEach((it,i)=>{
  const sg=songBy(it.songId);if(!sg)return;
  PREFER=sg.acc||null;const tot=(sg.shift||0)+(it.shift||0),root=(sg.key||"").match(/^[A-G][#b]?/);
  const lab=root?tn(root[0],tot):(tot>0?"+":"")+tot;
  const d=document.createElement("div");d.className="sit";
  d.innerHTML=`<span class="hd" title="Arraste">⠿</span><span class="n">${i+1}. ${esc(sg.title||"(sem título)")}</span><button title="Tom −">−</button><b>${esc(lab)}</b><button title="Tom +">+</button><button title="Subir">↑</button><button title="Descer">↓</button><button title="Remover">✕</button>`;
  const [m,p,u,dn,rm]=d.querySelectorAll("button");
  m.onclick=()=>{it.shift=((it.shift||0)-1)%12;touchSets()};
  p.onclick=()=>{it.shift=((it.shift||0)+1)%12;touchSets()};
  u.onclick=()=>{if(i>0){[cs.items[i-1],cs.items[i]]=[cs.items[i],cs.items[i-1]];touchSets()}};
  dn.onclick=()=>{if(i<cs.items.length-1){[cs.items[i+1],cs.items[i]]=[cs.items[i],cs.items[i+1]];touchSets()}};
  rm.onclick=()=>{cs.items.splice(i,1);touchSets()};
  dnd(d,d.querySelector(".hd"),"set",i,cs.items,touchSets);
  $("sitems").appendChild(d);
 });
}
$("setsel").onchange=e=>{LIB.curSet=e.target.value;touchSets()};
$("snew").onclick=()=>{const x={id:uid(),name:"Novo repertório",items:[]};LIB.sets.push(x);LIB.curSet=x.id;touchSets();$("sname").focus();$("sname").select()};
$("sname").oninput=e=>{const c=curSet();if(c){c.name=e.target.value;c.updated=Date.now();persist();const o=$("setsel").selectedOptions[0];if(o)o.textContent=c.name||"(sem nome)"}};
$("sdel").onclick=()=>{const c=curSet();if(!c||!armed($("sdel")))return;tomb("set",c.id);LIB.sets=LIB.sets.filter(x=>x!==c);LIB.curSet=null;touchSets()};
$("saddb").onclick=()=>{
 if(!LIB.songs.length)return;
 let c=curSet();if(!c){c={id:uid(),name:"Repertório 1",items:[]};LIB.sets.push(c);LIB.curSet=c.id}
 c.items.push({songId:$("sadd").value,shift:0});touchSets();
};
$("sview").onclick=()=>{if(!curSet()){msg("Crie um repertório e adicione músicas primeiro.");return}VIEW="set";preview();setM("sheet");$("sheet").scrollIntoView({behavior:"smooth"})};
$("back").onclick=()=>{VIEW="song";preview()};
