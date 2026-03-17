const functions = require("firebase-functions");
const admin = require("firebase-admin");
// 🔴 1. PON TU CLAVE SECRETA DE STRIPE AQUÍ ABAJO (Empieza con sk_test_...)
const stripe = require("stripe")("sk_test_51TBrAV3BmYGrtpk6CaPVIyuSxJzcMyGEW8RZ5GwkTAwzLkNM06rijsWSN7NPihF1dvaSiTd6IF7r9SYQZZReRiDp00EYUGqzqO"); 
const cors = require("cors")({ origin: true });

admin.initializeApp();

// Este es el robot que escuchará a la Landing Page
exports.crearBovedaVIP = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // 1. Recibimos los datos del formulario de la web
      const { paymentMethodId, plan, precio, nombre, email, fecha } = req.body;

      // 2. Procesamos el pago en Stripe (Le quitamos comas al precio y pasamos a centavos)
      const precioLimpio = parseInt(precio.replace(/,/g, ''));
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: precioLimpio * 100, // Stripe cobra en centavos (ej. 199000 = $1,990.00 MXN)
        currency: "mxn",
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' }
      });

      // 3. ¡PAGO EXITOSO! Generamos contraseña y creamos cuenta en Firebase
      const passwordTemporal = Math.random().toString(36).slice(-8) + "Baulia!";
      const userRecord = await admin.auth().createUser({
        email: email.trim().toLowerCase(),
        password: passwordTemporal,
        displayName: nombre,
      });

      const eventId = userRecord.uid; // El ID único e irrepetible
      const planLimpio = plan.toLowerCase().includes('diamante') ? 'diamante' : 'oro';
      const roleAsignado = plan.toLowerCase().includes('planner') ? 'planner' : 'cliente';

      // 4. Construimos la Bóveda en la Base de Datos
      await admin.firestore().collection("usuarios").doc(eventId).set({
        email: email.trim().toLowerCase(),
        role: roleAsignado,
        plan: planLimpio,
        tipoEvento: 'boda', // Por defecto boda, el SuperAdmin lo puede cambiar luego
        eventId: eventId,
        nombres: nombre,
        status: 'activo',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await admin.firestore().collection("eventos").doc(eventId).set({
        presupuestoTotal: 150000,
        nombres: nombre,
        fecha: fecha,
        plan: planLimpio,
        tipoEvento: 'boda'
      });

      // 5. Enviamos la confirmación de éxito de regreso a la página web
      res.status(200).send({ 
        success: true, 
        eventId: eventId,
        mensaje: "¡Cobro exitoso y bóveda creada en la nube!"
      });

    } catch (error) {
      console.error("Error crítico en el servidor:", error);
      res.status(500).send({ error: error.message });
    }
  });
});