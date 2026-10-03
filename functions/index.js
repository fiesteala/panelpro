const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Reemplaza 'sk_test_...' por tu Clave Secreta real de Stripe
const stripe = require("stripe")("sk_test_51UMEr4PWwjjZi7vXtofwjzBd3omGGoCLGHEyeZhTDUcW0uE3HN9adfQ25zY5ZQMlab5n9JbcZlEB4aOJtvp8EzoY00irHu6OF7"); 

admin.initializeApp();
const db = admin.firestore();

// La llave maestra que me acabas de dar
const endpointSecret = "whsec_anu7t852lXgGflE932zgxEzaD49ydk8Z";

exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // Verificamos que la notificación es 100% real y viene de Stripe
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error("⚠️ Alerta de seguridad o error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Si el pago entró con éxito a tu cuenta de Stripe
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    
    // Extraemos el correo del cliente que acaba de pagar
    const emailCliente = paymentIntent.receipt_email || "cliente_nuevo@baulia.com"; 

    // Extraemos los metadatos (donde Stripe debe mandarte fecha y teléfono)
    const metadatos = paymentIntent.metadata || {};
    const nombreCliente = metadatos.nombre || "Cliente Nuevo";
    const fechaEvento = metadatos.fecha || "";
    const telefonoCliente = metadatos.telefono || "";

    try {
      // 🔴 MAGIA: Creamos su bóveda automáticamente en tu base de datos
      await db.collection("usuarios").add({
        email: emailCliente.toLowerCase(),
        role: "admin",
        plan: "Oro", // Asignamos un plan base
        eventId: "evento-" + Math.floor(Math.random() * 100000),
        nombres: nombreCliente,
        fecha: fechaEvento,
        telefono: telefonoCliente,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "nuevo" // 🔴 FASE 1: Nace en rojo
      });
      console.log("✅ Bóveda creada con éxito para:", emailCliente);
    } catch (error) {
      console.error("❌ Error creando la cuenta:", error);
    }
  }

  // Le decimos a Stripe que recibimos el pago y procesamos la entrega
  res.json({ received: true });
});