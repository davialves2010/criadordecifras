/* Rodar: node --test tests/*.test.js   (Node 18+). O teste do PDF só roda se existir node_modules/jspdf. */
const test=require("node:test"),assert=require("node:assert/strict"),{load}=require("./harness");
const q=s=>JSON.stringify(s);
const BASE=["state.js","render.js","chords.js","history.js","sets.js","settings.js","sync.js","share.js","versions.js","collab.js"];

test("duração: parseDur e fmtDur",()=>{
 const a=load(["state.js"]);
 assert.equal(a.run('parseDur("4:30")'),270);assert.equal(a.run('parseDur("5")'),300);assert.equal(a.run('parseDur("")'),0);assert.equal(a.run('parseDur("x")'),0);
 assert.equal(a.run("fmtDur(270)"),"4:30");assert.equal(a.run("fmtDur(3725)"),"1:02:05");
});
test("busca por tom, acorde e progressão",()=>{
 const a=load(["state.js","render.js"]);
 a.run(`var A={title:"Alfa",key:"G",sections:[{text:"[G]a [Em]b [C]c [D/F#]d"}]},B={title:"Beta",key:"Em",sections:[{text:"[Em]x [C]y [G]z"}]},C={title:"Gama",key:"C major",sections:[{text:"[C]x [G]y [Am]z [F]w"}]}`);
 const m=(s,x)=>a.run("matchSong("+s+","+q(x)+")");
 assert.equal(m("A","tom:G"),true);assert.equal(m("B","tom:G"),false);assert.equal(m("B","tom:Em"),true);assert.equal(m("A","tom:Gm"),false);assert.equal(m("C","tom:C"),true);
 assert.equal(m("A","acorde:Em,C"),true);assert.equal(m("C","acorde:Em,C"),false);assert.equal(m("A","acorde:D"),true,"baixo /F# é ignorado");
 assert.equal(m("C","prog:C-G-Am-F"),true);assert.equal(m("A","prog:C-G-Am-F"),false);assert.equal(m("A","prog:Em-C"),true);
 assert.equal(m("A","tom:G acorde:Em alfa"),true);assert.equal(m("A","tom:G beta"),false);
 assert.equal(m("A","tom:"),true,"token vazio não filtra");assert.equal(m("A","alfa"),true);
});
test("folha mostra nota do repertório, duração e anotações pessoais",()=>{
 const a=load(["state.js","render.js"]);
 const h=a.run('sheetHTML({title:"X",dur:"4:30",myNotes:"capo 2\\n<b>",sections:[{name:"E",text:"[C]Oi"}]},0,"entrar no 2º refrão")');
 assert.ok(h.includes("entrar no 2º refrão")&&h.includes("Dur: <b>4:30</b>")&&h.includes("Minhas anotações")&&h.includes("&lt;b&gt;"));
 assert.ok(!a.run('sheetHTML({title:"X",sections:[{name:"E",text:"[C]Oi"}]},0)').includes("Minhas anotações"));
});
test("links não vazam token de equipe, favorita nem anotações",()=>{
 const a=load(BASE);
 a.run(`LIB.songs.length=0;LIB.sets.length=0;LIB.songs.push({id:"s1",title:"Um",fav:true,myNotes:"segredo",sections:[]});
  LIB.sets.push({id:"L",name:"C",items:[{songId:"s1",shift:1,note:"n"}],collab:{token:"TOKEN-SECRETO",id:"x"},follow:"f"})`);
 const p=JSON.stringify(a.json('setPayload(LIB.sets[0])'));
 assert.ok(!p.includes("TOKEN-SECRETO")&&!p.includes("segredo")&&!p.includes('"fav"')&&!p.includes('"collab"')&&!p.includes('"follow"'));
 assert.ok(p.includes('"note":"n"'),"a nota do repertório vai no link");
});
test("seguir link ao vivo: atualiza, acrescenta, remove e mantém anotações e notas",async()=>{
 const a=load(BASE);
 a.run(`USER={id:"u"};schedPush=()=>{};fields=()=>{};editor=()=>{};preview=()=>{};lib=()=>{};toast=()=>{};
  var payload={live:true,songs:[{id:"s1",title:"Um",sections:[{name:"Estrofe",text:"[C]Oi"}]},{id:"s2",title:"Dois",sections:[]}],set:{id:"x",name:"Culto",items:[{songId:"s1",shift:0,note:"abrir"},{songId:"s2",shift:2}]}};
  sb={rpc:async()=>({data:payload,error:null})};LIB.sets.push({id:"L",name:"Seguindo",follow:"SH",items:[]});`);
 await a.run("followSync()");
 let r=a.json("({s:LIB.songs.filter(s=>s.follow==='SH').map(s=>s.title),set:LIB.sets.find(s=>s.id==='L')})");
 assert.deepEqual(r.s.sort(),["Dois","Um"]);assert.equal(r.set.items.length,2);assert.equal(r.set.items[0].note,"abrir");assert.equal(r.set.items[1].shift,2);assert.equal(r.set.items[1].note,undefined);
 a.run('LIB.songs.find(s=>s.title==="Um").myNotes="minha nota";LIB.songs.find(s=>s.title==="Um").fav=true');
 a.run('payload.songs=[{id:"s1",title:"Um editado",sections:[]}];payload.set.items=[{songId:"s1",shift:0}]');
 await a.run("followSync()");
 r=a.json("LIB.songs.filter(s=>s.follow==='SH')");
 assert.equal(r.length,1);assert.equal(r[0].title,"Um editado");assert.equal(r[0].myNotes,"minha nota");assert.equal(r[0].fav,true);
 assert.ok(a.json("vLoad()")[r[0].id].length>=1,"a versão anterior foi guardada no histórico");
});
test("histórico de versões: limite de 15, sem duplicar, e ordem",()=>{
 const a=load(BASE);
 for(let i=0;i<20;i++)a.run(`verPush("s",JSON.stringify({title:"v${i}",sections:[]}),${1000+i})`);
 assert.equal(a.run('verPush("s",JSON.stringify({title:"v19",sections:[]}),9)'),false);
 const v=a.json('vLoad().s');assert.equal(v.length,15);assert.equal(JSON.parse(v[0].s).title,"v5");assert.equal(JSON.parse(v[14].s).title,"v19");
});
test("histórico de versões: guarda o estado ANTERIOR depois de uma pausa",()=>{
 const a=load(BASE);
 a.run(`USER=null;LIB.songs.length=0;LIB.songs.push({id:"s1",title:"Antes",sections:[]});S=LIB.songs[0];HID="s1";updUndo=()=>{};
  HIST.s1={a:[snapStr(S)],i:0};S.title="Depois";snap()`);
 const v=a.json('vLoad().s1');assert.equal(v.length,1);assert.equal(JSON.parse(v[0].s).title,"Antes");
 a.run('S.title="Depois 2";snap()');
 assert.equal(a.json('vLoad().s1').length,1,"dentro dos 5 minutos não cria outra");
});

