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
    <Card className="shadow-industrial">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Users size={20} color="#374151" />
          Välj ditt skiftlag - {company.name}
        </CardTitle>
        <p className="text-muted-foreground">
          Välj vilket lag du tillhör för att se ditt personliga schema
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Team grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {company.teams.map((team) => (
            <Button
              key={team}
              variant={selectedTeam === team ? "default" : "outline"}
              onClick={() => onTeamSelect(team)}
              className="h-20 flex flex-col gap-2"
            >
              <div
                className="w-8 h-8 rounded-full"
                style={{ backgroundColor: company.colors[team] || '#6B7280' }}
              />
              <span className="font-medium">Lag {team}</span>
            </Button>
          ))}
        </div>

        {/* Alla lag option */}
        <div className="border-t pt-4">
          <Button
            variant={selectedTeam === 'ALLA' ? "default" : "outline"}
            onClick={() => onTeamSelect('ALLA')}
            className="w-full h-16 flex items-center justify-center gap-3"
          >
            <div className="flex gap-1">
              {company.teams.slice(0, 4).map((team, index) => (
                <div
                  key={team}
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: company.colors[team] || '#6B7280' }}
                />
              ))}
              {company.teams.length > 4 && (
                <span className="text-xs">+{company.teams.length - 4}</span>
              )}
            </div>
            <span className="font-medium">Visa alla lag</span>
          </Button>
        </div>

        {/* Info text */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Osäker på vilket lag du tillhör? Kontakta din arbetsledare eller välj &quot;Visa alla lag&quot; 
            för att se alla scheman.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}; 