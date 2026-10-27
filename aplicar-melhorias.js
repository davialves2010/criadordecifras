#!/usr/bin/env node
/* Uso (na raiz do projeto):  node aplicar-melhorias.js
   Cada trecho precisa ser encontrado exatamente 1 vez. Se algum não for, NADA é gravado e o script lista o que falhou. */
const fs=require("fs"),path=require("path");
const cache={},errs=[];
const rd=f=>cache[f]!==undefined?cache[f]:(cache[f]=fs.readFileSync(path.join(process.cwd(),f),"utf8"));
function rep(f,a,b){
 let s;try{s=rd(f)}catch(e){errs.push(f+": arquivo não encontrado");return}
 const E=s.includes("\r\n")?"\r\n":"\n";a=a.replace(/\n/g,E);b=b.replace(/\n/g,E);
 const n=s.split(a).length-1;
 if(n!==1){errs.push(f+": esperava 1 ocorrência, achei "+n+" → "+a.slice(0,80));return}
 cache[f]=s.replace(a,()=>b);
}
const H="index.html",attr=(id,a)=>rep(H,'id="'+id+'"','id="'+id+'" '+a);
const dlg=(id,label)=>attr(id,'role="dialog" aria-modal="true" aria-label="'+label+'"');

/* ===== 1. Acessibilidade: rótulos direto no HTML ===== */
attr("toast",'role="status" aria-live="polite"');
dlg("cfg","Configurações");dlg("helpbox","Atalhos e dicas");dlg("shv","Cifra compartilhada");dlg("shlinks","Links compartilhados");
dlg("trashbox","Lixeira");dlg("verbox","Versões anteriores");dlg("notebox","Minhas anotações");dlg("collabbox","Edição em equipe");
dlg("thbox","Tema");dlg("stage","Modo palco");
attr("aseg",'role="group" aria-label="Entrar ou criar conta"');attr("modeseg",'role="group" aria-label="Modo de edição"');attr("thseg",'role="group" aria-label="Tema"');
rep(H,'Colunas</span><div class="seg2">','Colunas</span><div class="seg2" role="group" aria-label="Colunas">');
rep(H,'Papel</span><div class="seg2">','Papel</span><div class="seg2" role="group" aria-label="Papel">');
Object.entries({td:"Tom meio tom abaixo",tu:"Tom meio tom acima",dn:"Tom meio tom abaixo",up:"Tom meio tom acima",rs:"Voltar ao tom original",
 fd:"Diminuir letra",fu:"Aumentar letra",fdn:"Diminuir letra da folha",fup:"Aumentar letra da folha",sp:"Música anterior",sn:"Próxima música",
 sx:"Fechar modo palco",mm:"Diminuir BPM",mp:"Aumentar BPM",pfm:"Diminuir letra inicial",pfp:"Aumentar letra inicial",cfgback:"Voltar",
 undo:"Desfazer",redo:"Refazer",tmore:"Menu e configurações",sfs:"Tela cheia",mstage:"Modo palco",
 swq:"Buscar música",sname:"Nome do repertório",saq:"Buscar música para adicionar",sadd:"Música a adicionar",ksel:"Tom de saída",msel:"Margem da folha",
 spd:"Velocidade da rolagem","pf-spd":"Velocidade da rolagem",ttxt:"Cifra em texto",notetxt:"Minhas anotações"
}).forEach(([id,l])=>attr(id,'aria-label="'+l+'"'));
/* rótulos associados aos campos (for=) */
[["E-mail","aemail"],["Senha","apass"],["Repita a senha","aconf"],["Título","title"],["Artista","artist"],["Etiquetas (separe por vírgula)","tags"],
 ["Compasso","time"],["BPM","bpm"],["Duração (min:seg)","dur"],["Link para ouvir (YouTube/Spotify)","link"],["Capotraste (casa)","capo"],
 ["Acidentes na transposição","acc"],["Ou cole o link da cifra","purl"]].forEach(([t,id])=>rep(H,'<label>'+t+'</label>','<label for="'+id+'">'+t+'</label>'));
rep(H,'<label>Tom original ','<label for="key">Tom original ');
rep(H,'<label style="margin-top:0">Cole aqui a cifra','<label for="ptxt" style="margin-top:0">Cole aqui a cifra');
rep(H,'<label style="margin-top:0">Escolha o repertório</label>','<label for="setsel" style="margin-top:0">Escolha o repertório</label>');
/* botões gerados por JS */
rep("js/editor.js",'<button title="Subir">↑</button><button title="Descer">↓</button><button title="Duplicar">⧉</button><button title="Remover">✕</button>',
 '<button title="Subir" aria-label="Subir seção">↑</button><button title="Descer" aria-label="Descer seção">↓</button><button title="Duplicar" aria-label="Duplicar seção">⧉</button><button title="Remover" aria-label="Remover seção">✕</button>');
rep("js/sets.js",'<button title="Tom −">−</button><b>${esc(lab)}</b><button title="Tom +">+</button><button title="Subir">↑</button><button title="Descer">↓</button><button title="Remover">✕</button>',
 '<button title="Tom −" aria-label="Tom meio tom abaixo">−</button><b>${esc(lab)}</b><button title="Tom +" aria-label="Tom meio tom acima">+</button><button title="Subir" aria-label="Subir música">↑</button><button title="Descer" aria-label="Descer música">↓</button><button title="Remover" aria-label="Remover música">✕</button>');
