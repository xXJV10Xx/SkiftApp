import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface Company {
  id: string;
  name: string;
  description: string;
  industry: string;
  location: string;
  shifts: string[];
  teams: string[];
  colors: Record<string, string>;
}

interface CompanySelectorProps {
  companies: Company[];
  selectedCompany: Company;
  onSelectCompany: (company: Company) => void;
}

export function CompanySelector({ companies, selectedCompany, onSelectCompany }: CompanySelectorProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Filtrera företag baserat på sökning
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Gruppera företag efter bransch
  const groupedCompanies = filteredCompanies.reduce((groups, company) => {
    const industry = company.industry;
    if (!groups[industry]) {
      groups[industry] = [];
    }
    groups[industry].push(company);
    return groups;
  }, {} as Record<string, Company[]>);

  const industryOrder = [
    'Stålindustri',
    'Biltillverkning',
    'IT/Telekom',
    'Skogsindustri',
    'Kemisk industri',
    'Energi',
    'Sjukvård',
    'Transport',
    'Livsmedel',
    'Bygg',
    'Bank och Finans',
    'Telekom',
    'Försäkring',
    'Media',
    'Gruvindustri',
    'Verktygsindustri',
    'Pappersindustri',
    'Elektrisk industri',
    'Industri'
  ];

  return (
    <View style={styles.container}>
      {/* Sökfält */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Sök företag..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Vald företag */}
      <TouchableOpacity
        style={[styles.selectedCompany, { backgroundColor: colors.card }]}
        onPress={() => setShowDropdown(!showDropdown)}
      >
        <View style={styles.selectedCompanyInfo}>
          <View style={[styles.companyIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="business" size={20} color="white" />
          </View>
          <View style={styles.companyDetails}>
            <Text style={[styles.companyName, { color: colors.text }]}>
              {selectedCompany.name}
            </Text>
            <Text style={[styles.companyIndustry, { color: colors.textSecondary }]}>
              {selectedCompany.industry} • {selectedCompany.location}
            </Text>
            <Text style={[styles.companyDescription, { color: colors.textSecondary }]}>
              {selectedCompany.description}
            </Text>
          </View>
        </View>
        <Ionicons 
          name={showDropdown ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={colors.textSecondary} 
        />
      </TouchableOpacity>

      {/* Dropdown med företag */}
      {showDropdown && (
        <View style={[styles.dropdown, { backgroundColor: colors.card }]}>
          <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
            {industryOrder.map(industry => {
              const industryCompanies = groupedCompanies[industry];
              if (!industryCompanies || industryCompanies.length === 0) return null;

              return (
                <View key={industry} style={styles.industryGroup}>
                  <Text style={[styles.industryTitle, { color: colors.primary }]}>
                    {industry}
                  </Text>
                  {industryCompanies.map(company => (
                    <TouchableOpacity
                      key={company.id}
                      style={[
                        styles.companyOption,
                        selectedCompany.id === company.id && { backgroundColor: colors.primary + '20' }
                      ]}
                      onPress={() => {
                        onSelectCompany(company);
                        setShowDropdown(false);
                        setSearchQuery('');
                      }}
                    >
                      <View style={styles.companyOptionInfo}>
                        <View style={[styles.companyOptionIcon, { backgroundColor: colors.secondary }]}>
                          <Ionicons name="business" size={16} color="white" />
                        </View>
                        <View style={styles.companyOptionDetails}>
                          <Text style={[styles.companyOptionName, { color: colors.text }]}>
                            {company.name}
                          </Text>
                          <Text style={[styles.companyOptionLocation, { color: colors.textSecondary }]}>
                            {company.location}
                          </Text>
                          <Text style={[styles.companyOptionDescription, { color: colors.textSecondary }]}>
                            {company.description}
                          </Text>
                        </View>
                      </View>
                      {selectedCompany.id === company.id && (
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Företagsstatistik */}
      <View style={styles.companyStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {companies.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Företag
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {Object.keys(groupedCompanies).length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Branscher
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {companies.reduce((total, company) => total + company.teams.length, 0)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Team
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  selectedCompany: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedCompanyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companyDetails: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  companyIndustry: {
    fontSize: 14,
    marginBottom: 4,
  },
  companyDescription: {
    fontSize: 12,
  },
  dropdown: {
    maxHeight: 300,
    borderRadius: 12,
    marginBottom: 12,
  },
  dropdownScroll: {
    padding: 8,
  },
  industryGroup: {
    marginBottom: 16,
  },
  industryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  companyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  companyOptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  companyOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companyOptionDetails: {
    flex: 1,
  },
  companyOptionName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  companyOptionLocation: {
    fontSize: 12,
    marginBottom: 2,
  },
  companyOptionDescription: {
    fontSize: 11,
  },
  companyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
}); 