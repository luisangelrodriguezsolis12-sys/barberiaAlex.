// Service worker mínimo para que /admin/ sea instalable como PWA independiente.
// La lógica de notificaciones push se agrega en la Fase B, junto con el login real.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
