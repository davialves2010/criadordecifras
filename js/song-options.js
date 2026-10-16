/* js/song-options.js — Imprimir, capotraste e quadro de acordes */
$("print").onclick=()=>window.print();
$("capo").oninput=()=>{S.capo=Math.max(0,Math.min(11,parseInt($("capo").value)||0));save();preview()};
$("capoS").onchange=()=>{S.capoShapes=$("capoS").checked;save();preview()};
$("chart").onchange=()=>{S.chart=$("chart").checked;save();preview()};

/* ---- capotraste sugerido: escolhe a casa com mais acordes "abertos" (sem pestana) ---- */
function capoSuggest(){
 PREFER=S.acc||null;const t=S.shift||0,cs=[];
 S.sections.forEach(s=>(s.text.match(/\[[^\]]+\]/g)||[]).forEach(m=>cs.push(m.slice(1,-1))));
 if(!cs.length)return null;
 const sc=c=>cs.filter(x=>{const h=shape(tcr(x,t-c));return h&&h.b===0}).length;
 let best=0,bs=sc(0);const base=bs;
 for(let c=1;c<=7;c++){const v=sc(c);if(v>bs){bs=v;best=c}}
 return{capo:best,score:bs,base,total:cs.length,shapes:[...new Set(cs.map(x=>tcr(x,t-best)))]};
}
$("capos").onclick=()=>{
 const r=capoSuggest();if(!r){msg("Adicione acordes à música primeiro.");return}
 if(!r.capo){msg("Sem capotraste já está bom: "+r.base+" de "+r.total+" acordes são abertos.");return}
 if(S.capo===r.capo&&S.capoShapes){msg("O capotraste sugerido (casa "+r.capo+") já está aplicado.");return}
 if(confirm("Sugestão: capotraste na "+r.capo+"ª casa, tocando "+r.shapes.join(" ")+".\nAcordes abertos: "+r.score+" de "+r.total+" (hoje: "+r.base+").\n\nAplicar?")){
  S.capo=r.capo;S.capoShapes=true;fields();save();preview();
 }
};
