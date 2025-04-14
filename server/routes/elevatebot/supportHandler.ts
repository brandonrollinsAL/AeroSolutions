import { Request, Response } from 'express';
import { generateJson } from '../../utils/xaiClient';
import { storage } from '../../storage';
import { db } from '../../db';
import { body, validationResult } from 'express-validator';
import { support_tickets, support_responses } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Interface for the support query analysis
 */
interface SupportQueryAnalysis {
  category: 'billing' | 'technical' | 'account' | 'feature' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  sentiment: 'positive' | 'neutral' | 'negative' | 'frustrated';
  isEscalationNeeded: boolean;
  escalationReason?: string;
  suggestedResponse: string;
  relevantDocumentation?: string[];
  followUpQuestions?: string[];
}

/**
 * Handle customer support queries
 */
export const supportValidators = [
  body('query').isString().notEmpty().withMessage('Support query is required'),
  body('sessionId').optional().isString(),
  body('userId').optional().isNumeric(),
  body('userContext').optional().isObject()
];

/**
 * Process a support query and generate automated responses or escalate to admin
 */
export async function handleSupportQuery(req: Request, res: Response) {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { query, sessionId, userId, userContext = {} } = req.body;
  // Safer check for authentication that won't throw an error if isAuthenticated is not available
  const authenticatedUserId = req.user && typeof req.isAuthenticated === 'function' && req.isAuthenticated() ? req.user.id : null;
  const actualUserId = userId || authenticatedUserId;

  try {
    // Store support ticket
    const [ticket] = await db.insert(support_tickets).values({
      query,
      userId: actualUserId,
      sessionId,
      metadata: userContext,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Analyze the query with Grok AI
    const analysis = await analyzeQuery(query, userContext, actualUserId);

    // Store response
    const [response] = await db.insert(support_responses).values({
      ticketId: ticket.id,
      response: analysis.suggestedResponse,
      isAutomated: true,
      metadata: analysis,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Check if escalation is needed
    if (analysis.isEscalationNeeded) {
      // Update ticket status to escalated
      await db.update(support_tickets)
        .set({
          status: 'escalated',
          priority: analysis.priority,
          updatedAt: new Date()
        })
        .where(eq(support_tickets.id, ticket.id));

      // Notify admins (in a real app)
      // sendAdminNotification(ticket.id, analysis);
    } else {
      // Update ticket status to resolved if no escalation needed
      await db.update(support_tickets)
        .set({
          status: 'resolved',
          priority: analysis.priority,
          updatedAt: new Date()
        })
        .where(eq(support_tickets.id, ticket.id));
    }

    // Return response
    res.status(200).json({
      success: true,
      ticketId: ticket.id,
      response: analysis.suggestedResponse,
      isEscalated: analysis.isEscalationNeeded,
      category: analysis.category,
      priority: analysis.priority,
      followUpQuestions: analysis.followUpQuestions || []
    });
  } catch (error) {
    console.error('Support query error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process support query',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Analyze a support query using Grok AI
 */
async function analyzeQuery(
  query: string,
  context: any = {},
  userId: number | null = null
): Promise<SupportQueryAnalysis> {
  try {
    // Get user history if available
    let userHistory = '';
    if (userId) {
      const previousTickets = await db.select()
        .from(support_tickets)
        .where(eq(support_tickets.userId, userId))
        .orderBy(desc(support_tickets.createdAt))
        .limit(5);

      if (previousTickets.length > 0) {
        userHistory = `User has submitted ${previousTickets.length} previous support tickets. Most recent issues: ${
          previousTickets.slice(0, 3).map(t => t.query).join(' | ')
        }`;
      }
    }

    // Get billing information if the query is potentially billing-related
    let billingInfo = '';
    if (
      query.toLowerCase().includes('bill') ||
      query.toLowerCase().includes('payment') ||
      query.toLowerCase().includes('charge') ||
      query.toLowerCase().includes('subscription') ||
      query.toLowerCase().includes('refund')
    ) {
      if (userId) {
        // In a real app, fetch user subscription status
        billingInfo = 'User has an active subscription plan: Professional Monthly ($39/month). Last payment was on April 5, 2025.';
      }
    }

    // Get service status if query is about service issues
    let serviceStatus = '';
    if (
      query.toLowerCase().includes('down') ||
      query.toLowerCase().includes('error') ||
      query.toLowerCase().includes('unavailable') ||
      query.toLowerCase().includes('can\'t access')
    ) {
      // In a real app, check service status
      serviceStatus = 'All services are currently operational. No known outages.';
    }

    // Extract business information from context if available
    const businessName = context.businessName || '';
    const businessType = context.businessType || '';
    const businessSize = context.businessSize || '';
    const websiteStatus = context.websiteStatus || '';
    const businessGoals = context.goals || '';
    
    // Format business context for the AI prompt
    let businessContext = '';
    if (businessName || businessType || businessSize || websiteStatus || businessGoals) {
      businessContext = `
        BUSINESS INFORMATION:
        ${businessName ? `Business Name: ${businessName}` : ''}
        ${businessType ? `Business Type: ${businessType}` : ''}
        ${businessSize ? `Business Size: ${businessSize}` : ''}
        ${websiteStatus ? `Website Status: ${websiteStatus}` : ''}
        ${businessGoals ? `Business Goals: ${businessGoals}` : ''}
      `;
    }
    
    // Analyze the query using Grok AI
    const analysis = await generateJson<SupportQueryAnalysis>(`
      Please analyze this customer support query and provide a structured response:
      
      QUERY: "${query}"
      
      ${userHistory ? `USER HISTORY: ${userHistory}` : ''}
      ${billingInfo ? `BILLING INFO: ${billingInfo}` : ''}
      ${serviceStatus ? `SERVICE STATUS: ${serviceStatus}` : ''}
      ${businessContext ? businessContext : ''}
      ${context && Object.keys(context).length > 0 ? `ADDITIONAL CONTEXT: ${JSON.stringify(context)}` : ''}
      
      Please return a JSON response with the following structure:
      {
        "category": "billing|technical|account|feature|other",
        "priority": "low|medium|high|critical",
        "sentiment": "positive|neutral|negative|frustrated",
        "isEscalationNeeded": boolean,
        "escalationReason": "Reason for escalation if needed",
        "suggestedResponse": "A helpful response to the query",
        "relevantDocumentation": ["URL or doc reference 1", "URL or doc reference 2"],
        "followUpQuestions": ["Potential follow-up question 1", "Potential follow-up question 2"]
      }
    `, {
      model: 'grok-3-mini',
      systemPrompt: `
        You are an AI support assistant for Elevion, a web development company that offers services 
        to small businesses. Your job is to analyze customer support queries and determine:
        
        1. The category of the query
        2. The priority level
        3. The sentiment of the user
        4. Whether the query needs human escalation
        5. A helpful response that is tailored to the user's business needs
        
        When business information is provided, personalize your responses based on:
        - Business type (e-commerce, service providers, restaurants, etc.)
        - Business size (solo, small team, medium business, etc.)
        - Current website status (no website, needs redesign, etc.)
        - Their specific goals and challenges
        
        Here are the available pricing plans:
        - Basic: $19/month - 5 pages, basic SEO, 1 mockup/month
        - Professional: $39/month - 10 pages, advanced SEO, 3 mockups/month
        - Enterprise: $99/month - Unlimited pages, premium SEO, unlimited mockups
        
        Tailor plan recommendations based on business size and needs:
        - Solo entrepreneurs/small businesses often need Basic or Professional plans
        - Medium-sized businesses usually need Professional plans
        - Larger businesses often require Enterprise plans
        
        Common issues:
        - Billing questions: These can usually be handled automatically unless there's a dispute
        - Technical issues: Simple troubleshooting can be automated, complex issues should be escalated
        - Account management: Password resets and basic account changes can be automated
        - Feature requests: Should be logged and escalated
        
        Always be helpful, empathetic, and concise in your suggested responses.
        Reference the user's business specifics when answering questions about services,
        pricing, or recommendations to make responses feel personalized.
      `
    });

    return analysis;
  } catch (error) {
    console.error('Error analyzing support query:', error);
    // Return a fallback analysis
    return {
      category: 'other',
      priority: 'medium',
      sentiment: 'neutral',
      isEscalationNeeded: true,
      escalationReason: 'Failed to automatically analyze the query',
      suggestedResponse: 'Thank you for reaching out. Your request has been forwarded to our support team, and someone will get back to you shortly. We appreciate your patience.',
      relevantDocumentation: [],
      followUpQuestions: []
    };
  }
}

/**
 * Get a list of support tickets for admin dashboard
 */
export async function getSupportTickets(req: Request, res: Response) {
  try {
    // Check if user is admin with safer authentication check
    if (!(req.user && typeof req.isAuthenticated === 'function' && req.isAuthenticated()) || req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Get query parameters
    const status = req.query.status as string | undefined;
    const limit = parseInt(req.query.limit as string || '50');
    const offset = parseInt(req.query.offset as string || '0');

    // Build query
    let query = db.select().from(support_tickets);
    
    if (status) {
      query = query.where(eq(support_tickets.status, status));
    }
    
    // Execute query with pagination
    const tickets = await query
      .orderBy(desc(support_tickets.createdAt))
      .limit(limit)
      .offset(offset);

    // Count total
    const [{ count }] = await db
      .select({ count: db.fn.count().mapWith(Number) })
      .from(support_tickets);

    res.status(200).json({
      success: true,
      tickets,
      pagination: {
        total: count,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support tickets',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Resolve a support ticket (admin only)
 */
export async function resolveTicket(req: Request, res: Response) {
  try {
    // Check if user is admin with safer authentication check
    if (!(req.user && typeof req.isAuthenticated === 'function' && req.isAuthenticated()) || req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { ticketId } = req.params;
    const { resolution, internalNotes } = req.body;

    // Update ticket
    const [updatedTicket] = await db.update(support_tickets)
      .set({
        status: 'resolved',
        updatedAt: new Date(),
        internalNotes
      })
      .where(eq(support_tickets.id, parseInt(ticketId)))
      .returning();

    // Add admin response
    const [response] = await db.insert(support_responses).values({
      ticketId: parseInt(ticketId),
      response: resolution,
      isAutomated: false,
      responderId: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    res.status(200).json({
      success: true,
      ticket: updatedTicket,
      response
    });
  } catch (error) {
    console.error('Error resolving ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve support ticket',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}