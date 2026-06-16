import { prisma } from '../../common/prisma.js';
import { env } from '../../config/env.js';
import { runAiProvider } from './providers/providerFactory.js';

export async function askAi(input: { question: string; userId?: string }) {
  const q = input.question.toLowerCase();

  let records: unknown = undefined;
  let answer = '';
  let cards: Array<{ title: string; value?: string; description?: string; href?: string }> = [];

  if (q.includes('service request') || q.includes('ticket')) {
    const [count, latest, breached] = await Promise.all([
      prisma.serviceRequest.count({ where: { status: { notIn: ['CLOSED', 'RESOLVED'] } } }),
      prisma.serviceRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.serviceRequest.count({ where: { dueAt: { lt: new Date() }, status: { notIn: ['CLOSED', 'RESOLVED'] } } })
    ]);
    records = latest;
    answer = `There are ${count} open service requests. SLA breached count is ${breached}.`;
    cards = latest.map((item) => ({ title: item.ticketNo, value: item.priority, description: item.title, href: '/service-requests' }));
  } else if (q.includes('incident')) {
    const count = await prisma.incident.count({ where: { status: { notIn: ['CLOSED', 'RESOLVED'] } } });
    const latest = await prisma.incident.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
    records = latest;
    answer = `There are ${count} open incidents.`;
    cards = latest.map((item) => ({ title: item.incidentNo, value: item.severity, description: item.title, href: '/incidents' }));
  } else if (q.includes('asset') || q.includes('inventory') || q.includes('laptop')) {
    const available = await prisma.asset.count({ where: { status: 'AVAILABLE' } });
    const latest = await prisma.asset.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
    records = latest;
    answer = `There are ${available} available assets.`;
    cards = latest.map((item) => ({ title: item.assetNo, value: item.status, description: `${item.assetType} ${item.make || ''}`, href: '/inventory' }));
  } else if (q.includes('compliance') || q.includes('audit')) {
    const pending = await prisma.complianceControl.count({ where: { status: { notIn: ['CLOSED', 'RESOLVED'] } } });
    const latest = await prisma.complianceControl.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
    records = latest;
    answer = `There are ${pending} pending compliance controls.`;
    cards = latest.map((item) => ({ title: item.controlNo, value: item.riskRating, description: item.title, href: '/compliance' }));
  } else {
    const providerAnswer = await runAiProvider(input.question);
    answer = providerAnswer.answer;
    records = providerAnswer.raw;
  }

  await prisma.aiConversation.create({
    data: {
      userId: input.userId,
      question: input.question,
      answer,
      provider: env.AI_PROVIDER,
      sourceJson: records as any
    }
  });

  return { answer, cards, provider: env.AI_PROVIDER };
}
