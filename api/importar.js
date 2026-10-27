/* api/importar.js — função da Vercel: busca uma cifra num site conhecido e devolve só o texto.
   POST /api/importar  {url}  ->  {title, artist, text}
   Segurança: só HTTPS, só os sites da lista, sem redirecionar para fora dela, limite de tempo e de tamanho,
   limite de uso (por usuário, ou por IP se não der para identificar) e, se SUPABASE_URL e SUPABASE_KEY estiverem
   nas variáveis de ambiente da Vercel, só para quem está logado.
   Limites (podem ser trocados por variável): IMPORT_MAX_MIN (padrão 10 por minuto) e IMPORT_MAX_HORA (padrão 60 por hora). */
const {extrair}=require("./_extrair");
const hosts=()=>(process.env.IMPORT_HOSTS||"cifraclub.com.br,cifraclub.com,cifras.com.br").split(",").map(s=>s.trim().toLowerCase()).filter(Boolean);
const hostOk=h=>hosts().some(d=>h===d||h.endsWith("."+d));
function urlOk(s){
 let u;try{u=new URL(s)}catch(e){return null}
 if(u.protocol!=="https:"||u.username||u.password||(u.port&&u.port!=="443")||!hostOk(u.hostname.toLowerCase()))return null;
 return u;
}

/* ---- limite de uso ----
   1) em memória: barato, mas cada instância da Vercel tem a sua (vale como freio básico);
   2) no banco (função importar_limite, em supabase/fase1.sql): vale para todas as instâncias. Se ela não existir ou falhar, segue sem ela. */
const num=(v,d)=>{const n=parseInt(v,10);return n>0?n:d};
const maxMin=()=>num(process.env.IMPORT_MAX_MIN,10),maxHora=()=>num(process.env.IMPORT_MAX_HORA,60);
const uso=new Map();
/* devolve 0 se pode, ou quantos segundos esperar */
function limite(chave,agora=Date.now()){
 const a=(uso.get(chave)||[]).filter(t=>agora-t<36e5),min=a.filter(t=>agora-t<6e4);
 let espera=0;
 if(min.length>=maxMin())espera=Math.ceil((min[0]+6e4-agora)/1e3);
 else if(a.length>=maxHora())espera=Math.ceil((a[0]+36e5-agora)/1e3);
 if(espera>0){uso.set(chave,a);return Math.max(1,espera)}
 a.push(agora);uso.set(chave,a);
 if(uso.size>5000)for(const[k,v]of uso)if(!v.some(t=>agora-t<36e5))uso.delete(k);
 return 0;
}
const ipDe=req=>{const x=String((req.headers&&req.headers["x-forwarded-for"])||"").split(",")[0].trim();return x||(req.socket&&req.socket.remoteAddress)||"anon"};
async function dbLimite(auth){
 const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_KEY;
 if(!base||!key)return 0;
 try{
  const r=await fetch(base.replace(/\/$/,"")+"/rest/v1/rpc/importar_limite",{method:"POST",headers:{apikey:key,Authorization:auth,"Content-Type":"application/json"},body:"{}"});
  if(!r.ok||typeof r.json!=="function")return 0;
  const j=await r.json();return typeof j==="number"?j:0;
 }catch(e){return 0}
}

/* quem está chamando: {ok, id}. Sem as variáveis do Supabase não dá para conferir (veja NOVIDADES.md) */
async function quem(auth){
 const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_KEY;
 if(!base||!key)return{ok:true,id:null};
 if(!/^Bearer\s+\S+$/.test(auth||""))return{ok:false};
 try{
  const r=await fetch(base.replace(/\/$/,"")+"/auth/v1/user",{headers:{apikey:key,Authorization:auth}});
  if(!r.ok)return{ok:false};
  let id=null;try{const j=await r.json();id=(j&&j.id)||null}catch(e){}
  return{ok:true,id};
 }catch(e){return{ok:false}}
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
 const espere=w=>{res.setHeader("Retry-After",String(w));return send(429,{error:"Muitas importações em pouco tempo. Tente de novo em "+(w>90?Math.ceil(w/60)+" min":w+" s")+"."})};
 if(req.method!=="POST")return send(405,{error:"Use POST."});
 const q=await quem(req.headers.authorization);
 if(!q.ok)return send(401,{error:"Entre na sua conta para importar de um link."});
 let b=req.body;if(typeof b==="string"){try{b=JSON.parse(b)}catch(e){b=null}}
 const u=urlOk(b&&b.url);
 if(!u)return send(400,{error:"Endereço não aceito. Sites aceitos: "+hosts().join(", ")+" (o link precisa começar com https://)."});
 /* o limite só conta pedidos com endereço válido */
 const w=limite(q.id?"u:"+q.id:"ip:"+ipDe(req));
 if(w)return espere(w);
 if(q.id){const w2=await dbLimite(req.headers.authorization);if(w2>0)return espere(w2)}
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
module.exports.limite=limite;
module.exports._reset=()=>uso.clear();
