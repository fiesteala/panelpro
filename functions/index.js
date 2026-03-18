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

      // CREACIÓN DE USUARIO Y CONTRASEÑA EN FIREBASE
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

      // 🔴 3. EL CARTERO AUTOMÁTICO - CORREO VIP DE LUJO 💌
      console.log("Enviando correo VIP de bienvenida a:", email);
      
      const emailHtml = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 0; background-color: #0a0a0a; color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <div style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 28px; margin: 0; letter-spacing: 2px; text-transform: uppercase;">Bienvenido a la Élite</h1>
            <p style="color: #fef3c7; font-size: 14px; margin-top: 10px; font-weight: 300; letter-spacing: 1px;">Tu Bóveda Digital está lista</p>
          </div>

          <div style="padding: 40px 30px; background-color: #111111;">
            <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-top: 0;">Hola <strong style="color: #ffffff;">${nombre}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1;">Es un honor para nosotros ser parte de tu evento. Hemos preparado tu <b>Panel de Control Premium</b>, diseñado para darte el poder absoluto sobre cada detalle de tu celebración sin el estrés habitual.</p>
            
            <div style="margin: 35px 0; background-color: #050505; border: 1px solid #333333; border-radius: 12px; padding: 25px; text-align: center;">
              <p style="margin: 0 0 15px 0; color: #d97706; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">Tus Credenciales de Acceso Seguras</p>
              <p style="margin: 10px 0; color: #94a3b8; font-size: 14px;">Usuario: <br><strong style="color: #ffffff; font-size: 16px;">${email.trim().toLowerCase()}</strong></p>
              <p style="margin: 10px 0; color: #94a3b8; font-size: 14px;">Contraseña Temporal: <br><strong style="font-family: monospace; background: #1e293b; padding: 6px 12px; border-radius: 6px; color: #34d399; font-size: 18px; letter-spacing: 2px;">${passwordTemporal}</strong></p>
              <p style="margin-top: 15px; font-size: 11px; color: #64748b;"><i>* Te recomendamos guardar este correo en un lugar seguro.</i></p>
            </div>

            <h3 style="color: #ffffff; font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px;">¿Qué sigue ahora?</h3>
            <ul style="color: #cbd5e1; font-size: 14px; line-height: 1.8; padding-left: 20px; margin-bottom: 35px;">
              <li style="margin-bottom: 10px;"><strong>1. Accede a tu Bóveda:</strong> Entra al panel usando el botón de abajo y tus credenciales.</li>
              <li style="margin-bottom: 10px;"><strong>2. Diseña tu Espacio:</strong> Asigna lugares, mesas, y configura tu presupuesto.</li>
              <li style="margin-bottom: 10px;"><strong>3. Relájate:</strong> Deja que la tecnología de Baulia haga el trabajo pesado mientras tú disfrutas.</li>
            </ul>

            <div style="text-align: center;">
              <a href="https://panel.baulia.com" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000000; padding: 16px 40px; text-decoration: none; font-weight: bold; border-radius: 50px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);">Desbloquear mi Bóveda</a>
            </div>
          </div>
          
          <div style="background-color: #050505; padding: 30px 20px; text-align: center; border-top: 1px solid #222222;">
            <p style="color: #64748b; font-size: 12px; margin: 0 0 10px 0;">¿Necesitas ayuda? Responde a este correo y nuestro equipo VIP te asistirá al instante.</p>
            <p style="color: #475569; font-size: 10px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">© ${new Date().getFullYear()} Baulia Premium Software</p>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: 'Equipo Baulia <hola@baulia.com>', 
        to: email.trim().toLowerCase(),
        subject: '🗝️ Tu Bóveda Digital está lista - Accesos Baulia',
        html: emailHtml
      });

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