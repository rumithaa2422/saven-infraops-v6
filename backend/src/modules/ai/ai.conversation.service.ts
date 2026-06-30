/**
 * AI Conversation Service
 * 
 * Handles persistence of AI conversations and messages.
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate a title from the first user message
 */
function generateTitle(firstMessage: string): string {
  // Truncate to 40 characters
  const truncated = firstMessage.length > 40 
    ? firstMessage.substring(0, 40) + '...'
    : firstMessage;
  return truncated;
}

/**
 * Create a new conversation
 */
export async function createConversation(userId: string): Promise<{ id: string; title: string }> {
  const conversation = await prisma.aIConversation.create({
    data: {
      title: 'New Chat',
      userId
    }
  });
  
  return {
    id: conversation.id,
    title: conversation.title
  };
}

/**
 * List all conversations for a user (newest first)
 */
export async function listConversations(userId: string): Promise<
  Array<{ id: string; title: string; updatedAt: Date }>
> {
  const conversations = await prisma.aIConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      updatedAt: true
    }
  });
  
  return conversations;
}

/**
 * Get a single conversation with all messages
 */
export async function getConversation(
  userId: string, 
  conversationId: string
): Promise<{ 
  id: string; 
  title: string; 
  messages: Array<{ role: string; content: string; createdAt: Date }>;
} | null> {
  const conversation = await prisma.aIConversation.findFirst({
    where: { 
      id: conversationId,
      userId  // Ensure user can only see their own conversations
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        select: {
          role: true,
          content: true,
          createdAt: true
        }
      }
    }
  });
  
  if (!conversation) {
    return null;
  }
  
  return {
    id: conversation.id,
    title: conversation.title,
    messages: conversation.messages
  };
}

/**
 * Add a message to a conversation
 */
export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  await prisma.aIMessage.create({
    data: {
      conversationId,
      role,
      content
    }
  });
  
  // Update conversation's updatedAt timestamp
  await prisma.aIConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() }
  });
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<void> {
  await prisma.aIConversation.update({
    where: { id: conversationId },
    data: { title }
  });
}

/**
 * Delete a conversation and all its messages
 */
export async function deleteConversation(
  userId: string,
  conversationId: string
): Promise<boolean> {
  const result = await prisma.aIConversation.deleteMany({
    where: {
      id: conversationId,
      userId  // Ensure user can only delete their own conversations
    }
  });
  
  return result.count > 0;
}

/**
 * Check if user owns the conversation
 */
export async function userOwnsConversation(
  userId: string,
  conversationId: string
): Promise<boolean> {
  const count = await prisma.aIConversation.count({
    where: { id: conversationId, userId }
  });
  return count > 0;
}
