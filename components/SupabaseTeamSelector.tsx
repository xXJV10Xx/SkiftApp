import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTeams } from '@/hooks/useShifts';
import { Users, Loader2 } from 'lucide-react-native';
import React from 'react';

interface SupabaseTeamSelectorProps {
  company: string;
  selectedTeam?: string;
  onTeamSelect: (team: string) => void;
}

export const SupabaseTeamSelector: React.FC<SupabaseTeamSelectorProps> = ({
  company,
  selectedTeam,
  onTeamSelect
}) => {
  const { teams, loading, error } = useTeams(company);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Laddar team...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-red-500">Fel vid laddning av team: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            Inga team hittades för {company}. Kontrollera att scraping-data finns.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Välj ditt team
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {teams.length} team tillgängliga för {company}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Visa alla team-alternativ */}
          <Button
            variant={selectedTeam === 'ALLA' ? "default" : "outline"}
            className="p-4 h-auto flex flex-col items-center gap-2"
            onClick={() => onTeamSelect('ALLA')}
          >
            <Users className="h-6 w-6" />
            <span className="font-medium">Alla team</span>
          </Button>
          
          {teams.map((team) => (
            <Button
              key={team}
              variant={selectedTeam === team ? "default" : "outline"}
              className="p-4 h-auto flex flex-col items-center gap-2"
              onClick={() => onTeamSelect(team)}
            >
              <Users className="h-6 w-6" />
              <span className="font-medium">{team}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};