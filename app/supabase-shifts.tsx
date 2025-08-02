import { SupabaseCompanySelector } from '@/components/SupabaseCompanySelector';
import { SupabaseShiftCalendar } from '@/components/SupabaseShiftCalendar';
import { SupabaseTeamSelector } from '@/components/SupabaseTeamSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Calendar, Menu, Users, Database } from 'lucide-react-native';
import React, { useState } from 'react';

const SupabaseShifts = () => {
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  const handleCompanySelect = (company: string) => {
    setSelectedCompany(company);
    setSelectedTeam(''); // Reset team when company changes
  };

  const handleTeamSelect = (team: string) => {
    setSelectedTeam(team);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Database className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Skiftappen Live</h1>
                <p className="text-sm text-muted-foreground">
                  Realtidsdata från Supabase - automatiskt uppdaterat
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!selectedCompany ? (
          // Välkomstskärm och företagsval
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-industrial mb-8">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Välkommen till Skiftappen Live
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  Visa skiftscheman från realtidsdata - automatiskt uppdaterat från skiftschema.se
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <Database className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-medium">Live Data</h3>
                    <p className="text-sm text-muted-foreground">
                      Automatisk scraping varje dag
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-medium">Kalendervy</h3>
                    <p className="text-sm text-muted-foreground">
                      Fullständig månadssicht
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-medium">Team & Företag</h3>
                    <p className="text-sm text-muted-foreground">
                      Filtrera på specifika team
                    </p>
                  </div>
                </div>
                
                <SupabaseCompanySelector
                  selectedCompany={selectedCompany}
                  onCompanySelect={handleCompanySelect}
                />
              </CardContent>
            </Card>
          </div>
        ) : !selectedTeam ? (
          // Teamval
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                onClick={() => setSelectedCompany('')}
                className="flex items-center gap-2"
              >
                <Building2 className="h-4 w-4" />
                Byt företag
              </Button>
              <div className="text-sm text-muted-foreground">
                Steg 2 av 2: Välj ditt team för {selectedCompany}
              </div>
            </div>
            
            <SupabaseTeamSelector
              company={selectedCompany}
              selectedTeam={selectedTeam}
              onTeamSelect={handleTeamSelect}
            />
          </div>
        ) : (
          // Huvudvy med kalender
          <div className="space-y-8">
            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTeam('')}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Byt team
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedCompany('')}
                  className="flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  Byt företag
                </Button>
              </div>
              
              <div className="text-right">
                <h2 className="text-xl font-semibold">
                  {selectedCompany} - {selectedTeam === 'ALLA' ? 'Alla team' : selectedTeam}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Live data från Supabase
                </p>
              </div>
            </div>

            {/* Kalender */}
            <SupabaseShiftCalendar
              company={selectedCompany}
              team={selectedTeam}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default SupabaseShifts;