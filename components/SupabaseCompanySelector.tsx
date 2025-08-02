import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCompanies } from '@/hooks/useShifts';
import { Building2, Loader2 } from 'lucide-react-native';
import React from 'react';

interface SupabaseCompanySelectorProps {
  selectedCompany?: string;
  onCompanySelect: (company: string) => void;
}

export const SupabaseCompanySelector: React.FC<SupabaseCompanySelectorProps> = ({
  selectedCompany,
  onCompanySelect
}) => {
  const { companies, loading, error } = useCompanies();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Laddar företag...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-red-500">Fel vid laddning av företag: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (companies.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            Inga företag hittades. Kör scraping-scriptet först för att ladda data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Välj ditt företag
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {companies.length} företag tillgängliga
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {companies.map((company) => (
            <Button
              key={company}
              variant={selectedCompany === company ? "default" : "outline"}
              className="p-4 h-auto flex flex-col items-start gap-2 text-left"
              onClick={() => onCompanySelect(company)}
            >
              <div className="flex items-center gap-2 w-full">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium truncate">{company}</span>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};