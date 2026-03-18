const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Resend } = require("resend");

// 🔴 1. TU CLAVE SECRETA DE STRIPE
const stripe = require("stripe")("sk_test_51TBrAV3BmYGrtpk6CaPVIyuSxJzcMyGEW8RZ5GwkTAwzLkNM06rijsWSN7NPihF1dvaSiTd6IF7r9SYQZZReRiDp00EYUGqzqO"); 
const cors = require("cors")({ origin: true });

// 🔴 2. TU LLAVE DE RESEND
const resend = new Resend("re_gs7VfBsA_nXDzjE181fhzFWD2TCCAcwCm");

admin.initializeApp();

exports.crearBovedaVIP = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { paymentMethodId, plan, precio, nombre, email, fecha } = req.body;
      const cleanEmail = email.trim().toLowerCase();

      console.log(`Iniciando cobro para: ${cleanEmail} por el plan ${plan}`);

      const precioLimpio = parseInt(precio.replace(/,/g, ''));
      
      // COBRO CON STRIPE
      const paymentIntent = await stripe.paymentIntents.create({
        amount: precioLimpio * 100, 
        currency: "mxn",
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' }
      });

      console.log("Cobro exitoso. Creando Bóveda Multi-Tenant...");

      // 🔴 GENERAMOS UN ID ÚNICO PARA EL EVENTO (Igual que en SuperAdmin)
      const slug = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const eventId = slug + '-' + Math.random().toString(36).slice(-4);

      // CREACIÓN DE USUARIO Y CONTRASEÑA EN FIREBASE (CON SOPORTE A CLIENTES RECURRENTES)
      let passwordTemporal = Math.random().toString(36).slice(-8) + "Baulia!";
      let esRecurrente = false;

      try {
        await admin.auth().createUser({
          email: cleanEmail,
          password: passwordTemporal,
          displayName: nombre,
        });
      } catch (authError) {
        if (authError.code === 'auth/email-already-exists' || authError.code === 'auth/email-already-in-use') {
          // EL CLIENTE YA EXISTE. ¡Excelente, es cliente frecuente!
          esRecurrente = true;
          passwordTemporal = "Tu contraseña actual de Baulia";
          console.log(`Cliente recurrente detectado: ${cleanEmail}`);
        } else {
          throw authError; // Si es un error distinto, sí cortamos la operación
        }
      }

      const planLimpio = plan.toLowerCase().includes('diamante') ? 'diamante' : 'oro';
      const roleAsignado = plan.toLowerCase().includes('planner') ? 'planner' : 'cliente';

      // CREACIÓN DE BASES DE DATOS USANDO EL EVENT_ID ÚNICO
      await admin.firestore().collection("usuarios").doc(eventId).set({
        email: cleanEmail,
        role: roleAsignado,
        plan: planLimpio,
        tipoEvento: 'boda', 
        eventId: eventId,
        nombres: nombre,
        status: 'activo',
        creadoPor: 'Stripe (Web Automático)',
        referenciaPago: `Stripe: ${paymentIntent.id}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await admin.firestore().collection("eventos").doc(eventId).set({
        presupuestoTotal: 150000,
        nombres: nombre,
        fecha: fecha,
        plan: planLimpio,
        tipoEvento: 'boda'
      });

      // 🔴 EL CARTERO AUTOMÁTICO - CORREO VIP DE LUJO 💌
      console.log("Enviando correo VIP de bienvenida a:", cleanEmail);
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAFAFA; margin: 0; padding: 20px; color: #1C1917; }
            .container { max-w: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #EAEAEA; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
            .header { padding: 40px 20px; text-align: center; border-bottom: 1px solid #F5F5F5; }
            .logo-text { font-family: 'Georgia', serif; font-size: 28px; font-weight: bold; color: #1C1917; letter-spacing: 2px; margin: 0; text-transform: uppercase; }
            .gold-accent { color: #D4AF37; font-style: italic; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 18px; color: #1C1917; margin-top: 0; }
            .body-text { font-size: 15px; line-height: 1.6; color: #57534E; }
            .credentials-box { margin: 35px 0; background-color: #FAFAFA; border: 1px solid #F5F5F5; border-radius: 8px; padding: 25px; text-align: center; }
            .cred-label { margin: 0 0 15px 0; color: #D4AF37; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; }
            .cred-item { margin: 10px 0; color: #78716C; font-size: 14px; }
            .cred-value { color: #1C1917; font-size: 16px; font-weight: bold; }
            .password-pill { font-family: monospace; background: #F5F5F5; padding: 6px 12px; border-radius: 6px; color: #1C1917; font-size: 16px; letter-spacing: 1px; border: 1px solid #EAEAEA; }
            .btn-container { text-align: center; margin: 40px 0; }
            .btn { display: inline-block; background-color: #1C1917; color: #FFFFFF !important; padding: 16px 40px; text-decoration: none; font-weight: bold; border-radius: 50px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
            .footer { background-color: #FAFAFA; padding: 30px 20px; text-align: center; border-top: 1px solid #EAEAEA; }
            .footer-text { color: #A8A29E; font-size: 11px; margin: 0 0 5px 0; }
            .help-text { font-size: 12px; color: #78716C; font-style: italic; margin-top: 20px; }
            
            @media (prefers-color-scheme: dark) {
              body { background-color: #050505; color: #FFFFFF; }
              .container { background-color: #111111; border-color: #222222; }
              .header { border-color: #222222; }
              .logo-text { color: #FFFFFF; }
              .greeting { color: #FFFFFF; }
              .body-text { color: #A8A29E; }
              .credentials-box { background-color: #0A0A0A; border-color: #222222; }
              .cred-value { color: #FFFFFF; }
              .password-pill { background: #1C1917; color: #D4AF37; border-color: #333333; }
              .btn { background-color: #D4AF37; color: #000000 !important; }
              .footer { background-color: #0A0A0A; border-color: #222222; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo-text">Baulia <span class="gold-accent">VIP</span></h1>
            </div>

            <div class="content">
              <p class="greeting">Hola <strong>${nombre}</strong>,</p>
              <p class="body-text">Es un honor para nosotros acompañarte. Hemos preparado tu <b>Bóveda Premium</b>, diseñada para darte el poder absoluto sobre tu evento con la mayor elegancia.</p>
              
              <div class="credentials-box">
                <p class="cred-label">Tus Credenciales de Acceso</p>
                <p class="cred-item">Usuario: <br><span class="cred-value">${cleanEmail}</span></p>
                <p class="cred-item">Contraseña: <br><span class="password-pill">${passwordTemporal}</span></p>
                ${esRecurrente ? '<p class="help-text">Al iniciar sesión, podrás alternar fácilmente entre tus proyectos.</p>' : ''}
                <p class="help-text" style="color: #D4AF37;">¿Olvidaste tu contraseña? Ve al panel, ingresa tu correo y haz clic en "Recuperar aquí".</p>
              </div>

              <div class="btn-container">
                <a href="https://panel.baulia.com" class="btn">Desbloquear Bóveda</a>
              </div>
            </div>
            
            <div class="footer">
              <p class="footer-text">Si necesitas asistencia, simplemente responde a este correo.</p>
              <p class="footer-text" style="text-transform: uppercase; letter-spacing: 1px;">© ${new Date().getFullYear()} Baulia Premium Software</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await resend.emails.send({
        from: 'Equipo Baulia <hola@baulia.com>', 
        to: cleanEmail,
        subject: esRecurrente ? '🗝️ Tu nuevo evento está listo - Baulia' : '🗝️ Tu Bóveda Digital está lista - Accesos Baulia',
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