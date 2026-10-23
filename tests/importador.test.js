const test=require("node:test"),assert=require("node:assert/strict"),{load}=require("./harness");
const q=s=>JSON.stringify(s);
const app=load(["state.js","render.js","chords.js","importer.js"]);
const parse=t=>app.json("parse("+q(t)+")");

/* --- comportamento que já existia --- */
test("reconhece acordes e rejeita palavras",()=>{
 for(const c of ["C","Am7","C#m7(b5)","A7M","Dsus4","G/B","F#dim","Bb","Cmaj7","E7(9)","D/F#","F#4(7)","C#m7(9)"])assert.equal(app.run("CH.test("+q(c)+")"),true,c);
 for(const w of ["Dad","Ela","amor","Quanto","Deus"])assert.equal(app.run("CH.test("+q(w)+")"),false,w);
});
test("[Intro] com acordes na mesma linha",()=>{assert.deepEqual(parse("[Intro] G9  C/E  D/F#"),[{name:"Intro",text:"[G9] [C/E] [D/F#]"}])});
test("título, linha em branco e acordes entre parênteses",()=>{assert.deepEqual(parse("[Primeira Parte]\n\n( G9  C/E  D/F# )"),[{name:"Primeira Parte",text:"[G9] [C/E] [D/F#]"}])});
test("acordes em cima, letra embaixo",()=>{assert.deepEqual(parse("G9       C9/E\nQuanto amor, quanto amor"),[{name:"Estrofe",text:"[G9]Quanto am[C9/E]or, quanto amor"}])});
test("Intro: e Refrão (2x)",()=>{
 const r=parse("Intro: C G Am F\nRefrão (2x)\nC   G\nOh Deus");
 assert.deepEqual(r[0],{name:"Intro",text:"[C] [G] [Am] [F]"});assert.deepEqual(r[1],{name:"Refrão",rep:"2x",text:"[C]Oh D[G]eus"});
});

/* --- o caso reportado --- */
const CIFRA=`Intro: E9 A9 E9 C#m7(9) E9 A9 E9 C#m7(9)

E9      A9     G#7   C#m7(9)     F#4(7)   F#7
Como descrever, como explicar
              A9       B/D#
O amor que vai de Leste a Oeste
              C#m7(9)
E nunca mais vai terminar

E9     A9  B              E9
É de coração tudo o que eu disser`;
test("'Intro: E9 A9…' não vira título da música",()=>{
 const mp=app.json("metaPaste("+q(CIFRA)+")");
 assert.equal(mp.title,undefined);
 assert.ok(mp.body.startsWith("Intro: E9"));
 const r=parse(mp.body);
 assert.deepEqual(r[0],{name:"Intro",text:"[E9] [A9] [E9] [C#m7(9)] [E9] [A9] [E9] [C#m7(9)]"});
 assert.ok(r[1].text.startsWith("[E9]Como des[A9]crever"));
 assert.ok(r[1].text.includes("O amor que vai[A9] de Leste[B/D#] a Oeste"));
});
test("título e artista de verdade continuam sendo detectados",()=>{
 const mp=app.json("metaPaste("+q("É de Coração\nGerson Rufino\n\nIntro: E9 A9\n\nE9 A9\nOi amor")+")");
 assert.equal(mp.title,"É de Coração");assert.equal(mp.artist,"Gerson Rufino");
 const mp2=app.json("metaPaste("+q("É de Coração - Gerson Rufino\nIntro: E9 A9\n\nE9 A9\nOi amor")+")");
 assert.equal(mp2.title,"É de Coração");assert.equal(mp2.artist,"Gerson Rufino");assert.ok(mp2.body.startsWith("Intro: E9"));
});
test("texto copiado de sites: espaços especiais, caracteres invisíveis e ♯/♭ não atrapalham",()=>{
 const sujo=CIFRA.replace(/ /g,"\u00A0").replace(/#/g,"♯").replace(/\n/g,"\u200B\n").replace("E9","\uFEFFE9");
 const limpo=parse(app.json("metaPaste("+q(CIFRA)+")").body);
 const r=parse(app.json("metaPaste("+q(sujo)+")").body);
 assert.deepEqual(r.map(s=>s.text.replace(/♯/g,"#")),limpo.map(s=>s.text));
 assert.equal(parse("C\u2003 G\nOi ♭amor")[0].text,"[C]Oi [G]bamor");
 assert.equal(parse("B♭   F\nTeste")[0].text,"[Bb]Teste[F]");
});

/* --- colar direto dentro de um cartão --- */
function cardPage(sections){
 const handlers={},el=()=>new Proxy({style:{},value:""},{get:(t,k)=>k in t?t[k]:"",set:(t,k,v)=>{t[k]=v;return true}});
 const a=load(["state.js","render.js","chords.js","importer.js"],{document:{getElementById:el,addEventListener(t,f){handlers[t]=f},createElement:()=>({}),querySelectorAll:()=>[]}});
 a.run(`var all=()=>{};S={id:"a",sections:${q(sections)}}`);
 const ta={tagName:"TEXTAREA",value:sections[0].text,selectionStart:0,selectionEnd:0,oninput(){},
  closest(s){return s==="#secs"?{}:s===".card"?{dataset:{di:"0"}}:null},setRangeText(t,x,y){this.value=this.value.slice(0,x)+t+this.value.slice(y)}};
 const paste=text=>{const e={target:ta,clipboardData:{getData:()=>text},preventDefault(){this.p=true}};handlers.paste(e);return e};
 return{a,ta,paste};
}
test("colar cifra dentro de um cartão converte os acordes",()=>{
 const{ta,paste}=cardPage([{name:"Estrofe",text:""}]);
 const e=paste("E9      A9\nComo descrever, como explicar\n");
 assert.equal(e.p,true);assert.equal(ta.value,"[E9]Como des[A9]crever, como explicar");
});
test("colar várias seções num cartão vazio troca o cartão por elas",()=>{
 const{a,paste}=cardPage([{name:"Estrofe",text:""}]);
 paste("[Refrão]\nC   G\nOh Deus\n\n[Ponte]\nAm  F\nTchau amor");
 assert.deepEqual(a.json("S.sections.map(s=>s.name)"),["Refrão","Ponte"]);
 assert.equal(a.json("S.sections[0].text"),"[C]Oh D[G]eus");
});
test("texto comum (sem acordes) continua sendo colado normalmente",()=>{
 const{ta,paste}=cardPage([{name:"Estrofe",text:""}]);
 assert.ok(!paste("Abra os olhos\ndo meu coração").p);
 assert.ok(!paste("uma linha só").p);
});
