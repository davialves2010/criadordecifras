/* js/organize.js — biblioteca grande: ordenação das músicas e busca ao adicionar no repertório */
FILT.sort=PREFS.sort||"title";
$("sortsel").value=FILT.sort;
$("sortsel").onchange=()=>{FILT.sort=$("sortsel").value;PREFS.sort=FILT.sort;savePrefs();lib()};
$("saq").oninput=sets;
$("saq").onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();$("saddb").click();$("saq").select()}};
lib();
