/* js/repertorio.js — Fase 3: histórico e estatísticas, escala de músicos e pastas de músicas.
   Carregar DEPOIS de ux.js (usa sets(), go(), toast()) e ANTES de a11y.js. */
(function(){
 const g=id=>document.getElementById(id);
 const mk=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e};
 const fechar=id=>{g(id).hidden=true};
 [["histx","histbox"],["teamx","teambox"]].forEach(([b,m])=>{g(b).onclick=()=>fechar(m);g(m).onclick=e=>{if(e.target===g(m))fechar(m)}});
 function abrirMusica(id){
  const s=songBy(id);if(!s)return;
  S=s;LIB.cur=s.id;VIEW="song";fields();editor();preview();persist();go("song");
 }

 /* ---- pastas ---- */
 g("folder").oninput=()=>{const v=g("folder").value.trim();if(v)S.folder=v;else delete S.folder;save()};
 g("foldersel").onchange=()=>{FILT.folder=g("foldersel").value;lib()};

 /* ---- histórico e estatísticas ---- */
 function linhaMusica(id,direita){
  const s=songBy(id),b=mk("button","hrow");
  b.append(mk("span","",s.title||"(sem título)"),mk("small","muted",direita||""));
  b.onclick=()=>{fechar("histbox");abrirMusica(id)};
  return b;
 }
 function bloco(titulo,linhas,vazio){
  const d=mk("div","hsec");d.appendChild(mk("h4","",titulo));
  if(linhas.length)linhas.forEach(x=>d.appendChild(x));else d.appendChild(mk("p","muted",vazio||"Nada por aqui ainda."));
  return d;
 }
 function histRender(){
  const box=g("hbody");box.innerHTML="";
  const hoje=todayISO(),past=LIB.sets.filter(x=>x.date&&x.date<=hoje);
  if(!past.length){
   box.appendChild(mk("div","help","Ainda não há histórico. Em Repertórios, dê uma data a cada culto ou ensaio (campo Data). Os repertórios com data de hoje ou anterior contam como tocados."));
   return;
  }
  const dias=+g("hper").value,noPeriodo=dias?past.filter(x=>daysSince(x.date)<=dias):past;
  const cont=new Map();
  noPeriodo.forEach(x=>new Set((x.items||[]).map(i=>i.songId)).forEach(id=>cont.set(id,(cont.get(id)||0)+1)));
  const todas=playStats().m;
  const top=[...cont].filter(([id])=>songBy(id))
   .sort((a,b)=>b[1]-a[1]||(songBy(a[0]).title||"").localeCompare(songBy(b[0]).title||"","pt")).slice(0,15)
   .map(([id,n])=>linhaMusica(id,n+"× · última "+dfmt(todas.get(id).last)));
  box.appendChild(bloco("🏆 Mais tocadas",top,"Nenhum repertório com data nesse período."));
  const antigas=[...todas].filter(([id])=>songBy(id)).sort((a,b)=>a[1].last.localeCompare(b[1].last)).slice(0,15)
   .map(([id,r])=>linhaMusica(id,agoTxt(daysSince(r.last))));
  box.appendChild(bloco("⏳ Há mais tempo sem tocar",antigas));
  const nunca=LIB.songs.filter(s=>!todas.has(s.id));
  box.appendChild(bloco("🆕 Nunca tocadas ("+nunca.length+")",nunca.slice(0,15).map(s=>linhaMusica(s.id,"")),"Todas as suas músicas já foram tocadas."));
  const ultimos=past.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10).map(x=>{
   const b=mk("button","hrow");
   b.append(mk("span","",dfmt(x.date)+" · "+(x.name||"(sem nome)")),mk("small","muted",(x.items||[]).length+" músicas"));
   b.onclick=()=>{fechar("histbox");LIB.curSet=x.id;persist();sets();go("sets")};
   return b;
  });
  box.appendChild(bloco("🗓 Últimos repertórios",ultimos));
 }
 g("shist").onclick=()=>{histRender();g("histbox").hidden=false};
 g("hper").onchange=histRender;

 /* ---- escala de músicos (guardada no repertório: team = [{n, r, s:[ids das músicas]}]; fica só na sua conta) ---- */
 let QUEM=0;
 function teamRender(){
  const c=curSet(),box=g("tbody");box.innerHTML="";
  if(!c){box.appendChild(mk("p","muted","Crie um repertório primeiro."));return}
  c.team=c.team||[];
  g("ttitle").textContent="🎸 Escala — "+(c.name||"(sem nome)")+(c.date?" · "+dfmt(c.date):"");
  const salvar=()=>{c.updated=Date.now();persist()};
  const rows=(c.items||[]).map(it=>({s:songBy(it.songId),it})).filter(r=>r.s);
  box.appendChild(mk("p","muted","Quem toca ou canta em cada música deste repertório. Fica só na sua conta e não vai nos links."));
  const lista=mk("div");box.appendChild(lista);
  const mx=mk("div","tmx"),quem=mk("div","twho");

  function matriz(){
   mx.innerHTML="";
   if(!c.team.length||!rows.length){mx.appendChild(mk("p","muted",rows.length?"Adicione pessoas para marcar quem toca cada música.":"Adicione músicas ao repertório para montar a escala."));return}
   mx.appendChild(mk("h4","","Quem toca cada música"));
   rows.forEach((r,i)=>{
    const linha=mk("div","tsong"),cks=mk("div","tchk");
    linha.appendChild(mk("b","",(i+1)+". "+(r.s.title||"(sem título)")));
    c.team.forEach(p=>{
     const lab=mk("label","tc"),cb=mk("input");cb.type="checkbox";cb.style.width="auto";
     cb.checked=!!(p.s&&p.s.includes(r.s.id));
     cb.onchange=()=>{
      p.s=p.s||[];const k=p.s.indexOf(r.s.id);
      if(cb.checked&&k<0)p.s.push(r.s.id);
      if(!cb.checked&&k>=0)p.s.splice(k,1);
      salvar();vista();
     };
     lab.append(cb," "+(p.n||"(sem nome)"));cks.appendChild(lab);
    });
    linha.appendChild(cks);mx.appendChild(linha);
   });
  }
  function vista(){
   quem.innerHTML="";
   if(!c.team.length||!rows.length)return;
   quem.appendChild(mk("h4","","Ver por pessoa"));
   const sel=mk("select"),out=mk("div","tout");
   sel.setAttribute("aria-label","Pessoa");
   c.team.forEach((p,i)=>{const o=mk("option","",(p.n||"(sem nome)")+(p.r?" ("+p.r+")":""));o.value=String(i);sel.appendChild(o)});
   QUEM=Math.min(QUEM,c.team.length-1);sel.value=String(QUEM);
   const mostrar=()=>{
    QUEM=+sel.value;const p=c.team[QUEM];out.innerHTML="";
    const meus=rows.map((r,i)=>({r,i})).filter(x=>p.s&&p.s.includes(x.r.s.id));
    if(!meus.length){out.appendChild(mk("p","muted","Nenhuma música marcada para esta pessoa."));return}
    meus.forEach(({r,i})=>{
     PREFER=r.s.acc||null;const t2=(r.s.shift||0)+(r.it.shift||0),raiz=(r.s.key||"").match(/^[A-G][#b]?/);
     out.appendChild(mk("div","",(i+1)+". "+(r.s.title||"(sem título)")+(raiz?" — tom "+tn(raiz[0],t2):"")+(r.it.note?" · "+r.it.note:"")));
    });
   };
   sel.onchange=mostrar;quem.append(sel,out);mostrar();
  }
  c.team.forEach((p,i)=>{
   const r=mk("div","trow"),n=mk("input"),f=mk("input"),x=mk("button","","✕");
   n.value=p.n||"";n.placeholder="Nome";n.setAttribute("aria-label","Nome da pessoa");
   f.value=p.r||"";f.placeholder="Função (voz, violão…)";f.setAttribute("aria-label","Função");
   x.setAttribute("aria-label","Remover "+(p.n||"pessoa"));
   n.oninput=()=>{p.n=n.value;salvar();matriz();vista()};
   f.oninput=()=>{p.r=f.value;salvar();vista()};
   x.onclick=()=>{c.team.splice(i,1);salvar();teamRender()};
   r.append(n,f,x);lista.appendChild(r);
  });
  const add=mk("button","","+ Adicionar pessoa");
  add.onclick=()=>{c.team.push({n:"",r:"",s:[]});salvar();teamRender();const ins=g("tbody").querySelectorAll(".trow input");if(ins.length>1)ins[ins.length-2].focus()};
  box.append(add,mx,quem);matriz();vista();
  const cp=mk("button","p","📋 Copiar escala (texto)");cp.style.marginTop="12px";
  cp.onclick=async()=>{const t=escalaTexto(c);try{await navigator.clipboard.writeText(t);toast("Escala copiada.")}catch(e){prompt("Copie a escala:",t)}};
  box.appendChild(cp);
 }
 g("steam").onclick=()=>{
  if(!curSet()){msg("Crie um repertório primeiro.");return}
  QUEM=0;teamRender();g("teambox").hidden=false;
 };
})();
