// Service worker de Firebase Cloud Messaging: recibe las notificaciones push
// cuando la PWA está cerrada o en segundo plano.
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Mismo firebaseConfig que usa index.html (los service workers no pueden
// leer <script> del documento, así que se repite aquí).
firebase.initializeApp({
  apiKey: "AIzaSyDiLO2ikdGUcKwJH2nGwrquU_9uWn7a9XM",
  authDomain: "navaja-dorada-e6a0d.firebaseapp.com",
  projectId: "navaja-dorada-e6a0d",
  storageBucket: "navaja-dorada-e6a0d.firebasestorage.app",
  messagingSenderId: "741596424652",
  appId: "1:741596424652:web:a9bd42c1dd0ed42c6f9569"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || 'Nueva cita reservada';
  const body = (payload.notification && payload.notification.body) || '';
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
  });
});

// Al tocar la notificación, abre (o enfoca) la pestaña de la app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
