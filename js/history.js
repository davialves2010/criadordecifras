/* js/history.js — Desfazer / refazer */
/* ---- histórico (desfazer/refazer) ---- */
function snapStr(sg){return JSON.stringify(sg,(k,v)=>k==="updated"?undefined:v)}
function hist(){return HIST[S.id]||(HIST[S.id]={a:[snapStr(S)],i:0})}
function snap(){HT=null;const sg=songBy(HID);if(!sg)return;const s=snapStr(sg),h=HIST[HID]||(HIST[HID]={a:[s],i:0});
 if(h.a[h.i]!==s){h.a=h.a.slice(0,h.i+1);h.a.push(s);if(h.a.length>80)h.a.shift();h.i=h.a.length-1}updUndo()}
function updUndo(){const h=HIST[S.id];$("undo").disabled=!h||(h.i<=0&&!HT);$("redo").disabled=!h||h.i>=h.a.length-1}
function restore(str){
 const open=S.sections.map(s=>OPENS.has(s)),o=JSON.parse(str);
 Object.keys(S).forEach(k=>delete S[k]);Object.assign(S,o);S.updated=Date.now();
 S.sections.forEach((s,i)=>{if(open[i])OPENS.add(s)});
 persist();fields();editor();preview();if(MODE==="text")$("ttxt").value=ser(S.sections);lib();updUndo();
}
function undo(){if(HT){clearTimeout(HT);snap()}const h=hist();if(h.i>0){h.i--;restore(h.a[h.i])}}
function redo(){if(HT){clearTimeout(HT);snap()}const h=hist();if(h.i<h.a.length-1){h.i++;restore(h.a[h.i])}}
$("undo").onclick=undo;$("redo").onclick=redo;
document.addEventListener("keydown",e=>{
 if(!(e.ctrlKey||e.metaKey)||/INPUT|TEXTAREA|SELECT/.test((e.target.tagName||"")))return;
 const k=e.key.toLowerCase();
 if(k==="z"&&!e.shiftKey){e.preventDefault();undo()}else if(k==="y"||(k==="z"&&e.shiftKey)){e.preventDefault();redo()}
});
