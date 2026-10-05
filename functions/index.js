const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Resend } = require("resend");
const { onSchedule } = require("firebase-functions/v2/scheduler");

const cors = require("cors")({ origin: true });
const resend = new Resend(process.env.RESEND_KEY || "re_llave_de_respaldo_temporal_123");

admin.initializeApp();

// ==============================================================
// 🔴 1. MOTOR DE TELEGRAM
// ==============================================================
const notificarTelegram = async (mensaje) => {
  const botToken = "8654962436:AAHeXUs1s7PaQfZ48TRmf3Ox5b6t2X_yNyA";
  const chatId = "-5226537354";
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: mensaje, parse_mode: 'HTML' })
    });
  } catch (error) {
    console.error("Fallo al enviar a Telegram", error);
  }
};

// ==============================================================
// 🔴 2. VENTA POR STRIPE (PAGOS INMEDIATOS / TARJETA)
// ==============================================================
exports.crearBovedaVIP = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const stripe = require("stripe")(process.env.STRIPE_SECRET);

      const { paymentMethodId, plan, precio, nombre, email, fecha, telefono } = req.body;
      const cleanEmail = email.trim().toLowerCase();
      const precioLimpio = parseInt(precio.toString().replace(/,/g, ''));
      
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
          // 🟢 TEXTO CORREGIDO PARA CLIENTES RECURRENTES
          passwordTemporal = "Detectamos que ya eres cliente VIP. Inicia sesión con tu cuenta actual. Si no la recuerdas, haz clic en 'Olvidé mi contraseña' en la pantalla principal.";
        } else {
          throw authError;
        }
      }

      let planLimpio = 'oro';
      if (plan.toLowerCase().includes('diamante')) planLimpio = 'diamante';
      if (plan.toLowerCase().includes('plata') || plan.toLowerCase().includes('firma')) planLimpio = 'plata';
      if (plan.toLowerCase().includes('basico') || plan.toLowerCase().includes('esencial')) planLimpio = 'basico';
      if (plan.toLowerCase().includes('social_wall')) planLimpio = 'social_wall'; 
      if (plan.toLowerCase().includes('security_kit')) planLimpio = 'security_kit'; 

      const roleAsignado = plan.toLowerCase().includes('planner') ? 'planner' : 'cliente';

      await admin.firestore().collection("usuarios").doc(eventId).set({
        email: cleanEmail, role: roleAsignado, plan: planLimpio, tipoEvento: 'boda', 
        eventId: eventId, nombres: nombre, fechaEvento: fecha || '', telefono: telefono || '',
        status: 'nuevo', creadoPor: 'Stripe (Web Automático)', referenciaPago: `Stripe: ${paymentIntent.id}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isQrEnabled: planLimpio !== 'social_wall', isPassCountEnabled: planLimpio !== 'social_wall'
      });

      await admin.firestore().collection("eventos").doc(eventId).set({
        presupuestoTotal: 150000, nombres: nombre, fecha: fecha || '', plan: planLimpio, tipoEvento: 'boda',
        isQrEnabled: planLimpio !== 'social_wall', isPassCountEnabled: planLimpio !== 'social_wall'
      });

      const mesAnioActual = new Date().toISOString().slice(0, 7);
      await admin.firestore().collection("ventas").doc(eventId).set({
        fecha: admin.firestore.FieldValue.serverTimestamp(), mesAnio: mesAnioActual,
        monto: precioLimpio, plan: planLimpio, vendedor: 'Stripe (Web Automático)',
        referencia: `Stripe: ${paymentIntent.id}`, cliente: nombre
      });

      let mensajeAtencion = "Un asesor de diseño se pondrá en contacto contigo a la brevedad posible para afinar los detalles.";
      try {
        const utcDate = new Date();
        const mxDate = new Date(utcDate.getTime() - (3600000 * 6));
        const horaActual = mxDate.getHours();
        if (horaActual < 8 || horaActual >= 16) {
          mensajeAtencion = "Hemos recibido tu compra. Un asesor de diseño te contactará a primera hora el día de mañana (Horario laboral: 8am - 4pm).";
        }
      } catch (e) { console.error("Error al calcular horario:", e); }

      try {
        await resend.emails.send({
          from: "Baulia <hola@baulia.com>",
          to: cleanEmail,
          subject: "¡Tus accesos de Baulia están listos!",
          html: `<div style="font-family: sans-serif; text-align: center; padding: 20px;">
                  <h2>¡Bienvenido a Baulia, ${nombre}!</h2>
                  <p>Tu Centro de Operaciones ya está configurado y listo para usarse.</p>
                  <p style="color: #475569; font-size: 14px; font-weight: bold; margin: 20px 0;">${mensajeAtencion}</p>
                  <div style="background-color: #f8fafc; padding: 15px; border-radius: 10px; margin: 20px 0;">
                    <p><b>Usuario:</b> ${cleanEmail}</p>
                    <p><b>Contraseña:</b> ${passwordTemporal}</p>
                  </div>
                  <p>Inicia sesión en panel.baulia.com</p>
                  ${!esRecurrente ? `<p style="font-size: 12px; color: #dc2626; font-weight: bold; margin-top: 25px;">Por tu seguridad y comodidad, te recomendamos ir a 'Ajustes' y cambiar tu contraseña temporal como primer paso.</p>` : ''}
                </div>`
        });
      } catch (emailError) { console.error("Error crítico de Resend en Stripe:", emailError); }

      const msgVenta = `🎉 <b>¡NUEVA VENTA CERRADA (TARJETA)!</b>\n\n👤 <b>Cliente:</b> ${nombre}\n💎 <b>Plan:</b> ${planLimpio.toUpperCase()}\n📅 <b>Fecha del Evento:</b> ${fecha || 'Pendiente'}\n📱 <b>WhatsApp:</b> ${telefono || 'Pendiente'}\n\n<i>¿Quién del equipo toma esta bóveda? 👩‍🎨👨‍🎨</i>`;
      await notificarTelegram(msgVenta);

      res.status(200).send({ success: true, eventId: eventId, mensaje: "Cobro exitoso" });
    } catch (error) {
      console.error("Error general en crearBovedaVIP:", error);
      res.status(500).send({ error: error.message });
    }
  });
});

// ==============================================================
// 🔴 3. CREACIÓN MANUAL
// ==============================================================
exports.enviarCorreoManual = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { email, password, nombre } = req.body;
      
      let mensajeAtencion = "Un asesor de diseño se pondrá en contacto contigo a la brevedad posible para afinar los detalles.";
      try {
        const utcDate = new Date();
        const mxDate = new Date(utcDate.getTime() - (3600000 * 6));
        const horaActual = mxDate.getHours();
        if (horaActual < 8 || horaActual >= 16) {
          mensajeAtencion = "Hemos recibido tu compra. Un asesor de diseño te contactará a primera hora el día de mañana (Horario laboral: 8am - 4pm).";
        }
      } catch (e) { console.error("Error horario manual:", e); }
      
      await resend.emails.send({
        from: "Baulia <hola@baulia.com>",
        to: email,
        subject: "¡Tus accesos de Baulia están listos!",
        html: `<div style="font-family: sans-serif; text-align: center; padding: 20px;">
                <h2>¡Bienvenido a Baulia, ${nombre}!</h2>
                <p>Tu asesor ha creado y configurado tu Centro de Operaciones.</p>
                <p style="color: #475569; font-size: 14px; font-weight: bold; margin: 20px 0;">${mensajeAtencion}</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 10px; margin: 20px 0;">
                  <p><b>Usuario:</b> ${email}</p>
                  <p><b>Contraseña temporal:</b> ${password}</p>
                </div>
                <p>Inicia sesión en panel.baulia.com</p>
                <p style="font-size: 12px; color: #dc2626; font-weight: bold; margin-top: 25px;">Por tu seguridad y comodidad, te recomendamos ir a 'Ajustes' y cambiar tu contraseña como primer paso.</p>
              </div>`
      });
      res.status(200).send({ success: true });
    } catch (error) {
      console.error("Error en enviarCorreoManual:", error);
      res.status(500).send({ error: error.message });
    }
  });
});

// ==============================================================
// 🔴 4. ROBOT DE LIMPIEZA DIARIA (V2)
// ==============================================================
exports.archivarEventosPasados = onSchedule({
  schedule: "0 9 * * *",
  timeZone: "America/Mexico_City"
}, async (event) => {
  const db = admin.firestore();
  const hoy = new Date();
  const limite90Dias = new Date();
  limite90Dias.setDate(hoy.getDate() - 90);
  let caducados = [];

  try {
    const snapshot = await db.collection("usuarios").where("status", "!=", "archivado").get();
    if (snapshot.empty) return null;
    const batch = db.batch();

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.fechaEvento) {
        const fechaDelEvento = new Date(data.fechaEvento);
        if (!isNaN(fechaDelEvento.getTime()) && fechaDelEvento < limite90Dias) {
          batch.update(doc.ref, { status: "archivado" });
          const urlCompleta = data.urlInvitacion || '';
          const carpetaExacta = urlCompleta.split('/').filter(Boolean).pop() || 'Sin_Link_Asignado';
          caducados.push({ nombre: data.nombres, carpeta: carpetaExacta });
        }
      }
    });

    if (caducados.length > 0) {
      await batch.commit(); 
      let listaTelegram = caducados.map(c => `• ${c.nombre} -> Carpeta: <b>${c.carpeta}</b>`).join('\n');
      let listaHTML = caducados.map(c => `<li style="margin-bottom: 10px;"><b>${c.nombre}</b><br>Carpeta a borrar: <b style="color: #dc2626;">${c.carpeta}</b></li>`).join('');
      const mensajeAlerta = `⚠️ <b>Recuerda respaldar estas carpetas en tu computadora antes de borrarlas de public.</b>`;

      await notificarTelegram(`🧹 <b>BÓVEDAS CADUCADAS (90 DÍAS)</b>\n\nEl sistema archivó hoy ${caducados.length} evento(s):\n\n${listaTelegram}\n\n${mensajeAlerta}`);

      await resend.emails.send({
        from: "Baulia System <hola@baulia.com>",
        to: "tu_correo@hotmail.com", 
        subject: `🧹 Limpieza Baulia: ${caducados.length} bóvedas caducadas`,
        html: `<div style="font-family: sans-serif; padding: 20px;"><h2>Reporte Diario</h2><ul style="background: #f8fafc; padding: 20px;">${listaHTML}</ul></div>`
      });
    }
    return null;
  } catch (error) {
    console.error("Error limpieza automática:", error);
    return null;
  }
});

// ==============================================================
// 🔴 5. EL VIGILANTE (WEBHOOK DE STRIPE PARA OXXO Y SPEI)
// ==============================================================
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET);
  const endpointSecret = "whsec_opoV6M6Foq6E9Aqiyh32iv9dcaKcrUr3"; 
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error(`⚠️ Error de firma en Webhook: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const metadatos = paymentIntent.metadata;

    // Solo procesamos si el pago trae datos de Baulia
    if (metadatos && metadatos.email && metadatos.nombre) {
      
      // 🔴 1. Quitamos 'precio' de esta lista porque no viene en la metadata
      const { plan, nombre, email, fecha, telefono } = metadatos; 
      const cleanEmail = email.trim().toLowerCase();
      
      // 🔴 2. SOLUCIÓN: Tomamos el precio exacto directamente del cobro real de Stripe
      const precioLimpio = paymentIntent.amount / 100;
      
      const slug = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const eventId = slug + '-' + Math.random().toString(36).slice(-4);

      let passwordTemporal = Math.random().toString(36).slice(-8) + "Baulia!";
      let esRecurrente = false;

      try {
        await admin.auth().createUser({ email: cleanEmail, password: passwordTemporal, displayName: nombre });
      } catch (authError) {
        if (authError.code === 'auth/email-already-exists' || authError.code === 'auth/email-already-in-use') {
          esRecurrente = true;
          passwordTemporal = "Detectamos que ya eres cliente VIP. Inicia sesión con tu cuenta actual. Si no la recuerdas, haz clic en 'Olvidé mi contraseña' en la pantalla principal.";
        }
      }

      let planLimpio = 'oro';
      if (plan.toLowerCase().includes('diamante')) planLimpio = 'diamante';
      if (plan.toLowerCase().includes('plata') || plan.toLowerCase().includes('firma')) planLimpio = 'plata';
      if (plan.toLowerCase().includes('basico') || plan.toLowerCase().includes('esencial')) planLimpio = 'basico';
      if (plan.toLowerCase().includes('social_wall')) planLimpio = 'social_wall'; 
      if (plan.toLowerCase().includes('security_kit')) planLimpio = 'security_kit'; 

      const roleAsignado = plan.toLowerCase().includes('planner') ? 'planner' : 'cliente';

      await admin.firestore().collection("usuarios").doc(eventId).set({
        email: cleanEmail, role: roleAsignado, plan: planLimpio, tipoEvento: 'boda', 
        eventId: eventId, nombres: nombre, fechaEvento: fecha || '', telefono: telefono || '',
        status: 'nuevo', creadoPor: 'Stripe (OXXO/SPEI Automático)', referenciaPago: `Webhook: ${paymentIntent.id}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isQrEnabled: planLimpio !== 'social_wall', isPassCountEnabled: planLimpio !== 'social_wall'
      });

      await admin.firestore().collection("eventos").doc(eventId).set({
        presupuestoTotal: 150000, nombres: nombre, fecha: fecha || '', plan: planLimpio, tipoEvento: 'boda',
        isQrEnabled: planLimpio !== 'social_wall', isPassCountEnabled: planLimpio !== 'social_wall'
      });

      const mesAnioActual = new Date().toISOString().slice(0, 7);
      await admin.firestore().collection("ventas").doc(eventId).set({
        fecha: admin.firestore.FieldValue.serverTimestamp(), mesAnio: mesAnioActual,
        monto: precioLimpio, plan: planLimpio, vendedor: 'Stripe (OXXO/SPEI Automático)',
        referencia: `Webhook: ${paymentIntent.id}`, cliente: nombre
      });

      let mensajeAtencion = "Un asesor de diseño se pondrá en contacto contigo a la brevedad posible para afinar los detalles.";
      try {
        const utcDate = new Date();
        const mxDate = new Date(utcDate.getTime() - (3600000 * 6));
        const horaActual = mxDate.getHours();
        if (horaActual < 8 || horaActual >= 16) {
          mensajeAtencion = "Hemos detectado tu pago y activado tu cuenta. Un asesor de diseño te contactará a primera hora el día de mañana (Horario laboral: 8am - 4pm).";
        }
      } catch (e) {}

      try {
        await resend.emails.send({
          from: "Baulia <hola@baulia.com>",
          to: cleanEmail,
          subject: "¡Tu pago ha sido acreditado y tus accesos están listos!",
          html: `<div style="font-family: sans-serif; text-align: center; padding: 20px;">
                  <h2>¡Bienvenido a Baulia, ${nombre}!</h2>
                  <p>Hemos confirmado tu pago y tu Centro de Operaciones ya está configurado.</p>
                  <p style="color: #475569; font-size: 14px; font-weight: bold; margin: 20px 0;">${mensajeAtencion}</p>
                  <div style="background-color: #f8fafc; padding: 15px; border-radius: 10px; margin: 20px 0;">
                    <p><b>Usuario:</b> ${cleanEmail}</p>
                    <p><b>Contraseña:</b> ${passwordTemporal}</p>
                  </div>
                  <p>Inicia sesión en panel.baulia.com</p>
                  ${!esRecurrente ? `<p style="font-size: 12px; color: #dc2626; font-weight: bold; margin-top: 25px;">Por tu seguridad y comodidad, te recomendamos ir a 'Ajustes' y cambiar tu contraseña temporal como primer paso.</p>` : ''}
                </div>`
        });
      } catch (e) { console.error("Error email Webhook:", e); }

      const msgVenta = `🎉 <b>¡NUEVO PAGO ASÍNCRONO ACREDITADO (OXXO/SPEI)!</b>\n\n👤 <b>Cliente:</b> ${nombre}\n💎 <b>Plan:</b> ${planLimpio.toUpperCase()}\n📅 <b>Fecha del Evento:</b> ${fecha || 'Pendiente'}\n📱 <b>WhatsApp:</b> ${telefono || 'Pendiente'}\n\n<i>¿Quién del equipo toma esta bóveda? 👩‍🎨👨‍🎨</i>`;
      await notificarTelegram(msgVenta);
    }
  }

  res.status(200).send({received: true});
});

// ==============================================================
// 🔴 GENERADOR DE INTENTOS DE PAGO (100% Automático)
// ==============================================================
exports.crearIntentoAsincrono = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  try {
    const stripe = require("stripe")(process.env.STRIPE_SECRET);
    const { precio, plan, nombre, email, fecha, telefono, pais } = req.body;
    const precioLimpio = parseInt(precio.toString().replace(/,/g, ''));

    let customerId;
    const clientesExistentes = await stripe.customers.list({ email: email, limit: 1 });
    
    if (clientesExistentes.data.length > 0) {
      customerId = clientesExistentes.data[0].id;
    } else {
      const nuevoCliente = await stripe.customers.create({ 
        name: nombre, 
        email: email, 
        phone: telefono,
        // CLAVE: Asignar el país desde la creación del cliente
        address: { country: pais } 
      });
      customerId = nuevoCliente.id;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: precioLimpio * 100,
      currency: "mxn",
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      // Dejamos esto para que SPEI funcione sin problema
      payment_method_options: {
        customer_balance: {
          funding_type: 'bank_transfer',
          bank_transfer: { type: 'mx_bank_transfer' }
        }
      },
      metadata: { plan, nombre, email, fecha, telefono, pais }
    });

    res.status(200).send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});