#!/usr/bin/env node
/* Uso (na raiz do projeto):  node aplicar-mobile.js
   Acrescenta ao fim de css/ux.css as regras de celular. Pode rodar de novo sem duplicar. */
const fs=require("fs"),path=require("path");
const f=path.join(process.cwd(),"css","ux.css");
let s=fs.readFileSync(f,"utf8");
if(s.includes("/* ---- mobile v2 ---- */")){console.log("Já aplicado.");process.exit(0)}
s+=`
/* ---- mobile v2 ---- */
@media(max-width:860px){
 .top{gap:6px;padding:8px 12px}

 /* Tela da música: barra de ações em grade (antes eram botões de 16px quebrando em 4 linhas) */
 .songbar{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-bottom:10px}
 .songbar .sbsp{display:none}
 .songbar button,.songbar #pdf,.songbar #golink,.songbar #gonote{width:100%;min-height:46px;padding:8px 6px;font-size:14px;line-height:1.2;white-space:normal;text-align:center}
 .songbar #gohome,.songbar #goback{grid-column:span 3;order:1}
 .songbar #stg0{grid-column:span 3;order:2;font-size:16px;font-weight:700}
 .songbar #print,.songbar #pdf,.songbar #gonote{grid-column:span 2;order:3}
 .songbar #goedit,.songbar #more2{grid-column:span 3;order:4}
 .songbar #golink{grid-column:1/-1;order:5}

 /* Barra de tom e opções: sem rolagem lateral, não gruda no topo (comia a tela) */
 .vbar{position:static;padding:10px;gap:8px;margin-bottom:10px}
 .vbar .vg{gap:6px}
 body[data-v] .vbar .vg:first-child{display:grid;grid-template-columns:auto 48px minmax(0,1fr) 48px;align-items:center;flex:1 1 100%}
 body[data-v] .vbar .vg:first-child button,body[data-v] .vbar .vg:first-child select{width:100%;min-height:46px;padding:6px 8px;font-size:16px}
 body[data-v] .vbar .vg:first-child #rs{grid-column:1/-1;font-size:14px}
 #shift{display:none}
 .vbar .vg:has(#moreopt),.vbar .vg:has(#laybtn){flex:1 1 calc(50% - 8px)}
 .vbar #moreopt,.vbar #laybtn{width:100%;min-height:44px;white-space:normal;line-height:1.2}
 .vbar.open .adv{flex:1 1 calc(50% - 8px)}
 .vbar .adv button{width:100%;min-height:44px}
 .layp{gap:10px}
 .layp .vg{flex:1 1 100%;justify-content:space-between}

 /* Editor de seções e repertório: alvos de toque maiores, menos texto apertado */
 .card .pv{display:none}
 .card .ch{padding:6px 8px}
 .card .acts{gap:0;margin-left:auto}
 .card .acts button{min-width:38px;min-height:38px;padding:4px;font-size:16px}
 .sit{gap:6px}
 .sit .n{flex:1 1 calc(100% - 40px);white-space:normal}
 .sit button{min-width:42px;min-height:42px}
 .sit b{min-width:40px}
 .homehd{gap:8px}
 .bar button{min-height:44px}
}
`;
fs.writeFileSync(f,s);console.log("OK: regras de celular acrescentadas a css/ux.css. Recarregue o site (se o app estiver instalado, feche e abra de novo).");
