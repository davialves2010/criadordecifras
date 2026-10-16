/* js/trash.js — Lixeira: músicas e repertórios excluídos ficam 30 dias e sincronizam entre aparelhos */
function trashList(){
 LIB.trash=(LIB.trash||[]).map(x=>x.song?{kind:"song",item:x.song,t:x.t}:x).filter(x=>x.item&&x.t>Date.now()-30*864e5);
 const b=$("trashl");b.innerHTML="";
 LIB.trash.slice().reverse().forEach(x=>{
  const isSet=x.kind==="set",d=document.createElement("div");d.className="sit";
  d.innerHTML=`<span class="n">${isSet?"📋":"🎵"} ${esc((isSet?x.item.name:x.item.title)||"(sem título)")}</span><small>${new Date(x.t).toLocaleDateString("pt-BR")}</small><button>Restaurar</button>`;
  d.querySelector("button").onclick=()=>{
   const g=x.item;g.updated=Date.now();LIB.dels=(LIB.dels||[]).filter(t=>t.id!==g.id);LIB.trash=LIB.trash.filter(y=>y!==x);
   if(isSet){g.items=(g.items||[]).filter(i=>songBy(i.songId));LIB.sets.push(g);LIB.curSet=g.id;touchSets()}
   else{LIB.songs.push(g);S=g;LIB.cur=g.id;fields();all()}
   persist();trashList();toast(isSet?"Repertório restaurado.":"Música restaurada.");
  };
  b.appendChild(d);
 });
 if(!LIB.trash.length)b.innerHTML='<div class="help">Lixeira vazia. Músicas e repertórios excluídos ficam aqui por 30 dias e aparecem em todos os seus aparelhos.</div>';
}
$("trashb").onclick=()=>{trashList();$("trashbox").hidden=false};
$("tclose").onclick=()=>{$("trashbox").hidden=true};
$("trashbox").onclick=e=>{if(e.target===$("trashbox"))$("trashbox").hidden=true};
