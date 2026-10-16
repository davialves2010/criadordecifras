/* js/chordpro.js — exportar/importar ChordPro (.cho). Usa hn() de importer.js */
function toCho(sg){
 const L=[],add=(k,v)=>{if(v)L.push("{"+k+": "+v+"}")};
 add("title",sg.title);add("artist",sg.artist);add("key",sg.key);add("capo",sg.capo||"");add("tempo",sg.bpm);add("time",sg.time);L.push("");
 sg.sections.forEach(s=>{
  const kind=/refr|coro/i.test(s.name||"")?"chorus":/ponte/i.test(s.name||"")?"bridge":"verse",lab=(s.name||"")+(s.rep?" "+s.rep:"");
  L.push("{start_of_"+kind+": "+lab+"}");
  if(s.note)L.push("{comment_italic: "+s.note+"}");
  (s.text||"").split("\n").forEach(l=>L.push(l.replace(/\{([^}]*)\}/g,"[*$1]")));
  L.push("{end_of_"+kind+"}","");
 });
 return L.join("\n");
}
function fromCho(txt){
 const m={},secs=[];let cur=null;
 const open=(name,rep,auto)=>{cur={name:name||"Estrofe",lines:[],rep:rep||"",note:"",auto:!!auto};secs.push(cur)};
 txt.replace(/\r/g,"").split("\n").forEach(raw=>{
  const l=raw.trim();
  if(l.startsWith("#"))return;
  const d=l.match(/^\{\s*([a-z_]+)\s*(?::\s*(.*?))?\s*\}$/i);
  if(d){
   const k=d[1].toLowerCase(),v=(d[2]||"").trim();
   if(k==="title"||k==="t")m.title=v;
   else if(k==="artist")m.artist=v;
   else if(k==="subtitle"||k==="st")m.artist=m.artist||v;
   else if(k==="key")m.key=v;
   else if(k==="capo")m.capo=+v||0;
   else if(k==="tempo")m.bpm=+v||"";
   else if(k==="time")m.time=v;
   else if(/^(start_of_|so)/.test(k)){
    const kind=k.replace(/^start_of_|^so/,""),def={chorus:"Refrão",c:"Refrão",verse:"Estrofe",v:"Estrofe",bridge:"Ponte",b:"Ponte"}[kind]||"Estrofe";
    const h=v?hn(v):{name:def,rep:""};open(h.name,h.rep,false);
   }
   else if(/^(end_of_|eo)/.test(k))cur=null;
   else if(/^(comment_italic|ci|comment|c)$/.test(k)&&cur)cur.note=v;
   return;
  }
  if(!l){if(cur&&cur.auto)cur=null;return}
  if(!cur)open("Estrofe","",true);
  cur.lines.push(raw.replace(/\s+$/,"").replace(/\[\*([^\]]*)\]/g,"{$1}"));
 });
 return{m,secs:secs.filter(s=>s.lines.length).map(s=>{const o={name:s.name,text:s.lines.join("\n")};if(s.rep)o.rep=s.rep;if(s.note)o.note=s.note;return o})};
}
function dlText(name,text){
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"text/plain;charset=utf-8"}));a.download=name;a.click();
 setTimeout(()=>URL.revokeObjectURL(a.href),4000);msg("Arquivo "+name+" gerado.");
}
$("expCho").onclick=()=>dlText(fname(S.title)+".cho",toCho(S));
const _jsonImport=$("file").onchange;
$("file").onchange=async function(e){
 const f=e.target.files[0];
 if(f&&/\.(cho|crd|chordpro|pro)$/i.test(f.name)){
  e.target.value="";
  try{
   const{m,secs}=fromCho(await f.text());if(!secs.length)throw 0;
   S={id:uid(),title:m.title||f.name.replace(/\.[^.]+$/,""),artist:m.artist||"",key:m.key||"",time:m.time||"4/4",bpm:m.bpm||"",capo:m.capo||0,shift:0,sections:secs};
   LIB.songs.push(S);LIB.cur=S.id;VIEW="song";fields();all();msg("Música importada do ChordPro.");
  }catch(err){msg("Não consegui ler esse arquivo ChordPro.")}
  return;
 }
 return _jsonImport.call(this,e);
};
