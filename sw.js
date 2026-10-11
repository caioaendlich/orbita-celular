// Órbita Celular: guarda a casca do app para abrir sem internet. Os dados ficam no IndexedDB, cifrados.
const SHELL='orbita-shell-v1';
const FILES=['./','index.html','manifest.webmanifest','icon-180.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(SHELL).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==SHELL&&x!=='orbita-fonts').map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.hostname==='api.github.com')return;
  if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
    e.respondWith(caches.open('orbita-fonts').then(async c=>{const hit=await c.match(e.request);if(hit)return hit;try{const r=await fetch(e.request);c.put(e.request,r.clone());return r}catch(err){return hit||Response.error()}}));return;
  }
  if(u.origin===location.origin){
    // rede primeiro, para receber versões novas; cache quando offline
    e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(SHELL).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))));
  }
});