rep("js/share.js",'<button title="Apagar link">✕</button>','<button title="Apagar link" aria-label="Apagar link">✕</button>');
rep("js/state.js",'<b class="star" title="Favorita">','<b class="star" role="button" tabindex="0" aria-label="Favorita" aria-pressed="${s.fav?"true":"false"}" title="Favorita">');
rep("js/state.js",'d.querySelector(".star").onclick=e=>{e.stopPropagation();s.fav=!s.fav;s.updated=Date.now();if(s===S)$("fav").checked=!!s.fav;persist();lib()};',
 'const st=d.querySelector(".star"),tf=e=>{e.stopPropagation();s.fav=!s.fav;s.updated=Date.now();if(s===S)$("fav").checked=!!s.fav;persist();lib()};\n  st.onclick=tf;st.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();tf(e)}};');

/* ===== 2. Esc fecha só a camada do topo (agora em a11y.js) ===== */
const ESC="/* Esc é tratado em a11y.js: fecha só a camada do topo */";
rep("js/settings.js",'document.addEventListener("keydown",e=>{if(e.key==="Escape"){$("helpbox").hidden=true;$("swp").hidden=true;closeCfg()}});',ESC);
rep("js/stage.js",'document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("stage").hidden)closeStage()});',ESC);
rep("js/metronome.js",'document.addEventListener("keydown",e=>{if(e.key==="Escape")mToggle(false)});',ESC);

/* ===== 3. Desempenho ===== */
/* 3a. lib() com atraso ao salvar/digitar na busca */
rep("js/state.js",'const ok=persist();lib();HID=S.id;','const ok=persist();libSoon();HID=S.id;');
rep("js/state.js",'let FILT={fav:false,tag:"",sort:"title"};','let LD=null;const libSoon=(ms=250)=>{clearTimeout(LD);LD=setTimeout(lib,ms)};\nlet FILT={fav:false,tag:"",sort:"title"};');
rep("js/library.js",'$("q").oninput=lib;','$("q").oninput=()=>libSoon(120);');
/* 3b. índice de busca por música (texto normalizado e acordes só são recalculados quando a música muda) */
rep("js/state.js",'function matchSong(s,q){\n const p=parseQ(q);',
 `const SIX=new WeakMap();
function sIdx(s){
 const k=[s.title||"",s.artist||"",(s.tags||[]).join(" ")].concat((s.sections||[]).map(x=>x.text||"")).join("\\u0001");
 let c=SIX.get(s);
 if(!c||c.k!==k){const ly=lyr(s),nm=[s.title,s.artist,(s.tags||[]).join(" ")].join(" ");c={k,ly,nly:nz(ly),head:nz(nm),full:nz(nm+" "+ly),ch:songChords(s)};SIX.set(s,c)}
 return c;
}
let PQ={q:null,p:null};
function pq(q){if(PQ.q!==q){const p=parseQ(q);p.t=nz(p.txt.join(" ")).trim();PQ={q,p}}return PQ.p}
function matchSong(s,q){
 const p=pq(q),c=sIdx(s);`);
rep("js/state.js",'const cs=songChords(s);','const cs=c.ch;');
rep("js/state.js",'const t=nz(p.txt.join(" ")).trim();if(!t)return true;','const t=p.t;if(!t)return true;');
rep("js/state.js",'return nz([s.title,s.artist,(s.tags||[]).join(" "),lyr(s)].join(" ")).includes(t);','return c.full.includes(t);');
rep("js/state.js",'!nz((s.title||"")+" "+(s.artist||"")+" "+(s.tags||[]).join(" ")).includes(qn)','!sIdx(s).head.includes(qn)');
rep("js/state.js",'const ly=lyr(s),i=nz(ly).indexOf(qn);','const ly=sIdx(s).ly,i=sIdx(s).nly.indexOf(qn);');
/* 3c. guides() mede o DOM: roda só depois que a digitação para */
rep("js/render.js",'function guides(){','let GT=null;const guidesSoon=()=>{clearTimeout(GT);GT=setTimeout(()=>{try{guides()}catch(e){}},120)};\nfunction guides(){');
rep("js/render.js",'$("back2").hidden=!set;\n try{guides()}catch(e){}','$("back2").hidden=!set;\n guidesSoon();');

/* ===== 4. Contraste e cor ===== */
if(!/\/\* ---- a11y v2 ---- \*\//.test(rd("css/ux.css")||""))cache["css/ux.css"]=rd("css/ux.css")+`
/* ---- a11y v2 ---- */
/* texto secundário: #6b7280 sobre #f1f2f4 dava ~4,3:1 (abaixo do AA); #4f5666 dá ~6,6:1. O escuro continua definido em style.css */
:root{--mut:#4f5666}
.sheet:not(.stage) .art{color:#5f6672}
[role="dialog"]:focus,#stage:focus{outline:none}
/* impressão em preto e branco: acorde preto e grosso, letra cinza, para não depender do vermelho */
@media print and (monochrome){
 .sheet .c,.sheet .ch .l,.chart figcaption{color:#000!important;font-weight:800}
 .sheet .l{color:#444}
}
`;

/* ===== 5. Cache do service worker ===== */
rep("sw.js",'const V="cifras-v15"','const V="cifras-v16"');

if(errs.length){console.error("\nNADA foi gravado. Problemas:\n - "+errs.join("\n - "));process.exit(1)}
Object.keys(cache).forEach(f=>fs.writeFileSync(path.join(process.cwd(),f),cache[f]));
console.log("OK: "+Object.keys(cache).length+" arquivos atualizados ("+Object.keys(cache).join(", ")+").\nAgora copie js/a11y.js e tests/melhorias.test.js desta entrega e rode: node --test tests/*.test.js");
