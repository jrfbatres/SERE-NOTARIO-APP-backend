const nodemailer = require('nodemailer');

async function testEmail() {
  try {
    console.log('Creando transportador SMTP...');
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: 'admin@serenotario.com',
        pass: 'VCamila26.'
      }
    });

    console.log('Verificando conexión SMTP...');
    await transporter.verify();
    console.log('Conexión SMTP exitosa. El servidor está listo para enviar mensajes.');

    // Opcional: enviar un correo de prueba
    console.log('Enviando correo de prueba a jrfbatres@gmail.com...');
    const info = await transporter.sendMail({
      from: '"Seré Notario Test" <admin@serenotario.com>',
      to: 'jrfbatres@gmail.com',
      subject: 'Prueba de configuración SMTP - Seré Notario',
      text: '¡Hola! Este es un correo de prueba enviado desde la aplicación Seré Notario para verificar que la configuración de Hostinger hacia correos externos funciona correctamente.'
    });

    console.log('Correo enviado exitosamente. ID:', info.messageId);
  } catch (error) {
    console.error('Error durante la prueba SMTP:', error);
  }
}

testEmail();
