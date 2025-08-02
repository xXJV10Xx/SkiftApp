import CalendarExport from '@/components/CalendarExport';
import { CompanySelector } from '@/components/CompanySelector';
import { ShiftCalendar } from '@/components/ShiftCalendar';
import { ShiftStats } from '@/components/ShiftStats';
import { Sidebar } from '@/components/Sidebar';
import { TeamSelector } from '@/components/TeamSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Company } from '@/data/companies';
import { Building2, Calendar, Menu, Users } from 'lucide-react-native';
import React, { useState } from 'react';

const Index = () => {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'chat' | 'personal' | 'calendar-sync' | null>(null);

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    setSelectedTeam(''); // Reset team when company changes
  };

  const handleTeamSelect = (team: string) => {
    setSelectedTeam(team);
  };

  const handleSidebarSectionChange = (section: 'chat' | 'personal' | 'calendar-sync' | null) => {
    setActiveSection(section);
    if (section) setSidebarOpen(true);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeSection={activeSection}
        onSectionChange={handleSidebarSectionChange}
        companyName={selectedCompany?.name}
        team={selectedTeam !== 'ALLA' ? selectedTeam : undefined}
      />

      {/* Main Content */}
      <div className="flex-1 min-h-screen">
        {/* Header */}
        <header className="border-b border-border bg-card shadow-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Skiftappen</h1>
                  <p className="text-sm text-muted-foreground">
                    Schemahantering för Sveriges 33+ största företag
                  </p>
                </div>
              </div>
              
              {/* Desktop Sidebar Toggle */}
              <div className="hidden lg:flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSidebarSectionChange('chat')}
                >
                  Chatt
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSidebarSectionChange('personal')}
                >
                  Personligt
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSidebarSectionChange('calendar-sync')}
                >
                  Kalendersynk
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
        {!selectedCompany ? (
          // Välkomstskärm
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-industrial">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Välkommen till Skiftappen
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  Hantera dina skift för 33+ svenska företag med automatisk schemaberäkning
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <CompanySelector
                  selectedCompany={selectedCompany || undefined}
                  onCompanySelect={handleCompanySelect}
                />
                
                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-medium">Kalendervy</h3>
                    <p className="text-sm text-muted-foreground">
                      Se dina skift 2020-2030
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-medium">Skiftlag</h3>
                    <p className="text-sm text-muted-foreground">
                      Färgkodade team A-D
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-medium">33+ Företag</h3>
                    <p className="text-sm text-muted-foreground">
                      Volvo, SSAB, Scania m.fl.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : !selectedTeam ? (
          // Teamval
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                onClick={() => setSelectedCompany(null)}
                className="flex items-center gap-2"
              >
                <Building2 className="h-4 w-4" />
                Byt företag
              </Button>
              <div className="text-sm text-muted-foreground">
                Steg 2 av 2: Välj ditt skiftlag
              </div>
            </div>
            
            <TeamSelector
              company={selectedCompany}
              selectedTeam={selectedTeam}
              onTeamSelect={handleTeamSelect}
            />
          </div>
        ) : (
          // Huvudvy med kalender och statistik
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
                  Byt lag
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedCompany(null)}
                  className="flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  Byt företag
                </Button>
              </div>
              
              <div className="text-right">
                <h2 className="text-xl font-semibold">
                  {selectedCompany.name} - Lag {selectedTeam}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedCompany.location}
                </p>
              </div>
            </div>

            {/* Statistikkort */}
            <ShiftStats
              company={selectedCompany}
              team={selectedTeam}
              shiftTypeId={selectedCompany.shifts[0]} // Använd första tillgängliga skifttyp
            />

            {/* Kalender */}
            <ShiftCalendar
              company={selectedCompany}
              team={selectedTeam}
              shiftTypeId={selectedCompany.shifts[0]} // Använd första tillgängliga skifttyp
            />

            {/* Export funktionalitet */}
            <CalendarExport shifts={[]} />
          </div>
        )}
        </main>
      </div>
    </div>
  );
};

export default Index; 