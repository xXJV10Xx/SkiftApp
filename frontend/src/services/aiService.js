/**
 * AI Service for Frontend
 * Handles communication with AI backend for user assistance
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api/ai';

class AIService {
  constructor() {
    this.conversationId = null;
    this.context = {};
  }

  /**
   * Get help for a specific query
   */
  async getHelp(query, context = {}) {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      if (Object.keys(context).length > 0) {
        params.append('context', JSON.stringify(context));
      }

      const response = await fetch(`${API_BASE_URL}/help?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`AI Service Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AI Help Error:', error);
      return this.getFallbackResponse(query);
    }
  }

  /**
   * Send chat message to AI
   */
  async sendChatMessage(message, context = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          context: { ...this.context, ...context },
          conversationId: this.conversationId
        })
      });

      if (!response.ok) {
        throw new Error(`Chat Error: ${response.statusText}`);
      }

      const result = await response.json();
      this.conversationId = result.conversationId;
      
      return result;
    } catch (error) {
      console.error('Chat Error:', error);
      return this.getFallbackResponse(message);
    }
  }

  /**
   * Get contextual suggestions
   */
  async getSuggestions(page, company = null, team = null) {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      if (company) params.append('company', company);
      if (team) params.append('team', team);

      const response = await fetch(`${API_BASE_URL}/suggestions?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Suggestions Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Suggestions Error:', error);
      return {
        suggestions: [
          'Vad betyder skifttyperna?',
          'Hur exporterar jag schema?',
          'Vilka företag stöds?',
          'Hjälp med navigation'
        ]
      };
    }
  }

  /**
   * Get quick help for specific topic
   */
  async getQuickHelp(topic) {
    try {
      const response = await fetch(`${API_BASE_URL}/quick-help/${topic}`);
      
      if (!response.ok) {
        throw new Error(`Quick Help Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Quick Help Error:', error);
      return this.getFallbackResponse(`Hjälp med ${topic}`);
    }
  }

  /**
   * Get conversation starters
   */
  async getConversationStarters() {
    try {
      const response = await fetch(`${API_BASE_URL}/conversation-starters`);
      
      if (!response.ok) {
        throw new Error(`Conversation Starters Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Conversation Starters Error:', error);
      return {
        starters: [
          'Vad betyder F, E, N skift?',
          'Vilka företag stöds?',
          'Hur exporterar jag schema?',
          'Hjälp med navigation',
          'Förklara arbetstider'
        ]
      };
    }
  }

  /**
   * Check AI service health
   */
  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('AI Health Check Error:', error);
      return false;
    }
  }

  /**
   * Update context for better responses
   */
  updateContext(newContext) {
    this.context = { ...this.context, ...newContext };
  }

  /**
   * Clear conversation
   */
  clearConversation() {
    this.conversationId = null;
    this.context = {};
  }

  /**
   * Get fallback response when AI service is unavailable
   */
  getFallbackResponse(query) {
    return {
      success: false,
      response: {
        type: 'fallback',
        title: 'Hjälp',
        content: `
Jag hade problem att svara på din fråga, men här är grundläggande hjälp:

**🏢 Företag**: Välj från 30+ svenska företag i olika industrier
**📅 Kalender**: Visa scheman månadsvis eller årsvis  
**📊 Dashboard**: Se dagens skift och månatlig statistik
**📁 Export**: Spara scheman som CSV eller JSON

**Vanliga frågor**:
- F, E, N = Förmiddag (06-14), Eftermiddag (14-22), Natt (22-06)
- Ledig = L, Ingen arbetstid schemalagd
- Använd sökfunktionen för att hitta ditt företag
- Exportfunktionen finns i kalendervy

Prova att ladda om sidan om problemet kvarstår.
        `,
        suggestions: [
          'Ladda om sidan',
          'Kontrollera internetanslutning',
          'Prova enklare frågor'
        ]
      },
      fallback: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Format response for display
   */
  formatResponse(response) {
    if (!response || !response.response) {
      return this.getFallbackResponse('').response;
    }

    // Add helpful formatting
    const formatted = { ...response.response };
    
    if (formatted.content) {
      // Convert markdown-style formatting to HTML-friendly
      formatted.content = formatted.content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/- (.*?)$/gm, '• $1');
    }

    return formatted;
  }

  /**
   * Get predefined quick actions
   */
  getQuickActions() {
    return [
      {
        id: 'shift-types',
        text: 'Skifttyper',
        description: 'Förklara F, E, N skift',
        icon: '🕐'
      },
      {
        id: 'companies',
        text: 'Företag',
        description: 'Vilka företag stöds?',
        icon: '🏢'
      },
      {
        id: 'export',
        text: 'Export',
        description: 'Hur exporterar jag schema?',
        icon: '📁'
      },
      {
        id: 'navigation',
        text: 'Navigation',
        description: 'Hjälp med att hitta funktioner',
        icon: '🧭'
      },
      {
        id: 'troubleshooting',
        text: 'Felsökning',
        description: 'Vanliga problem och lösningar',
        icon: '🔧'
      }
    ];
  }

  /**
   * Analytics for AI usage
   */
  trackUsage(type, query, successful = true) {
    // Simple client-side analytics
    const usage = JSON.parse(localStorage.getItem('ai_usage') || '[]');
    usage.push({
      type,
      query: query?.substring(0, 50), // First 50 chars only for privacy
      successful,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 entries
    if (usage.length > 100) {
      usage.splice(0, usage.length - 100);
    }
    
    localStorage.setItem('ai_usage', JSON.stringify(usage));
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    const usage = JSON.parse(localStorage.getItem('ai_usage') || '[]');
    const last24h = usage.filter(u => 
      new Date(u.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    return {
      total: usage.length,
      last24h: last24h.length,
      successRate: usage.length > 0 
        ? (usage.filter(u => u.successful).length / usage.length * 100).toFixed(1)
        : 0
    };
  }
}

// Create singleton instance
const aiService = new AIService();

export default aiService;