const test=require("node:test"),assert=require("node:assert/strict"),fs=require("fs"),path=require("path"),vm=require("vm"),{load}=require("./harness");
const hasJspdf=(()=>{try{require.resolve("jspdf");return true}catch(e){return false}})();

const fakeDoc=(msgs,head)=>{const el=new Proxy({style:{}},{get:(t,k)=>k in t?t[k]:"",set:(t,k,v)=>{if(k==="textContent")msgs.push(v);t[k]=v;return true}});return{createElement:()=>({}),head,getElementById:()=>el}};
test("botão Baixar PDF: carrega a biblioteca, monta e salva o arquivo",{skip:!hasJspdf},async()=>{
 const{jsPDF}=require("jspdf");let saved=null;
 const J2=function(...a){const d=new jsPDF(...a);d.save=n=>{saved=n};return d};
 const a=load(["state.js","render.js","chords.js","pdf.js"],{});
 /* simula o carregamento do <script> do CDN: ao anexar, define window.jspdf e dispara onload */
 const msgs=[];a.ctx.document=fakeDoc(msgs,{appendChild(s){a.ctx.window.jspdf={jsPDF:J2};s.onload()}});
 a.run(`S={id:"a",title:"Abra os Olhos",sections:[{name:"Estrofe",text:"[C]Oi [G]amor"}]};VIEW="song"`);
 await a.run("exportPdf()");
 assert.equal(saved,"abra-os-olhos.pdf");
 assert.equal(msgs.pop(),"PDF gerado.");
});
test("botão Baixar PDF: se a biblioteca não carrega, avisa com clareza",async()=>{
 const a=load(["state.js","render.js","chords.js","pdf.js"],{});
 const msgs=[];a.ctx.document=fakeDoc(msgs,{appendChild(s){s.onerror()}});
 a.run(`S={id:"a",title:"X",sections:[]};VIEW="song"`);
 await a.run("exportPdf()");
 assert.match(msgs.pop(),/biblioteca de PDF/);
});
test("favorito de importação: copia título + texto do <pre> da página",async()=>{
 const src=fs.readFileSync(path.join(__dirname,"..","js","extras.js"),"utf8");
 const lit=src.match(/const BKM=("(?:[^"\\]|\\.)*");/);assert.ok(lit,"não achei o código do favorito");
 const code=JSON.parse(lit[1]);assert.ok(code.startsWith("javascript:"));
 assert.ok(!/\n/.test(code),"o favorito não pode ter quebra de linha");
 let copied=null,alerted=null;
 const ctx={getSelection:()=>"",document:{title:"Abra os Olhos - Cifra Club",querySelectorAll:()=>[{innerText:"curto"},{innerText:"[Intro] C G\nC        G\nAbra os olhos"}]},
  navigator:{clipboard:{writeText:async t=>{copied=t}}},alert:m=>{alerted=m},prompt(){},Promise};
 vm.runInNewContext(code.slice("javascript:".length),ctx);
 await new Promise(r=>setTimeout(r,10));
 assert.equal(copied,"Abra os Olhos - Cifra Club\n\n[Intro] C G\nC        G\nAbra os olhos");
 assert.match(alerted,/Cifra copiada/);
 /* sem <pre>: usa o texto selecionado */
 copied=null;ctx.getSelection=()=>"texto selecionado";ctx.document.querySelectorAll=()=>[];
 vm.runInNewContext(code.slice(11),ctx);await new Promise(r=>setTimeout(r,10));
 assert.ok(copied.endsWith("texto selecionado"));
});

/* ---- importar pelo link (lado do navegador) ---- */
function pageWith(fetchImpl){
 const a=load(["state.js","render.js","chords.js","history.js","sets.js","stage.js","settings.js","extras.js"],{});
 const els={},msgs=[];
 const el=id=>els[id]||(els[id]=new Proxy({style:{},value:""},{get:(t,k)=>k in t?t[k]:"",set:(t,k,v)=>{if(k==="textContent"&&(id==="msg"||id==="toast"))msgs.push(v);t[k]=v;return true}}));
 a.ctx.document={getElementById:el,createElement:()=>({}),querySelectorAll:()=>[],addEventListener(){},documentElement:{}};
 a.ctx.fetch=fetchImpl;
 a.ctx.__calls=[];
 a.run('USER={id:"u"};sb={auth:{getSession:async()=>({data:{session:{access_token:"TOK"}}})}}');
 return{a,els,msgs};
}
test("importar link: envia o login, preenche a caixa e avisa o que fazer",async()=>{
 const sent=[];
 const{a,els,msgs}=pageWith(async(u,o)=>{sent.push({u,o});return{ok:true,json:async()=>({title:"Abra os Olhos",artist:"David Quinlan",text:"[Intro] C G\nC   G\nAbra os olhos"})}});
 await a.run('importUrl("https://www.cifraclub.com.br/x/y/")');
 assert.equal(sent[0].u,"/api/importar");assert.equal(sent[0].o.method,"POST");
 assert.equal(sent[0].o.headers.Authorization,"Bearer TOK");assert.deepEqual(JSON.parse(sent[0].o.body),{url:"https://www.cifraclub.com.br/x/y/"});
 assert.equal(els.ptxt.value,"Abra os Olhos\nDavid Quinlan\n\n[Intro] C G\nC   G\nAbra os olhos");
 assert.equal(els.pbox.style.display,"block");assert.match(msgs.pop(),/Converter e adicionar/);
});
test("importar link: mostra o erro do servidor e funciona sem a função (fora da Vercel)",async()=>{
 let{a,els,msgs}=pageWith(async()=>({ok:false,json:async()=>({error:"O site bloqueou o acesso automático."})}));
 await a.run('importUrl("https://www.cifraclub.com.br/x/")');
 assert.match(msgs.pop(),/bloqueou/);assert.ok(!els.ptxt||els.ptxt.value==="");
 ({a,els,msgs}=pageWith(async()=>({ok:false,json:async()=>{throw new Error("html")}})));
 await a.run('importUrl("https://www.cifraclub.com.br/x/")');
 assert.match(msgs.pop(),/site publicado na Vercel/);
 ({a,els,msgs}=pageWith(async()=>{throw new Error("offline")}));
 await a.run('importUrl("https://www.cifraclub.com.br/x/")');
 assert.match(msgs.pop(),/Verifique a internet/);
});
test("importar link: recusa texto que não é endereço e exige login",async()=>{
 let{a,msgs}=pageWith(async()=>{throw new Error("não deveria buscar")});
 await a.run('importUrl("Abra os olhos")');assert.match(msgs.pop(),/endereço completo/);
 ({a,msgs}=pageWith(async()=>{throw new Error("não deveria buscar")}));
 a.run("USER=null");await a.run('importUrl("https://www.cifraclub.com.br/x/")');assert.match(msgs.pop(),/Entre na sua conta/);
});
