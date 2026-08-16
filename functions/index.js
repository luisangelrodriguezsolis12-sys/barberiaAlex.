const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Lee un doc de site_data con el mismo formato que usa la página (campo "value"
// con un JSON serializado en texto). Devuelve el fallback si no existe o está vacío.
function readSiteDataArray(snap, fallback) {
  const raw = snap && snap.exists ? snap.get('value') : undefined;
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

// Se dispara con cualquier cambio en site_data/bookings. Como todas las citas
// viven juntas en un solo documento (un array dentro de "value"), comparamos el
// array de antes contra el de después para saber qué cita(s) son nuevas.
exports.notifyOwnerOnNewBooking = onDocumentWritten(
  { document: 'site_data/bookings', region: 'us-central1' },
  async (event) => {
    const before = readSiteDataArray(event.data.before, []);
    const after = readSiteDataArray(event.data.after, []);
    if (!after.length) return;

    const beforeIds = new Set(before.map((b) => b.id));
    const newBookings = after.filter((b) => !beforeIds.has(b.id));
    if (!newBookings.length) return;

    const tokensSnap = await db.collection('site_data').doc('adminTokens').get();
    const tokens = readSiteDataArray(tokensSnap, []);
    if (!tokens.length) {
      logger.info('Cita nueva, pero no hay dispositivos registrados para notificar.');
      return;
    }

    for (const booking of newBookings) {
      const message = {
        notification: {
          title: 'Nueva cita reservada',
          body: `${booking.name} — ${booking.service} el ${booking.date} a las ${booking.time}`,
        },
        webpush: {
          fcmOptions: { link: '/' },
          notification: { icon: '/icon-192.png' },
        },
        tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      logger.info(`Notificación enviada para la cita ${booking.id}: ${response.successCount}/${tokens.length} entregadas`);

      const deadTokens = [];
      response.responses.forEach((r, i) => {
        const code = r.error && r.error.code;
        if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
          deadTokens.push(tokens[i]);
        }
      });
      if (deadTokens.length) {
        const remaining = tokens.filter((t) => !deadTokens.includes(t));
        await db.collection('site_data').doc('adminTokens').set({ value: JSON.stringify(remaining) });
        logger.info(`Se limpiaron ${deadTokens.length} token(s) de notificaciones inválidos.`);
      }
    }
  }
);

const PLACES_API_KEY = defineSecret('PLACES_API_KEY');

// Datos del negocio en Google Maps (resueltos del link que compartió el dueño).
// Se usan como pista de ubicación para encontrar el place_id correcto por nombre.
const BUSINESS_NAME = 'Casa negra Barberia';
const BUSINESS_LAT = 20.6275849;
const BUSINESS_LNG = -103.3990185;

async function syncGoogleRating(apiKey) {
  const findUrl = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json'
    + `?input=${encodeURIComponent(BUSINESS_NAME)}`
    + '&inputtype=textquery'
    + `&locationbias=point:${BUSINESS_LAT},${BUSINESS_LNG}`
    + '&fields=place_id,name'
    + `&key=${apiKey}`;
  const findRes = await fetch(findUrl).then(r => r.json());
  const candidate = findRes.candidates && findRes.candidates[0];
  if (!candidate) {
    throw new Error('No se encontró el negocio en Google Places: ' + JSON.stringify(findRes));
  }

  const detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json'
    + `?place_id=${candidate.place_id}`
    + '&fields=rating,user_ratings_total,name'
    + `&key=${apiKey}`;
  const detailsRes = await fetch(detailsUrl).then(r => r.json());
  const result = detailsRes.result;
  if (!result) {
    throw new Error('No se pudo leer el detalle del negocio en Google: ' + JSON.stringify(detailsRes));
  }

  const payload = {
    rating: result.rating || 0,
    userRatingsTotal: result.user_ratings_total || 0,
    placeId: candidate.place_id,
    updatedAt: new Date().toISOString(),
  };

  // Mismo formato que espera getShared() en la página: un documento con un solo
  // campo "value" en texto (JSON serializado) dentro de la colección site_data.
  await db.collection('site_data').doc('googleRating').set({
    value: JSON.stringify(payload),
  });

  logger.info('Calificación de Google actualizada', payload);
  return payload;
}

// Se ejecuta sola cada 6 horas. La página web NUNCA llama a la API de Google:
// solo lee el documento site_data/googleRating que esta función mantiene actualizado.
exports.syncGoogleRatingScheduled = onSchedule(
  { schedule: 'every 6 hours', region: 'us-central1', secrets: [PLACES_API_KEY] },
  async () => {
    await syncGoogleRating(PLACES_API_KEY.value());
  }
);

// Endpoint manual de respaldo: útil para probar la sincronización a mano
// (desde el navegador o con curl) sin esperar 6 horas, y para forzar la
// primera sincronización justo después de desplegar.
exports.syncGoogleRatingNow = onRequest(
  { region: 'us-central1', secrets: [PLACES_API_KEY] },
  async (req, res) => {
    try {
      const payload = await syncGoogleRating(PLACES_API_KEY.value());
      res.status(200).json({ ok: true, payload });
    } catch (err) {
      logger.error(err);
      res.status(500).json({ ok: false, error: String(err) });
    }
  }
);
