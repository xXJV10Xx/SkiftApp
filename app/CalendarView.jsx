import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import useConvertedShifts from '../hooks/useConvertedShifts';
import ShiftExportButton from '../components/ShiftExportButton';

const teamOptions = [
  { id: 31, name: 'Lag 31' },
  { id: 32, name: 'Lag 32' },
  { id: 33, name: 'Lag 33' },
  { id: 34, name: 'Lag 34' },
  { id: 35, name: 'Lag 35' },
];

export default function CalendarView() {
  const [selectedTeam, setSelectedTeam] = useState(31); // default lag
  const events = useConvertedShifts(selectedTeam);

  return (
    <View style={{ padding: 16, flex: 1 }}>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ 
          marginRight: 8, 
          fontSize: 14, 
          fontWeight: '600',
          marginBottom: 8 
        }}>
          Välj skiftlag:
        </Text>
        <View style={{
          borderWidth: 1,
          borderColor: '#d1d5db',
          borderRadius: 8,
          backgroundColor: 'white',
        }}>
          {/* Placeholder för native select - kan ersättas med Picker eller annan komponent */}
          <Text style={{
            padding: 12,
            fontSize: 16,
          }}>
            {teamOptions.find(team => team.id === selectedTeam)?.name || 'Välj lag'}
          </Text>
        </View>
        
        {/* Alternativ: Använd knappar för lagval */}
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 8
        }}>
          {teamOptions.map((team) => (
            <Pressable
              key={team.id}
              onPress={() => setSelectedTeam(team.id)}
              style={({ pressed }) => ({
                backgroundColor: selectedTeam === team.id 
                  ? '#3b82f6' 
                  : pressed 
                    ? '#f3f4f6' 
                    : '#e5e7eb',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: selectedTeam === team.id ? '#3b82f6' : '#d1d5db',
              })}
            >
              <Text style={{
                color: selectedTeam === team.id ? 'white' : '#374151',
                fontSize: 14,
                fontWeight: selectedTeam === team.id ? '600' : '400',
              }}>
                {team.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Visa antal skift */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, color: '#6b7280' }}>
          {events.length} skift hittades för {teamOptions.find(t => t.id === selectedTeam)?.name}
        </Text>
      </View>

      {/* Här kan du lägga till din kalenderkomponent */}
      <View style={{ 
        flex: 1, 
        backgroundColor: '#f9fafb', 
        borderRadius: 8, 
        padding: 16,
        marginBottom: 16 
      }}>
        <Text style={{ 
          fontSize: 18, 
          fontWeight: '600', 
          marginBottom: 12,
          textAlign: 'center' 
        }}>
          📅 Kalendervy
        </Text>
        
        {/* Lista över kommande skift */}
        <View style={{ gap: 8 }}>
          {events.slice(0, 5).map((event, index) => (
            <View 
              key={event.id || index}
              style={{
                backgroundColor: 'white',
                padding: 12,
                borderRadius: 6,
                borderLeftWidth: 4,
                borderLeftColor: event.color,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <Text style={{ fontWeight: '600', fontSize: 16 }}>
                {event.title}
              </Text>
              <Text style={{ color: '#6b7280', fontSize: 14 }}>
                {new Date(event.date).toLocaleDateString('sv-SE', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
          ))}
          
          {events.length > 5 && (
            <Text style={{ 
              textAlign: 'center', 
              color: '#6b7280', 
              fontStyle: 'italic',
              marginTop: 8 
            }}>
              ... och {events.length - 5} fler skift
            </Text>
          )}
          
          {events.length === 0 && (
            <Text style={{ 
              textAlign: 'center', 
              color: '#9ca3af', 
              fontStyle: 'italic',
              marginTop: 20 
            }}>
              Inga skift hittades för valt lag
            </Text>
          )}
        </View>
      </View>

      <ShiftExportButton events={events} />
    </View>
  );
}