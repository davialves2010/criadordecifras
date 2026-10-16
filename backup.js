/* js/backup.js — backup: lembrete a cada 30 dias e opção de baixar um arquivo ao sair da conta */
function backupAll(){PREFS.lastBackup=Date.now();savePrefs();out("minhas-cifras.json",{app:"cifras",version:2,songs:LIB.songs,sets:LIB.sets})}
function updBk(){
 $("pf-bk").checked=!!PREFS.autoBackup;
 $("bk-last").textContent=PREFS.lastBackup?"Último backup: "+new Date(PREFS.lastBackup).toLocaleDateString("pt-BR"):"Nenhum backup feito ainda.";
}
$("expAll").addEventListener("click",()=>{PREFS.lastBackup=Date.now();savePrefs();updBk()});
$("tmore").addEventListener("click",updBk);
$("pf-bk").onchange=()=>{PREFS.autoBackup=$("pf-bk").checked;savePrefs()};
const _outClick=$("m-out").onclick;
$("m-out").onclick=function(e){if(PREFS.autoBackup&&!$("m-out")._a)backupAll();return _outClick.call(this,e)};
function backupCheck(){
 if(!PREFS.lastBackup){PREFS.lastBackup=Date.now();savePrefs();return}
 const d=864e5,now=Date.now();
 if(LIB.songs.length>=3&&now-PREFS.lastBackup>30*d&&now-(PREFS.remindAt||0)>d){
  PREFS.remindAt=now;savePrefs();toast("Faz mais de 30 dias do seu último backup. Em Configurações, use “Exportar tudo”.");
 }
}
