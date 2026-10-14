// Órbita Celular: guarda a casca do app para abrir sem internet. Os dados ficam no IndexedDB, cifrados.
// v2: rede com limite de 2,5 s. Com internet fraca abre na hora pela cópia salva e atualiza por trás.
const SHELL='orbita-shell-v2';
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
    e.respondWith((async()=>{
      const c=await caches.open(SHELL);
      const cached=await c.match(e.request,{ignoreSearch:true})||(e.request.mode==='navigate'?await c.match('index.html'):undefined);
      const net=fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());return r});
      if(!cached)return net.catch(()=>Response.error());
      e.waitUntil(net.catch(()=>{}));
      const timer=new Promise(res=>setTimeout(()=>res(cached),2500));
      return Promise.race([net.catch(()=>cached),timer]);
    })());
  }
});
