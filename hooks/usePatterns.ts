import { useCallback, useEffect, useState } from 'react';
import { patternCalculator, PatternData, PatternResult } from '../lib/patternCalculator';

export interface UsePatternsReturn {
  patterns: PatternResult[];
  todayPatterns: { [schema: string]: number };
  loading: boolean;
  error: string | null;
  refreshPatterns: () => Promise<void>;
  getSchemaPattern: (schema: string) => PatternResult | undefined;
  getHistoricalData: (schema: string) => PatternData[];
  getProjectedData: (schema: string) => PatternData[];
}

export const usePatterns = (): UsePatternsReturn => {
  const [patterns, setPatterns] = useState<PatternResult[]>([]);
  const [todayPatterns, setTodayPatterns] = useState<{ [schema: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPatterns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Hämta alla mönster
      const allPatterns = await patternCalculator.calculateAllPatterns();
      setPatterns(allPatterns);
      
      // Hämta dagens mönster
      const today = await patternCalculator.getTodayPatterns();
      setTodayPatterns(today);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod vid beräkning av mönster');
    } finally {
      setLoading(false);
    }
  }, []);

  // Ladda mönster när komponenten mountas
  useEffect(() => {
    refreshPatterns();
  }, [refreshPatterns]);

  // Uppdatera mönster automatiskt varje timme
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPatterns();
    }, 60 * 60 * 1000); // 1 timme

    return () => clearInterval(interval);
  }, [refreshPatterns]);

  const getSchemaPattern = useCallback((schema: string): PatternResult | undefined => {
    return patterns.find(pattern => 
      pattern.historical.length > 0 && pattern.historical[0].schema === schema
    );
  }, [patterns]);

  const getHistoricalData = useCallback((schema: string): PatternData[] => {
    const pattern = getSchemaPattern(schema);
    return pattern?.historical || [];
  }, [getSchemaPattern]);

  const getProjectedData = useCallback((schema: string): PatternData[] => {
    const pattern = getSchemaPattern(schema);
    return pattern?.projected || [];
  }, [getSchemaPattern]);

  return {
    patterns,
    todayPatterns,
    loading,
    error,
    refreshPatterns,
    getSchemaPattern,
    getHistoricalData,
    getProjectedData
  };
}; 