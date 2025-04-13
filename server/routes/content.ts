import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { db } from '../db';
import { callXAI, generateText, generateJson } from '../utils/xaiClient';
import { sql, desc, eq, like } from 'drizzle-orm';
import { contents } from '@shared/schema';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * Generate content using XAI API
 * Creates blog posts, industry insights, and email templates with Elevion branding
 */
router.post('/generate', [
  body('contentType')
    .isIn(['blog_post', 'industry_insight', 'email_template'])
    .withMessage('Invalid content type'),
  body('topic')
    .notEmpty()
    .withMessage('Topic is required')
    .isString()
    .withMessage('Topic must be a string'),
  body('industry')
    .notEmpty()
    .withMessage('Industry is required')
    .isString()
    .withMessage('Industry must be a string'),
  body('tone')
    .isIn(['professional', 'conversational', 'technical', 'inspirational'])
    .withMessage('Invalid tone'),
  body('wordCount')
    .isString()
    .withMessage('Word count must be a string')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const {
      contentType,
      topic,
      industry,
      targetAudience = '',
      tone,
      keyPoints = '',
      wordCount,
      includeCallToAction = false
    } = req.body;

    // Process key points if provided
    const keyPointsList = keyPoints
      .split('\n')
      .map((point: string) => point.trim())
      .filter((point: string) => point.length > 0);

    const keyPointsPrompt = keyPointsList.length > 0
      ? `Include these key points in the content:
${keyPointsList.map((point: string) => `- ${point}`).join('\n')}`
      : '';

    // Determine content structure based on type
    let contentStructure = '';
    if (contentType === 'blog_post') {
      contentStructure = `
Structure the blog post with:
- An engaging headline (H1)
- An introduction that hooks the reader
- 3-5 sections with subheadings (H2)
- Relevant bullet points or numbered lists where appropriate
- A conclusion
${includeCallToAction ? '- A clear call to action at the end' : ''}`;
    } else if (contentType === 'industry_insight') {
      contentStructure = `
Structure the industry insight with:
- A thought-provoking headline (H1)
- An executive summary
- Analysis of current trends
- Future predictions
- Impact on ${industry} businesses
- Strategic recommendations
${includeCallToAction ? '- A clear call to action for industry professionals' : ''}`;
    } else if (contentType === 'email_template') {
      contentStructure = `
Structure the email template with:
- A clear subject line
- Personalized greeting
- Concise body content
- 2-3 main points
${includeCallToAction ? '- A compelling call to action' : ''}
- Professional signature with Elevion branding`;
    }

    // Build the prompt
    const prompt = `Generate a ${contentType.replace('_', ' ')} about "${topic}" for the ${industry} industry${targetAudience ? ` targeting ${targetAudience}` : ''}.

Use a ${tone} tone and aim for approximately ${wordCount} words.

${keyPointsPrompt}

${contentStructure}

Apply Elevion's brand typography:
- Use Poppins for all headings (h1, h2, h3)
- Use Lato for body text and paragraphs
- Include appropriate spacing between sections

Format using HTML tags for proper styling. The content will be displayed in a web application, so include appropriate HTML formatting for headings, paragraphs, lists, etc.

The content should be factually accurate, informative, and provide real value to the audience. Avoid generic platitudes or overly broad statements. Focus on specific, actionable insights relevant to ${industry} businesses.`;

    try {
      const response = await callXAI('/chat/completions', {
        model: 'grok-3',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2500,
        temperature: 0.7
      });

      // Process the content for proper HTML formatting
      let generatedContent = response.choices[0].message.content;

      // Ensure proper heading font styling
      generatedContent = generatedContent
        .replace(/<h1>/g, '<h1 class="font-poppins text-3xl font-bold mb-4">')
        .replace(/<h2>/g, '<h2 class="font-poppins text-2xl font-semibold mt-6 mb-3">')
        .replace(/<h3>/g, '<h3 class="font-poppins text-xl font-medium mt-5 mb-2">')
        .replace(/<p>/g, '<p class="font-lato mb-4">');

      // Add additional styling for lists and other elements
      generatedContent = generatedContent
        .replace(/<ul>/g, '<ul class="list-disc pl-5 mb-4 font-lato">')
        .replace(/<ol>/g, '<ol class="list-decimal pl-5 mb-4 font-lato">');

      // If content is an email template, handle the format differently
      if (contentType === 'email_template') {
        const emailParts = generatedContent.split('\n');
        let subjectLine = '';
        let emailBody = '';

        // Extract subject line
        const subjectIndex = emailParts.findIndex(line => 
          line.toLowerCase().includes('subject:') || 
          line.toLowerCase().includes('subject line:'));

        if (subjectIndex >= 0) {
          subjectLine = emailParts[subjectIndex]
            .replace(/subject:?/i, '')
            .trim();
          emailParts.splice(subjectIndex, 1);
        }

        emailBody = emailParts.join('\n');

        generatedContent = `
          <div class="email-template font-lato p-4 border rounded-md">
            ${subjectLine ? `<div class="subject-line bg-slate-50 p-2 mb-4 rounded font-medium">
              <span class="text-slate-500">Subject:</span> ${subjectLine}
            </div>` : ''}
            <div class="email-body">
              ${emailBody}
            </div>
          </div>
        `;
      }

      return res.status(200).json({
        success: true,
        content: generatedContent,
        wordCount: generatedContent.split(/\s+/).length,
      });

    } catch (error) {
      console.error('Content generation API error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error generating content with AI',
        error: error.message
      });
    }
  } catch (error: any) {
    console.error('Content generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Save generated content to the database
 */
router.post('/save', [
  body('content')
    .notEmpty()
    .withMessage('Content is required'),
  body('title')
    .notEmpty()
    .withMessage('Title is required'),
  body('type')
    .isIn(['blog_post', 'industry_insight', 'email_template'])
    .withMessage('Invalid content type'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { content, title, type } = req.body;

    // Calculate word count
    const wordCount = content.split(/\s+/).length;

    // Insert content into database
    const [result] = await db
      .insert(contents)
      .values({
        id: uuidv4(),
        title,
        content,
        type,
        wordCount,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return res.status(201).json({
      success: true,
      message: 'Content saved successfully',
      contentId: result.id,
    });
  } catch (error: any) {
    console.error('Content save error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error saving content',
      error: error.message
    });
  }
});

/**
 * List all saved content
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    const { search, type, status } = req.query;

    let query = db.select().from(contents).orderBy(desc(contents.createdAt));

    // Apply filters if provided
    if (search) {
      query = query.where(like(contents.title, `%${search}%`));
    }

    if (type) {
      query = query.where(eq(contents.type, type as string));
    }

    if (status) {
      query = query.where(eq(contents.status, status as string));
    }

    const contentList = await query;

    return res.status(200).json({
      success: true,
      contents: contentList,
    });
  } catch (error: any) {
    console.error('Content list error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving content list',
      error: error.message
    });
  }
});

/**
 * Get content by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [content] = await db
      .select()
      .from(contents)
      .where(eq(contents.id, id));

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    return res.status(200).json({
      success: true,
      content,
    });
  } catch (error: any) {
    console.error('Content fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving content',
      error: error.message
    });
  }
});

/**
 * Update content status (publish/archive/draft)
 */
router.patch('/:id/status', [
  body('status')
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Invalid status'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    const [updated] = await db
      .update(contents)
      .set({
        status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(contents.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Content ${status}`,
      content: updated,
    });
  } catch (error: any) {
    console.error('Content status update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating content status',
      error: error.message
    });
  }
});

/**
 * Delete content
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [deleted] = await db
      .delete(contents)
      .where(eq(contents.id, id))
      .returning();

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Content deleted successfully',
    });
  } catch (error: any) {
    console.error('Content delete error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting content',
      error: error.message
    });
  }
});

export default router;