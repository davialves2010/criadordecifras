/* js/trash.js — Lixeira (restaurar músicas excluídas) */
/* ---- lixeira ---- */
function trashList(){
 LIB.trash=(LIB.trash||[]).filter(x=>x.t>Date.now()-30*864e5);const b=$("trashl");b.innerHTML="";
 LIB.trash.slice().reverse().forEach(x=>{const d=document.createElement("div");d.className="sit";
  d.innerHTML=`<span class="n">${esc(x.song.title||"(sem título)")}</span><small>${new Date(x.t).toLocaleDateString("pt-BR")}</small><button>Restaurar</button>`;
  d.querySelector("button").onclick=()=>{const g=x.song;g.updated=Date.now();LIB.dels=(LIB.dels||[]).filter(t=>t.id!==g.id);LIB.songs.push(g);LIB.trash=LIB.trash.filter(y=>y!==x);S=g;LIB.cur=g.id;fields();all();trashList();toast("Música restaurada.")};
  b.appendChild(d)});
 if(!LIB.trash.length)b.innerHTML='<div class="help">Lixeira vazia. Músicas excluídas ficam aqui por 30 dias, neste aparelho.</div>';
}
$("trashb").onclick=()=>{trashList();$("trashbox").hidden=false};
$("tclose").onclick=()=>{$("trashbox").hidden=true};
$("trashbox").onclick=e=>{if(e.target===$("trashbox"))$("trashbox").hidden=true};
