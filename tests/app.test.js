/* Rodar: node --test tests/*.test.js   (Node 18+, sem dependências) */
const test=require("node:test"),assert=require("node:assert/strict"),{load}=require("./harness");
const app=load(["state.js","render.js","chords.js","importer.js","song-options.js","chordpro.js"]);
const q=s=>JSON.stringify(s);
const parse=t=>app.json("parse("+q(t)+")");

test("reconhece acordes e rejeita palavras",()=>{
 for(const c of ["C","Am7","C#m7(b5)","A7M","Dsus4","G/B","F#dim","Bb","Cmaj7","E7(9)","D/F#"])assert.equal(app.run("CH.test("+q(c)+")"),true,c);
 for(const w of ["Dad","Ela","amor","Quanto","Deus"])assert.equal(app.run("CH.test("+q(w)+")"),false,w);
});
test("[Intro] com acordes na mesma linha",()=>{
 assert.deepEqual(parse("[Intro] G9  C/E  D/F#"),[{name:"Intro",text:"[G9] [C/E] [D/F#]"}]);
});
test("título, linha em branco e acordes entre parênteses",()=>{
 assert.deepEqual(parse("[Primeira Parte]\n\n( G9  C/E  D/F# )"),[{name:"Primeira Parte",text:"[G9] [C/E] [D/F#]"}]);
});
test("acordes em cima, letra embaixo",()=>{
 assert.deepEqual(parse("G9       C9/E\nQuanto amor, quanto amor"),[{name:"Estrofe",text:"[G9]Quanto am[C9/E]or, quanto amor"}]);
});
test("Intro: e Refrão (2x)",()=>{
 const r=parse("Intro: C G Am F\nRefrão (2x)\nC   G\nOh Deus");
 assert.deepEqual(r[0],{name:"Intro",text:"[C] [G] [Am] [F]"});
 assert.deepEqual(r[1],{name:"Refrão",rep:"2x",text:"[C]Oh D[G]eus"});
});
test("transposição",()=>{
 assert.equal(app.run('PREFER=null;tcr("C",2)'),"D");
 assert.equal(app.run('tcr("G/B",2)'),"A/C#");
 assert.equal(app.run('tcr("Am7",-3)'),"F#m7");
 assert.equal(app.run('PREFER="flat";tcr("C",3)'),"Eb");
 app.run("PREFER=null");
});
test("folha transposta mostra o acorde novo",()=>{
 const h=app.run('sheetHTML({title:"X",sections:[{name:"Estrofe",text:"[C]Oi"}],shift:2},0)');
 assert.ok(h.includes(">D</span>"));
});
test("capotraste sugerido",()=>{
 app.run('S={sections:[{text:"[Bb] [F] [Gm] [Eb]"}],shift:0}');
 const r=app.json("capoSuggest()");
 assert.equal(r.capo,3);assert.deepEqual(r.shapes,["G","D","Em","C"]);
 app.run('S={sections:[{text:"[G] [C] [Em] [D]"}],shift:0}');
 assert.equal(app.json("capoSuggest()").capo,0);
});
test("ChordPro: exportar e importar mantém as seções",()=>{
 const sg={title:"T",artist:"A",key:"C",bpm:80,time:"4/4",capo:2,sections:[
  {name:"Refrão",rep:"2x",text:"[C]Oi {segura} amor\n[G]Tchau",note:"só voz"},{name:"Estrofe",text:"[Am]Teste"}]};
 const cho=app.run("toCho("+q(sg)+")");
 assert.ok(cho.includes("{start_of_chorus: Refrão 2x}")&&cho.includes("[*segura]")&&cho.includes("{title: T}"));
 const r=app.json("fromCho("+q(cho)+")");
 assert.equal(r.m.title,"T");assert.equal(r.m.capo,2);assert.equal(r.m.bpm,80);
 assert.deepEqual(r.secs,sg.sections);
});
test("ChordPro sem seções vira Estrofe",()=>{
 const r=app.json('fromCho("{title: X}\\n[C]Oi\\n[G]Tchau\\n\\n[Am]Outra")');
 assert.equal(r.secs.length,2);assert.equal(r.secs[0].text,"[C]Oi\n[G]Tchau");
});
