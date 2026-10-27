const test=require("node:test"),assert=require("node:assert/strict"),fs=require("fs"),path=require("path"),{load}=require("./harness");
const lerArq=f=>fs.readFileSync(path.join(__dirname,"..",f),"utf8");

test("lista: texto de apoio mostra artista, tom e duração (só o que existir)",()=>{
 const a=load(["state.js"]);
 const m=o=>a.run("libMeta("+JSON.stringify(o)+")");
 assert.equal(m({artist:"Gerson",key:"G major",dur:"4:30"}),"Gerson · G · 4:30");
 assert.equal(m({artist:"",key:"Em"}),"Em");
 assert.equal(m({artist:"X",key:"Bb minor",dur:"3:00"}),"X · Bbm · 3:00");
 assert.equal(m({artist:"X"}),"X");
 assert.equal(m({}),"");
});

test("todo script e CSS carregado pelo index.html está na lista SHELL do sw.js (senão não funciona offline)",()=>{
 const html=lerArq("index.html"),sw=lerArq("sw.js");
 const arqs=[...html.matchAll(/(?:src|href)="((?:js|css)\/[^"]+)"/g)].map(m=>m[1]);
 assert.ok(arqs.length>10);
 assert.deepEqual(arqs.filter(f=>!sw.includes('"'+f+'"')),[]);
});

test("os ids que os scripts novos usam existem no index.html",()=>{
 const html=lerArq("index.html");
 for(const id of ["newsbox","newsl","newsx","m-news","pf-gest","stage","sbar","smenu","sx","sp","sn"])
  assert.ok(html.includes('id="'+id+'"')||id==="smenu","faltando id="+id); /* smenu é criado por ux.js */
});
