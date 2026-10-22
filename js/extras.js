/* js/extras.js — Duração e link da música, anotações pessoais, pedal, rolagem e importação por favorito */
/* ---- duração e link (YouTube/Spotify) ---- */
$("dur").oninput=()=>{S.dur=$("dur").value.trim();save();preview()};
$("link").oninput=()=>{S.link=$("link").value.trim();save();updLink()};
function updLink(){
 const b=$("golink"),u=(S.link||"").trim(),ok=/^https?:\/\//i.test(u);
 b.hidden=!ok;
 if(ok){let h="";try{h=new URL(u).hostname.replace(/^www\./,"")}catch(e){}b.textContent=/youtu/i.test(h)?"▶ YouTube":/spotify/i.test(h)?"🎧 Spotify":"🎧 Ouvir"}
}
$("golink").onclick=()=>{const u=(S.link||"").trim();if(/^https?:\/\//i.test(u))window.open(u,"_blank","noopener,noreferrer")};
/* chamada por fields() sempre que a música muda */
function onFields(){updLink();$("gonote").textContent=S.myNotes&&String(S.myNotes).trim()?"📝 Anotações •":"📝 Anotações"}

/* ---- anotações pessoais: só você vê; não vão em links; sobrevivem a "seguir" e a "equipe" ---- */
$("gonote").onclick=()=>{$("notetxt").value=S.myNotes||"";$("notebox").hidden=false;$("notetxt").focus()};
$("notesave").onclick=()=>{
 const v=$("notetxt").value.trim();
 if(v)S.myNotes=v;else delete S.myNotes;
 save();preview();onFields();$("notebox").hidden=true;toast("Anotações salvas.");
};
$("noteclose").onclick=()=>{$("notebox").hidden=true};
$("notebox").onclick=e=>{if(e.target===$("notebox"))$("notebox").hidden=true};

/* botões novos ficam junto de Imprimir na barra da música */
$("print").after($("pdf"),$("golink"),$("gonote"));

/* ---- preferências: pedal e rolagem do palco ---- */
SMODE=PREFS.smode||"manual";BPL=PREFS.bpl||2;
$("smode").value=SMODE;$("sbpl").value=String(BPL);updSmode();
$("pf-pedal").onchange=()=>{PREFS.pedal=$("pf-pedal").value;savePrefs()};
["tmore","mcfg"].forEach(id=>$(id).addEventListener("click",()=>{$("pf-pedal").value=PREFS.pedal||"song"}));
$("pf-pedal").value=PREFS.pedal||"song";

/* ---- importar de um site de cifras: favorito que copia a cifra da página aberta ---- */
const BKM="javascript:(function(){var s=(getSelection()+'').trim();if(!s){var p=[].slice.call(document.querySelectorAll('pre')).sort(function(a,b){return b.innerText.length-a.innerText.length})[0];s=p?p.innerText:''}if(!s){alert('Não achei a cifra nesta página. Selecione o texto da cifra e toque no favorito de novo.');return}var o=document.title+'\\n\\n'+s;(navigator.clipboard?navigator.clipboard.writeText(o):Promise.reject()).then(function(){alert('Cifra copiada! Volte ao Montador de Cifras e use Colar cifra.')},function(){prompt('Copie o texto abaixo:',o)})})();";
$("bkm").href=BKM;
$("bkm").onclick=e=>{e.preventDefault();toast("Arraste este botão para a barra de favoritos do navegador.")};
$("bkmcopy").onclick=async()=>{try{await navigator.clipboard.writeText(BKM);toast("Código copiado. Crie um favorito e cole no campo do endereço.")}catch(e){prompt("Copie o código:",BKM)}};
/* se a pessoa colar um endereço (URL) em vez do texto da cifra */
$("ptxt").addEventListener("input",()=>{$("purlhint").hidden=!/^\s*https?:\/\/\S+\s*$/.test($("ptxt").value)});
