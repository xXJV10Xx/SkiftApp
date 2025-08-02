import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TeamDropdown } from '@/components/TeamDropdown';
import { ShiftExportButton } from '@/components/ShiftExportButton';
import useConvertedShifts from '@/hooks/useConvertedShifts';
import { Play, Database, Calendar, FileText } from 'lucide-react-native';

const DEMO_TEAMS = ['31', '32', '33', '34', '35', '36'];
const TEAM_COLORS = {
  '31': '#FF6B6B',
  '32': '#4ECDC4', 
  '33': '#45B7D1',
  '34': '#96CEB4',
  '35': '#FFA502',
  '36': '#9B59B6'
};

export const ExportDemo: React.FC = () => {
  const [selectedTeam, setSelectedTeam] = useState<string | null>('31');
  const [showDemo, setShowDemo] = useState(false);
  const { events, loading, error } = useConvertedShifts(selectedTeam || undefined);

  const handleStartDemo = () => {
    setShowDemo(true);
    setSelectedTeam('31'); // Starta med lag 31
  };

  return (
    <div className="space-y-6">
      {/* Demo Introduction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Export-demo
          </CardTitle>
          <p className="text-muted-foreground">
            Testa den automatiska konverteraren som hämtar skift från Supabase och exporterar dem till kalender-format.
          </p>
        </CardHeader>
        <CardContent>
          {!showDemo ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <Database className="h-8 w-8 text-blue-500" />
                  <div>
                    <h4 className="font-medium">Hämta från Supabase</h4>
                    <p className="text-sm text-muted-foreground">Automatisk hämtning av skiftdata</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <Calendar className="h-8 w-8 text-green-500" />
                  <div>
                    <h4 className="font-medium">Konvertera format</h4>
                    <p className="text-sm text-muted-foreground">Omvandla till ICS/CSV</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <FileText className="h-8 w-8 text-purple-500" />
                  <div>
                    <h4 className="font-medium">Exportera</h4>
                    <p className="text-sm text-muted-foreground">Ladda ner för import</p>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleStartDemo} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Starta demo
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                ✅ Demo startad! Välj ett skiftlag nedan för att se automatisk hämtning och export.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demo Interface */}
      {showDemo && (
        <>
          <TeamDropdown
            teams={DEMO_TEAMS}
            selectedTeam={selectedTeam}
            onTeamSelect={setSelectedTeam}
            teamColors={TEAM_COLORS}
          />

          {error && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-600">
                  <span>⚠️ Fel: {error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedTeam && (
            <Card>
              <CardHeader>
                <CardTitle>Hämtade skift för lag {selectedTeam}</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground">Hämtar skift från Supabase...</p>
                ) : events.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-green-600">
                      ✅ Hämtade {events.length} skift från databasen
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {events.slice(0, 4).map((event, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: TEAM_COLORS[event.teamId] }}
                          />
                          <span>{event.date}</span>
                          <span>{event.shiftType}-skift</span>
                          <span className="text-muted-foreground">
                            {event.startTime}-{event.endTime}
                          </span>
                        </div>
                      ))}
                    </div>
                    {events.length > 4 && (
                      <p className="text-xs text-muted-foreground">
                        ...och {events.length - 4} skift till
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Inga skift hittades för lag {selectedTeam}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <ShiftExportButton 
            events={events} 
            teamId={selectedTeam || undefined}
            loading={loading}
          />

          {events.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-600">
                  <span>🎉 Klart! Nu kan du exportera {events.length} skift till din kalender.</span>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};