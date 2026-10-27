#!/usr/bin/env node
/* Uso (na raiz do projeto):  node aplicar-fase1.js seu@email.com
   Cada trecho precisa ser encontrado exatamente 1 vez; se algum não for, NADA é gravado. */
const fs=require("fs"),path=require("path");
const email=(process.argv[2]||"").trim();
if(!/^\S+@\S+\.\S+$/.test(email)){console.error("Informe o seu e-mail de contato:  node aplicar-fase1.js seu@email.com");process.exit(1)}
const cache={},errs=[];
const rd=f=>cache[f]!==undefined?cache[f]:(cache[f]=fs.readFileSync(path.join(process.cwd(),f),"utf8"));
function rep(f,a,b){
 let s;try{s=rd(f)}catch(e){errs.push(f+": arquivo não encontrado");return}
 const E=s.includes("\r\n")?"\r\n":"\n";a=a.replace(/\n/g,E);b=b.replace(/\n/g,E);
 const n=s.split(a).length-1;
 if(n!==1){errs.push(f+": esperava 1 ocorrência, achei "+n+" → "+a.slice(0,80));return}
 cache[f]=s.replace(a,()=>b);
}

/* 1. Privacidade: e-mail de contato, data, registros de erro e prazo de guarda */
const P="privacidade.html";
rep(P,'<b>[COLOQUE AQUI SEU E-MAIL]</b>','<b><a href="mailto:'+email+'">'+email+'</a></b>');
rep(P,'Última atualização: 15/10/2026','Última atualização: 24/10/2026');
rep(P,'<li><b>Links compartilhados:</b> uma cópia da música ou do repertório que você decidir compartilhar.</li>',
 '<li><b>Links compartilhados:</b> uma cópia da música ou do repertório que você decidir compartilhar.</li>\n<li><b>Registros de erro:</b> quando algo dá erro no app, guardamos a mensagem do erro, a página, o tipo de aparelho e navegador e o identificador da sua conta, só para encontrar e corrigir o problema. As mensagens são cortadas e não são feitas para incluir suas cifras.</li>');
rep(P,'Músicas na lixeira ficam disponíveis por 30 dias.</p>','Músicas na lixeira ficam disponíveis por 30 dias. Registros de erro são apagados depois de 90 dias.</p>');

/* 4. Registro de erros: script novo carregado primeiro + ganchos nos pontos onde o app já captura erros */
rep("index.html",'<script src="js/config.js"></script>','<script src="js/erros.js"></script>\n<script src="js/config.js"></script>');
rep("js/sync.js",'catch(e){console.error(e);showForm();aerr(','catch(e){console.error(e);if(window.logErro)logErro(e,"startSession");showForm();aerr(');
rep("js/pdf.js",'catch(e){console.error(e);msg("Erro ao montar o PDF: "','catch(e){console.error(e);if(window.logErro)logErro(e,"pdf");msg("Erro ao montar o PDF: "');

/* service worker: novo arquivo na lista e versão nova */
rep("sw.js",'"js/config.js",','"js/erros.js","js/config.js",');
{const s=rd("sw.js"),m=s.match(/const V="cifras-v(\d+)"/);
 if(!m)errs.push('sw.js: não achei const V="cifras-vN"');else cache["sw.js"]=s.replace(m[0],'const V="cifras-v'+(+m[1]+1)+'"')}

/* testes antigos: zera o contador de uso entre um teste e outro */
rep("tests/importar.test.js",'test.afterEach(()=>{delete process.env.SUPABASE_URL;','test.afterEach(()=>{handler._reset();delete process.env.SUPABASE_URL;');

if(errs.length){console.error("\nNADA foi gravado. Problemas:\n - "+errs.join("\n - "));process.exit(1)}
Object.keys(cache).forEach(f=>fs.writeFileSync(path.join(process.cwd(),f),cache[f]));
console.log("OK: "+Object.keys(cache).join(", ")+"\nFaltam (copiar da entrega): api/importar.js, js/erros.js, supabase/fase1.sql, tests/fase1.test.js");
