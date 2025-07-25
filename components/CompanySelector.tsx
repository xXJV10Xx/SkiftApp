import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Company, COMPANY_LIST } from '@/data/companies';
import { Building2, Search } from 'lucide-react-native';
import React, { useState } from 'react';

interface CompanySelectorProps {
  selectedCompany?: Company;
  onCompanySelect: (company: Company) => void;
}

export const CompanySelector: React.FC<CompanySelectorProps> = ({
  selectedCompany,
  onCompanySelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState(COMPANY_LIST);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const filtered = COMPANY_LIST.filter(company =>
      company.name.toLowerCase().includes(value.toLowerCase()) ||
      company.description.toLowerCase().includes(value.toLowerCase()) ||
      company.location.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCompanies(filtered);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Sök företag..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCompanies.map((company) => (
          <Card
            key={company.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedCompany?.id === company.id
                ? 'ring-2 ring-primary bg-primary/5'
                : 'hover:bg-muted/50'
            }`}
            onClick={() => onCompanySelect(company)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: company.colors[company.teams[0]] || '#6B7280' }}
                >
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {company.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {company.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {company.location}
                  </p>
                  <div className="flex gap-1 mt-2">
                    {company.teams.slice(0, 3).map((team, index) => (
                      <div
                        key={team}
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: company.colors[team] || '#6B7280' }}
                        title={`Lag ${team}`}
                      />
                    ))}
                    {company.teams.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{company.teams.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <div className="text-center py-8">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Inga företag matchar din sökning
          </p>
        </div>
      )}
    </div>
  );
}; 