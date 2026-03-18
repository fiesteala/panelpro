const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Resend } = require("resend");

// 🔴 1. TU CLAVE SECRETA DE STRIPE (Empieza con sk_test_...)
const stripe = require("stripe")("sk_test_51TBrAV3BmYGrtpk6CaPVIyuSxJzcMyGEW8RZ5GwkTAwzLkNM06rijsWSN7NPihF1dvaSiTd6IF7r9SYQZZReRiDp00EYUGqzqO"); 
const cors = require("cors")({ origin: true });

// 🔴 2. TU LLAVE DE RESEND (El Cartero Automático)
const resend = new Resend("re_gs7VfBsA_nXDzjE181fhzFWD2TCCAcwCm");

admin.initializeApp();

exports.crearBovedaVIP = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { paymentMethodId, plan, precio, nombre, email, fecha } = req.body;

      console.log(`Iniciando cobro para: ${email} por el plan ${plan}`);

      const precioLimpio = parseInt(precio.replace(/,/g, ''));
      
      // COBRO CON STRIPE
      const paymentIntent = await stripe.paymentIntents.create({
        amount: precioLimpio * 100, 
        currency: "mxn",
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' }
      });

      console.log("Cobro exitoso. Creando Bóveda...");

      // CREACIÓN DE USUARIO Y CONTRASEÑA
      const passwordTemporal = Math.random().toString(36).slice(-8) + "Baulia!";
      const userRecord = await admin.auth().createUser({
        email: email.trim().toLowerCase(),
        password: passwordTemporal,
        displayName: nombre,
      });

      const eventId = userRecord.uid; 
      const planLimpio = plan.toLowerCase().includes('diamante') ? 'diamante' : 'oro';
      const roleAsignado = plan.toLowerCase().includes('planner') ? 'planner' : 'cliente';

      // CREACIÓN DE BASES DE DATOS
      await admin.firestore().collection("usuarios").doc(eventId).set({
        email: email.trim().toLowerCase(),
        role: roleAsignado,
        plan: planLimpio,
        tipoEvento: 'boda', 
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

      // 🔴 3. EL CARTERO AUTOMÁTICO ENTRA EN ACCIÓN 💌
      console.log("Enviando correo de bienvenida a:", email);
      
      const emailHtml = `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; background-color: #050505; color: #ffffff; border-radius: 10px;">
          <h1 style="color: #f59e0b; text-align: center; margin-bottom: 5px;">¡Bienvenido a Baulia!</h1>
          <p style="color: #cbd5e1; font-size: 16px; text-align: center; margin-top: 0;">Tu Bóveda Privada ha sido creada.</p>
          
          <p style="color: #cbd5e1; font-size: 16px; margin-top: 30px;">Hola <b>${nombre}</b>,</p>
          <p style="color: #cbd5e1; font-size: 16px;">Tu pago ha sido procesado con éxito y tu plataforma está lista para usarse.</p>
          
          <div style="background-color: #111111; padding: 20px; border-radius: 8px; margin: 30px 0; border: 1px solid #333333;">
            <p style="margin: 0 0 15px 0; color: #f59e0b; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">Tus Credenciales de Acceso</p>
            <p style="margin: 8px 0; color: #ffffff; font-size: 15px;"><b>Usuario:</b> ${email.trim().toLowerCase()}</p>
            <p style="margin: 8px 0; color: #ffffff; font-size: 15px;"><b>Contraseña temporal:</b> <span style="font-family: monospace; background: #222; padding: 4px 8px; border-radius: 4px; color: #6ee7b7;">${passwordTemporal}</span></p>
          </div>

          <p style="text-align: center; margin-top: 40px; margin-bottom: 40px;">
            <a href="https://panel.baulia.com" style="background-color: #f59e0b; color: #050505; padding: 16px 32px; text-decoration: none; font-weight: bold; border-radius: 50px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Entrar a mi Panel</a>
          </p>
          
          <p style="color: #64748b; font-size: 11px; text-align: center; border-top: 1px solid #333; padding-top: 20px;">
            Si tienes problemas para acceder, responde a este correo.<br><br>
            © ${new Date().getFullYear()} Baulia Premium Software.
          </p>
        </div>
      `;

      await resend.emails.send({
        from: 'Baulia VIP <onboarding@resend.dev>', // Usamos el correo de prueba de Resend por ahora
        to: email.trim().toLowerCase(),
        subject: '🗝️ Tus accesos a la Bóveda Baulia',
        html: emailHtml
      });

      // CONFIRMACIÓN A LA PÁGINA WEB
      res.status(200).send({ 
        success: true, 
        eventId: eventId,
        mensaje: "¡Cobro exitoso, bóveda creada y correo enviado!"
      });

    } catch (error) {
      console.error("Error crítico en el servidor:", error);
      res.status(500).send({ error: error.message });
    }
  });
});