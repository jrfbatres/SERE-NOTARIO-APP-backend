import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_sere_notario_elite_key';

export async function POST(request) {
  try {
    const { correo } = await request.json();

    if (!correo) {
      return NextResponse.json({ success: false, error: 'El correo es requerido' }, { status: 400 });
    }

    const correoLower = correo.toLowerCase().trim();

    // Verify if user exists
    const userResult = await query(
      `SELECT id, nombre, correo FROM "notarioElite".usuarios WHERE correo = $1`,
      [correoLower]
    );

    if (userResult.rows.length === 0) {
      // Return success anyway to prevent email enumeration attacks
      return NextResponse.json({ success: true, message: 'Si el correo existe, recibirás un enlace de recuperación.' });
    }

    const user = userResult.rows[0];

    // Generate reset token valid for 1 hour
    const token = jwt.sign(
      { userId: user.id, type: 'reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send email with nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: true,
      auth: {
        user: process.env.SMTP_USER || 'admin@serenotario.com',
        pass: process.env.SMTP_PASS || 'VCamila26.'
      }
    });

    const resetLink = `https://serenotario.com/reset-clave?token=${token}`;

    const mailOptions = {
      from: '"Seré Notario" <admin@serenotario.com>',
      to: correoLower,
      subject: 'Restablecimiento de Contraseña - Seré Notario',
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #191c1e; padding: 30px; text-align: center;">
            <img src="https://serenotario.com/images/logo.png" alt="Seré Notario Logo" style="max-height: 80px; width: auto;" />
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #191c1e; text-align: center; font-size: 24px; margin-top: 0;">Restablecer tu contraseña</h2>
            <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; text-align: center;">
              Hola, <strong>${user.nombre}</strong>. Hemos recibido una solicitud para cambiar tu contraseña en <strong style="color: #191c1e;">Seré Notario</strong>.
            </p>
            
            <p style="color: #4a4a4a; font-size: 15px; line-height: 1.6; text-align: center;">
              Para crear una nueva contraseña, haz clic en el siguiente botón. Este enlace caducará en <strong>1 hora</strong> por seguridad.
            </p>
            
            <div style="text-align: center; margin-top: 40px; margin-bottom: 30px;">
              <a href="${resetLink}" style="display: inline-block; background-color: #d4af37; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Cambiar mi contraseña</a>
            </div>

            <p style="color: #888888; font-size: 13px; line-height: 1.6; text-align: center; border-top: 1px solid #eeeeee; padding-top: 20px;">
              Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:<br/>
              <span style="color: #d4af37; word-break: break-all;">${resetLink}</span>
            </p>
          </div>
          <div style="background-color: #f1f1f1; padding: 20px; text-align: center;">
            <p style="color: #888888; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Seré Notario. Todos los derechos reservados.</p>
            <p style="color: #888888; font-size: 12px; margin: 5px 0 0 0;">Si no solicitaste este cambio, simplemente ignora este correo y tu cuenta seguirá segura.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Si el correo existe, recibirás un enlace de recuperación.' });
  } catch (error) {
    console.error('Error enviando correo de recuperación:', error);
    return NextResponse.json({ success: false, error: 'Ocurrió un error procesando tu solicitud' }, { status: 500 });
  }
}
