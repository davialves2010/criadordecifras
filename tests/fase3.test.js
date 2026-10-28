const test=require("node:test"),assert=require("node:assert/strict"),{load}=require("./harness");
const BASE=["state.js","render.js","chords.js","history.js","sets.js","settings.js","sync.js","share.js","versions.js","collab.js"];

test("datas: agoTxt, daysSince e formatos",()=>{
 const a=load(["state.js","render.js","sets.js"]);
 assert.equal(a.run("daysSince('2026-10-20','2026-10-26')"),6);
 assert.equal(a.run("daysSince('2025-12-31','2026-01-02')"),2);
 for(const [d,t] of [[0,"hoje"],[1,"ontem"],[5,"há 5 dias"],[21,"há 3 sem"],[90,"há 3 meses"],[800,"há 2 anos"]])assert.equal(a.run("agoTxt("+d+")"),t);
 assert.equal(a.run("dfull('2026-10-05')"),"05/10/2026");
 assert.match(a.run("todayISO()"),/^\d{4}-\d{2}-\d{2}$/);
});

test("histórico: só conta repertório com data até hoje, uma vez por repertório",()=>{
 const a=load(["state.js","render.js","sets.js"]);
 a.run(`LIB.sets.length=0;LIB.sets.push(
  {id:"a",date:"2026-10-01",items:[{songId:"s1"},{songId:"s1"},{songId:"s2"}]},
  {id:"b",date:"2026-10-20",items:[{songId:"s1"}]},
  {id:"c",date:"2026-12-25",items:[{songId:"s3"}]},
  {id:"d",items:[{songId:"s4"}]})`);
 const r=a.json("(()=>{const p=playStats('2026-10-26');return{any:p.any,m:[...p.m]}})()");
 const m=Object.fromEntries(r.m);
 assert.equal(r.any,true);
 assert.deepEqual(m.s1,{n:2,last:"2026-10-20"});
 assert.deepEqual(m.s2,{n:1,last:"2026-10-01"});
 assert.equal(m.s3,undefined,"data futura não conta");
 assert.equal(m.s4,undefined,"sem data não conta");
 a.run("LIB.sets.length=0");
 assert.equal(a.json("playStats('2026-10-26').any"),false);
});

test("escala: texto por pessoa (todas, algumas, nenhuma)",()=>{
 const a=load(["state.js","render.js","sets.js"]);
 a.run(`LIB.songs.length=0;LIB.songs.push({id:"s1",title:"Um",sections:[]},{id:"s2",title:"Dois",sections:[]},{id:"s3",title:"Três",sections:[]});
  var c={name:"Culto",date:"2026-10-25",items:[{songId:"s1"},{songId:"s2"},{songId:"s3"}],
   team:[{n:"Ana",r:"Voz",s:["s1","s2","s3"]},{n:"João",r:"Violão",s:["s1","s3"]},{n:"Lia",r:"",s:[]}]}`);
 assert.equal(a.run("escalaTexto(c)"),[
  "Culto — 25/10/2026","",
  "Ana (Voz): todas as músicas",
  "João (Violão): 1. Um · 3. Três",
  "Lia: sem músicas marcadas"].join("\n"));
 assert.match(a.run('escalaTexto({name:"X",items:[]})'),/Nenhuma pessoa/);
});

test("pastas: busca encontra pelo nome da pasta e o índice acompanha a mudança",()=>{
 const a=load(["state.js","render.js"]);
 a.run('var s={title:"Um",sections:[{text:"[C]x"}]}');
 assert.equal(a.run('matchSong(s,"natal")'),false);
 a.run('s.folder="Natal"');
 assert.equal(a.run('matchSong(s,"natal")'),true);
 assert.ok(a.json("PRIV").includes("folder"),"a pasta é dado pessoal: não vai em links nem é trocada ao seguir");
});

test("links e equipe não levam data, escala nem pasta (senão cada aparelho reescreve o outro)",()=>{
 const a=load(BASE);
 a.run(`LIB.songs.length=0;LIB.sets.length=0;LIB.songs.push({id:"s1",title:"Um",folder:"Natal",sections:[]});
  LIB.sets.push({id:"L",name:"C",date:"2026-10-25",team:[{n:"Ana",r:"Voz",s:["s1"]}],items:[{songId:"s1",shift:0}]})`);
 const p=JSON.stringify(a.json("setPayload(LIB.sets[0])"));
 assert.ok(!p.includes('"date"')&&!p.includes('"team"')&&!p.includes("Natal")&&!p.includes("Ana"),p);
 assert.ok(p.includes('"name":"C"'));
});
