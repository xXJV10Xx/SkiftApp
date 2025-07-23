import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

interface Company {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  industry: string | null;
  size: string | null;
}

interface Department {
  id: string;
  name: string;
  description: string | null;
  company_id: string;
  manager_id: string | null;
  color: string;
}

interface Team {
  id: string;
  name: string;
  color: string;
  company_id: string;
  department_id: string | null;
  description: string | null;
  team_leader_id: string | null;
}

export const CompanyManagement: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Ladda företag
      const { data: companiesData } = await supabase
        .from('companies')
        .select('*')
        .order('name');
      
      if (companiesData) {
        setCompanies(companiesData);
      }

      // Ladda avdelningar
      const { data: departmentsData } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      
      if (departmentsData) {
        setDepartments(departmentsData);
      }

      // Ladda team
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      
      if (teamsData) {
        setTeams(teamsData);
      }

    } catch (error) {
      console.error('Fel vid laddning av data:', error);
      Alert.alert('Fel', 'Kunde inte ladda företagsdata');
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentsForCompany = (companyId: string) => {
    return departments.filter(dept => dept.company_id === companyId);
  };

  const getTeamsForCompany = (companyId: string) => {
    return teams.filter(team => team.company_id === companyId);
  };

  const getTeamsForDepartment = (departmentId: string) => {
    return teams.filter(team => team.department_id === departmentId);
  };

  const getCompanySizeLabel = (size: string | null) => {
    switch (size) {
      case 'small': return 'Litet (1-50)';
      case 'medium': return 'Mellanstort (51-200)';
      case 'large': return 'Stort (200+)';
      default: return 'Ej angivet';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Laddar företagsdata...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Företagsöversikt</Text>
      
      {companies.map(company => (
        <View key={company.id} style={styles.companyCard}>
          <View style={styles.companyHeader}>
            <Text style={styles.companyName}>{company.name}</Text>
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => setSelectedCompany(
                selectedCompany === company.id ? null : company.id
              )}
            >
              <Text style={styles.expandButtonText}>
                {selectedCompany === company.id ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.companyInfo}>
            <Text style={styles.companyDescription}>
              {company.description || 'Ingen beskrivning'}
            </Text>
            <Text style={styles.companyDetails}>
              Bransch: {company.industry || 'Ej angivet'}
            </Text>
            <Text style={styles.companyDetails}>
              Storlek: {getCompanySizeLabel(company.size)}
            </Text>
            {company.address && (
              <Text style={styles.companyDetails}>
                Adress: {company.address}
              </Text>
            )}
            {company.phone && (
              <Text style={styles.companyDetails}>
                Telefon: {company.phone}
              </Text>
            )}
            {company.email && (
              <Text style={styles.companyDetails}>
                Email: {company.email}
              </Text>
            )}
          </View>

          {selectedCompany === company.id && (
            <View style={styles.expandedContent}>
              {/* Avdelningar */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Avdelningar</Text>
                {getDepartmentsForCompany(company.id).map(department => (
                  <View key={department.id} style={styles.departmentCard}>
                    <View style={[styles.colorIndicator, { backgroundColor: department.color }]} />
                    <View style={styles.departmentInfo}>
                      <Text style={styles.departmentName}>{department.name}</Text>
                      <Text style={styles.departmentDescription}>
                        {department.description || 'Ingen beskrivning'}
                      </Text>
                      
                      {/* Team i denna avdelning */}
                      <View style={styles.teamsSection}>
                        <Text style={styles.teamsTitle}>Team:</Text>
                        {getTeamsForDepartment(department.id).map(team => (
                          <View key={team.id} style={styles.teamItem}>
                            <View style={[styles.teamColor, { backgroundColor: team.color }]} />
                            <Text style={styles.teamName}>{team.name}</Text>
                          </View>
                        ))}
                        {getTeamsForDepartment(department.id).length === 0 && (
                          <Text style={styles.noTeams}>Inga team i denna avdelning</Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
                {getDepartmentsForCompany(company.id).length === 0 && (
                  <Text style={styles.noData}>Inga avdelningar registrerade</Text>
                )}
              </View>

              {/* Team utan avdelning */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Team utan avdelning</Text>
                {getTeamsForCompany(company.id)
                  .filter(team => !team.department_id)
                  .map(team => (
                    <View key={team.id} style={styles.teamCard}>
                      <View style={[styles.teamColor, { backgroundColor: team.color }]} />
                      <View style={styles.teamInfo}>
                        <Text style={styles.teamName}>{team.name}</Text>
                        <Text style={styles.teamDescription}>
                          {team.description || 'Ingen beskrivning'}
                        </Text>
                      </View>
                    </View>
                  ))}
                {getTeamsForCompany(company.id).filter(team => !team.department_id).length === 0 && (
                  <Text style={styles.noData}>Inga team utan avdelning</Text>
                )}
              </View>
            </View>
          )}
        </View>
      ))}

      {companies.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Inga företag registrerade ännu</Text>
          <Text style={styles.emptyStateSubtext}>
            Lägg till företag för att komma igång med skiftapp
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  companyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  expandButton: {
    padding: 8,
  },
  expandButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  companyInfo: {
    marginBottom: 12,
  },
  companyDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  companyDetails: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  departmentCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  colorIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  departmentInfo: {
    flex: 1,
  },
  departmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  departmentDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  teamsSection: {
    marginTop: 8,
  },
  teamsTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  teamColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  teamName: {
    fontSize: 12,
    color: '#666',
  },
  noTeams: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  teamCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  teamInfo: {
    flex: 1,
  },
  teamDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  noData: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
}); 