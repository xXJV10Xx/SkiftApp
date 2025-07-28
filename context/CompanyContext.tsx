import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Company, COMPANIES } from '../data/companies';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface CompanyContextType {
  companies: Company[];
  selectedCompany: Company | null;
  selectedTeam: string | null;
  selectedDepartment: string | null;
  employee: any;
  loading: boolean;
  error: string | null;
  setSelectedCompany: (company: Company | null) => void;
  setSelectedTeam: (team: string | null) => void;
  setSelectedDepartment: (department: string | null) => void;
  updateEmployeeProfile: (updates: any) => Promise<void>;
  syncCompaniesToSupabase: () => Promise<void>;
  refreshEmployee: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [companies] = useState<Company[]>(Object.values(COMPANIES));
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch employee data
  useEffect(() => {
    if (user) {
      fetchEmployee();
    } else {
      // Reset state when user logs out
      setEmployee(null);
      setSelectedCompany(null);
      setSelectedTeam(null);
      setSelectedDepartment(null);
      setError(null);
    }
  }, [user]);

  const fetchEmployee = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          companies (
            id,
            name,
            slug
          ),
          teams (
            id,
            name,
            color
          )
        `)
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching employee:', error);
        setError('Kunde inte hämta användardata');
        return;
      }

      if (data) {
        setEmployee(data);
        
        // Set selected company and team based on employee data
        if (data.company_id) {
          const company = Object.values(COMPANIES).find(c => c.id === data.companies?.slug);
          if (company) {
            setSelectedCompany(company);
          }
        }
        
        if (data.team_id && data.teams) {
          setSelectedTeam(data.teams.name);
        }
        
        if (data.department) {
          setSelectedDepartment(data.department);
        }
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
      setError('Ett oväntat fel uppstod vid hämtning av användardata');
    } finally {
      setLoading(false);
    }
  };

  const refreshEmployee = async () => {
    await fetchEmployee();
  };

  const updateEmployeeProfile = async (updates: any) => {
    if (!user) {
      throw new Error('Ingen användare inloggad');
    }

    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('employees')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating employee profile:', error);
        throw new Error('Kunde inte uppdatera profilen');
      }

      // Refresh employee data
      await fetchEmployee();
    } catch (error) {
      console.error('Error updating employee profile:', error);
      setError('Kunde inte uppdatera profilen');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const syncCompaniesToSupabase = async () => {
    try {
      setLoading(true);
      setError(null);

      let successCount = 0;
      let errorCount = 0;

      // Sync companies
      for (const company of Object.values(COMPANIES)) {
        try {
          const { error: companyError } = await supabase
            .from('companies')
            .upsert({
              id: company.id,
              name: company.name,
              slug: company.id,
              logo_url: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'slug'
            });

          if (companyError) {
            console.error(`Error syncing company ${company.name}:`, companyError);
            errorCount++;
            continue;
          }

          // Sync teams for this company
          for (const teamName of company.teams) {
            try {
              const { error: teamError } = await supabase
                .from('teams')
                .upsert({
                  company_id: company.id,
                  name: teamName,
                  description: `${teamName} team för ${company.name}`,
                  color: company.colors[teamName] || '#6B7280',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'company_id,name'
                });

              if (teamError) {
                console.error(`Error syncing team ${teamName} for ${company.name}:`, teamError);
                errorCount++;
              } else {
                successCount++;
              }
            } catch (teamError) {
              console.error(`Error syncing team ${teamName}:`, teamError);
              errorCount++;
            }
          }
        } catch (companyError) {
          console.error(`Error syncing company ${company.name}:`, companyError);
          errorCount++;
        }
      }

      if (errorCount > 0) {
        Alert.alert(
          'Synkronisering slutförd med varningar',
          `${successCount} poster synkroniserades framgångsrikt. ${errorCount} fel uppstod.`
        );
      } else {
        Alert.alert('Framgång', 'Alla företag och lag synkroniserades framgångsrikt till databasen');
      }

      console.log(`Sync completed: ${successCount} success, ${errorCount} errors`);
    } catch (error) {
      console.error('Error syncing companies to Supabase:', error);
      setError('Kunde inte synkronisera företagsdata');
      Alert.alert('Fel', 'Ett oväntat fel uppstod vid synkronisering av företagsdata');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    companies,
    selectedCompany,
    selectedTeam,
    selectedDepartment,
    employee,
    loading,
    error,
    setSelectedCompany,
    setSelectedTeam,
    setSelectedDepartment,
    updateEmployeeProfile,
    syncCompaniesToSupabase,
    refreshEmployee
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};