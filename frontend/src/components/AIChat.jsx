import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  X, 
  Minimize2, 
  Maximize2, 
  Bot, 
  User, 
  Lightbulb,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import aiService from '../services/aiService';

const AIChat = ({ currentPage, selectedCompany, selectedTeam }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [isHealthy, setIsHealthy] = useState(true);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Update AI context when page or selection changes
    aiService.updateContext({
      currentPage,
      selectedCompany,
      selectedTeam
    });
    
    // Load contextual suggestions
    loadSuggestions();
  }, [currentPage, selectedCompany, selectedTeam]);

  useEffect(() => {
    // Check AI service health on mount
    checkAIHealth();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkAIHealth = async () => {
    const healthy = await aiService.checkHealth();
    setIsHealthy(healthy);
  };

  const loadSuggestions = async () => {
    try {
      const response = await aiService.getSuggestions(currentPage, selectedCompany, selectedTeam);
      setSuggestions(response.suggestions || []);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const handleSendMessage = async (message = inputMessage) => {
    if (!message.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setShowQuickActions(false);

    try {
      const response = await aiService.sendChatMessage(message, {
        currentPage,
        selectedCompany,
        selectedTeam
      });

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiService.formatResponse(response),
        timestamp: new Date(),
        success: response.success
      };

      setMessages(prev => [...prev, aiMessage]);
      aiService.trackUsage('chat', message, response.success);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: {
          type: 'error',
          title: 'Fel',
          content: 'Kunde inte skicka meddelandet. Kontrollera din internetanslutning och försök igen.'
        },
        timestamp: new Date(),
        success: false
      };
      setMessages(prev => [...prev, errorMessage]);
      aiService.trackUsage('chat', message, false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  const handleQuickAction = async (actionId) => {
    setIsLoading(true);
    try {
      const response = await aiService.getQuickHelp(actionId);
      const aiMessage = {
        id: Date.now(),
        type: 'ai',
        content: aiService.formatResponse(response),
        timestamp: new Date(),
        success: response.success
      };
      setMessages(prev => [...prev, aiMessage]);
      setShowQuickActions(false);
    } catch (error) {
      console.error('Quick action error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setShowQuickActions(true);
    aiService.clearConversation();
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      // Show welcome message for new users
      const welcomeMessage = {
        id: 'welcome',
        type: 'ai',
        content: {
          type: 'welcome',
          title: 'Välkommen till AI-hjälpen! 👋',
          content: `
Jag kan hjälpa dig med:
• **Skiftplanering**: Förklara arbetstider och scheman
• **Navigation**: Hitta funktioner i systemet  
• **Företagsinformation**: Information om 30+ svenska företag
• **Export**: Spara och dela scheman
• **Felsökning**: Lösa vanliga problem

Välj en snabbåtgärd nedan eller ställ en fråga!
          `,
          suggestions: suggestions.slice(0, 3)
        },
        timestamp: new Date(),
        success: true
      };
      setMessages([welcomeMessage]);
    }
  };

  const formatMessageContent = (content) => {
    if (typeof content === 'string') {
      return content;
    }

    return (
      <div className="space-y-3">
        {content.title && (
          <h4 className="font-semibold text-gray-900">{content.title}</h4>
        )}
        {content.content && (
          <div 
            className="text-gray-700 whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: content.content }}
          />
        )}
        {content.actions && (
          <div className="flex flex-wrap gap-2 mt-3">
            {content.actions.map((action, index) => (
              <button
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                onClick={() => handleSendMessage(action.text)}
              >
                {action.text}
              </button>
            ))}
          </div>
        )}
        {content.suggestions && (
          <div className="flex flex-wrap gap-2 mt-3">
            {content.suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all duration-300 z-50 ${
          isHealthy 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-gray-400 text-gray-200'
        }`}
        title={isHealthy ? 'Öppna AI-hjälp' : 'AI-hjälp är otillgänglig'}
      >
        {isHealthy ? <MessageCircle size={24} /> : <AlertCircle size={24} />}
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 bg-white rounded-lg shadow-xl border z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot size={20} />
          <span className="font-semibold">AI-hjälp</span>
          {!isHealthy && (
            <AlertCircle size={16} className="text-yellow-200" title="Begränsad funktionalitet" />
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 h-96 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[80%] ${
                  message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : message.success === false
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {message.type === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.success === false
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-gray-100'
                  }`}>
                    {typeof message.content === 'string' 
                      ? message.content 
                      : formatMessageContent(message.content)
                    }
                  </div>
                </div>
              </div>
            ))}

            {/* Quick Actions */}
            {showQuickActions && messages.length <= 1 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-gray-500">
                  <Lightbulb size={16} />
                  <span className="text-sm">Snabbåtgärder</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {aiService.getQuickActions().map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action.id)}
                      className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      disabled={isLoading}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{action.icon}</span>
                        <div>
                          <div className="font-medium text-sm">{action.text}</div>
                          <div className="text-xs text-gray-500">{action.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Bot size={16} className="text-gray-600" />
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && !showQuickActions && (
            <div className="border-t p-3">
              <div className="text-xs text-gray-500 mb-2">Förslag:</div>
              <div className="flex flex-wrap gap-1">
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                    disabled={isLoading}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isHealthy ? "Ställ en fråga..." : "AI-tjänst otillgänglig"}
                disabled={isLoading || !isHealthy}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading || !isHealthy}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={20} />
              </button>
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                  title="Rensa chat"
                >
                  <RefreshCw size={20} />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIChat;