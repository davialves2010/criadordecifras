/* js/welcome.js — guia de início e escolha do tema na primeira vez */
function showWelcome(){$("welcome").hidden=!!PREFS.hideWelcome}
$("wx").onclick=()=>{PREFS.hideWelcome=1;savePrefs();showWelcome()};
$("w-paste").onclick=()=>{$("new").click();setMode("cards");$("paste").click();$("pbox").scrollIntoView({behavior:"smooth",block:"center"})};
$("w-new").onclick=()=>$("new").click();
$("w-imp").onclick=()=>$("imp").click();
$("m-guide").onclick=()=>{PREFS.hideWelcome=0;savePrefs();closeCfg();showWelcome();go("home")};
showWelcome();
function setTheme(v){thi=Math.max(0,TH.indexOf(v));try{localStorage.setItem("cifras_theme",TH[thi])}catch(x){}applyTheme();$("thbox").hidden=true}
$("th-l").onclick=()=>setTheme("light");$("th-d").onclick=()=>setTheme("dark");$("th-a").onclick=()=>setTheme("");
function askTheme(){let s=null;try{s=localStorage.getItem("cifras_theme")}catch(e){}if(s===null)$("thbox").hidden=false}
