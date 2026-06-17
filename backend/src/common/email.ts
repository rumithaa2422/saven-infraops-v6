import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { prisma } from './prisma.js';

export async function createTransporter() {
  if (!env.EMAIL_ENABLED) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });
}

export async function sendActivationEmail(user: { name: string; email: string }, activationUrl: string) {
  const subject = 'Welcome to Saven InfraOps Command Center';
  const body = `
Hello ${user.name},

Your account has been created successfully.

Please click the link below to activate your account and set your password:

${activationUrl}

This link expires in 24 hours.

Regards,
Saven InfraOps Team
`.trim();

  if (!env.EMAIL_ENABLED) {
    console.log(`[EMAIL MOCK] To: ${user.email}\nSubject: ${subject}\n\n${body}\n`);
    await prisma.notificationLog.create({
      data: {
        channel: 'email',
        recipient: user.email,
        subject,
        body,
        status: 'MOCK_SENT'
      }
    });
    return { success: true, mock: true };
  }

  try {
    const transporter = await createTransporter();
    if (!transporter) {
      throw new Error('Email transporter not configured');
    }

    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: user.email,
      subject,
      text: body
    });

    await prisma.notificationLog.create({
      data: {
        channel: 'email',
        recipient: user.email,
        subject,
        body,
        status: 'SENT'
      }
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    await prisma.notificationLog.create({
      data: {
        channel: 'email',
        recipient: user.email,
        subject,
        body,
        status: 'FAILED',
        error: errorMessage
      }
    });

    console.error(`Failed to send activation email to ${user.email}:`, error);
    return { success: false, error: errorMessage };
  }
}
