/* js/modes.js — Barra de visualização, modo Cartões/Texto e botões de partes */
/* ---- barra de visualização ---- */
document.querySelectorAll("[data-cols]").forEach(b=>b.onclick=()=>{S.cols=+b.dataset.cols;save();preview()});
document.querySelectorAll("[data-ori]").forEach(b=>b.onclick=()=>{S.ori=b.dataset.ori;save();preview()});
$("msel").onchange=()=>{S.mar=$("msel").value;save();preview()};
$("fup").onclick=()=>{S.fs=Math.min(150,(S.fs||100)+10);save();preview()};
$("fdn").onclick=()=>{S.fs=Math.max(70,(S.fs||100)-10);save();preview()};
$("deg").onclick=()=>{S.degrees=!S.degrees;save();preview()};
/* ---- modo cartões / texto + partes ---- */
function setMode(m){
 MODE=m;document.querySelectorAll("[data-md]").forEach(b=>b.classList.toggle("on",b.dataset.md===m));
 $("cardsbox").hidden=m!=="cards";$("txtbox").hidden=m!=="text";$("paste").style.display=m==="cards"?"":"none";
 if(m==="text")$("ttxt").value=ser(S.sections);else editor();
}
document.querySelectorAll("[data-md]").forEach(b=>b.onclick=()=>setMode(b.dataset.md));
$("ttxt").oninput=()=>{S.sections=parse($("ttxt").value);save();preview()};
const PARTS=["Introdução","Estrofe","Pré-refrão","Refrão","Ponte","Solo","Interlúdio","Final"];
$("parts").innerHTML=PARTS.map(n=>`<button>+ ${n}</button>`).join("")+`<button>+ Nova parte</button>`;
[...$("parts").children].forEach((b,i)=>b.onclick=()=>{
 const n=PARTS[i]||"Parte";
 if(MODE==="text"){const ta=$("ttxt"),pre=ta.value.slice(0,ta.selectionStart||0);ins(ta,(!pre?"":/\n\n$/.test(pre)?"":pre.endsWith("\n")?"\n":"\n\n")+"["+n+"]\n",0)}
 else{const ns={name:n,text:""};S.sections.push(ns);OPENS.add(ns);all()}
});
