/* js/welcome.js — guia de início para quem chega pela primeira vez */
function showWelcome(){$("welcome").hidden=!!PREFS.hideWelcome}
$("wx").onclick=()=>{PREFS.hideWelcome=1;savePrefs();showWelcome()};
$("w-paste").onclick=()=>{tab("edit");setMode("cards");$("paste").click();$("pbox").scrollIntoView({behavior:"smooth",block:"center"})};
$("w-new").onclick=()=>$("new").click();
$("w-imp").onclick=()=>$("imp").click();
$("m-guide").onclick=()=>{PREFS.hideWelcome=0;savePrefs();closeCfg();showWelcome();tab("edit");setM("edit");scrollTo(0,0)};
showWelcome();
