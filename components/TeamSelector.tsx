import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COMPANIES, SHIFT_TYPES } from '../data/companies';

interface TeamSelectorProps {
  companyId: string;
  selectedTeam: string;
  onSelectTeam: (team: string) => void;
  selectedShiftTypeId: string;
  onSelectShiftType: (shiftTypeId: string) => void;
}

export function TeamSelector({ 
  companyId, 
  selectedTeam, 
  onSelectTeam, 
  selectedShiftTypeId,
  onSelectShiftType 
}: TeamSelectorProps) {
  const { colors } = useTheme();
  const [showShiftTypes, setShowShiftTypes] = useState(false);

  const company = COMPANIES[companyId];
  if (!company) return null;

  const availableShiftTypes = company.shifts.map(shiftId => SHIFT_TYPES[shiftId]);
  const teams = company.teams.map(team => ({
    name: team,
    color: company.colors[team]
  }));

  return (
    <View style={styles.container}>
      {/* Skifttyper */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          📋 Skifttyp
        </Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shiftTypesContainer}
        >
          {availableShiftTypes.map((shiftType) => (
            <TouchableOpacity
              key={shiftType.id}
              style={[
                styles.shiftTypeCard,
                { backgroundColor: colors.card },
                selectedShiftTypeId === shiftType.id && { 
                  backgroundColor: colors.primary,
                  borderColor: colors.primary 
                }
              ]}
              onPress={() => onSelectShiftType(shiftType.id)}
            >
              <View style={styles.shiftTypeHeader}>
                <Ionicons 
                  name="time" 
                  size={16} 
                  color={selectedShiftTypeId === shiftType.id ? 'white' : colors.textSecondary} 
                />
                <Text style={[
                  styles.shiftTypeName,
                  { color: selectedShiftTypeId === shiftType.id ? 'white' : colors.text }
                ]}>
                  {shiftType.name}
                </Text>
              </View>
              <Text style={[
                styles.shiftTypeDescription,
                { color: selectedShiftTypeId === shiftType.id ? 'rgba(255,255,255,0.8)' : colors.textSecondary }
              ]}>
                {shiftType.description}
              </Text>
              <View style={styles.shiftTypeDetails}>
                <Text style={[
                  styles.shiftTypeCycle,
                  { color: selectedShiftTypeId === shiftType.id ? 'rgba(255,255,255,0.8)' : colors.textSecondary }
                ]}>
                  {shiftType.cycle} dagars cykel
                </Text>
                <Text style={[
                  styles.shiftTypePattern,
                  { color: selectedShiftTypeId === shiftType.id ? 'rgba(255,255,255,0.8)' : colors.textSecondary }
                ]}>
                  {shiftType.pattern.join(' ')}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Team */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          👥 Team
        </Text>
        <View style={styles.teamsContainer}>
          {teams.map((team) => (
            <TouchableOpacity
              key={team.name}
              style={[
                styles.teamCard,
                { backgroundColor: colors.card },
                selectedTeam === team.name && { 
                  backgroundColor: team.color,
                  borderColor: team.color 
                }
              ]}
              onPress={() => onSelectTeam(team.name)}
            >
              <View style={[
                styles.teamColorIndicator,
                { backgroundColor: team.color }
              ]} />
              <View style={styles.teamInfo}>
                <Text style={[
                  styles.teamName,
                  { color: selectedTeam === team.name ? 'white' : colors.text }
                ]}>
                  {team.name}
                </Text>
                <Text style={[
                  styles.teamShiftType,
                  { color: selectedTeam === team.name ? 'rgba(255,255,255,0.8)' : colors.textSecondary }
                ]}>
                  {availableShiftTypes.find(st => st.id === selectedShiftTypeId)?.name || 'Välj skifttyp'}
                </Text>
              </View>
              {selectedTeam === team.name && (
                <Ionicons name="checkmark-circle" size={20} color="white" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Teamstatistik */}
      <View style={styles.teamStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {teams.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Team
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {availableShiftTypes.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Skifttyper
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {availableShiftTypes.reduce((total, st) => total + st.cycle, 0)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Cykeldagar
          </Text>
        </View>
      </View>

      {/* Vald skifttyp detaljer */}
      {selectedShiftTypeId && (
        <View style={[styles.shiftTypeDetailsContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.detailsTitle, { color: colors.text }]}>
            Skiftschema för {selectedTeam}
          </Text>
          {(() => {
            const shiftType = SHIFT_TYPES[selectedShiftTypeId];
            return (
              <View style={styles.shiftPattern}>
                <Text style={[styles.patternTitle, { color: colors.textSecondary }]}>
                  Mönster ({shiftType.cycle} dagar):
                </Text>
                <View style={styles.patternContainer}>
                  {shiftType.pattern.map((shiftCode, index) => (
                    <View key={index} style={styles.patternDay}>
                      <View style={[
                        styles.patternIndicator,
                        { backgroundColor: getShiftColor(shiftCode) }
                      ]}>
                        <Text style={styles.patternCode}>{shiftCode}</Text>
                      </View>
                      <Text style={[styles.patternName, { color: colors.textSecondary }]}>
                        {getShiftNameSwedish(shiftCode)}
                      </Text>
                      {shiftType.times[shiftCode]?.start && (
                        <Text style={[styles.patternTime, { color: colors.textSecondary }]}>
                          {shiftType.times[shiftCode].start}-{shiftType.times[shiftCode].end}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            );
          })()}
        </View>
      )}
    </View>
  );
}

// Hjälpfunktioner
function getShiftColor(shiftCode: string): string {
  switch (shiftCode) {
    case 'F': return '#FF6B6B'; // Förmiddag - Röd
    case 'E': return '#4ECDC4'; // Eftermiddag - Blå
    case 'N': return '#45B7D1'; // Natt - Mörkblå
    case 'D': return '#2ECC71'; // Dag - Grön
    case 'L': return '#95A5A6'; // Ledig - Grå
    case 'D12': return '#1A936F'; // Dag 12h - Mörkgrön
    case 'N12': return '#34495E'; // Natt 12h - Mörkgrå
    case 'FH': return '#E67E22'; // Förmiddag Helg - Orange
    case 'NH': return '#8E44AD'; // Natt Helg - Lila
    case 'FE': return '#FFA502'; // Förmiddag-Eftermiddag - Orange
    case 'EN': return '#6C5CE7'; // Eftermiddag-Natt - Lila
    default: return '#BDC3C7';
  }
}

function getShiftNameSwedish(shiftCode: string): string {
  const shiftNames: Record<string, string> = {
    'F': 'Förmiddag',
    'E': 'Eftermiddag', 
    'N': 'Natt',
    'D': 'Dag',
    'L': 'Ledig',
    'D12': 'Dag 12h',
    'N12': 'Natt 12h',
    'FH': 'Förmiddag Helg',
    'NH': 'Natt Helg',
    'FE': 'Förmiddag-Eftermiddag',
    'EN': 'Eftermiddag-Natt'
  };
  
  return shiftNames[shiftCode] || shiftCode;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  shiftTypesContainer: {
    paddingHorizontal: 4,
  },
  shiftTypeCard: {
    width: 200,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  shiftTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shiftTypeName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  shiftTypeDescription: {
    fontSize: 12,
    marginBottom: 8,
  },
  shiftTypeDetails: {
    marginTop: 8,
  },
  shiftTypeDetailsContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
  },
  shiftTypeCycle: {
    fontSize: 11,
    marginBottom: 4,
  },
  shiftTypePattern: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  teamsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 120,
  },
  teamColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  teamShiftType: {
    fontSize: 11,
  },
  teamStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  shiftTypeDetailsContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  shiftPattern: {
    marginTop: 8,
  },
  patternTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  patternContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  patternDay: {
    alignItems: 'center',
    minWidth: 60,
  },
  patternIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  patternCode: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  patternName: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 2,
  },
  patternTime: {
    fontSize: 8,
    textAlign: 'center',
  },
}); 