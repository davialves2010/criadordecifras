/* Pega o erro "Identifier 'X' has already been declared": dois scripts que declaram a mesma variável global
   (let/const) fazem o navegador recusar o segundo arquivo INTEIRO, e os botões dele ficam sem função.
   Carrega todos os scripts do index.html na mesma ordem do navegador. */
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("fs"),path=require("path"),{loadSoft}=require("./harness");
test("nenhum script redeclara variáveis globais de outro nem tem erro de sintaxe",()=>{
 const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 const files=[...html.matchAll(/<script src="js\/([^"]+)"/g)].map(m=>m[1]);
 assert.ok(files.length>10,"não achei os scripts no index.html");
 const bad=loadSoft(files).errors.filter(e=>e.error&&e.error.name==="SyntaxError").map(e=>e.file+": "+e.error.message);
 assert.deepEqual(bad,[]);
});
