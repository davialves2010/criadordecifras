const test=require("node:test"),assert=require("node:assert/strict"),{load}=require("./harness");
const handler=require("../api/importar");

/* ---------- limite de importação ---------- */
const PAGE="<h1>Teste</h1><pre>C   G   Am   F\nLetra de teste bem comprida</pre>";
const resp=b=>({status:200,ok:true,headers:{get:k=>k.toLowerCase()==="content-type"?"text/html":null},arrayBuffer:async()=>Buffer.from(b)});
function call(body,ip="1.1.1.1"){
 return new Promise(ok=>{const res={h:{},setHeader(k,v){this.h[k]=v},status(c){this.c=c;return this},json(o){ok({c:this.c,o,h:this.h})}};
  handler({method:"POST",body,headers:{"x-forwarded-for":ip}},res)});
}
test.beforeEach(()=>handler._reset());
test.afterEach(()=>{delete process.env.IMPORT_MAX_MIN});

test("limite: a 11ª importação no mesmo minuto recebe 429 com Retry-After",async()=>{
 globalThis.fetch=async()=>resp(PAGE);
 const u={url:"https://www.cifraclub.com.br/a"};
 for(let i=0;i<10;i++)assert.equal((await call(u)).c,200,"pedido "+(i+1));
 const r=await call(u);
 assert.equal(r.c,429);assert.match(r.o.error,/Tente de novo/);assert.ok(+r.h["Retry-After"]>0);
});
test("limite: cada IP tem o seu contador e o limite pode ser trocado por variável",async()=>{
 globalThis.fetch=async()=>resp(PAGE);process.env.IMPORT_MAX_MIN="2";
 const u={url:"https://www.cifraclub.com.br/a"};
 assert.equal((await call(u,"2.2.2.2")).c,200);assert.equal((await call(u,"2.2.2.2")).c,200);
 assert.equal((await call(u,"2.2.2.2")).c,429);
 assert.equal((await call(u,"3.3.3.3")).c,200,"outro IP não é afetado");
});
test("limite: endereço recusado não gasta o limite",async()=>{
 globalThis.fetch=async()=>resp(PAGE);process.env.IMPORT_MAX_MIN="1";
 for(let i=0;i<5;i++)assert.equal((await call({url:"https://evil.com/"})).c,400);
 assert.equal((await call({url:"https://www.cifraclub.com.br/a"})).c,200);
});
test("limite: a função devolve os segundos de espera e libera depois do minuto",()=>{
 process.env.IMPORT_MAX_MIN="2";
 assert.equal(handler.limite("k",1000),0);assert.equal(handler.limite("k",2000),0);
 assert.equal(handler.limite("k",3000),58);
 assert.equal(handler.limite("k",62000),0);
});

/* ---------- registro de erros ---------- */
function pagina(extra){
 const H={},calls=[];
 const a=load(["erros.js"],{addEventListener(t,f){H[t]=f},navigator:{userAgent:"UA-teste"},USER:{id:"u"},sb:{rpc:async(n,x)=>{calls.push([n,x]);return{}}},...extra});
 return{a,H,calls};
}
test("erros: envia o erro com contexto e não repete o mesmo",async()=>{
 const{H,calls}=pagina();
 H.error({message:"boom",filename:"js/x.js",lineno:3,colno:5,error:{stack:"S".repeat(5000)}});
 H.error({message:"boom",filename:"js/x.js",lineno:3,colno:5});
 await new Promise(r=>setTimeout(r,5));
 assert.equal(calls.length,1);assert.equal(calls[0][0],"registrar_erro");
 assert.equal(calls[0][1].p_msg,"boom");assert.equal(calls[0][1].p_src,"js/x.js:3:5");
 assert.equal(calls[0][1].p_stack.length,1500);assert.equal(calls[0][1].p_ua,"UA-teste");
});
test("erros: ignora ruído e falhas de carregamento de recurso",async()=>{
 const{H,calls}=pagina();
 H.error({message:"ResizeObserver loop completed with undelivered notifications.",filename:"",lineno:0,colno:0});
 H.error({message:"Script error.",filename:"",lineno:0,colno:0});
 H.error({message:"img falhou",target:{tagName:"IMG"}});
 await new Promise(r=>setTimeout(r,5));
 assert.equal(calls.length,0);
});
test("erros: sem login guarda e envia depois que entrar; promessa rejeitada também conta",async()=>{
 const{a,H,calls}=pagina({USER:null});
 H.unhandledrejection({reason:new Error("falhou depois")});
 await new Promise(r=>setTimeout(r,5));
 assert.equal(calls.length,0,"sem login não envia");
 a.ctx.USER={id:"u"};H.online();
 await new Promise(r=>setTimeout(r,5));
 assert.equal(calls.length,1);assert.equal(calls[0][1].p_msg,"falhou depois");
});
