/* js/pdf.js — Baixar PDF direto (a biblioteca jsPDF só é carregada quando você clica) */
let PDFLIB=null;
function loadPdfLib(){
 if(window.jspdf&&window.jspdf.jsPDF)return Promise.resolve(window.jspdf);
 return PDFLIB||(PDFLIB=new Promise((ok,no)=>{
  const s=document.createElement("script");
  s.src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
  s.onload=()=>window.jspdf?ok(window.jspdf):no(new Error("jspdf"));
  s.onerror=()=>{PDFLIB=null;no(new Error("load"))};
  document.head.appendChild(s);
 }));
}
const PDF_PT=0.3528,PDF_RED=[192,17,43],PDF_BPX=3.2,PDF_BPT=4.4,PDF_BPB=2.2,PDF_BGAP=3.6;
/* as fontes padrão do PDF só têm Latin-1: troca o que dá e remove o resto */
const pL=s=>String(s==null?"":s).replace(/\t/g,"    ").replace(/[–—]/g,"-").replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/…/g,"...").replace(/♯/g,"#").replace(/♭/g,"b").replace(/[^\x20-\x7E\u00A0-\u00FF]/g,"");
function pdfSegs(t,k){
 const segs=[];
 t.split(/(\[[^\]]+\])/).forEach(p=>{
  const m=p.match(/^\[([^\]]+)\]$/);
  if(m)segs.push({c:tc(m[1],k),t:"",n:[]});
  else if(p){if(!segs.length)segs.push({c:"",t:p,n:[]});else segs[segs.length-1].t+=p}
 });
 segs.forEach(s=>{s.t=s.t.replace(/\{([^}]*)\}/g,(_,x)=>{s.n.push(x);return ""})});
 return segs;
}
function pdfInfo(sg,x){
 PREFER=sg.acc||null;DEG=sg.degrees?origIdx(sg):null;
 const t=(sg.shift||0)+x,k=t-(sg.capoShapes?(sg.capo||0):0);
 let key=sg.key||"";if(t)key=key?key.replace(/^([A-G][#b]?)/,m=>tn(m,t)):tn((PREFER==="flat"?FL:SH)[origIdx(sg)],t);
 return{k,key};
}
/* quebra um texto em pedaços que cabem em maxW, cortando nos espaços */
function pdfChunks(txt,maxW,mw){
 const out=[];let cur="";
 txt.split(/(\s+)/).forEach(w=>{if(cur&&mw(cur+w)>maxW){out.push(cur);cur=w.replace(/^\s+/,"")}else cur+=w});
 if(cur)out.push(cur);
 if(!out.length)return[txt];
 if(/\s$/.test(txt)&&!/\s$/.test(out[out.length-1]))out[out.length-1]+=" "; /* mantém o espaço final para o próximo trecho não colar */
 return out;
}
/* transforma uma linha da cifra em "linhas visuais" {h, draw(x,y)} */
function lineRows(doc,t,k,avail,fz){
 t=String(t||"").replace(/\t/g,"    ");
 const cfs=9*fz,lfs=8.25*fz,nfs=6*fz,hc=cfs*PDF_PT*1.25,hl=lfs*PDF_PT*1.3,gap=.5;
 if(!t.trim())return[{h:hl*.8,draw(){}}];
 if(/^\s*[eBGDAEb]\|[-\dhpbrx\/\\~()|\s]+$/.test(t)){
  const fs=7*fz;
  return[{h:fs*PDF_PT*1.25+gap,draw:(x,y)=>{doc.setFont("courier","normal");doc.setFontSize(fs);doc.setTextColor(51);doc.text(pL(t),x,y+fs*PDF_PT*.85)}}];
 }
 /* o getTextWidth do jsPDF ignora espaços no fim do texto: soma de volta */
 const mw=(s,f,z)=>{doc.setFont("helvetica",f);doc.setFontSize(z);const t=pL(s),sp=doc.getTextWidth("a a")-doc.getTextWidth("aa");return doc.getTextWidth(t)+sp*((t.match(/\s+$/)||[""])[0].length)};
 const segs=pdfSegs(t,k),only=!/[a-zA-ZÀ-ú]/.test(t.replace(/\[[^\]]+\]|\{[^}]*\}/g,""));
 if(only){
  const toks=[];
  segs.forEach(s=>{
   if(s.c)toks.push({s:s.c,f:"bold",z:cfs});
   s.n.forEach(n=>toks.push({s:n,f:"bold",z:nfs,sp:.8}));
   if(s.t)toks.push({s:s.t,f:"bold",z:cfs});
  });
  toks.forEach(o=>{o.w=mw(o.s,o.f,o.z)+(o.sp||0)});
  const ls=[];let cur=[],x=0;
  toks.forEach(o=>{if(x+o.w>avail&&cur.length){ls.push(cur);cur=[];x=0}cur.push(o);x+=o.w});
  if(cur.length)ls.push(cur);
  return ls.map((ln,i)=>({h:hc+(i===ls.length-1?gap:0),draw:(X,Y)=>{
   let x=X;ln.forEach(o=>{doc.setFont("helvetica",o.f);doc.setFontSize(o.z);doc.setTextColor(...PDF_RED);doc.text(pL(o.s),x+(o.sp||0),Y+cfs*PDF_PT*.85);x+=o.w});
  }}));
 }
 const hasC=segs.some(s=>s.c),pcs=[];
 segs.forEach(s=>{
  const nW=s.n.reduce((a,n)=>a+.8+mw(n,"bold",nfs),0),cw=s.c?mw(s.c,"bold",cfs)+nW+1.7:0;
  let parts=[s.t];
  if(mw(s.t,"normal",lfs)>avail)parts=pdfChunks(s.t,avail,x=>mw(x,"normal",lfs));
  parts.forEach((p,i)=>pcs.push({c:i?"":s.c,n:i?[]:s.n,t:p,w:Math.max((!i&&s.c)?cw:0,mw(p,"normal",lfs))}));
 });
 const vr=[];let cur=[],x=0;
 pcs.forEach(p=>{if(x+p.w>avail&&cur.length){vr.push(cur);cur=[];x=0}p.x=x;cur.push(p);x+=p.w});
 if(cur.length)vr.push(cur);
 return vr.map((r,i)=>({h:(hasC?hc:0)+hl+(i===vr.length-1?gap:0),draw:(X,Y)=>{
  r.forEach(p=>{
   if(p.c){
    doc.setFont("helvetica","bold");doc.setFontSize(cfs);doc.setTextColor(...PDF_RED);doc.text(pL(p.c),X+p.x,Y+cfs*PDF_PT*.85);
    let nx=X+p.x+mw(p.c,"bold",cfs);
    p.n.forEach(n=>{nx+=.8;doc.setFont("helvetica","bold");doc.setFontSize(nfs);doc.setTextColor(34);doc.text(pL(n),nx,Y+cfs*PDF_PT*.85);nx+=mw(n,"bold",nfs)});
   }
   if(p.t.trim()){doc.setFont("helvetica","normal");doc.setFontSize(lfs);doc.setTextColor(85);doc.text(pL(p.t),X+p.x,Y+(hasC?hc:0)+lfs*PDF_PT*.85)}
  });
 }}));
}
function noteRows(doc,txt,avail,fz){
 const fs=7.5*fz;doc.setFont("helvetica","italic");doc.setFontSize(fs);
 return doc.splitTextToSize(pL(txt),avail).map((l,i,a)=>({h:fs*PDF_PT*1.3+(i===a.length-1?.5:0),draw:(x,y)=>{doc.setFont("helvetica","italic");doc.setFontSize(fs);doc.setTextColor(102);doc.text(l,x,y+fs*PDF_PT*.9)}}));
}
/* ---- posicionamento: colunas, páginas e caixas ---- */
const pX=P=>P.M+P.col*(P.colW+P.gap);
function pNewCol(P){
 if(P.col+1<P.cols){P.col++;P.y=P.pt}
 else{P.doc.addPage();P.col=0;P.pt=P.M;P.y=P.M}
}
function pDrawBox(P,b,rows,first){
 const doc=P.doc,x=pX(P),y=P.y,h=rows.reduce((a,r)=>a+r.h,0),bh=h+PDF_BPT+PDF_BPB;
 doc.setDrawColor(34);doc.setLineWidth(.3);doc.roundedRect(x,y,P.colW,bh,2,2,"S");
 if(first&&b.label){
  doc.setFont("helvetica","bold");doc.setFontSize(6.5);
  const lab=pL(b.label).toUpperCase(),lw=doc.getTextWidth(lab);
  let rw=0,rep="";if(b.rep){rep=" "+pL(b.rep);doc.setFont("helvetica","italic");rw=doc.getTextWidth(rep)}
  doc.setFillColor(255,255,255);doc.rect(x+3,y-1.3,lw+rw+1.8,2.6,"F");
  doc.setFont("helvetica","bold");doc.setFontSize(6.5);doc.setTextColor(34);doc.text(lab,x+3.9,y+.75);
  if(rep){doc.setFont("helvetica","italic");doc.setTextColor(...PDF_RED);doc.text(rep,x+3.9+lw,y+.75)}
 }
 let yy=y+PDF_BPT;rows.forEach(r=>{r.draw(x+PDF_BPX,yy);yy+=r.h});
 P.y+=bh+PDF_BGAP;
}
function pPlaceBox(P,b){
 const rows=b.rows.slice();let first=true;
 for(let guard=0;rows.length&&guard<200;guard++){
  const avail=P.bottom-P.y-PDF_BPT-PDF_BPB;
  let take=0,h=0;while(take<rows.length&&h+rows[take].h<=avail){h+=rows[take].h;take++}
  const total=rows.reduce((a,r)=>a+r.h,0),colFull=P.bottom-P.pt-PDF_BPT-PDF_BPB;
  if(take===rows.length){pDrawBox(P,b,rows,first);return}
  if(first&&total<=colFull&&P.y>P.pt+.1){pNewCol(P);continue}
  if(take===0){if(P.y>P.pt+.1){pNewCol(P);continue}take=1}
  pDrawBox(P,b,rows.splice(0,take),first);first=false;pNewCol(P);
 }
}
/* diagrama de acordes (mesma geometria do SVG da tela) */
function pDiag(doc,c,x,y,sc){
 if(typeof pDiagAlt==="function"){const r=pDiagAlt(doc,c,x,y,sc);if(r!==null)return r}
 const s=shape(c);if(!s)return false;
 const f=s.f,pr=f.filter(v=>v>0),mx=Math.max(0,...pr),mn=pr.length?Math.min(...pr):1,b=mx>4?mn:1,x0=18,y0=16,sx=7.5,sy=12;
 const X=v=>x+v*sc,Y=v=>y+v*sc;
 doc.setDrawColor(40);doc.setFillColor(40,40,40);
 doc.setLineWidth(.12);for(let i=0;i<6;i++)doc.line(X(x0+i*sx),Y(y0),X(x0+i*sx),Y(y0+5*sy));
 for(let j=0;j<=5;j++){doc.setLineWidth(j===0&&b===1?.5:.12);doc.line(X(x0),Y(y0+j*sy),X(x0+5*sx),Y(y0+j*sy))}
 if(b>1){doc.setFont("helvetica","normal");doc.setFontSize(6);doc.setTextColor(40);doc.text(b+"fr",X(0),Y(y0+sy*.8))}
 if(s.b>0){const ix=f.map((v,i)=>v===s.b?i:-1).filter(i=>i>=0);if(ix.length>1)doc.roundedRect(X(x0+ix[0]*sx-3.4),Y(y0+(s.b-b+1)*sy-sy/2-3.4),(ix[ix.length-1]-ix[0])*sx*sc+6.8*sc,6.8*sc,3.4*sc,3.4*sc,"F")}
 f.forEach((v,i)=>{
  const px=x0+i*sx;
  if(v<0){doc.setFont("helvetica","normal");doc.setFontSize(6);doc.setTextColor(40);doc.text("x",X(px-2.4),Y(y0-3))}
  else if(v===0){doc.setLineWidth(.15);doc.circle(X(px),Y(y0-7),2.6*sc,"S")}
  else doc.circle(X(px),Y(y0+(v-b+1)*sy-sy/2),3.3*sc,"F");
 });
 return true;
}
function pdfSong(doc,it,W,H,M){
 const sg=it.sg,info=pdfInfo(sg,it.x),fz=(sg.fs||100)/100,cols=sg.cols==2?2:1,gap=5,colW=(W-2*M-(cols-1)*gap)/cols;
 const P={doc,W,H,M,cols,colW,gap,col:0,y:M,pt:M,bottom:H-M};
 let y=M;
 doc.setTextColor(34);doc.setFont("helvetica","bold");doc.setFontSize(13);
 doc.splitTextToSize(pL(sg.title||"").toUpperCase(),W-2*M).forEach(l=>{doc.text(l,M,y+4.4);y+=5.2});
 if(sg.artist){doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(136);doc.text(pL(sg.artist),M,y+3);y+=4.4}
 const meta=[info.key?"Tom: "+info.key:"",sg.time?"Comp: "+sg.time:"",sg.bpm?"BPM: "+sg.bpm:"",sg.capo?"Capotraste: "+sg.capo+"a casa":"",sg.dur?"Dur: "+sg.dur:"",sg.degrees?"Graus":""].filter(Boolean).join("  |  ");
 if(meta){doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(34);doc.text(pL(meta),M,y+3.6);y+=6}
 if(it.note){doc.setFont("helvetica","bold");doc.setFontSize(9);doc.setTextColor(...PDF_RED);doc.splitTextToSize(pL("Nota: "+it.note),W-2*M).forEach(l=>{doc.text(l,M,y+3.4);y+=4.6});y+=1}
 y+=3;P.y=y;P.pt=y;
 const avail=colW-2*PDF_BPX;
 sg.sections.forEach(s=>{
  const rows=[];
  (s.text||"").split("\n").forEach(l=>rows.push(...lineRows(doc,l,info.k,avail,fz)));
  if(s.note)rows.push(...noteRows(doc,s.note,avail,fz));
  pPlaceBox(P,{label:s.name||"",rep:s.rep||"",rows});
 });
 if(sg.chart){
  const u=[];sg.sections.forEach(s=>((s.text||"").match(/\[[^\]]+\]/g)||[]).forEach(m=>{const c=tcr(m.slice(1,-1),info.k);if(!u.includes(c))u.push(c)}));
  const sc=.26,fw=19,fh=76*sc+5;let fx=0;
  if(u.length&&P.y+fh>P.bottom)pNewCol(P);
  u.forEach(c=>{
   if(fx+fw>colW){fx=0;P.y+=fh}
   if(P.y+fh>P.bottom){pNewCol(P);fx=0}
   doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(...PDF_RED);doc.text(pL(c),pX(P)+fx+2,P.y+3);
   pDiag(doc,c,pX(P)+fx,P.y+3.6,sc);fx+=fw;
  });
  P.y+=fh;
 }
 if(sg.myNotes&&String(sg.myNotes).trim()){
  const rows=[];doc.setFont("helvetica","normal");doc.setFontSize(8);
  doc.splitTextToSize(pL(sg.myNotes),avail).forEach(l=>rows.push({h:8*PDF_PT*1.3,draw:(x,yy)=>{doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(51);doc.text(l,x,yy+8*PDF_PT*.9)}}));
  pPlaceBox(P,{label:"Minhas anotações",rep:"",rows});
 }
}
function buildPdf(J,items){
 const ps=items[0].sg,land=ps.ori==="l",M={c:8,n:12,w:18}[ps.mar||"n"];
 const doc=new J.jsPDF({orientation:land?"landscape":"portrait",unit:"mm",format:"a4"});
 const W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight();
 items.forEach((it,n)=>{if(n)doc.addPage();pdfSong(doc,it,W,H,M)});
 return doc;
}
async function exportPdf(){
 const cs=curSet(),set=VIEW==="set"&&cs&&cs.items.length;
 const items=set?cs.items.map(i=>({sg:songBy(i.songId),x:i.shift||0,note:i.note||""})).filter(i=>i.sg):[{sg:S,x:0,note:""}];
 if(!items.length){msg("Nada para exportar.");return}
 msg("Gerando PDF…");
 let J;
 try{J=await loadPdfLib()}
 catch(e){msg("Não consegui baixar a biblioteca de PDF (precisa de internet na primeira vez; um bloqueador de anúncios também pode impedir). Use “Imprimir / PDF”.");return}
 try{
  const doc=buildPdf(J,items);
  doc.save(fname(set?cs.name:S.title)+".pdf");msg("PDF gerado.");
 }catch(e){console.error(e);msg("Erro ao montar o PDF: "+((e&&e.message)||e)+". Use “Imprimir / PDF” enquanto isso.")}
}
$("pdf").onclick=exportPdf;
