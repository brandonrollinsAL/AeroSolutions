import express from 'express';
import { db } from '../db';
import { callXAI } from '../utils/xaiClient';

const router = express.Router();

/**
 * Semantic search endpoint
 * Uses Elevion AI to perform intelligent semantic search on website content
 */
router.post('/semantic', async (req, res) => {
  const { query, filters = {}, limit = 10 } = req.body;
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'Search query is required' 
    });
  }
  
  try {
    // Get content from database
    const whereClause = Object.entries(filters)
      .map(([key, value]) => `${key} = '${value}'`)
      .join(' AND ');
    
    const sqlQuery = `
      SELECT id, title, content, category, tags, created_at
      FROM content
      ${whereClause ? `WHERE ${whereClause}` : ''}
      ORDER BY created_at DESC
      LIMIT 100
    `;
    
    const { rows } = await db.query(sqlQuery);
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No content found to search'
      });
    }
    
    // Format the data for semantic search
    const contentItems = rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category,
      tags: row.tags,
      created_at: row.created_at
    }));
    
    const prompt = `You are a semantic search engine. I'll provide you with a list of content items and a query.
      Your job is to find the most relevant items based on semantic meaning, not just keyword matching.
      
      Query: "${query}"
      
      Content items:
      ${JSON.stringify(contentItems, null, 2)}
      
      Return only the top ${limit} most relevant results as JSON with this structure:
      {
        "results": [
          {
            "id": "item_id",
            "title": "item_title",
            "relevance_score": 0.95,
            "matched_concepts": ["concept1", "concept2"]
          }
        ]
      }
      
      Relevance score should be between 0 and 1, with 1 being perfectly relevant.`;
    
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });
    
    const content = JSON.parse(response.choices[0].message.content);
    
    res.json({ 
      success: true, 
      search_results: content.results
    });
  } catch (error: any) {
    console.error('Semantic search failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Semantic search failed', 
      error: error.message,
      fallback: {
        search_results: [] // Empty results when search fails
      }
    });
  }
});

/**
 * Natural language query endpoint
 * Allows users to ask questions in natural language about website content
 */
router.post('/natural-language-query', async (req, res) => {
  const { question } = req.body;
  
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'Question is required' 
    });
  }
  
  try {
    // Get content from database to use as context
    const { rows } = await db.query(`
      SELECT title, content, category
      FROM content
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No content found to search'
      });
    }
    
    // Concatenate relevant content for context
    const context = rows.map(row => `
      Title: ${row.title}
      Category: ${row.category}
      Content: ${row.content.substring(0, 500)}...
    `).join('\n\n');
    
    const prompt = `You are an AI assistant for a web development company called Elevion. 
      A user has asked the following question: "${question}"
      
      Based on the following content from our website, provide a helpful, accurate, and concise answer.
      If the answer cannot be found in the content, provide general information that would be helpful
      and suggest contacting our team for more specific information.
      
      Context from website:
      ${context}`;
    
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [{ role: 'user', content: prompt }]
    });
    
    res.json({ 
      success: true, 
      answer: response.choices[0].message.content
    });
  } catch (error: any) {
    console.error('Natural language query failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Natural language query failed', 
      error: error.message,
      fallback: {
        answer: `I apologize, but I'm currently unable to process your question fully. Based on general knowledge, ${question.includes('pricing') ? 'Elevion offers competitive pricing packages tailored to your business needs' : question.includes('services') ? 'Elevion provides comprehensive web development services including website design, e-commerce solutions, and content management systems' : 'Elevion specializes in web development services for small businesses'}. For more specific information, please contact our team directly or try again later.`
      }
    });
  }
});

/**
 * Entity recognition endpoint
 * Extracts entities and concepts from user queries
 */
router.post('/entity-recognition', async (req, res) => {
  const { text } = req.body;
  
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'Text for entity recognition is required' 
    });
  }
  
  try {
    const prompt = `Extract entities and concepts from the following text. 
      Identify people, organizations, locations, products, services, and key concepts.
      Categorize each entity and provide a confidence score.
      
      Text: "${text}"
      
      Format the response as JSON with this structure:
      {
        "entities": [
          {
            "text": "entity name",
            "type": "person/organization/location/product/service/concept",
            "confidence": 0.95
          }
        ],
        "key_concepts": ["concept1", "concept2"],
        "sentiment": "positive/neutral/negative",
        "intent": "information/purchase/support/other"
      }`;
    
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });
    
    const content = JSON.parse(response.choices[0].message.content);
    
    res.json({ 
      success: true, 
      analysis: content
    });
  } catch (error: any) {
    console.error('Entity recognition failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Entity recognition failed', 
      error: error.message,
      fallback: {
        entities: [],
        key_concepts: [],
        sentiment: "neutral",
        intent: "information"
      }
    });
  }
});

/**
 * Intelligent FAQ endpoint
 * Finds the most relevant FAQ based on user question
 */
router.post('/faq-matching', async (req, res) => {
  const { question } = req.body;
  
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'Question is required' 
    });
  }
  
  try {
    // Get FAQs from database
    const { rows } = await db.query(`
      SELECT id, question, answer, category
      FROM faqs
      ORDER BY id ASC
    `);
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No FAQs found'
      });
    }
    
    const faqs = rows.map(row => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
      category: row.category
    }));
    
    const prompt = `Match the following user question to the most relevant FAQ from our database.
      If there's no good match, generate a helpful response.
      
      User question: "${question}"
      
      Available FAQs:
      ${JSON.stringify(faqs, null, 2)}
      
      Return the response as JSON with this structure:
      {
        "matched_faq": {
          "id": "faq_id or null if no match",
          "question": "matched question or null",
          "answer": "matched answer or custom response",
          "match_confidence": 0.85
        },
        "suggested_followup_questions": ["question1", "question2"]
      }`;
    
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });
    
    const content = JSON.parse(response.choices[0].message.content);
    
    res.json({ 
      success: true, 
      result: content
    });
  } catch (error: any) {
    console.error('FAQ matching failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'FAQ matching failed', 
      error: error.message,
      fallback: {
        matched_faq: {
          id: null,
          question: null,
          answer: "I apologize, but I couldn't find a specific answer to your question in our FAQ database. Please contact our support team for more detailed information, or try rephrasing your question.",
          match_confidence: 0
        },
        suggested_followup_questions: [
          "What services does Elevion offer?",
          "How much do your web development services cost?",
          "What is your process for creating a website?"
        ]
      }
    });
  }
});

export default router;