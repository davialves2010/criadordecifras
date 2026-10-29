const test=require("node:test"),assert=require("node:assert/strict"),{load,loadSoft}=require("./harness");

test("acordes: notas de cada tipo de acorde",()=>{
 const a=load(["state.js","render.js","chords.js"]);
 const pcs=c=>a.json("[...chordPcs("+JSON.stringify(c)+").set].sort((x,y)=>x-y)");
 assert.deepEqual(pcs("C"),[0,4,7]);
 assert.deepEqual(pcs("Am7"),[0,4,7,9]);
 assert.deepEqual(pcs("C7M"),[0,4,7,11]);
 assert.deepEqual(pcs("G7"),[2,5,7,11]);
 assert.deepEqual(pcs("Bdim"),[2,5,11]);
 assert.deepEqual(pcs("Dsus4"),[2,7,9]);
 assert.deepEqual(pcs("Cadd9"),[0,2,4,7],"add9 não vira 7ª");
 assert.deepEqual(pcs("G/B"),[2,7,11]);
 assert.equal(a.run('chordPcs("H")'),null);
});

test("ukulele: forma usa só notas do acorde e inclui o que não pode faltar",()=>{
 const a=load(["state.js","render.js","chords.js"]);
 assert.deepEqual(a.json('ushape("C").f'),[0,0,0,3]);
 assert.deepEqual(a.json('ushape("Am").f'),[2,0,0,0]);
 for(const c of ["C","D","Em","F","G","G7","Am7","Bb","F#m","Dsus4","Cmaj7","E7"]){
  const ok=a.run(`(()=>{const s=ushape(${JSON.stringify(c)}),t=chordPcs(${JSON.stringify(c)});if(!s)return false;
   const p=s.f.map((v,i)=>(UB[i]+v)%12);return p.every(x=>t.set.has(x))&&t.req.every(x=>p.includes(x))})()`);
  assert.equal(ok,true,c);
 }
});

test("diagramas: cada instrumento gera um desenho diferente",()=>{
 const a=load(["state.js","render.js","chords.js"]);
 const g=a.run('PREFS={};diag("C")'),u=a.run('PREFS={inst:"ukulele"};diag("C")'),p=a.run('PREFS={inst:"teclado"};diag("C")');
 assert.equal((g.match(/<line/g)||[]).length,12);   /* 6 cordas + 6 trastes */
 assert.equal((u.match(/<line/g)||[]).length,10);   /* 4 cordas + 6 trastes */
 assert.ok(p.includes("<rect")&&p.includes("C E G"));
 assert.equal(a.run('PREFS={inst:"teclado"};diag("X")'),"");
});

test("posicionar acordes: separar e juntar não perde nada",()=>{
 const a=load(["state.js","render.js","chords.js","acordes-visual.js"]);
 const ida=l=>a.run("chordLineSer(...(()=>{const r=chordLineParse("+JSON.stringify(l)+");return[r.lyr,r.toks]})())");
 for(const l of ["[C]Abra os olhos do meu [G]coração","[C]{segura}Oi [G/B]amor [Am7]","| [C] [G/B] [F/A] [C] :||","sem acordes","[C]","texto [G"])assert.equal(ida(l),l,l);
 const r=a.json('chordLineParse("[C]Abra os [G]olhos")');
 assert.equal(r.lyr,"Abra os olhos");assert.deepEqual(r.toks.map(t=>[t.p,t.c]),[[0,"C"],[8,"G"]]);
 /* mover o G para o início de "coração" */
 assert.equal(a.run('chordLineSer("Abra os olhos",[{p:0,c:"C",n:""},{p:5,c:"G",n:""}])'),"[C]Abra [G]os olhos");
 /* acorde além do fim da letra fica no fim */
 assert.equal(a.run('chordLineSer("Oi",[{p:9,c:"D",n:""}])'),"Oi[D]");
});

test("palco ao vivo: código da sala",()=>{
 const a=loadSoft(["palco-vivo.js"],{crypto:require("node:crypto").webcrypto});
 for(let i=0;i<50;i++){const c=a.run("novaSala()");assert.match(c,/^[A-HJKMNP-Z2-9]{10}$/);assert.equal(a.run("salaOk("+JSON.stringify(c)+")"),true)}
 assert.equal(a.run('salaNorm(" abcde-fghjk ")'),"ABCDEFGHJK");
 assert.equal(a.run('salaOk("ABCDEFGHIJ")'),false,"I não existe no alfabeto");
 assert.equal(a.run('salaOk("ABC")'),false);
});

test("diapasão: frequência da tônica",()=>{
 const a=loadSoft(["diapasao.js"]);
 const f=pc=>a.run("tonicFreq("+pc+")");
 assert.ok(Math.abs(f(0)-261.63)<.01);assert.ok(Math.abs(f(9)-220)<.01);assert.ok(Math.abs(f(7)-196)<.01);
 assert.ok(Math.abs(f(12)-f(0))<1e-9&&Math.abs(f(-3)-f(9))<1e-9);
 for(let i=0;i<12;i++)assert.ok(f(i)>180&&f(i)<380);
});
