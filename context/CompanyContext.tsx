import React, { createContext, useContext, useEffect, useState } from 'react';
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
  setSelectedCompany: (company: Company | null) => void;
  setSelectedTeam: (team: string | null) => void;
  setSelectedDepartment: (department: string | null) => void;
  updateEmployeeProfile: (updates: any) => Promise<void>;
  syncCompaniesToSupabase: () => Promise<void>;
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

  // Fetch employee data
  useEffect(() => {
    if (user) {
      fetchEmployee();
    }
  }, [user]);

  const fetchEmployee = async () => {
    if (!user) return;

    try {
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
    }
  };

  const updateEmployeeProfile = async (updates: any) => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('employees')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Refresh employee data
      await fetchEmployee();
    } catch (error) {
      console.error('Error updating employee profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const syncCompaniesToSupabase = async () => {
    try {
      setLoading(true);

      // Sync companies
      for (const company of Object.values(COMPANIES)) {
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
          continue;
        }

        // Sync teams for this company
        for (const teamName of company.teams) {
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
          }
        }
      }

      console.log('Successfully synced companies and teams to Supabase');
    } catch (error) {
      console.error('Error syncing companies to Supabase:', error);
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
    setSelectedCompany,
    setSelectedTeam,
    setSelectedDepartment,
    updateEmployeeProfile,
    syncCompaniesToSupabase
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