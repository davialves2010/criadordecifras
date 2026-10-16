/* js/importer.js — Colar cifra: reconhecimento de acordes/seções e conversão texto ⇄ cartões */
const CH=/^[A-G][#b]?(?:maj|min|dim|aug|m|M|°|º|\+|-)?(?:[0-9]{1,2}|[#b+-][0-9]{1,2}|maj|M|sus[24]?|add[0-9]{1,2}|dim|aug|\([^)]*\))*(?:\/[A-G][#b]?)?$/;
const SKIP=/^(\||\|\||:\|\||\|\|:|:|-|–|x\d+|\d+x|\(?\d+x\)?)$/i;
const nb=x=>x.replace(/\{[^}]*\}$/,"");
const nt=x=>{const m=x.match(/\{([^}]*)\}$/);return m?m[1].replace(/_/g," "):""};
const isChordLine=l=>{const t=l.trim().split(/\s+/).filter(Boolean);return t.length>0&&t.some(x=>CH.test(nb(x)))&&t.every(x=>CH.test(nb(x))||SKIP.test(x))};
const HEAD=/^\[?\s*(intro(dução|ducao)?|estrofe|verso|refr[aã]o|coro|ponte|pr[eé][- ]?refr[aã]o|final|solo|interl[uú]dio|outro|tag)\b[^\n]{0,20}?\]?\s*:?\s*$/i;
const BH=/^\[([^\]]+)\]\s*((?:\d+\s*x|x\s*\d+))?\s*$/i;
const isHdr=l=>{const t=l.trim(),m=t.match(BH);return(!!m&&!CH.test(m[1].trim()))||(!isChordLine(t)&&HEAD.test(t))};
const IH=/^\s*\[?\s*(intro(?:dução|ducao)?|solo|interl[uú]dio|final|ponte|refr[aã]o|estrofe|coro|outro)\s*(\(?\s*(?:\d+\s*x|x\s*\d+)\s*\)?)?\s*\]?\s*[:\-]?\s*(\S.*)$/i;
const hn=n=>{let rep="";const r2=n.match(/\(?\s*(\d+\s*x|x\s*\d+)\s*\)?\s*$/i);if(r2){rep=r2[1].replace(/\s/g,"");n=n.replace(r2[0],"").trim()||n}return{name:n[0].toUpperCase()+n.slice(1),rep}};
/* "( G9 C/E )" -> chama de linha de acordes, trocando os parênteses por espaços (mantém o alinhamento) */
const fixParen=l=>{if(!/[()]/.test(l))return l;const l2=l.replace(/\S+/g,t=>/\(/.test(t)&&/\)/.test(t)?t:t.replace(/[()]/g," "));return isChordLine(l2)&&!isChordLine(l)?l2:l};
function conv(chordL,lyric){
 let res=lyric.replace(/\t/g,"    ");
 const pos=[];chordL.replace(/\t/g,"    ").replace(/\S+/g,(m,i)=>{if(CH.test(nb(m)))pos.push([i,m])});
 pos.reverse().forEach(([i,m])=>{if(res.length<i)res=res.padEnd(i," ");const n=nt(m);res=res.slice(0,i)+"["+nb(m)+"]"+(n?"{"+n+"}":"")+res.slice(i)});
 return res.replace(/\s+$/,"");
}
function chordOnly(l){return l.trim().split(/\s+/).map(x=>{if(CH.test(nb(x))){const n=nt(x);return "["+nb(x)+"]"+(n?"{"+n+"}":"")}return x}).join(" ")}
function parse(txt){
 const L=txt.replace(/\r/g,"").split("\n").map(fixParen),secs=[];let cur=null;
 const flush=()=>{if(cur&&(cur.lines.length||cur.note||cur.name)){
  const co=cur.lines.length>0&&cur.lines.every(x=>/^[\s|:\[\]\-x\d]*$/.test(x.replace(/\[[^\]]+\]|\{[^}]*\}/g,"")));
  const s={name:cur.name||(co&&!secs.length?"Introdução":"Estrofe"),text:cur.lines.join("\n")};
  if(cur.rep)s.rep=cur.rep;if(cur.note)s.note=cur.note;secs.push(s)}cur=null};
 for(let i=0;i<L.length;i++){
  const l=L[i];
  if(!l.trim()){if(cur&&cur.name&&!cur.lines.length&&!cur.note)continue;flush();continue}
  const ib=l.match(/^\s*\[([^\]\n]+)\]\s*(?:[:\-]\s*)?(\S.*)$/);
  if(ib&&!CH.test(ib[1].trim())&&isChordLine(ib[2])){flush();const h=hn(ib[1].trim());cur={name:h.name,rep:h.rep,lines:[chordOnly(ib[2])],note:""};continue}
  const ih=l.match(IH);
  if(ih&&isChordLine(ih[3])){flush();cur={name:ih[1][0].toUpperCase()+ih[1].slice(1).toLowerCase(),rep:(ih[2]||"").replace(/[\s()]/g,""),lines:[chordOnly(ih[3])],note:""};continue}
  if(isHdr(l)){
   flush();const t=l.trim(),m=t.match(BH);let name,rep="";
   if(m&&!CH.test(m[1].trim())){name=m[1].trim();rep=(m[2]||"").replace(/\s/g,"")}
   else name=t.replace(/[\[\]:]/g,"").trim();
   const r2=name.match(/\(?\s*(\d+\s*x|x\s*\d+)\s*\)?\s*$/i);if(r2){rep=r2[1].replace(/\s/g,"");name=name.replace(r2[0],"").trim()||name}name=name[0].toUpperCase()+name.slice(1);cur={name,rep,lines:[],note:""};continue}
  if(!cur)cur={name:null,rep:"",lines:[],note:""};
  if(/^>\s?/.test(l)){cur.note=(cur.note?cur.note+" ":"")+l.replace(/^>\s?/,"").trim();continue}
  if(isChordLine(l)){
   const n=L[i+1];
   if(n!==undefined&&n.trim()&&!isChordLine(n)&&!isHdr(n)&&!/^>/.test(n)){cur.lines.push(conv(l,n));i++}
   else cur.lines.push(chordOnly(l));
  }else cur.lines.push(l.replace(/\s+$/,""));
 }
 flush();return secs;
}
function ser(secs){
 return secs.map(s=>{
  const out=["["+s.name+"]"+(s.rep?" "+s.rep:"")];
  if(s.note)out.push("> "+s.note);
  (s.text||"").split("\n").forEach(l=>{
   if(!l.trim())return;
   const only=!/[a-zA-ZÀ-ú]/.test(l.replace(/\[[^\]]+\]|\{[^}]*\}/g,""));
   if(only){out.push(l.replace(/\[([^\]]+)\](\{([^}]*)\})?/g,(_,c,__,n)=>c+(n?"{"+n.replace(/ /g,"_")+"}":"")));return}
   let ch="",ly="",any=false;
   l.split(/(\[[^\]]+\])/).forEach(p=>{
    const m=p.match(/^\[([^\]]+)\]$/);
    if(m){any=true;const pos=Math.max(ly.length,ch.length?ch.length+1:0);ch=ch.padEnd(pos," ")+m[1]}
    else{let t=p;if(any)t=t.replace(/\{([^}]*)\}/g,(_,x)=>{ch+="{"+x.replace(/ /g,"_")+"}";return ""});ly+=t}
   });
   if(any)out.push(ch);if(ly.trim())out.push(ly.replace(/\s+$/,""));
  });
  return out.join("\n");
 }).join("\n\n");
}
$("paste").onclick=()=>{$("pbox").style.display="block";$("ptxt").focus()};
$("pcx").onclick=()=>{$("pbox").style.display="none"};
const METARE=/^\s*(tom|capo|capotraste|bpm|compasso)\s*[:\-]\s*(.*)$/i;
function metaPaste(txt){
 const L=txt.replace(/\r/g,"").split("\n"),m={},drop=new Set();
 L.forEach((l,i)=>{const x=l.match(METARE);if(!x)return;const k=x[1].toLowerCase(),v=x[2].trim();
  if(k==="tom"){const r=v.match(/^([A-G][#b]?)(m(?!aj)|\s*(?:menor|minor))?/i);if(r&&!m.key){m.key=r[1][0].toUpperCase()+r[1].slice(1)+(r[2]?"m":"");drop.add(i)}}
  else if(k.startsWith("capo")){const n=v.match(/\d+/);if(n&&+n[0]<=11){m.capo=+n[0];drop.add(i)}}
  else if(k==="bpm"){const n=v.match(/\d+/);if(n){m.bpm=+n[0];drop.add(i)}}
  else drop.add(i);
 });
 let i=0;while(i<L.length&&(!L[i].trim()||drop.has(i)))i++;
 const head=[];let j=i;
 while(j<L.length&&L[j].trim()&&!drop.has(j)&&!isChordLine(L[j])&&!isHdr(L[j])&&!/^>/.test(L[j])&&L[j].trim().length<70&&head.length<3){head.push(L[j].trim());j++}
 const nx=L[j];let start=i;
 if(head.length>0&&head.length<=2&&(nx===undefined||!nx.trim()||drop.has(j)||isHdr(nx))){
  let t=head[0].replace(/\s*[-–|]\s*cifra.*$/i,"").replace(/^cifra\s*[:\-]?\s*/i,"").trim(),a=(head[1]||"").replace(/^(de|por|artista\s*:)\s+/i,"").trim();
  if(!a&&/\s[-–]\s/.test(t)){const p=t.split(/\s[-–]\s/);t=p[0].trim();a=p.slice(1).join(" - ").trim()}
  if(t)m.title=t;if(a)m.artist=a;start=j;
 }
 m.body=L.slice(start).filter((l,k)=>!drop.has(start+k)).join("\n");
 return m;
}
function guessKey(secs){
 const cs=[];secs.forEach(s=>(s.text.match(/\[[A-G][#b]?m?(?!aj)[^\]]*\]/g)||[]).forEach(x=>{const r=x.match(/^\[([A-G][#b]?)(m(?!aj))?/);if(r)cs.push(r[1]+(r[2]||""))}));
 if(!cs.length)return "";
 const f=cs[0],l=cs[cs.length-1],n=c=>cs.filter(x=>x===c).length;
 return n(l)>n(f)?l:f;
}
function applyMeta(mp,secs){
 const got=[],blank=v=>!v||v==="Nova música";
 if(mp.title&&blank(S.title)){S.title=mp.title;got.push("título")}
 if(mp.artist&&!S.artist){S.artist=mp.artist;got.push("artista")}
 if(!S.key){const k=mp.key||guessKey(secs);if(k){S.key=k;got.push("tom "+k)}}
 if(mp.capo&&!S.capo){S.capo=mp.capo;got.push("capotraste "+mp.capo)}
 if(mp.bpm&&!S.bpm){S.bpm=mp.bpm;got.push("BPM "+mp.bpm)}
 return got;
}
$("pgo").onclick=()=>{
 const mp=metaPaste($("ptxt").value),r=parse(mp.body);
 if(!r.length){msg("Nada para converter. Cole a cifra no campo.");return}
 S.sections=$("prep").checked?r:S.sections.concat(r);
 const got=applyMeta(mp,S.sections);
 $("ptxt").value="";$("pbox").style.display="none";fields();all();
 msg(r.length+" seção(ões) adicionada(s)."+(got.length?" Detectei: "+got.join(", ")+".":"")+" Confira e ajuste se precisar.");
};
$("ttxt").onpaste=e=>{
 if($("ttxt").value.trim())return;
 const t=(e.clipboardData||window.clipboardData).getData("text"),mp=metaPaste(t);
 if(!mp.title&&!mp.artist&&!mp.key&&!mp.capo&&!mp.bpm)return;
 e.preventDefault();$("ttxt").value=mp.body;S.sections=parse(mp.body);
 const got=applyMeta(mp,S.sections);fields();save();preview();if(got.length)msg("Detectei: "+got.join(", ")+".");
};
