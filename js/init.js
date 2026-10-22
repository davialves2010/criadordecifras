/* js/init.js — Etiquetas, favorita e primeira renderização da interface */
$("tags").oninput=()=>{S.tags=$("tags").value.split(",").map(x=>x.trim()).filter(Boolean);save()};
$("fav").onchange=()=>{S.fav=$("fav").checked;save()};
fields();all();setM("edit");
