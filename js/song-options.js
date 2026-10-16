/* js/song-options.js — Imprimir, capotraste e quadro de acordes */
$("print").onclick=()=>window.print();
$("capo").oninput=()=>{S.capo=Math.max(0,Math.min(11,parseInt($("capo").value)||0));save();preview()};
$("capoS").onchange=()=>{S.capoShapes=$("capoS").checked;save();preview()};
$("chart").onchange=()=>{S.chart=$("chart").checked;save();preview()};
