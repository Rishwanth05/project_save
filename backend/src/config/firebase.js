const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

async function sendPushNotification(token, title, body, data = {}) {
  try {
    const message = {
      token,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
    };
    const response = await admin.messaging().send(message);
    console.log(`FCM sent to ${token.slice(0, 20)}...: ${response}`);
  } catch (err) {
    console.error(`FCM failed for token ${token.slice(0, 20)}...: ${err.message}`);
  }
}

module.exports = { sendPushNotification };
