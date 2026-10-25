const test=require("node:test"),assert=require("node:assert/strict"),{load}=require("./harness");

test("busca: o índice acompanha edições de título, letra e acordes",()=>{
 const a=load(["state.js","render.js"]);
 a.run('var s={title:"Um",artist:"X",sections:[{text:"[C]amor [G]eterno"}]}');
 const m=x=>a.run("matchSong(s,"+JSON.stringify(x)+")");
 assert.equal(m("amor"),true);assert.equal(m("acorde:G"),true);assert.equal(m("acorde:Am"),false);
 a.run('s.sections[0].text="[Am]paz [F]eterno"');          /* mesmo tamanho de texto, outro conteúdo */
 assert.equal(m("amor"),false);assert.equal(m("paz"),true);assert.equal(m("acorde:Am"),true);assert.equal(m("acorde:G"),false);
 a.run('s.title="Outro";s.tags=["natal"]');
 assert.equal(m("outro"),true);assert.equal(m("natal"),true);
});

test("busca: consulta repetida não refaz o parse e consulta nova vale",()=>{
 const a=load(["state.js","render.js"]);
 a.run('var s={title:"Alfa",key:"G",sections:[{text:"[G]a [Em]b"}]}');
 assert.equal(a.run('matchSong(s,"tom:G alfa")'),true);
 assert.equal(a.run('matchSong(s,"tom:G alfa")'),true);
 assert.equal(a.run('matchSong(s,"tom:G beta")'),false);
});

test("save() agrupa a reconstrução da lista (lib) em vez de refazer a cada tecla",async()=>{
 const a=load(["state.js","render.js"]);
 a.run('var n=0;lib=()=>{n++};updUndo=()=>{};snap=()=>{};S={id:"x",sections:[]};for(let i=0;i<5;i++)save();');
 assert.equal(a.run("n"),0,"não deve rodar de imediato");
 await new Promise(r=>setTimeout(r,450));
 assert.equal(a.run("n"),1);
});
