import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Company } from '@/data/companies';
import { Users } from 'lucide-react-native';
import React from 'react';

interface TeamSelectorProps {
  company: Company;
  selectedTeam: string;
  onTeamSelect: (team: string) => void;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  company,
  selectedTeam,
  onTeamSelect
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Välj ditt skiftlag
          </CardTitle>
          <p className="text-muted-foreground">
            {company.name} - {company.description}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {company.teams.map((team) => (
              <Button
                key={team}
                variant={selectedTeam === team ? 'default' : 'outline'}
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => onTeamSelect(team)}
                style={{
                  backgroundColor: selectedTeam === team ? company.colors[team] : undefined,
                  borderColor: company.colors[team],
                  color: selectedTeam === team ? 'white' : undefined
                }}
              >
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: company.colors[team] }}
                />
                <span className="font-medium">Lag {team}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skifttyper info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tillgängliga skifttyper</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {company.shifts.map((shiftType) => (
              <div key={shiftType} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <div>
                  <p className="font-medium">{shiftType.replace('_', ' ')}</p>
                  <p className="text-sm text-muted-foreground">
                    {shiftType.includes('3SKIFT') && '3-skiftssystem'}
                    {shiftType.includes('2SKIFT') && '2-skiftssystem'}
                    {shiftType.includes('5SKIFT') && '5-skiftssystem'}
                    {shiftType.includes('6SKIFT') && '6-skiftssystem'}
                    {shiftType.includes('DAG') && 'Dagskift'}
                    {shiftType.includes('KVALL') && 'Kvällsskift'}
                    {shiftType.includes('HELG') && 'Helgskift'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Färgkodning info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Färgkodning</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {company.teams.map((team) => (
              <div key={team} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: company.colors[team] }}
                />
                <span className="text-sm">Lag {team}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 