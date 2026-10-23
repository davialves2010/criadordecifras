const test=require("node:test"),assert=require("node:assert/strict");
const handler=require("../api/importar"),{extrair}=require("../api/_extrair");
const PAGE=`<html><head><title>Abra os Olhos do Meu Coração - David Quinlan - Cifra Club</title></head><body>
<h1 class="t1">Abra os Olhos do Meu Cora&ccedil;&atilde;o</h1><h2 class="t3"><a href="#">David Quinlan</a></h2>
<pre>[Intro] <b>C</b>  <b>G/B</b>
<b>C</b>           <b>G</b>
Abra os olhos do meu cora&#231;&#227;o &amp; ver
</pre></body></html>`;
function call(body,{auth,method="POST"}={}){
 return new Promise(ok=>{const res={h:{},setHeader(k,v){this.h[k]=v},status(c){this.c=c;return this},json(o){ok({c:this.c,o})}};handler({method,body,headers:{authorization:auth}},res)});
}
const mkFetch=routes=>{const calls=[];globalThis.fetch=async(u,opt)=>{calls.push(u);const r=routes[u]||routes["*"];if(!r)throw new Error("sem rota "+u);return r(u,opt)};return calls};
const html=(b,extra={})=>({status:200,ok:true,headers:{get:k=>({"content-type":"text/html; charset=utf-8",...extra}[k.toLowerCase()]||null)},arrayBuffer:async()=>Buffer.from(b)});
test.afterEach(()=>{delete process.env.SUPABASE_URL;delete process.env.SUPABASE_KEY;delete process.env.IMPORT_HOSTS});

test("extrai título, artista e texto (tags e acentos HTML)",()=>{
 const r=extrair(PAGE);
 assert.equal(r.title,"Abra os Olhos do Meu Coração");assert.equal(r.artist,"David Quinlan");
 assert.equal(r.text,"[Intro] C  G/B\nC           G\nAbra os olhos do meu coração & ver");
});
test("sem <h1>, usa o <title> e remove '- Cifra Club'",()=>{
 const r=extrair("<title>Quão Grande é o Meu Deus - Soraya Moraes - Cifra Club</title><pre>C   G\nQuão grande é o meu Deus, canto a ti</pre>");
 assert.equal(r.title,"Quão Grande é o Meu Deus");assert.equal(r.artist,"Soraya Moraes");
});
test("página sem cifra devolve null",()=>{assert.equal(extrair("<p>oi</p><pre>x</pre>"),null)});

test("importa de um site aceito",async()=>{
 const calls=mkFetch({"*":()=>html(PAGE)});
 const r=await call({url:"https://www.cifraclub.com.br/david-quinlan/abra-os-olhos/"});
 assert.equal(r.c,200);assert.equal(r.o.title,"Abra os Olhos do Meu Coração");assert.equal(calls.length,1);
});
test("recusa endereços perigosos ou fora da lista, sem nem buscar",async()=>{
 const calls=mkFetch({"*":()=>html(PAGE)});
 for(const u of["http://www.cifraclub.com.br/x","https://evil.com/","https://cifraclub.com.br.evil.com/x","https://cifraclub.com.br@evil.com/x","https://user:pw@cifraclub.com.br/x","https://cifraclub.com.br:8443/x","http://169.254.169.254/latest","https://localhost/","javascript:alert(1)","",null,42]){
  const r=await call({url:u});assert.equal(r.c,400,String(u));
 }
 assert.equal(calls.length,0);
});
test("segue redirecionamento só se continuar no site aceito",async()=>{
 const red=to=>()=>({status:302,ok:false,headers:{get:k=>k.toLowerCase()==="location"?to:null}});
 mkFetch({"https://www.cifraclub.com.br/a":red("/b"),"https://www.cifraclub.com.br/b":()=>html(PAGE)});
 assert.equal((await call({url:"https://www.cifraclub.com.br/a"})).c,200);
 const calls=mkFetch({"https://www.cifraclub.com.br/a":red("http://169.254.169.254/")});
 assert.equal((await call({url:"https://www.cifraclub.com.br/a"})).c,502);assert.equal(calls.length,1);
});
test("site que bloqueia vira mensagem clara; não-HTML e página sem cifra são recusados",async()=>{
 mkFetch({"*":()=>({status:403,ok:false,headers:{get:()=>null}})});
 let r=await call({url:"https://www.cifraclub.com.br/a"});assert.equal(r.c,502);assert.match(r.o.error,/bloqueou/);
 mkFetch({"*":()=>html("x",{"content-type":"application/pdf"})});
 assert.equal((await call({url:"https://www.cifraclub.com.br/a"})).c,502);
 mkFetch({"*":()=>html("<p>sem cifra</p>")});
 assert.equal((await call({url:"https://www.cifraclub.com.br/a"})).c,422);
});
test("exige login quando as variáveis do Supabase estão configuradas",async()=>{
 process.env.SUPABASE_URL="https://x.supabase.co";process.env.SUPABASE_KEY="k".repeat(50);
 const calls=mkFetch({"https://x.supabase.co/auth/v1/user":(u,o)=>({ok:o.headers.Authorization==="Bearer BOM"}),"*":()=>html(PAGE)});
 assert.equal((await call({url:"https://www.cifraclub.com.br/a"})).c,401);
 assert.equal((await call({url:"https://www.cifraclub.com.br/a"},{auth:"Bearer RUIM"})).c,401);
 assert.equal((await call({url:"https://www.cifraclub.com.br/a"},{auth:"Bearer BOM"})).c,200);
 assert.ok(!calls.slice(0,2).some(u=>u.includes("cifraclub")),"não busca o site de quem não está logado");
});
test("só aceita POST e a lista de sites pode ser trocada por variável",async()=>{
 assert.equal((await call({},{method:"GET"})).c,405);
 process.env.IMPORT_HOSTS="exemplo.com";mkFetch({"*":()=>html(PAGE)});
 assert.equal((await call({url:"https://www.cifraclub.com.br/a"})).c,400);
 assert.equal((await call({url:"https://musicas.exemplo.com/a"})).c,200);
});
