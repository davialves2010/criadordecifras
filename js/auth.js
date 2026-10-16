/* js/auth.js — Tela de login: entrar, criar conta, recuperar senha, Google */
/* ===== LOGIN OBRIGATÓRIO + SINCRONIZAÇÃO (Supabase) ===== */
const CONFIGURED=/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)/i.test(SUPABASE_URL)&&SUPABASE_KEY.length>40;
let CONF=0,AMODE="in",BOOT=false,RECOV=false,PT=null,PUSHING=false,AGAIN=false,BUSY=false,SYNCERR=null;
const aerr=m=>{const e=$("amsg");e.textContent=m||"";e.hidden=!m};
const ERRS={"Invalid login credentials":"E-mail ou senha incorretos.","User already registered":"Este e-mail já tem conta. Use a aba Entrar.","Email not confirmed":"Confirme seu e-mail antes de entrar (veja a caixa de entrada e o spam).","New password should be different from the old password.":"A nova senha precisa ser diferente da anterior."};
const trErr=m=>ERRS[m]||(/rate limit|too many/i.test(m||"")?"Muitas tentativas. Aguarde alguns minutos e tente de novo.":(m||"Algo deu errado. Tente de novo."));
function showForm(){$("aload").hidden=true;$("aform").hidden=false}
function setA(m){
 AMODE=m;document.querySelectorAll("[data-a]").forEach(b=>b.classList.toggle("on",b.dataset.a===m));
 const rec=m==="rec",up=m==="up";
 $("aseg").hidden=rec;$("gbtn").hidden=rec;$("aor").hidden=rec;$("aemail-w").hidden=rec;$("aconf-w").hidden=!(up||rec);$("aforgot").hidden=m!=="in";
 $("apass").autocomplete=m==="in"?"current-password":"new-password";
 $("asubmit").textContent=rec?"Salvar nova senha":up?"Criar conta":"Entrar";
 $("atitle").textContent=rec?"Defina uma nova senha":up?"Crie sua conta para guardar suas cifras":"Entre para guardar suas cifras na nuvem";
 aerr("");
}
document.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>setA(b.dataset.a));
["aemail","apass","aconf"].forEach(id=>$(id).addEventListener("keydown",e=>{if(e.key==="Enter")$("asubmit").click()}));
$("asubmit").onclick=async()=>{
 aerr("");const email=$("aemail").value.trim(),pw=$("apass").value;
 if(AMODE!=="rec"&&!/^\S+@\S+\.\S+$/.test(email)){aerr("Digite um e-mail válido.");return}
 if(pw.length<8){aerr("A senha precisa ter pelo menos 8 caracteres.");return}
 if((AMODE==="up"||AMODE==="rec")&&pw!==$("aconf").value){aerr("As senhas não conferem.");return}
 const bt=$("asubmit");bt.disabled=true;
 try{
  if(AMODE==="in"){const{error}=await sb.auth.signInWithPassword({email,password:pw});if(error)throw error}
  else if(AMODE==="up"){
   const{data,error}=await sb.auth.signUp({email,password:pw,options:{emailRedirectTo:location.origin+location.pathname}});if(error)throw error;
   if(!data.session){setA("in");$("aemail").value=email;aerr("Conta criada! Enviamos um e-mail de confirmação. Clique no link e depois entre.")}
  }else{
   const{error}=await sb.auth.updateUser({password:pw});if(error)throw error;
   try{history.replaceState(null,"",location.pathname)}catch(e){}
   RECOV=false;
   if(USER)document.documentElement.classList.remove("locked");
   else{const{data}=await sb.auth.getSession();if(data.session)startSession(data.session.user)}
  }
 }catch(e){aerr(trErr(e.message))}finally{bt.disabled=false}
};
$("aforgot").onclick=async()=>{
 const email=$("aemail").value.trim();
 if(!/^\S+@\S+\.\S+$/.test(email)){aerr("Digite seu e-mail acima e clique de novo.");return}
 const{error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
 aerr(error?trErr(error.message):"Se este e-mail tiver conta, enviamos um link para redefinir a senha.");
};
$("gbtn").onclick=async()=>{aerr("");const{error}=await sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+location.pathname}});if(error)aerr(trErr(error.message))};
