import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_sere_notario_elite_key';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Token inválido o expirado' }, { status: 401 });
    }

    const { nombre, correo, claveTemporal } = await request.json();

    if (!nombre || !correo || !claveTemporal) {
      return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: true,
      auth: {
        user: process.env.SMTP_USER || 'admin@serenotario.com',
        pass: process.env.SMTP_PASS || 'VCamila26.'
      }
    });

    const mailOptions = {
      from: '"Seré Notario" <admin@serenotario.com>',
      to: correo.toLowerCase().trim(),
      subject: '¡Te han invitado a Seré Notario!',
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #191c1e; padding: 30px; text-align: center;">
            <img src="https://serenotario.com/images/logo.png" alt="Seré Notario Logo" style="max-height: 80px; width: auto;" />
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #191c1e; text-align: center; font-size: 24px; margin-top: 0;">¡Hola, ${nombre.trim()}!</h2>
            <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; text-align: center;">
              Has recibido una invitación exclusiva para unirte a la plataforma de preparación <strong style="color: #191c1e;">Seré Notario</strong>.
            </p>
            
            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #d4af37;">
              <p style="margin: 0 0 10px 0; color: #4a4a4a; font-size: 15px;"><strong>Tu usuario de acceso:</strong> <br/><span style="color: #191c1e;">${correo.toLowerCase().trim()}</span></p>
              <p style="margin: 0; color: #4a4a4a; font-size: 15px;"><strong>Tu contraseña temporal:</strong> <br/>
                <span style="display: inline-block; background-color: #ffe088; color: #191c1e; padding: 6px 12px; border-radius: 4px; font-weight: bold; letter-spacing: 2px; margin-top: 5px; font-size: 18px;">${claveTemporal}</span>
              </p>
            </div>

            <p style="color: #4a4a4a; font-size: 15px; line-height: 1.6; text-align: center;">
              Ingresa a nuestra plataforma con estos datos para comenzar tu estudio. Te recomendamos cambiar tu contraseña desde tu perfil una vez que ingreses por primera vez.
            </p>
            
            <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
              <a href="https://www.serenotario.com/login" style="display: inline-block; background-color: #d4af37; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Iniciar Sesión Ahora</a>
            </div>
          </div>
          <div style="background-color: #f1f1f1; padding: 20px; text-align: center;">
            <p style="color: #888888; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Seré Notario. Todos los derechos reservados.</p>
            <p style="color: #888888; font-size: 12px; margin: 5px 0 0 0;">Si no esperabas esta invitación, puedes ignorar este correo.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    return NextResponse.json({ success: false, error: 'Ocurrió un error al enviar el correo' }, { status: 500 });
  }
}
