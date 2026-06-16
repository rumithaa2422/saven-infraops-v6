import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { prisma } from '../../common/prisma.js';

export async function sendEmail(input: { to: string; subject: string; body: string }) {
  if (!env.EMAIL_ENABLED) return { skipped: true, reason: 'Email disabled' };

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined
  });

  try {
    await transporter.sendMail({ from: env.SMTP_FROM, to: input.to, subject: input.subject, text: input.body });
    await prisma.notificationLog.create({ data: { channel: 'EMAIL', recipient: input.to, subject: input.subject, body: input.body, status: 'SENT' } });
    return { sent: true };
  } catch (error) {
    await prisma.notificationLog.create({ data: { channel: 'EMAIL', recipient: input.to, subject: input.subject, body: input.body, status: 'FAILED', error: String(error) } });
    throw error;
  }
}

export async function sendTeamsMessage(input: { title: string; body: string }) {
  if (!env.TEAMS_ENABLED) return { skipped: true, reason: 'Teams disabled' };
  if (!env.TEAMS_WEBHOOK_URL) return { skipped: true, reason: 'Teams webhook missing' };

  const response = await fetch(env.TEAMS_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: `**${input.title}**\n\n${input.body}` })
  });

  const status = response.ok ? 'SENT' : 'FAILED';
  await prisma.notificationLog.create({ data: { channel: 'TEAMS', subject: input.title, body: input.body, status } });
  return { sent: response.ok };
}
