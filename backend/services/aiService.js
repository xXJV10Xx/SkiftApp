/**
 * AI Service for Skiftschema App
 * Provides intelligent help and guidance for shift scheduling
 */

const UniversalScheduleGenerator = require('./universalScheduleGenerator');

class AIService {
  constructor() {
    this.universalSystem = UniversalScheduleGenerator;
    this.systemContext = `
Du är en AI-assistent för Skiftschema-appen som hjälper användare med skiftplanering i svenska företag.

SYSTEMKUNSKAP:
- Appen stöder 30+ svenska företag inom 12 industrier
- Skifttyper: F (Förmiddag 06-14), E (Eftermiddag 14-22), N (Natt 22-06), D (Dag), K (Kvällsskift), L (Ledig)
- Företag inkluderar: SSAB, Volvo, Sandvik, SKF, LKAB, Scania, Boliden, Holmen, SCA, m.fl.
- Systemet genererar scheman offline utan webbskrapning
- Stöder långsiktsplanering 2022-2040
- Funktioner: Schemavisning, export, jämförelser mellan företag/lag

HJÄLPOMRÅDEN:
1. Navigering i systemet
2. Förklaring av skifttyper och tider
3. Hjälp med företags- och lagval
4. Schemaförståelse och tolkning
5. Export och rapportfunktioner
6. Jämförelser mellan olika företag
7. Felsökning av vanliga problem

Svara alltid på svenska och var hjälpsam, tydlig och konkret.
`;

    this.quickHelp = {
      skift_typer: {
        title: "Skifttyper",
        content: `
**F - Förmiddag**: 06:00-14:00 (8 timmar)
**E - Eftermiddag**: 14:00-22:00 (8 timmar)  
**N - Natt**: 22:00-06:00 (8 timmar)
**D - Dag**: Vanligtvis 07:00-16:00
**K - Kväll**: Varierar per företag
**L - Ledig**: Ingen arbetstid schemalagd
        `
      },
      navigation: {
        title: "Navigation",
        content: `
**Dashboard**: Översikt över dagens skift och månatlig statistik
**Företag**: Välj mellan 30+ svenska företag
**Kalender**: Visa scheman månadsvis eller årsvis
**Export**: Ladda ner scheman som CSV eller JSON
        `
      },
      foretag: {
        title: "Företag",
        content: `
**Stöds just nu**: SSAB, Volvo, Sandvik, SKF, LKAB, Scania, Boliden, Holmen, SCA, och 20+ till
**Industrier**: Stål, Fordon, Verktyg, Lager, Gruvdrift, Transport, Papper, Skog m.fl.
**Platser**: Hela Sverige - från Kiruna till Malmö
        `
      },
      export: {
        title: "Export",
        content: `
**CSV-format**: För Excel och kalkylprogram
**JSON-format**: För utvecklare och systemintegration
**Datumintervall**: Välj start- och slutdatum
**Lagfiltrering**: Exportera specifika lag eller alla
        `
      }
    };
  }

  /**
   * Get contextual help based on user query and current system state
   */
  async getHelp(query, context = {}) {
    try {
      const response = await this.processQuery(query, context);
      return {
        success: true,
        response,
        timestamp: new Date().toISOString(),
        context: this.extractRelevantContext(query)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        fallback: this.getFallbackResponse(query)
      };
    }
  }

  /**
   * Process user query and generate response
   */
  async processQuery(query, context) {
    const lowerQuery = query.toLowerCase();
    
    // Quick help patterns
    if (this.matchesQuickHelp(lowerQuery)) {
      return this.getQuickHelpResponse(lowerQuery);
    }

    // Contextual responses based on current state
    if (context.currentPage) {
      return this.getContextualHelp(query, context);
    }

    // General AI response
    return this.generateAIResponse(query, context);
  }

