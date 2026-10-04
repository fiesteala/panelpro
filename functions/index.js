const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Resend } = require("resend");

const stripe = require("stripe")("sk_test_51TBrAV3BmYGrtpk6CaPVIyuSxJzcMyGEW8RZ5GwkTAwzLkNM06rijsWSN7NPihF1dvaSiTd6IF7r9SYQZZReRiDp00EYUGqzqO"); 
const cors = require("cors")({ origin: true });
const resend = new Resend("re_gs7VfBsA_nXDzjE181fhzFWD2TCCAcwCm");

admin.initializeApp();

exports.crearBovedaVIP = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { paymentMethodId, plan, precio, nombre, email, fecha, telefono } = req.body;
      const cleanEmail = email.trim().toLowerCase();

      const precioLimpio = parseInt(precio.replace(/,/g, ''));
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: precioLimpio * 100, 
        currency: "mxn",
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' }
      });

      const slug = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const eventId = slug + '-' + Math.random().toString(36).slice(-4);

      let passwordTemporal = Math.random().toString(36).slice(-8) + "Baulia!";
      let esRecurrente = false;

      try {
        await admin.auth().createUser({ email: cleanEmail, password: passwordTemporal, displayName: nombre });
      } catch (authError) {
        if (authError.code === 'auth/email-already-exists' || authError.code === 'auth/email-already-in-use') {
          esRecurrente = true;
          passwordTemporal = "Tu contraseña actual de Baulia";
        } else throw authError;
      }

      let planLimpio = 'oro';
      if (plan.toLowerCase().includes('diamante')) planLimpio = 'diamante';
      if (plan.toLowerCase().includes('plata') || plan.toLowerCase().includes('firma')) planLimpio = 'plata';
      if (plan.toLowerCase().includes('basico') || plan.toLowerCase().includes('esencial')) planLimpio = 'basico';
      if (plan.toLowerCase().includes('social_wall')) planLimpio = 'social_wall'; 
      if (plan.toLowerCase().includes('security_kit')) planLimpio = 'security_kit'; 

      const roleAsignado = plan.toLowerCase().includes('planner') ? 'planner' : 'cliente';

      await admin.firestore().collection("usuarios").doc(eventId).set({
        email: cleanEmail,
        role: roleAsignado,
        plan: planLimpio,
        tipoEvento: 'boda', 
        eventId: eventId,
        nombres: nombre,
        fecha: fecha || '',
        telefono: telefono || '',
        status: 'nuevo',
        creadoPor: 'Stripe (Web Automático)',
        referenciaPago: `Stripe: ${paymentIntent.id}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isQrEnabled: planLimpio !== 'social_wall', 
        isPassCountEnabled: planLimpio !== 'social_wall'
      });

      await admin.firestore().collection("eventos").doc(eventId).set({
        presupuestoTotal: 150000,
        nombres: nombre,
        fecha: fecha || '',
        plan: planLimpio,
        tipoEvento: 'boda',
        isQrEnabled: planLimpio !== 'social_wall',
        isPassCountEnabled: planLimpio !== 'social_wall'
      });

      const mesAnioActual = new Date().toISOString().slice(0, 7);
      await admin.firestore().collection("ventas").doc(eventId).set({
        fecha: admin.firestore.FieldValue.serverTimestamp(),
        mesAnio: mesAnioActual,
        monto: precioLimpio,
        plan: planLimpio,
        vendedor: 'Stripe (Web Automático)',
        referencia: `Stripe: ${paymentIntent.id}`,
        cliente: nombre
      });

      res.status(200).send({ success: true, eventId: eventId, mensaje: "Cobro exitoso" });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
});