import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';

interface ScheduleDay {
  date: string;
  dateString: string;
  day: number;
  weekday: string;
  shift: {
    code: string;
    time: {
      start: string;
      end: string;
      name: string;
    };
    cycleDay: number;
    totalCycleDays: number;
  };
  isToday: boolean;
  isWeekend: boolean;
  teamId: string;
}

interface ScheduleData {
  success: boolean;
  data?: {
    schedule: ScheduleDay[];
    stats?: {
      totalHours: number;
      workDays: number;
      averageHours: number;
    };
    nextShift?: any;
    teamInfo: {
      teamId: string;
      companyName: string;
      shiftType: string;
      color: string;
    };
  };
  error?: string;
}

interface SSABScheduleProps {
  teamId: '31' | '32' | '33' | '34' | '35';
  showStats?: boolean;
}

/**
 * SSAB Oxelösund Schema Komponent
 * Visar schema för ett specifikt lag med korrekt SSAB 3-skift mönster
 */
export const SSABScheduleExample: React.FC<SSABScheduleProps> = ({ 
  teamId, 
  showStats = true 
}) => {
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedule();
  }, [teamId]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Anropa API:et för att hämta schema för aktuell månad
      const response = await fetch(
        `/api/generate-schedule?currentMonth=true&teamId=${teamId}&includeStats=true`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: ScheduleData = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Okänt fel');
      }
      
      setSchedule(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nätverksfel';
      setError(errorMessage);
      console.error('Fel vid hämtning av schema:', err);
    } finally {
      setLoading(false);
    }
  };

  const getShiftColor = (shiftCode: string, teamColor: string) => {
    if (shiftCode === 'L') return '#E8E8E8'; // Ledig = grå
    return teamColor;
  };

  const getShiftDisplayText = (day: ScheduleDay) => {
    if (day.shift.code === 'L') {
      return 'Ledig';
    }
    return `${day.shift.time.name} (${day.shift.time.start}-${day.shift.time.end})`;
  };

  const renderScheduleDay = ({ item }: { item: ScheduleDay }) => {
    const teamColor = schedule?.data?.teamInfo.color || '#666666';
    const backgroundColor = getShiftColor(item.shift.code, teamColor);
    const isToday = item.isToday;
    
    return (
      <View style={[
        styles.dayContainer, 
        { backgroundColor },
        isToday && styles.todayBorder
      ]}>
        <View style={styles.dayHeader}>
          <Text style={[styles.weekday, { color: item.shift.code === 'L' ? '#666' : 'white' }]}>
            {item.weekday}
          </Text>
          <Text style={[styles.dayNumber, { color: item.shift.code === 'L' ? '#666' : 'white' }]}>
            {item.day}
          </Text>
        </View>
        
        <View style={styles.shiftInfo}>
          <Text style={[styles.shiftName, { color: item.shift.code === 'L' ? '#666' : 'white' }]}>
            {getShiftDisplayText(item)}
          </Text>
          {item.shift.code !== 'L' && (
            <Text style={[styles.cycleInfo, { color: 'rgba(255,255,255,0.8)' }]}>
              Cykel {item.shift.cycleDay}/{item.shift.totalCycleDays}
            </Text>
          )}
        </View>
        
        {isToday && (
          <View style={styles.todayIndicator}>
            <Text style={styles.todayText}>IDAG</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Laddar schema...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>❌ Fel: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSchedule}>
          <Text style={styles.retryButtonText}>Försök igen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!schedule?.data) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Ingen data tillgänglig</Text>
      </View>
    );
  }

  const { teamInfo, stats, schedule: scheduleData } = schedule.data;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.companyName}>{teamInfo.companyName}</Text>
        <Text style={styles.teamName}>Lag {teamInfo.teamId}</Text>
        <Text style={styles.shiftType}>{teamInfo.shiftType}</Text>
      </View>

      {/* Statistik */}
      {showStats && stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.workDays}</Text>
            <Text style={styles.statLabel}>Arbetsdagar</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalHours}h</Text>
            <Text style={styles.statLabel}>Totalt</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.averageHours}h</Text>
            <Text style={styles.statLabel}>Snitt/dag</Text>
          </View>
        </View>
      )}

      {/* Schema */}
      <FlatList
        data={scheduleData}
        renderItem={renderScheduleDay}
        keyExtractor={(item) => item.dateString}
        numColumns={7}
        contentContainerStyle={styles.scheduleGrid}
        showsVerticalScrollIndicator={false}
      />

      {/* Förklaring */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Skifttyper:</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: teamInfo.color }]} />
            <Text style={styles.legendText}>M = Morgon (06:00-14:00)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: teamInfo.color }]} />
            <Text style={styles.legendText}>A = Kväll (14:00-22:00)</Text>
          </View>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: teamInfo.color }]} />
            <Text style={styles.legendText}>N = Natt (22:00-06:00)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#E8E8E8' }]} />
            <Text style={styles.legendText}>L = Ledig</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  teamName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 4,
  },
  shiftType: {
    fontSize: 16,
    color: '#888',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  scheduleGrid: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayContainer: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    borderRadius: 8,
    padding: 8,
    justifyContent: 'space-between',
    position: 'relative',
  },
  todayBorder: {
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  dayHeader: {
    alignItems: 'center',
  },
  weekday: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  shiftInfo: {
    alignItems: 'center',
  },
  shiftName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  cycleInfo: {
    fontSize: 8,
    marginTop: 2,
    textAlign: 'center',
  },
  todayIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF6B35',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  todayText: {
    fontSize: 8,
    color: 'white',
    fontWeight: 'bold',
  },
  legend: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Hook för att använda SSAB schema data
export const useSSABSchedule = (teamId: '31' | '32' | '33' | '34' | '35') => {
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/generate-schedule?currentMonth=true&teamId=${teamId}&includeStats=true`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: ScheduleData = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Okänt fel');
      }
      
      setSchedule(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nätverksfel';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [teamId]);

  return { schedule, loading, error, refetch: fetchSchedule };
};

export default SSABScheduleExample;