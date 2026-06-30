import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { askAi } from './ai.service.js';
import { 
  createConversation, 
  listConversations, 
  getConversation, 
  addMessage,
  updateConversationTitle,
  deleteConversation,
  userOwnsConversation 
} from './ai.conversation.service.js';

export const aiRouter = Router();

// Validation schemas
const askSchema = z.object({ 
  question: z.string().min(2).max(1000),
  conversationId: z.string().optional()
});

const conversationIdSchema = z.object({ 
  id: z.string().min(1) 
});

/**
 * POST /api/ai/ask
 * 
 * Main AI endpoint. Requires authentication and 'ai:ask' permission.
 * Passes user permissions to the agent for tool filtering.
 * Optionally saves conversation history.
 */
aiRouter.post('/ask', requireAuth, requirePermission('ai:ask'), async (req, res, next) => {
  try {
    const payload = askSchema.parse(req.body);
    const userId = req.user?.id!;
    const { question, conversationId } = payload;
    
    // Check if this should be saved to a conversation
    let convId = conversationId;
    
    if (convId) {
      // Verify user owns this conversation
      const owns = await userOwnsConversation(userId, convId);
      if (!owns) {
        res.status(403).json({ error: 'Conversation not found' });
        return;
      }
    }
    
    // Save user message if conversationId provided
    if (convId) {
      await addMessage(convId, 'user', question);
    }
    
    // Run AI
    const result = await askAi({ 
      question, 
      userId,
      userPermissions: req.user?.permissions || [],
      userRoles: req.user?.roles || []
    });
    
    // Save assistant response if conversationId provided
    if (convId) {
      await addMessage(convId, 'assistant', result.answer);
    } else if (result.answer) {
      // No conversationId - create a new conversation and save
      const newConv = await createConversation(userId);
      await addMessage(newConv.id, 'user', question);
      await addMessage(newConv.id, 'assistant', result.answer);
      
      // Auto-title the conversation
      const title = question.length > 40 ? question.substring(0, 40) + '...' : question;
      await updateConversationTitle(newConv.id, title);
      
      convId = newConv.id;
    }
    
    // Include conversationId in response
    res.json({ ...result, conversationId: convId });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/conversations
 * 
 * Create a new conversation.
 */
aiRouter.post('/conversations', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id!;
    const conversation = await createConversation(userId);
    res.json(conversation);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/ai/conversations
 * 
 * List all conversations for the current user.
 */
aiRouter.get('/conversations', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id!;
    const conversations = await listConversations(userId);
    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/ai/conversations/:id
 * 
 * Get a single conversation with all messages.
 */
aiRouter.get('/conversations/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id!;
    const conversationId = req.params.id as string;
    
    const conversation = await getConversation(userId, conversationId);
    
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    
    res.json(conversation);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/ai/conversations/:id
 * 
 * Delete a conversation and all its messages.
 */
aiRouter.delete('/conversations/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id!;
    const conversationId = req.params.id as string;
    
    const deleted = await deleteConversation(userId, conversationId);
    
    if (!deleted) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
