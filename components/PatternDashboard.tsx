import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePatterns } from '../hooks/usePatterns';

interface PatternDashboardProps {
  selectedSchema?: string;
}

export const PatternDashboard: React.FC<PatternDashboardProps> = ({ selectedSchema }) => {
  const {
    patterns,
    todayPatterns,
    loading,
    error,
    getSchemaPattern,
    getHistoricalData,
    getProjectedData
  } = usePatterns();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Beräknar mönster...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Fel: {error}</Text>
      </View>
    );
  }

  const schemas = ['profiles', 'companies', 'teams', 'team_members', 'chat_messages', 'online_status'];
  const schemaNames = {
    profiles: 'Profiler',
    companies: 'Företag',
    teams: 'Team',
    team_members: 'Teammedlemmar',
    chat_messages: 'Chattmeddelanden',
    online_status: 'Online Status'
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mönsteranalys - 5 år framåt och bakåt</Text>
      
      {/* Dagens aktivitet */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dagens Aktivitet</Text>
        <View style={styles.todayGrid}>
          {schemas.map(schema => (
            <View key={schema} style={styles.todayCard}>
              <Text style={styles.todayLabel}>{schemaNames[schema as keyof typeof schemaNames]}</Text>
              <Text style={styles.todayValue}>{todayPatterns[schema] || 0}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Mönster för valt schema eller alla */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {selectedSchema ? `${schemaNames[selectedSchema as keyof typeof schemaNames]} Mönster` : 'Alla Mönster'}
        </Text>
        
        {(selectedSchema ? [selectedSchema] : schemas).map(schema => {
          const pattern = getSchemaPattern(schema);
          if (!pattern) return null;

          const historical = getHistoricalData(schema);
          const projected = getProjectedData(schema);
          
          return (
            <View key={schema} style={styles.patternCard}>
              <Text style={styles.patternTitle}>
                {schemaNames[schema as keyof typeof schemaNames]}
              </Text>
              
              {/* Trender */}
              <View style={styles.trendsContainer}>
                <View style={styles.trendItem}>
                  <Text style={styles.trendLabel}>Tillväxt</Text>
                  <Text style={[styles.trendValue, pattern.trends.growth > 0 ? styles.positive : styles.negative]}>
                    {pattern.trends.growth > 0 ? '+' : ''}{pattern.trends.growth}%
                  </Text>
                </View>
                <View style={styles.trendItem}>
                  <Text style={styles.trendLabel}>Säsongsvariation</Text>
                  <Text style={styles.trendValue}>{pattern.trends.seasonality}</Text>
                </View>
                <View style={styles.trendItem}>
                  <Text style={styles.trendLabel}>Volatilitet</Text>
                  <Text style={styles.trendValue}>{pattern.trends.volatility}</Text>
                </View>
              </View>

              {/* Data sammanfattning */}
              <View style={styles.dataSummary}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Historisk data</Text>
                  <Text style={styles.summaryValue}>{historical.length} datapunkter</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Projicerad data</Text>
                  <Text style={styles.summaryValue}>{projected.length} datapunkter</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Senaste aktivitet</Text>
                  <Text style={styles.summaryValue}>
                    {historical.length > 0 ? historical[historical.length - 1].value : 0}
                  </Text>
                </View>
              </View>

              {/* Tidslinje preview */}
              <View style={styles.timelinePreview}>
                <Text style={styles.timelineTitle}>Tidslinje (5 år bakåt → 5 år framåt)</Text>
                <View style={styles.timelineBar}>
                  <View style={styles.historicalBar} />
                  <View style={styles.currentMarker} />
                  <View style={styles.projectedBar} />
                </View>
                <View style={styles.timelineLabels}>
                  <Text style={styles.timelineLabel}>5 år bakåt</Text>
                  <Text style={styles.timelineLabel}>Idag</Text>
                  <Text style={styles.timelineLabel}>5 år framåt</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  todayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  todayCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todayLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  todayValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  patternCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  patternTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  trendsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  trendItem: {
    alignItems: 'center',
    flex: 1,
  },
  trendLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  trendValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  positive: {
    color: '#34C759',
  },
  negative: {
    color: '#FF3B30',
  },
  dataSummary: {
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  timelinePreview: {
    marginTop: 8,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  timelineBar: {
    flexDirection: 'row',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  historicalBar: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  currentMarker: {
    width: 4,
    backgroundColor: '#FF9500',
  },
  projectedBar: {
    flex: 1,
    backgroundColor: '#34C759',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  timelineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineLabel: {
    fontSize: 10,
    color: '#666',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
}); 