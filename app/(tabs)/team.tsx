import React from 'react';
import { View } from 'react-native';
import { UserList } from '../../components/UserList';
import { useCompany } from '../../context/CompanyContext';
import { useTheme } from '../../context/ThemeContext';

export default function TeamScreen() {
  const { colors } = useTheme();
  const { selectedCompany, selectedTeam } = useCompany();

  const handleUserInterest = (userId: string) => {
    // Optional: Navigate to chat tab or show success message
    console.log('Interest shown for user:', userId);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <UserList 
        companyId={selectedCompany?.id}
        teamId={selectedTeam}
        onUserInterest={handleUserInterest}
      />
    </View>
  );
}