/* ---- edição em equipe: dois "aparelhos" falando com o mesmo servidor de mentira ---- */
function mkServer(){
 const sv={rev:1,data:null,puts:0};
 sv.rpc=async(fn,args)=>{
  if(fn==="collab_get")return{data:sv.data?{id:"S1",rev:sv.rev,data:JSON.parse(JSON.stringify(sv.data))}:null,error:null};
  if(fn==="collab_put"){if(args.p_rev!==sv.rev)return{data:{ok:false,conflict:true},error:null};sv.data=JSON.parse(JSON.stringify(args.p_data));sv.rev++;sv.puts++;return{data:{ok:true,rev:sv.rev},error:null}}
 };
 return sv;
}
function device(sv,uid){
 const a=load(BASE,{confirm:()=>true,crypto:require("node:crypto").webcrypto});
 a.ctx.__rpc=sv.rpc;
 a.run(`USER={id:${q(uid)}};schedPush=()=>{};fields=()=>{};editor=()=>{};preview=()=>{};lib=()=>{};toast=()=>{};var go=()=>{};sb={rpc:__rpc};LIB.songs.length=0;LIB.sets.length=0;LIB.synced={};`);
 return a;
}
const TOKEN="a".repeat(36);
test("equipe: entrar, editar, resolver conflito e juntar mudanças",async()=>{
 const sv=mkServer(),A=device(sv,"a"),B=device(sv,"b");
 A.run(`LIB.songs.push({id:"s1",title:"Um",updated:100,fav:true,myNotes:"nota da A",sections:[{name:"E",text:"[C]Oi"}]});
  LIB.sets.push({id:"LA",name:"Culto",updated:100,items:[{songId:"s1",shift:0}],collab:{id:"S1",token:${q(TOKEN)},rev:1,sig:"",owner:true}})`);
 sv.data=A.json("cbPayload(LIB.sets[0])");
 assert.ok(!JSON.stringify(sv.data).includes(TOKEN)&&!JSON.stringify(sv.data).includes("nota da A"));
 /* B entra */
 await B.run(`collabJoin(${q(TOKEN)})`);
 let b=B.json("({songs:LIB.songs.map(s=>s.title),set:LIB.sets[0]})");
 assert.deepEqual(b.songs,["Um"]);assert.equal(b.set.name,"Culto");assert.equal(b.set.items.length,1);assert.equal(b.set.collab.owner,false);
 /* edições simultâneas: B muda a música (mais nova); A cria uma música nova e a põe no repertório */
 B.run('LIB.songs[0].title="Um (B)";LIB.songs[0].updated=400');
 A.run('LIB.songs.push({id:"s2",title:"Dois",updated:300,sections:[]});LIB.sets[0].items.push({songId:"s2",shift:2,note:"final"});LIB.sets[0].updated=300');
 assert.equal(await B.run("collabSync(LIB.sets[0])"),"pushed");
 const r=await A.run("collabSync(LIB.sets[0])");assert.equal(r,"merged");
 /* servidor tem as duas coisas; A manteve favorita e anotação pessoais */
 assert.deepEqual(sv.data.songs.map(s=>s.title).sort(),["Dois","Um (B)"]);
 assert.equal(sv.data.set.items.length,2);assert.equal(sv.data.set.items[1].note,"final");
 const a=A.json("LIB.songs.find(s=>s.id==='s1')");assert.equal(a.title,"Um (B)");assert.equal(a.myNotes,"nota da A");assert.equal(a.fav,true);
 /* B sincroniza e recebe a música nova */
 await B.run("collabSync(LIB.sets[0])");
 assert.deepEqual(B.json("LIB.songs.map(s=>s.title).sort()"),["Dois","Um (B)"]);
 assert.equal(B.json("LIB.sets[0].items.length"),2);
 /* sem mudanças: nenhuma gravação nova */
 const puts=sv.puts;assert.equal(await A.run("collabSync(LIB.sets[0])"),"same");assert.equal(await B.run("collabSync(LIB.sets[0])"),"same");assert.equal(sv.puts,puts);
});
test("equipe: a música mais recente vence; link encerrado vira repertório comum",async()=>{
 const sv=mkServer(),A=device(sv,"a"),B=device(sv,"b");
 A.run(`LIB.songs.push({id:"s1",title:"Original",updated:100,sections:[]});LIB.sets.push({id:"LA",name:"C",updated:100,items:[{songId:"s1",shift:0}],collab:{id:"S1",token:${q(TOKEN)},rev:1,owner:true}})`);
 sv.data=A.json("cbPayload(LIB.sets[0])");await B.run(`collabJoin(${q(TOKEN)})`);
 A.run('LIB.songs[0].title="A velha";LIB.songs[0].updated=150');
 B.run('LIB.songs[0].title="B nova";LIB.songs[0].updated=250');
 await B.run("collabSync(LIB.sets[0])");await A.run("collabSync(LIB.sets[0])");
 assert.equal(A.json("LIB.songs[0].title"),"B nova");assert.equal(sv.data.songs[0].title,"B nova");
 sv.data=null;
 assert.equal(await B.run("collabSync(LIB.sets[0])"),"gone");assert.equal(B.run("LIB.sets[0].collab"),undefined);assert.equal(B.json("LIB.sets.length"),1);
});
test("equipe: conflito de gravação é refeito automaticamente",async()=>{
 const sv=mkServer(),A=device(sv,"a");
 A.run(`LIB.songs.push({id:"s1",title:"Um",updated:100,sections:[]});LIB.sets.push({id:"LA",name:"C",updated:100,items:[{songId:"s1",shift:0}],collab:{id:"S1",token:${q(TOKEN)},rev:1,owner:true}})`);
 sv.data=A.json("cbPayload(LIB.sets[0])");
 A.run('LIB.songs[0].title="Mudou";LIB.songs[0].updated=200');
 /* outra pessoa grava entre o get e o put da A */
 const get=sv.rpc;let first=true;
 A.ctx.__rpc=async(fn,args)=>{const r=await get(fn,args);if(fn==="collab_get"&&first){first=false;sv.data.songs.push({id:"s9",title:"De outro",updated:300,sections:[]});sv.data.set.items.push({songId:"s9",shift:0});sv.data.set.updated=300;sv.rev++}return r};
 A.run("sb={rpc:__rpc}");
 assert.ok(["pushed","merged"].includes(await A.run("collabSync(LIB.sets[0])")));
 assert.deepEqual(sv.data.songs.map(s=>s.title).sort(),["De outro","Mudou"]);
});

test("PDF direto gera um arquivo válido com várias músicas",{skip:!(()=>{try{require.resolve("jspdf");return true}catch(e){return false}})()},()=>{
 const{jsPDF}=require("jspdf"),a=load(["state.js","render.js","chords.js","pdf.js"]);
 a.ctx.__J={jsPDF};
 a.run(`var sg={id:"a",title:"Çãó – “teste”",artist:"X",key:"C",time:"4/4",bpm:70,dur:"3:00",chart:true,myNotes:"nota",sections:[{name:"Estrofe",rep:"2x",note:"obs",text:"[C]Oi {segura} amor [G]tchau\\n| [C] [G] :||\\ne|-0-1-|"}]};
  globalThis.__d=buildPdf(__J,[{sg,x:0,note:"entrar no refrão"},{sg:Object.assign({},sg,{cols:2}),x:2,note:""}])`);
 assert.equal(a.ctx.__d.getNumberOfPages(),2);
 assert.ok(Buffer.from(a.ctx.__d.output("arraybuffer")).slice(0,4).toString()==="%PDF");
});
