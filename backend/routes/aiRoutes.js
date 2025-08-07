/**
 * AI Helper Routes
 * Provides intelligent assistance for shift scheduling
 */

const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');

// Rate limiting specifically for AI endpoints
const rateLimit = require('express-rate-limit');
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: {
    error: 'För många AI-förfrågningar. Försök igen om en minut.',
    code: 'AI_RATE_LIMIT_EXCEEDED'
  }
});

router.use(aiLimiter);

/**
 * GET /api/ai/help
 * Get AI help response for user query
 */
router.get('/help', async (req, res) => {
  try {
    const { q: query, context } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Fråga krävs',
        suggestions: aiService.getConversationStarters()
      });
    }

    if (query.length > 500) {
      return res.status(400).json({
        error: 'Frågan är för lång. Max 500 tecken.'
      });
    }

    let parsedContext = {};
    if (context) {
      try {
        parsedContext = JSON.parse(context);
      } catch (e) {
        console.warn('Invalid context JSON:', e.message);
      }
    }

    const response = await aiService.getHelp(query, parsedContext);
    
    res.json({
      ...response,
      query,
      responseTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Help Error:', error);
    res.status(500).json({
      error: 'AI-tjänsten är tillfälligt otillgänglig',
      fallback: aiService.getFallbackResponse(req.query.q || '').content
    });
  }
});

/**
 * POST /api/ai/chat
 * Chat-style interaction with AI helper
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, context, conversationId } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Meddelande krävs'
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        error: 'Meddelandet är för långt. Max 1000 tecken.'
      });
    }

    const response = await aiService.getHelp(message, context || {});
    
    res.json({
      ...response,
      conversationId: conversationId || `conv_${Date.now()}`,
      message,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({
      error: 'Chat-tjänsten är tillfälligt otillgänglig',
      fallback: aiService.getFallbackResponse(req.body.message || '').content
    });
  }
});

/**
 * GET /api/ai/suggestions
 * Get contextual suggestions based on current page/state
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { page, company, team } = req.query;
    
    const contextualSuggestions = {
      dashboard: [
        'Vad betyder dagens skiftstatus?',
        'Förklara månatlig statistik',
        'Varför visas fel arbetstid?',
        'Hur tolkar jag skiftfördelningen?'
      ],
      calendar: [
        'Hur navigerar jag i kalendern?',
        'Vad betyder färgerna?',
        'Hur exporterar jag månadsschema?',
        'Visa årsoversikt'
      ],
      companies: [
        'Vilka företag finns tillgängliga?',
        'Hur söker jag efter mitt företag?',
        'Vad är skillnaden mellan lagen?',
        'Vilka industrier stöds?'
      ]
    };

    const generalSuggestions = [
      'Förklara skifttyper F, E, N',
      'Hjälp med navigation',
      'Exportera till Excel',
      'Jämför företag',
      'Felsök problem'
    ];

    const suggestions = contextualSuggestions[page] || generalSuggestions;
    
    res.json({
      suggestions,
      context: { page, company, team },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Suggestions Error:', error);
    res.status(500).json({
      error: 'Kunde inte hämta förslag',
      suggestions: ['Hjälp med grundläggande funktioner']
    });
  }
});

/**
 * GET /api/ai/quick-help/:topic
 * Get quick help for specific topics
 */
router.get('/quick-help/:topic', async (req, res) => {
  try {
    const { topic } = req.params;
    
    const quickHelpTopics = {
      'shift-types': 'Vad betyder skifttyperna F, E, N?',
      'navigation': 'Hur navigerar jag i systemet?',
      'companies': 'Vilka företag stöds?',
      'export': 'Hur exporterar jag schema?',
      'troubleshooting': 'Vanliga problem och lösningar'
    };

    const query = quickHelpTopics[topic];
    if (!query) {
      return res.status(404).json({
        error: 'Okänt hjälpämne',
        availableTopics: Object.keys(quickHelpTopics)
      });
    }

    const response = await aiService.getHelp(query);
    
    res.json({
      ...response,
      topic,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Quick Help Error:', error);
    res.status(500).json({
      error: 'Snabbhjälp är tillfälligt otillgänglig'
    });
  }
});

/**
 * GET /api/ai/conversation-starters
 * Get conversation starters for new users
 */
router.get('/conversation-starters', (req, res) => {
  try {
    const starters = aiService.getConversationStarters();
    
    res.json({
      starters,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Conversation Starters Error:', error);
    res.status(500).json({
      error: 'Kunde inte hämta samtalsförslag',
      starters: ['Hjälp med grundläggande funktioner']
    });
  }
});

/**
 * GET /api/ai/health
 * AI service health check
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AI Helper',
    features: {
      contextualHelp: true,
      quickHelp: true,
      chatSupport: true,
      troubleshooting: true,
      multilingual: false,  // Currently Swedish only
      realTimeAI: false     // Using rule-based responses
    },
    supportedLanguages: ['sv'],
    responseTime: '<100ms',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;