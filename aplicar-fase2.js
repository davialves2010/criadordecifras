#!/usr/bin/env node
/* Uso (na raiz do projeto):  node aplicar-fase2.js
   Cada trecho precisa ser encontrado exatamente 1 vez; se algum não for, NADA é gravado. */
const fs=require("fs"),path=require("path");
const cache={},errs=[],avisos=[];
const rd=f=>cache[f]!==undefined?cache[f]:(cache[f]=fs.readFileSync(path.join(process.cwd(),f),"utf8"));
function rep(f,a,b,opcional){
 let s;try{s=rd(f)}catch(e){(opcional?avisos:errs).push(f+": arquivo não encontrado");return}
 const E=s.includes("\r\n")?"\r\n":"\n";a=a.replace(/\n/g,E);b=b.replace(/\n/g,E);
 const n=s.split(a).length-1;
 if(n!==1){(opcional?avisos:errs).push(f+": esperava 1 ocorrência, achei "+n+" → "+a.slice(0,80));return}
 cache[f]=s.replace(a,()=>b);
}

/* 1. Lista de músicas: tom e duração, e navegação por teclado */
rep("js/state.js",'function lib(){',
 'const libMeta=s=>{const k=keyParts(s.key);return[s.artist,k?k.r+(k.m?"m":""):"",s.dur].filter(Boolean).join(" · ")};\nfunction lib(){');
rep("js/state.js",'<small>${esc(s.artist||"")}</small>${snip?','<small>${esc(libMeta(s))}</small>${snip?');
rep("js/state.js",'d.onclick=()=>{S=s;LIB.cur=s.id;VIEW="song";fields();editor();preview();if(MODE==="text")$("ttxt").value=ser(S.sections);persist();go("song")};',
 'd.onclick=()=>{S=s;LIB.cur=s.id;VIEW="song";fields();editor();preview();if(MODE==="text")$("ttxt").value=ser(S.sections);persist();go("song")};\n  d.tabIndex=0;d.setAttribute("role","button");\n  d.onkeydown=e=>{if(e.target===d&&(e.key==="Enter"||e.key===" ")){e.preventDefault();d.click()}};');

/* 2. index.html: janela de novidades, linhas em Configurações e scripts novos */
const H="index.html";
rep(H,'<div id="tip" class="tip"></div>',
 '<div id="newsbox" class="modal" role="dialog" aria-modal="true" aria-label="Novidades" hidden><div class="mbox"><h3>✨ O que há de novo</h3><ul id="newsl"></ul><button class="p" id="newsx">Entendi</button></div></div>\n<div id="tip" class="tip"></div>');
rep(H,'<div class="crow"><div><b>Guia de início</b>',
 '<div class="crow"><div><b>Novidades</b><span class="muted">Veja o que mudou no app.</span></div><button id="m-news">Ver</button></div>\n   <div class="crow"><div><b>Guia de início</b>');
rep(H,'<option value="page">Rolam a página</option></select></div>',
 '<option value="page">Rolam a página</option></select></div>\n   <div class="crow"><div><b>Gestos no palco</b><span class="muted">Deslize para os lados para trocar de música; toque na borda esquerda ou direita da tela para voltar ou avançar a página.</span></div><input type="checkbox" id="pf-gest" style="width:auto" aria-label="Gestos no palco"></div>');
rep(H,'<script src="js/a11y.js"></script>','<script src="js/novidades.js"></script>\n<script src="js/palco2.js"></script>\n<script src="js/a11y.js"></script>');

/* 3. a11y.js: a janela de novidades entra na pilha de diálogos (Esc e foco) */
rep("js/a11y.js",'const DLG=["helpbox",','const DLG=["helpbox","newsbox",',true);

/* 4. Service worker: arquivos novos + versão nova */
rep("sw.js",'"js/ux.js"','"js/ux.js","js/novidades.js","js/palco2.js"');
{const s=rd("sw.js"),m=s.match(/const V="cifras-v(\d+)"/);
 if(!m)errs.push('sw.js: não achei const V="cifras-vN"');else cache["sw.js"]=s.replace(m[0],'const V="cifras-v'+(+m[1]+1)+'"')}

/* 5. CSS (no fim do ux.css; só uma vez) */
if(!rd("css/ux.css").includes("/* ---- fase 2 ---- */"))cache["css/ux.css"]=rd("css/ux.css")+`
/* ---- fase 2 ---- */
.lib .it:focus-visible{outline:2px solid var(--ac);outline-offset:2px}
#sproj[aria-pressed="true"]{background:var(--ac);border-color:var(--ac);color:#fff}
#sproj-ctl{position:fixed;top:calc(8px + env(safe-area-inset-top,0px));right:8px;z-index:6;display:flex;gap:6px;opacity:.35}
#sproj-ctl[hidden]{display:none}
#sproj-ctl:hover,#sproj-ctl:focus-within{opacity:1}
#sproj-ctl button{min-width:44px;min-height:44px;background:#2a2e35;color:#eee;border:1px solid #555;border-radius:10px;font-size:18px}
/* Projeção: só a letra, grande, centralizada, fundo preto, sem barras */
#stage.proj,#stage.proj #stg.stage{background:#000}
#stage.proj #sbar,#stage.proj #sbot{display:none}
#stage.proj #stg.stage{max-width:1200px;text-align:center;font-size:calc(var(--fs,18)*1.5px);padding-bottom:50vh}
#stage.proj #stg .ln.ch,#stage.proj #stg .tabl,#stage.proj #stg .c,#stage.proj #stg .meta,#stage.proj #stg .setnote,
#stage.proj #stg .mynotes,#stage.proj #stg .sn,#stage.proj #stg .chart{display:none}
#stage.proj #stg .box{border:0;padding:0 0 .6em;margin:0 0 .6em}
#stage.proj #stg .box>.lb{position:static;display:block;background:none;color:#888;padding:0 0 .2em}
#stage.proj #stg .box:not(:has(.ln:not(.ch):not(.tabl))){display:none}
#stage.proj #stg .l{color:#fff;font-size:1em;font-weight:600}
#stage.proj #stg .body.c2{column-count:1}
`;

if(errs.length){console.error("\nNADA foi gravado. Problemas:\n - "+errs.join("\n - "));process.exit(1)}
Object.keys(cache).forEach(f=>fs.writeFileSync(path.join(process.cwd(),f),cache[f]));
console.log("OK: "+Object.keys(cache).join(", "));
if(avisos.length)console.log("\nAvisos (não impedem nada):\n - "+avisos.join("\n - "));
console.log("\nFaltam (copiar da entrega): js/novidades.js, js/palco2.js, tests/fase2.test.js");
