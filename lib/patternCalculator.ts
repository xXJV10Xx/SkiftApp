import { supabase } from './supabase';

export interface PatternData {
  date: string;
  value: number;
  category: string;
  schema: string;
}

export interface PatternResult {
  historical: PatternData[];
  projected: PatternData[];
  trends: {
    growth: number;
    seasonality: number;
    volatility: number;
  };
}

export class PatternCalculator {
  private currentDate: Date;
  private fiveYearsAgo: Date;
  private fiveYearsFromNow: Date;

  constructor() {
    this.currentDate = new Date();
    this.fiveYearsAgo = new Date(this.currentDate.getFullYear() - 5, this.currentDate.getMonth(), this.currentDate.getDate());
    this.fiveYearsFromNow = new Date(this.currentDate.getFullYear() + 5, this.currentDate.getMonth(), this.currentDate.getDate());
  }

  // Beräkna mönster för alla scheman
  async calculateAllPatterns(): Promise<PatternResult[]> {
    const patterns: PatternResult[] = [];

    // Analysera varje schema
    patterns.push(await this.analyzeProfilesPattern());
    patterns.push(await this.analyzeCompaniesPattern());
    patterns.push(await this.analyzeTeamsPattern());
    patterns.push(await this.analyzeTeamMembersPattern());
    patterns.push(await this.analyzeChatMessagesPattern());
    patterns.push(await this.analyzeOnlineStatusPattern());

    return patterns;
  }

  // Analysera profiler mönster
  private async analyzeProfilesPattern(): Promise<PatternResult> {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('created_at, updated_at')
      .gte('created_at', this.fiveYearsAgo.toISOString())
      .lte('created_at', this.fiveYearsFromNow.toISOString());

    const historical = this.groupByDate(profiles || [], 'created_at', 'profiles');
    const projected = this.projectPattern(historical, 'profiles');

    return {
      historical,
      projected,
      trends: this.calculateTrends(historical)
    };
  }

  // Analysera företag mönster
  private async analyzeCompaniesPattern(): Promise<PatternResult> {
    const { data: companies } = await supabase
      .from('companies')
      .select('created_at, updated_at')
      .gte('created_at', this.fiveYearsAgo.toISOString())
      .lte('created_at', this.fiveYearsFromNow.toISOString());

    const historical = this.groupByDate(companies || [], 'created_at', 'companies');
    const projected = this.projectPattern(historical, 'companies');

    return {
      historical,
      projected,
      trends: this.calculateTrends(historical)
    };
  }

  // Analysera team mönster
  private async analyzeTeamsPattern(): Promise<PatternResult> {
    const { data: teams } = await supabase
      .from('teams')
      .select('created_at, updated_at')
      .gte('created_at', this.fiveYearsAgo.toISOString())
      .lte('created_at', this.fiveYearsFromNow.toISOString());

    const historical = this.groupByDate(teams || [], 'created_at', 'teams');
    const projected = this.projectPattern(historical, 'teams');

    return {
      historical,
      projected,
      trends: this.calculateTrends(historical)
    };
  }

  // Analysera team medlemmar mönster
  private async analyzeTeamMembersPattern(): Promise<PatternResult> {
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('joined_at')
      .gte('joined_at', this.fiveYearsAgo.toISOString())
      .lte('joined_at', this.fiveYearsFromNow.toISOString());

    const historical = this.groupByDate(teamMembers || [], 'joined_at', 'team_members');
    const projected = this.projectPattern(historical, 'team_members');

    return {
      historical,
      projected,
      trends: this.calculateTrends(historical)
    };
  }

  // Analysera chattmeddelanden mönster
  private async analyzeChatMessagesPattern(): Promise<PatternResult> {
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('created_at')
      .gte('created_at', this.fiveYearsAgo.toISOString())
      .lte('created_at', this.fiveYearsFromNow.toISOString());

    const historical = this.groupByDate(messages || [], 'created_at', 'chat_messages');
    const projected = this.projectPattern(historical, 'chat_messages');

    return {
      historical,
      projected,
      trends: this.calculateTrends(historical)
    };
  }

  // Analysera online status mönster
  private async analyzeOnlineStatusPattern(): Promise<PatternResult> {
    const { data: onlineStatus } = await supabase
      .from('online_status')
      .select('last_seen, updated_at')
      .gte('last_seen', this.fiveYearsAgo.toISOString())
      .lte('last_seen', this.fiveYearsFromNow.toISOString());

    const historical = this.groupByDate(onlineStatus || [], 'last_seen', 'online_status');
    const projected = this.projectPattern(historical, 'online_status');

    return {
      historical,
      projected,
      trends: this.calculateTrends(historical)
    };
  }

