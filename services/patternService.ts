import AsyncStorage from '@react-native-async-storage/async-storage';
import { patternCalculator, PatternResult } from '../lib/patternCalculator';

interface CachedPatterns {
  patterns: PatternResult[];
  lastUpdated: string;
  todayPatterns: { [schema: string]: number };
}

export class PatternService {
  private static instance: PatternService;
  private cacheKey = 'skiftapp_patterns_cache';
  private updateInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): PatternService {
    if (!PatternService.instance) {
      PatternService.instance = new PatternService();
    }
    return PatternService.instance;
  }

  // Hämta cachade mönster
  async getCachedPatterns(): Promise<PatternResult[]> {
    try {
      const cached = await AsyncStorage.getItem(this.cacheKey);
      if (cached) {
        const data: CachedPatterns = JSON.parse(cached);
        const lastUpdated = new Date(data.lastUpdated);
        const now = new Date();
        
        // Om cache är äldre än 1 timme, uppdatera
        if (now.getTime() - lastUpdated.getTime() < 60 * 60 * 1000) {
          return data.patterns;
        }
      }
    } catch (error) {
      console.error('Fel vid hämtning av cachade mönster:', error);
    }
    
    // Om ingen cache eller för gammal, beräkna nya mönster
    return this.updatePatterns();
  }

  // Uppdatera mönster och cache
  async updatePatterns(): Promise<PatternResult[]> {
    try {
      console.log('Uppdaterar mönster...');
      
      const patterns = await patternCalculator.calculateAllPatterns();
      const todayPatterns = await patternCalculator.getTodayPatterns();
      
      const cacheData: CachedPatterns = {
        patterns,
        lastUpdated: new Date().toISOString(),
        todayPatterns
      };
      
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
      
      console.log('Mönster uppdaterade och cachade');
      return patterns;
    } catch (error) {
      console.error('Fel vid uppdatering av mönster:', error);
      throw error;
    }
  }

  // Starta automatisk uppdatering
  startAutoUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    // Uppdatera varje timme
    this.updateInterval = setInterval(async () => {
      try {
        await this.updatePatterns();
      } catch (error) {
        console.error('Fel vid automatisk uppdatering av mönster:', error);
      }
    }, 60 * 60 * 1000); // 1 timme
  }

  // Stoppa automatisk uppdatering
  stopAutoUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Hämta dagens mönster från cache
  async getTodayPatterns(): Promise<{ [schema: string]: number }> {
    try {
      const cached = await AsyncStorage.getItem(this.cacheKey);
      if (cached) {
        const data: CachedPatterns = JSON.parse(cached);
        return data.todayPatterns;
      }
    } catch (error) {
      console.error('Fel vid hämtning av dagens mönster:', error);
    }
    
    return {};
  }

  // Rensa cache
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.cacheKey);
      console.log('Mönster cache rensad');
    } catch (error) {
      console.error('Fel vid rensning av cache:', error);
    }
  }

  // Hämta cache status
  async getCacheStatus(): Promise<{ lastUpdated: string | null; isValid: boolean }> {
    try {
      const cached = await AsyncStorage.getItem(this.cacheKey);
      if (cached) {
        const data: CachedPatterns = JSON.parse(cached);
        const lastUpdated = new Date(data.lastUpdated);
        const now = new Date();
        const isValid = now.getTime() - lastUpdated.getTime() < 60 * 60 * 1000;
        
        return {
          lastUpdated: data.lastUpdated,
          isValid
        };
      }
    } catch (error) {
      console.error('Fel vid hämtning av cache status:', error);
    }
    
    return { lastUpdated: null, isValid: false };
  }

  // Hämta specifikt schema mönster
  async getSchemaPattern(schema: string): Promise<PatternResult | null> {
    const patterns = await this.getCachedPatterns();
    return patterns.find(pattern => 
      pattern.historical.length > 0 && pattern.historical[0].schema === schema
    ) || null;
  }

  // Hämta alla scheman som har data
  async getAvailableSchemas(): Promise<string[]> {
    const patterns = await this.getCachedPatterns();
    return patterns
      .filter(pattern => pattern.historical.length > 0)
      .map(pattern => pattern.historical[0].schema);
  }

  // Beräkna total aktivitet för alla scheman
  async getTotalActivity(): Promise<{ [schema: string]: number }> {
    const patterns = await this.getCachedPatterns();
    const totalActivity: { [schema: string]: number } = {};
    
    patterns.forEach(pattern => {
      if (pattern.historical.length > 0) {
        const schema = pattern.historical[0].schema;
        totalActivity[schema] = pattern.historical.reduce((sum, data) => sum + data.value, 0);
      }
    });
    
    return totalActivity;
  }

  // Hämta trend sammanfattning för alla scheman
  async getTrendsSummary(): Promise<{ [schema: string]: { growth: number; seasonality: number; volatility: number } }> {
    const patterns = await this.getCachedPatterns();
    const trendsSummary: { [schema: string]: { growth: number; seasonality: number; volatility: number } } = {};
    
    patterns.forEach(pattern => {
      if (pattern.historical.length > 0) {
        const schema = pattern.historical[0].schema;
        trendsSummary[schema] = pattern.trends;
      }
    });
    
    return trendsSummary;
  }
}

// Exportera singleton instans
export const patternService = PatternService.getInstance(); 