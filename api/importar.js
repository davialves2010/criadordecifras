/* api/importar.js — função da Vercel: busca uma cifra num site conhecido e devolve só o texto.
   POST /api/importar  {url}  ->  {title, artist, text}
   Segurança: só HTTPS, só os sites da lista, sem redirecionar para fora dela, limite de tempo e de tamanho,
   e (se SUPABASE_URL e SUPABASE_KEY estiverem nas variáveis de ambiente da Vercel) só para quem está logado. */
const {extrair}=require("./_extrair");
const hosts=()=>(process.env.IMPORT_HOSTS||"cifraclub.com.br,cifraclub.com,cifras.com.br").split(",").map(s=>s.trim().toLowerCase()).filter(Boolean);
const hostOk=h=>hosts().some(d=>h===d||h.endsWith("."+d));
function urlOk(s){
 let u;try{u=new URL(s)}catch(e){return null}
 if(u.protocol!=="https:"||u.username||u.password||(u.port&&u.port!=="443")||!hostOk(u.hostname.toLowerCase()))return null;
 return u;
}
async function logado(auth){
 const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_KEY;
 if(!base||!key)return true; /* sem as variáveis, não dá para conferir (veja NOVIDADES.md) */
 if(!/^Bearer\s+\S+$/.test(auth||""))return false;
 try{const r=await fetch(base.replace(/\/$/,"")+"/auth/v1/user",{headers:{apikey:key,Authorization:auth}});return r.ok}catch(e){return false}
}
async function baixar(u){
 const ac=new AbortController(),t=setTimeout(()=>ac.abort(),9000);
 try{
  let cur=u;
  for(let i=0;i<4;i++){
   const r=await fetch(cur.href,{redirect:"manual",signal:ac.signal,headers:{"User-Agent":"MontadorDeCifras/1.0 (importacao pedida pelo usuario)",Accept:"text/html"}});
   if(r.status>=300&&r.status<400){
    const loc=r.headers.get("location"),n=loc&&urlOk(new URL(loc,cur).href);
    if(!n){const e=new Error("redirect");e.code="redirect";throw e}
    cur=n;continue;
   }
   if(!r.ok){const e=new Error("http "+r.status);e.code=r.status===403||r.status===429||r.status===503?"blocked":"http";throw e}
   if(!/text\/html/i.test(r.headers.get("content-type")||"")){const e=new Error("tipo");e.code="tipo";throw e}
   const buf=await r.arrayBuffer();
   if(buf.byteLength>2e6){const e=new Error("grande");e.code="grande";throw e}
   return new TextDecoder("utf-8").decode(buf);
  }
  const e=new Error("redirects");e.code="redirect";throw e;
 }finally{clearTimeout(t)}
}
module.exports=async(req,res)=>{
 res.setHeader("Cache-Control","no-store");
 const send=(c,o)=>res.status(c).json(o);
 if(req.method!=="POST")return send(405,{error:"Use POST."});
 if(!(await logado(req.headers.authorization)))return send(401,{error:"Entre na sua conta para importar de um link."});
 let b=req.body;if(typeof b==="string"){try{b=JSON.parse(b)}catch(e){b=null}}
 const u=urlOk(b&&b.url);
 if(!u)return send(400,{error:"Endereço não aceito. Sites aceitos: "+hosts().join(", ")+" (o link precisa começar com https://)."});
 let html;
 try{html=await baixar(u)}
 catch(e){
  if(e.code==="blocked")return send(502,{error:"O site bloqueou o acesso automático. Abra a cifra no site, copie o texto e cole aqui."});
  if(e.code==="redirect"||e.code==="tipo"||e.code==="grande")return send(502,{error:"Esse link não parece uma página de cifra."});
  return send(502,{error:"Não consegui abrir esse link agora. Tente de novo ou copie e cole o texto."});
 }
 const r=extrair(html);
 if(!r)return send(422,{error:"Não encontrei a cifra nessa página. Copie o texto no site e cole aqui."});
 return send(200,r);
};
module.exports.urlOk=urlOk;
