/* api/_extrair.js — tira título, artista e texto da cifra de uma página HTML. (O "_" no nome faz a Vercel não tratar como rota.) */
const ENT={amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" ",ordm:"º",ordf:"ª",hellip:"…",ndash:"–",mdash:"—",lsquo:"‘",rsquo:"’",ldquo:"“",rdquo:"”",deg:"°"};
/* letras acentuadas do português: &aacute; &Atilde; &ccedil; ... */
for(const[b,l]of Object.entries({a:"aacute agrave acirc atilde auml aring",e:"eacute egrave ecirc euml",i:"iacute igrave icirc iuml",o:"oacute ograve ocirc otilde ouml",u:"uacute ugrave ucirc uuml",c:"ccedil",n:"ntilde"})){
 const chars={a:"áàâãäå",e:"éèêë",i:"íìîï",o:"óòôõö",u:"úùûü",c:"ç",n:"ñ"}[b];
 l.split(" ").forEach((nm,i)=>{ENT[nm]=chars[i];ENT[nm[0].toUpperCase()+nm.slice(1)]=chars[i].toUpperCase()});
}
const dec=s=>s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,(m,e)=>{
 if(e[0]==="#"){const n=e[1].toLowerCase()==="x"?parseInt(e.slice(2),16):parseInt(e.slice(1),10);try{return String.fromCodePoint(n)}catch(x){return m}}
 const v=ENT[e]!==undefined?ENT[e]:ENT[e.toLowerCase()];return v===undefined?m:v;
});
const tx=h=>dec(h.replace(/<br\s*\/?>/gi,"\n").replace(/<\/(p|div|li)>/gi,"\n").replace(/<[^>]+>/g,""));
function extrair(html){
 html=String(html||"");
 const pres=[...html.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi)].map(m=>tx(m[1]).replace(/\r/g,"").replace(/[ \t]+$/gm,"").replace(/^\n+|\s+$/g,""));
 pres.sort((a,b)=>b.length-a.length);
 const text=pres[0]||"";
 if(text.length<20)return null;
 const first=re=>{const m=html.match(re);return m?tx(m[1]).replace(/\s+/g," ").trim():""};
 let title=first(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i),artist=first(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
 if(!title){
  /* "Música - Artista - Cifra Club" no <title> */
  let t=first(/<title\b[^>]*>([\s\S]*?)<\/title>/i).replace(/\s*[-–|]\s*cifra(s| club)?\b.*$/i,"").replace(/\s*\(cifra[^)]*\)\s*/i," ").trim();
  const p=t.split(/\s+[-–]\s+/);title=p[0].trim();if(!artist&&p[1])artist=p.slice(1).join(" - ").trim();
 }
 return{title:title.slice(0,120),artist:artist.slice(0,120),text:text.slice(0,60000)};
}
module.exports={extrair,dec};