  /**
   * Check if query matches predefined quick help
   */
  matchesQuickHelp(query) {
    const patterns = {
      skift_typer: ['skift', 'typ', 'arbetstid', 'förmiddag', 'eftermiddag', 'natt'],
      navigation: ['navigera', 'meny', 'hitta', 'var finns', 'hur kommer'],
      foretag: ['företag', 'vilka företag', 'stöds', 'industri'],
      export: ['export', 'ladda ner', 'csv', 'json', 'spara']
    };

    for (const [key, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => query.includes(keyword))) {
        return key;
      }
    }
    return false;
  }

  /**
   * Get quick help response
   */
  getQuickHelpResponse(query) {
    const helpType = this.matchesQuickHelp(query);
    if (helpType && this.quickHelp[helpType]) {
      return {
        type: 'quick_help',
        title: this.quickHelp[helpType].title,
        content: this.quickHelp[helpType].content,
        suggestions: this.getRelatedSuggestions(helpType)
      };
    }
    return this.generateAIResponse(query);
  }

  /**
   * Get contextual help based on current page
   */
  getContextualHelp(query, context) {
    const { currentPage, selectedCompany, selectedTeam } = context;

    switch (currentPage) {
      case 'dashboard':
        return this.getDashboardHelp(query, context);
      case 'calendar':
        return this.getCalendarHelp(query, context);
      case 'companies':
        return this.getCompanyHelp(query, context);
      default:
        return this.generateAIResponse(query, context);
    }
  }

  /**
   * Dashboard-specific help
   */
  getDashboardHelp(query, context) {
    const { selectedCompany, selectedTeam } = context;
    
    let companyInfo = '';
    let teamInfo = '';
    
    // Get real company information if available
    try {
      if (selectedCompany) {
        const company = this.universalSystem.companyRegistry.getCompany(selectedCompany);
        if (company) {
          companyInfo = `**${company.name}** (${company.location}) - ${company.industry}`;
          
          if (selectedTeam && company.teams.includes(selectedTeam)) {
            teamInfo = `**Lag ${selectedTeam}**: ${company.description}`;
          }
        }
      }
    } catch (error) {
      // Fallback if company data is not available
      companyInfo = selectedCompany ? `**Företag**: ${selectedCompany}` : '';
      teamInfo = selectedTeam ? `**Lag**: ${selectedTeam}` : '';
    }
    
    return {
      type: 'contextual',
      title: 'Dashboard Hjälp',
      content: `
${companyInfo ? `**Valt företag**: ${companyInfo}` : '**Inget företag valt**'}
${teamInfo ? `${teamInfo}` : selectedTeam ? `**Lag**: ${selectedTeam}` : '**Inget lag valt**'}

**Dashboard visar**:
- Dagens skiftstatus och arbetstider
- Månatlig statistik (arbetsdagar, timmar, vilodagar)  
- Skiftfördelning och övergripande systemstatus
- Systemhälsa och prestandastatistik

**Vanliga frågor**:
- "Varför ser jag fel skift?" - Kontrollera att rätt företag och lag är valt
- "Vad betyder färgerna?" - Varje skifttyp har sin färg (F=grön, E=orange, N=blå, L=grå)
- "Hur tolkar jag statistiken?" - Siffror baseras på ditt valda lag och aktuell månad
- "Vad är systemhälsa?" - Visar status för alla tjänster och antal aktiva företag

**Tips**: Dashboard uppdateras automatiskt varje minut med aktuell tid och skiftstatus.
      `,
      actions: [
        { text: 'Byt företag', action: 'navigate_companies' },
        { text: 'Visa kalender', action: 'navigate_calendar' },
        { text: 'Förklara skifttyper', action: 'explain_shifts' }
      ]
    };
  }

  /**
   * Calendar-specific help
   */
  getCalendarHelp(query, context) {
    return {
      type: 'contextual',
      title: 'Kalender Hjälp',
      content: `
**Kalendervy hjälp**:
- **Månadsvy**: Detaljerad daglig schemavisning
- **Årsvy**: Översikt av hela året
- **Färgkoder**: Varje skifttyp har sin unika färg
- **Export**: Spara scheman för offline-användning

**Navigation**:
- Använd pilarna för att byta månad/år
- Klicka på datum för mer detaljer
- Växla mellan månads- och årsvy med knapparna

**Tips**: Håll musen över en dag för snabb info om skifttyp och arbetstid.
      `,
      actions: [
        { text: 'Exportera schema', action: 'show_export' },
        { text: 'Byt företag', action: 'navigate_companies' }
      ]
    };
  }

  /**
   * Company selection help
   */
  getCompanyHelp(query, context) {
    const { selectedCompany } = context;
    
    // Get real company data
    let totalCompanies = 0;
    let industries = [];
    let locations = [];
    let featuredCompanies = '';
    
    try {
      const allCompanies = this.universalSystem.companyRegistry.getAllCompanies();
      totalCompanies = allCompanies.length;
      industries = [...new Set(allCompanies.map(c => c.industry))];
      locations = [...new Set(allCompanies.map(c => c.location))];
      
      // Featured companies (first 5)
      featuredCompanies = allCompanies
        .slice(0, 5)
        .map(company => `- **${company.name}**: ${company.industry} (${company.location})`)
        .join('\n');
    } catch (error) {
      totalCompanies = 30; // Fallback
      industries = ['Stålindustri', 'Fordonsindustri', 'Verktyg'];
      locations = ['Oxelösund', 'Göteborg', 'Stockholm'];
      featuredCompanies = '- **SSAB**: Stålindustri (Oxelösund)\n- **Volvo**: Fordonsindustri (Göteborg)';
    }
    
    let currentCompanyInfo = '';
    try {
      if (selectedCompany) {
        const company = this.universalSystem.companyRegistry.getCompany(selectedCompany);
        if (company) {
          const teamCount = company.teams.length;
          currentCompanyInfo = `
**Aktuellt val**: ${company.name} (${company.location})
- **Industri**: ${company.industry}
- **Antal lag**: ${teamCount}
- **Beskrivning**: ${company.description}
`;
        }
      }
    } catch (error) {
      // Fallback if company data is not available
      currentCompanyInfo = selectedCompany ? `**Aktuellt val**: ${selectedCompany}` : '';
    }
    
    return {
      type: 'contextual',
      title: 'Företagsval Hjälp',
      content: `
${currentCompanyInfo}
**Systemöversikt**:
- **${totalCompanies} svenska företag** stöds totalt
- **${industries.length} olika industrier**
- **${locations.length} orter** representerade

**Populära företag**:
${featuredCompanies}

**Sökfunktioner**:
- Sök efter företagsnamn
- Filtrera efter industri (${industries.slice(0, 3).join(', ')}, m.fl.)
- Filtrera efter plats (${locations.slice(0, 3).join(', ')}, m.fl.)

**Tips**: När du väljer företag visas alla tillgängliga lag automatiskt för det företaget.
      `,
      actions: [
        { text: 'Sök företag', action: 'focus_search' },
        { text: 'Visa alla industrier', action: 'show_industries' },
        { text: 'Lista alla företag', action: 'list_companies' }
      ]
    };
  }

  /**
   * Generate AI response for complex queries
   */
  generateAIResponse(query, context = {}) {
    // This would integrate with a real AI service in production
    // For now, we'll provide intelligent rule-based responses
    
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('fel') || lowerQuery.includes('problem') || lowerQuery.includes('fungerar inte')) {
      return this.getTroubleshootingHelp(query, context);
    }
    
    if (lowerQuery.includes('jämför') || lowerQuery.includes('skillnad')) {
      return this.getComparisonHelp(query, context);
    }
    
    if (lowerQuery.includes('tid') || lowerQuery.includes('timmar') || lowerQuery.includes('arbetstid')) {
      return this.getWorkTimeHelp(query, context);
    }

    // Default helpful response
    return {
      type: 'general',
      title: 'Allmän Hjälp',
      content: `
Jag kan hjälpa dig med:

**🏢 Företag & Lag**: Välja rätt företag och lag för dina scheman
**📅 Kalender**: Navigera och förstå schemavisningen  
**📊 Statistik**: Tolka arbetstider, vilodagar och månatlig data
**📁 Export**: Spara scheman i olika format
**🔧 Felsökning**: Lösa vanliga problem

**Ställ gärna mer specifika frågor som**:
- "Hur fungerar nattskift?"
- "Vad betyder F, E, N?"
- "Hur exporterar jag mitt schema?"
- "Vilka företag stöds?"
      `,
      suggestions: [
        'Visa skifttyper',
        'Hjälp med export',
        'Vilka företag finns?',
        'Navigationshjälp'
      ]
    };
  }

  /**
   * Troubleshooting help
   */
  getTroubleshootingHelp(query, context) {
    return {
      type: 'troubleshooting',
      title: 'Felsökning',
      content: `
**Vanliga problem och lösningar**:

**Inget schema visas**:
- Kontrollera att företag och lag är valt
- Prova att ladda om sidan
- Kontrollera internetanslutning

**Fel datum eller skift**:
- Verifiera att rätt månad/år är valt
- Kontrollera att korrekt lag är aktivt
- Systemet använder svensk tid (CET/CEST)

**Export fungerar inte**:
- Kontrollera att datum är korrekt format
- Prova ett mindre datumintervall
- Vissa webbläsare blockerar nedladdningar

**Långsam laddning**:
- Systemet genererar scheman i realtid
- Stora datumintervall tar längre tid
- Prova att begränsa tidsperioden
      `,
      actions: [
        { text: 'Ladda om sidan', action: 'reload' },
        { text: 'Kontakta support', action: 'contact_support' }
      ]
    };
  }

  /**
   * Comparison help
   */
  getComparisonHelp(query, context) {
    return {
      type: 'comparison',
      title: 'Jämförelse Hjälp',
      content: `
**Jämför företag och lag**:

Systemet stöder jämförelser mellan:
- **Olika företag**: Se skillnader i skiftmönster
- **Olika lag**: Inom samma företag
- **Tidsperioder**: Jämför månader eller år

**Användbara jämförelser**:
- SSAB vs Volvo skiftmönster
- Dag- vs nattskift fördelning
- Arbetstid per månad mellan lag
- Helgarbete mellan företag

**Tips**: Använd export-funktionen för att få data du kan analysera i Excel.
      `,
      actions: [
        { text: 'Visa jämförelse', action: 'show_comparison' },
        { text: 'Exportera data', action: 'export_comparison' }
      ]
    };
  }

  /**
   * Work time help
   */
  getWorkTimeHelp(query, context) {
    return {
      type: 'worktime',
      title: 'Arbetstider',
      content: `
**Svenska skiftmönster**:

**Standardskift (8-timmars)**:
- **F (Förmiddag)**: 06:00-14:00
- **E (Eftermiddag)**: 14:00-22:00  
- **N (Natt)**: 22:00-06:00

**Specialskift**:
- **D (Dag)**: Vanligtvis 07:00-16:00 eller 08:00-17:00
- **K (Kväll)**: Varierar, ofta 16:00-24:00

**Arbetstidslagen**:
- Max 40 timmar/vecka i genomsnitt
- Minst 11 timmars vila mellan skift
- Särskilda regler för nattarbete

**Vila och raster**:
- **L (Ledig)**: Ingen arbetstid
- Raster enligt kollektivavtal
      `,
      actions: [
        { text: 'Visa månadstimmar', action: 'show_monthly_hours' },
        { text: 'Beräkna arbetstid', action: 'calculate_hours' }
      ]
    };
  }

  /**
   * Get related suggestions
   */
  getRelatedSuggestions(helpType) {
    const suggestions = {
      skift_typer: ['Visa arbetstider', 'Förklara nattskift', 'Vad är F, E, N?'],
      navigation: ['Hitta kalender', 'Byt företag', 'Exportera schema'],
      foretag: ['Vilka industrier?', 'Sök efter plats', 'Populära företag'],
      export: ['CSV-format', 'JSON-export', 'Välj datumintervall']
    };
    return suggestions[helpType] || [];
  }

  /**
   * Extract relevant context from query
   */
  extractRelevantContext(query) {
    const context = {};
    const lowerQuery = query.toLowerCase();

    // Extract mentioned companies
    const companies = ['ssab', 'volvo', 'sandvik', 'skf', 'lkab', 'scania', 'boliden'];
    context.mentionedCompanies = companies.filter(company => lowerQuery.includes(company));

    // Extract mentioned shift types
    const shiftTypes = ['förmiddag', 'eftermiddag', 'natt', 'dag', 'kväll'];
    context.mentionedShifts = shiftTypes.filter(shift => lowerQuery.includes(shift));

    // Extract topics
    if (lowerQuery.includes('export') || lowerQuery.includes('ladda ner')) {
      context.topic = 'export';
    } else if (lowerQuery.includes('kalender') || lowerQuery.includes('schema')) {
      context.topic = 'calendar';
    } else if (lowerQuery.includes('företag') || lowerQuery.includes('lag')) {
      context.topic = 'companies';
    }

    return context;
  }

  /**
   * Get fallback response for errors
   */
  getFallbackResponse(query) {
    return {
      type: 'fallback',
      title: 'Hjälp',
      content: `
Jag hade lite problem att förstå din fråga, men jag kan hjälpa dig med:

- **Skiftplanering**: Förklara olika skifttyper och arbetstider
- **Navigation**: Hitta rätt funktioner i appen
- **Företagsval**: Välja rätt företag och lag
- **Export**: Spara scheman och data
- **Felsökning**: Lösa vanliga problem

Prova att ställa en mer specifik fråga eller välj från förslagen nedan.
      `,
      suggestions: [
        'Vad betyder skifttyperna?',
        'Hur navigerar jag i appen?',
        'Vilka företag stöds?',
        'Hur exporterar jag schema?'
      ]
    };
  }

  /**
   * Get conversation starters
   */
  getConversationStarters() {
    return [
      'Vad betyder F, E, N skift?',
      'Vilka företag stöds i systemet?',
      'Hur fungerar export till Excel?',
      'Förklara hur nattskift fungerar',
      'Visa mig navigationen',
      'Hjälp med företagsval',
      'Vad är skillnaden mellan företagen?'
    ];
  }
}

module.exports = new AIService();