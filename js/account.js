/* js/account.js — Sincronizar, sair, excluir conta e inicialização do login */
$("m-sync").onclick=()=>syncNow(true);
$("m-out").onclick=async()=>{
 await push();
 if(SYNCERR&&!armed($("m-out"))){msg("Há alterações que não foram sincronizadas. Exporte um backup (⋯ → Exportar tudo) ou clique de novo para sair mesmo assim.");return}
 try{localStorage.removeItem(LKEY)}catch(e){}
 await sb.auth.signOut();location.reload();
};
$("m-del").onclick=async()=>{
 if(!armed($("m-del"))){msg("Clique de novo para excluir sua conta e TODAS as cifras na nuvem. Não dá para desfazer. Antes, exporte um backup se quiser guardar.");return}
 const{error}=await sb.rpc("delete_my_account");
 if(error){msg("Não foi possível excluir a conta: "+error.message);return}
 try{localStorage.removeItem(LKEY)}catch(e){}
 await sb.auth.signOut();location.reload();
};
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&USER)syncNow()});
addEventListener("online",()=>{if(USER)syncNow()});
setInterval(()=>{if(USER&&!document.hidden)syncNow()},60000);
(async()=>{
 if(!window.supabase){$("aload").textContent="Não foi possível carregar o serviço de login. Verifique sua conexão e recarregue a página.";return}
 if(!CONFIGURED){$("aload").innerHTML="⚙️ Falta configurar o Supabase. Abra o <b>index.html</b> e preencha <b>SUPABASE_URL</b> e <b>SUPABASE_KEY</b> no início do script (veja o README).";return}
 sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 const sid=new URLSearchParams(location.search).get("share");
 if(sid){const{data:d}=await sb.rpc("get_share",{p_id:sid});if(d&&d.songs)showShare(d);else toast("Link inválido ou removido.")}
 sb.auth.onAuthStateChange((ev,session)=>{
  if(ev==="PASSWORD_RECOVERY"){RECOV=true;document.documentElement.classList.add("locked");showForm();setA("rec");return}
  if(session&&!RECOV)startSession(session.user);
 });
 const{data}=await sb.auth.getSession();
 if(data.session&&!RECOV)startSession(data.session.user);
 else if(!data.session&&!RECOV)showForm();
})();