  // Gruppera data per datum
  private groupByDate(data: any[], dateField: string, schema: string): PatternData[] {
    const grouped: { [key: string]: number } = {};
    
    data.forEach(item => {
      const date = new Date(item[dateField]).toISOString().split('T')[0];
      grouped[date] = (grouped[date] || 0) + 1;
    });

    return Object.entries(grouped).map(([date, value]) => ({
      date,
      value,
      category: 'activity',
      schema
    }));
  }

  // Projicera mönster framåt
  private projectPattern(historical: PatternData[], schema: string): PatternData[] {
    if (historical.length < 2) return [];

    const projected: PatternData[] = [];
    const today = new Date();
    
    // Beräkna genomsnittlig tillväxt per dag
    const values = historical.map(h => h.value);
    const avgGrowth = this.calculateAverageGrowth(values);
    
    // Projicera 5 år framåt
    for (let i = 1; i <= 1825; i++) { // 5 år = 1825 dagar
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      
      const projectedValue = Math.max(0, values[values.length - 1] + (avgGrowth * i));
      
      projected.push({
        date: futureDate.toISOString().split('T')[0],
        value: Math.round(projectedValue),
        category: 'projected',
        schema
      });
    }

    return projected;
  }

  // Beräkna genomsnittlig tillväxt
  private calculateAverageGrowth(values: number[]): number {
    if (values.length < 2) return 0;
    
    let totalGrowth = 0;
    for (let i = 1; i < values.length; i++) {
      totalGrowth += values[i] - values[i - 1];
    }
    
    return totalGrowth / (values.length - 1);
  }

  // Beräkna trender
  private calculateTrends(historical: PatternData[]): { growth: number; seasonality: number; volatility: number } {
    if (historical.length < 2) {
      return { growth: 0, seasonality: 0, volatility: 0 };
    }

    const values = historical.map(h => h.value);
    
    // Beräkna tillväxt
    const growth = ((values[values.length - 1] - values[0]) / values[0]) * 100;
    
    // Beräkna volatilitet (standardavvikelse)
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const volatility = Math.sqrt(variance);
    
    // Enkel säsongsvariation (kan förbättras)
    const seasonality = this.calculateSeasonality(values);

    return {
      growth: Math.round(growth * 100) / 100,
      seasonality: Math.round(seasonality * 100) / 100,
      volatility: Math.round(volatility * 100) / 100
    };
  }

  // Beräkna säsongsvariation
  private calculateSeasonality(values: number[]): number {
    if (values.length < 365) return 0; // Behöver minst ett år data
    
    const monthlyAverages = new Array(12).fill(0);
    const monthlyCounts = new Array(12).fill(0);
    
    // Gruppera per månad (förenklad)
    values.forEach((value, index) => {
      const month = index % 12;
      monthlyAverages[month] += value;
      monthlyCounts[month]++;
    });
    
    // Beräkna genomsnitt per månad
    for (let i = 0; i < 12; i++) {
      if (monthlyCounts[i] > 0) {
        monthlyAverages[i] /= monthlyCounts[i];
      }
    }
    
    // Beräkna säsongsvariation som standardavvikelse från genomsnitt
    const overallMean = monthlyAverages.reduce((a, b) => a + b, 0) / 12;
    const seasonality = Math.sqrt(
      monthlyAverages.reduce((a, b) => a + Math.pow(b - overallMean, 2), 0) / 12
    );
    
    return seasonality;
  }

  // Hämta dagens mönster för alla scheman
  async getTodayPatterns(): Promise<{ [schema: string]: number }> {
    const today = new Date().toISOString().split('T')[0];
    const patterns: { [schema: string]: number } = {};

    // Hämta dagens aktivitet för varje schema
    const schemas = ['profiles', 'companies', 'teams', 'team_members', 'chat_messages', 'online_status'];
    
    for (const schema of schemas) {
      const { count } = await supabase
        .from(schema)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today)
        .lte('created_at', today + 'T23:59:59');
      
      patterns[schema] = count || 0;
    }

    return patterns;
  }

  // Uppdatera mönster automatiskt (körs regelbundet)
  async updatePatterns(): Promise<void> {
    const patterns = await this.calculateAllPatterns();
    
    // Här kan du spara mönster till en cache eller databas
    // för snabb åtkomst i appen
    console.log('Patterns updated:', patterns);
  }
}

// Exportera en instans för användning i appen
export const patternCalculator = new PatternCalculator(); 