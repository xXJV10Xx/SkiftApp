import React, { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamDropdown } from '@/components/TeamDropdown';
import { ShiftExportButton } from '@/components/ShiftExportButton';
import { ExportDemo } from '@/components/ExportDemo';
import useConvertedShifts from '@/hooks/useConvertedShifts';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Download, Calendar, FileText, Users, Clock } from 'lucide-react-native';

// Hårdkodade team för nu - kan hämtas från Supabase senare
const AVAILABLE_TEAMS = ['31', '32', '33', '34', '35', '36'];

const TEAM_COLORS = {
  '31': '#FF6B6B',
  '32': '#4ECDC4', 
  '33': '#45B7D1',
  '34': '#96CEB4',
  '35': '#FFA502',
  '36': '#9B59B6'
};

export default function ExportScreen() {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { events, loading, error } = useConvertedShifts(selectedTeam || undefined);

  const handleTeamSelect = (team: string | null) => {
    setSelectedTeam(team);
  };

  const getShiftStats = () => {
    if (!events.length) return null;

    const shiftTypes = events.reduce((acc, event) => {
      acc[event.shiftType] = (acc[event.shiftType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dateRange = events.length > 0 ? {
      start: new Date(Math.min(...events.map(e => new Date(e.date).getTime()))),
      end: new Date(Math.max(...events.map(e => new Date(e.date).getTime())))
    } : null;

    return { shiftTypes, dateRange };
  };

  const stats = getShiftStats();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('sv-SE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Demo Section */}
        <ExportDemo />

        {/* Advanced Options Toggle */}
        <Card>
          <CardContent className="p-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAdvanced ? '▼ Dölj avancerade alternativ' : '▶ Visa avancerade alternativ'}
            </button>
          </CardContent>
        </Card>

        {/* Advanced Section */}
        {showAdvanced && (
          <>
            {/* Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-6 w-6" />
                  Avancerad export
                </CardTitle>
                <ThemedText style={{ opacity: 0.7 }}>
                  Manuell kontroll över skifthämtning och export
                </ThemedText>
              </CardHeader>
            </Card>

        {/* Team Selection */}
        <TeamDropdown
          teams={AVAILABLE_TEAMS}
          selectedTeam={selectedTeam}
          onTeamSelect={handleTeamSelect}
          teamColors={TEAM_COLORS}
        />

        {/* Error Display */}
        {error && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600">
                <Clock className="h-4 w-4" />
                <ThemedText style={{ color: '#dc2626' }}>
                  Fel: {error}
                </ThemedText>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        {stats && !loading && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Skiftöversikt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Date Range */}
                {stats.dateRange && (
                  <div>
                    <ThemedText style={{ fontWeight: '600', marginBottom: 8 }}>
                      Tidsperiod
                    </ThemedText>
                    <ThemedText style={{ opacity: 0.7 }}>
                      {formatDate(stats.dateRange.start)} - {formatDate(stats.dateRange.end)}
                    </ThemedText>
                  </div>
                )}

                {/* Shift Types */}
                <div>
                  <ThemedText style={{ fontWeight: '600', marginBottom: 8 }}>
                    Skifttyper
                  </ThemedText>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(stats.shiftTypes).map(([type, count]) => (
                      <div key={type} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <ThemedText style={{ fontSize: 14 }}>
                          {type}-skift: {count}
                        </ThemedText>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Count */}
                <div className="pt-2 border-t">
                  <ThemedText style={{ fontWeight: '600' }}>
                    Totalt: {events.length} skift
                  </ThemedText>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Export Buttons */}
        <ShiftExportButton 
          events={events} 
          teamId={selectedTeam || undefined}
          loading={loading}
        />

        {/* Recent Shifts Preview */}
        {events.length > 0 && !loading && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Senaste skift (förhandsvisning)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {events.slice(0, 5).map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: TEAM_COLORS[event.teamId] || '#95A5A6' }}
                      />
                      <div>
                        <ThemedText style={{ fontWeight: '500' }}>
                          {event.title}
                        </ThemedText>
                        <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                          {new Date(event.date).toLocaleDateString('sv-SE')}
                        </ThemedText>
                      </div>
                    </div>
                    <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                      {event.startTime} - {event.endTime}
                    </ThemedText>
                  </div>
                ))}
                
                {events.length > 5 && (
                  <div className="text-center pt-2">
                    <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                      ...och {events.length - 5} skift till
                    </ThemedText>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Hur använder jag exporten?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <ThemedText style={{ fontWeight: '500' }}>Välj ditt skiftlag</ThemedText>
                  <ThemedText style={{ fontSize: 14, opacity: 0.7 }}>
                    Använd dropdown-menyn ovan för att välja vilket lag du vill exportera skift för
                  </ThemedText>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <ThemedText style={{ fontWeight: '500' }}>Välj exportformat</ThemedText>
                  <ThemedText style={{ fontSize: 14, opacity: 0.7 }}>
                    .ics för kalender (Google, Outlook, Apple) eller .csv för Excel/kalkylark
                  </ThemedText>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <ThemedText style={{ fontWeight: '500' }}>Importera i din kalender</ThemedText>
                  <ThemedText style={{ fontSize: 14, opacity: 0.7 }}>
                    Öppna den nedladdade filen i din kalenderapp för att automatiskt lägga till alla skift
                  </ThemedText>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}