importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAdrnZfkSBUCAgTyII29mGpigvEW6n1ENc',
  authDomain: 'project-save-77410.firebaseapp.com',
  projectId: 'project-save-77410',
  messagingSenderId: '367151780181',
  appId: '1:367151780181:web:5062e70af7ba73cf2e1fdc',
});

const messaging = firebase.messaging();

console.log('[SW] Firebase messaging service worker loaded');

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'New Hazard Report';
  const body = payload.notification?.body || 'A new hazard has been reported nearby.';

  self.registration.showNotification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {},
  });
});
