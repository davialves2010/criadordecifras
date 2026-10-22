/* js/library.js — Ações da biblioteca: nova, duplicar, excluir, exportar e importar arquivo */
$("ex").onclick=()=>{S=clone(EX);S.id=uid();LIB.songs.push(S);LIB.cur=S.id;fields();all()};
$("q").oninput=lib;
$("new").onclick=()=>{S={id:uid(),title:"Nova música",artist:"",key:"",time:"4/4",shift:0,sections:[{name:"Estrofe",text:""}]};LIB.songs.push(S);LIB.cur=S.id;VIEW="song";fields();all();go("edit");$("title").select()};
$("dup").onclick=()=>{S={...clone(S),id:uid(),title:(S.title||"")+" (cópia)"};LIB.songs.push(S);LIB.cur=S.id;fields();all()};
$("del").onclick=()=>{if(!armed($("del")))return;$("pop").hidden=true;LIB.sets.forEach(x=>{const n=x.items.length;x.items=x.items.filter(i=>i.songId!==S.id);if(x.items.length!==n)x.updated=Date.now()});const gone=clone(S);(LIB.trash=LIB.trash||[]).push({kind:"song",item:gone,t:Date.now()});tomb("song",S.id,gone);LIB.songs=LIB.songs.filter(s=>s!==S);if(!LIB.songs.length)LIB.songs.push({id:uid(),title:"Nova música",artist:"",key:"",time:"4/4",shift:0,sections:[{name:"Estrofe",text:""}]});S=LIB.songs[0];LIB.cur=S.id;fields();all()};
$("expAll").onclick=()=>out("minhas-cifras.json",{app:"cifras",version:2,songs:LIB.songs,sets:LIB.sets});
$("expOne").onclick=()=>out(fname(S.title)+".json",{app:"cifras",version:1,songs:[S]});
$("imp").onclick=()=>$("file").click();
$("file").onchange=async e=>{
 const f=e.target.files[0];e.target.value="";if(!f)return;
 try{
  const j=JSON.parse(await f.text());
  const arr=(Array.isArray(j.songs)?j.songs:[j]).filter(s=>s&&Array.isArray(s.sections));
  if(!arr.length)throw 0;
  const idm={};arr.forEach(s=>{const id=uid();idm[s.id]=id;LIB.songs.push({title:"",artist:"",key:"",time:"",shift:0,...s,id})});
  (Array.isArray(j.sets)?j.sets:[]).forEach(x=>LIB.sets.push({id:uid(),name:x.name||"Repertório",items:(x.items||[]).filter(i=>idm[i.songId]).map(i=>{const o={songId:idm[i.songId],shift:i.shift||0};if(i.note)o.note=i.note;return o})}));
  S=LIB.songs[LIB.songs.length-1];LIB.cur=S.id;fields();all();msg(arr.length+" música(s) importada(s).");
 }catch(err){msg("Arquivo inválido. Use um .json exportado por este site.")}
};
