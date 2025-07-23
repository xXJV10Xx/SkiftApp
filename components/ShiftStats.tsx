import { useTheme } from '@/context/ThemeContext';
import { Company } from '@/data/companies';
import { calculateWorkedHours, generateMonthSchedule, getNextShift } from '@/lib/shiftCalculations';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ShiftStatsProps {
  company: Company;
  team: string;
  shiftTypeId: string;
}

export const ShiftStats: React.FC<ShiftStatsProps> = ({
  company,
  team,
  shiftTypeId
}) => {
  const { colors } = useTheme();
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Generera schema för aktuell månad
  const monthSchedule = generateMonthSchedule(currentYear, currentMonth, { id: shiftTypeId }, team);
  
  // Beräkna statistik
  const stats = calculateWorkedHours(monthSchedule);
  const nextShift = getNextShift({ shiftType: { id: shiftTypeId }, team }, currentDate);

  const getShiftName = (shiftCode: string) => {
    const shiftNames: Record<string, string> = {
      'M': 'Morgon',
      'A': 'Kväll',
      'N': 'Natt',
      'F': 'Förmiddag',
      'E': 'Eftermiddag',
      'D': 'Dag',
      'L': 'Ledig'
    };
    return shiftNames[shiftCode] || shiftCode;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      {/* Arbetade timmar */}
      <View style={[styles.statCard, { backgroundColor: colors.card }]}>
        <View style={styles.statHeader}>
          <Text style={[styles.statTitle, { color: colors.text }]}>
            Arbetade timmar
          </Text>
          <Ionicons name="time" size={16} color={colors.textSecondary} />
        </View>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {stats.totalHours}h
        </Text>
        <Text style={[styles.statSubtext, { color: colors.textSecondary }]}>
          {stats.workDays} arbetsdagar denna månad
        </Text>
      </View>

      {/* Genomsnitt per dag */}
      <View style={[styles.statCard, { backgroundColor: colors.card }]}>
        <View style={styles.statHeader}>
          <Text style={[styles.statTitle, { color: colors.text }]}>
            Genomsnitt per dag
          </Text>
          <Ionicons name="trending-up" size={16} color={colors.textSecondary} />
        </View>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {stats.averageHours}h
        </Text>
        <Text style={[styles.statSubtext, { color: colors.textSecondary }]}>
          {stats.workDays > 0 ? 'Baserat på arbetsdagar' : 'Inga arbetsdagar'}
        </Text>
      </View>

      {/* Nästa skift */}
      <View style={[styles.statCard, { backgroundColor: colors.card }]}>
        <View style={styles.statHeader}>
          <Text style={[styles.statTitle, { color: colors.text }]}>
            Nästa skift
          </Text>
          <Ionicons name="calendar" size={16} color={colors.textSecondary} />
        </View>
        {nextShift ? (
          <>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {getShiftName(nextShift.shift.code)}
            </Text>
            <Text style={[styles.statSubtext, { color: colors.textSecondary }]}>
              {formatDate(nextShift.date)}
            </Text>
            <Text style={[styles.statSubtext, { color: colors.textSecondary }]}>
              {nextShift.daysUntil} dagar kvar
            </Text>
          </>
        ) : (
          <Text style={[styles.statSubtext, { color: colors.textSecondary }]}>
            Inget kommande skift
          </Text>
        )}
      </View>

      {/* Team info */}
      <View style={[styles.statCard, { backgroundColor: colors.card }]}>
        <View style={styles.statHeader}>
          <Text style={[styles.statTitle, { color: colors.text }]}>
            Skiftlag
          </Text>
          <Ionicons name="people" size={16} color={colors.textSecondary} />
        </View>
        <View style={styles.teamInfo}>
          <View style={[
            styles.teamColor,
            { backgroundColor: company.colors[team] }
          ]} />
          <View style={styles.teamDetails}>
            <Text style={[styles.teamName, { color: colors.text }]}>
              {team}
            </Text>
            <Text style={[styles.teamCompany, { color: colors.textSecondary }]}>
              {company.name}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 10,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamColor: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  teamDetails: {
    flex: 1,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
  },
  teamCompany: {
    fontSize: 10,
  },
}); 