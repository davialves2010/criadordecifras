const V="cifras-v10",
/* Ao criar/renomear arquivos, liste-os aqui e aumente V. */
SHELL=["./", "index.html", "manifest.json", "icon.svg","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png", "css/style.css", "js/config.js", "js/state.js", "js/render.js", "js/chords.js", "js/editor.js", "js/importer.js", "js/song-options.js", "js/sets.js", "js/stage.js", "js/library.js","js/chordpro.js", "js/history.js", "js/modes.js", "js/settings.js","js/organize.js", "js/metronome.js", "js/init.js", "js/pwa.js", "js/auth.js", "js/sync.js", "js/share.js", "js/trash.js", "js/account.js","js/a11y.js","js/backup.js","privacidade.html"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
 const r=e.request,u=new URL(r.url);
 if(r.method!=="GET"||/supabase\.(co|in)$/.test(u.hostname))return;
 const own=u.origin===location.origin;
 if(!(own||/cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(u.hostname)))return;
 e.respondWith(caches.open(V).then(async c=>{
  const hit=await c.match(r,{ignoreSearch:true});
  const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==="opaque"))c.put(r,res.clone());return res});
  /* arquivos do app: internet primeiro (sempre a versão nova), cache só se estiver offline.
     bibliotecas externas: cache primeiro. */
  if(own)return net.catch(()=>hit||Response.error());
  return hit||net.catch(()=>Response.error());
 }));
});
