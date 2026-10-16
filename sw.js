const V="cifras-v3",
/* Ao criar/renomear arquivos, liste-os aqui e aumente V para os aparelhos atualizarem. */
SHELL=["./", "index.html", "manifest.json", "icon.svg","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png", "css/style.css", "js/config.js", "js/state.js", "js/render.js", "js/chords.js", "js/editor.js", "js/importer.js", "js/song-options.js", "js/sets.js", "js/stage.js", "js/library.js", "js/history.js", "js/modes.js", "js/settings.js", "js/metronome.js", "js/init.js", "js/pwa.js", "js/auth.js", "js/sync.js", "js/share.js", "js/trash.js", "js/account.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
 const r=e.request,u=new URL(r.url);
 if(r.method!=="GET"||/supabase\.(co|in)$/.test(u.hostname))return;
 if(!(u.origin===location.origin||/cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(u.hostname)))return;
 e.respondWith(caches.open(V).then(async c=>{
  const hit=await c.match(r,{ignoreSearch:true});
  const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==="opaque"))c.put(r,res.clone());return res}).catch(()=>hit||Response.error());
  return hit||net;
 }));
});
