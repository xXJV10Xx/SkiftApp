import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface Company {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
  company_id: string;
}

interface ShiftTeam {
  id: string;
  name: string;
  department_id: string;
}

export default function NewChat() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [groupName, setGroupName] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shiftTeams, setShiftTeams] = useState<ShiftTeam[]>([]);
  
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedShiftTeam, setSelectedShiftTeam] = useState<string>('');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchDepartments(selectedCompany);
      setSelectedDepartment('');
      setSelectedShiftTeam('');
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (selectedDepartment) {
      fetchShiftTeams(selectedDepartment);
      setSelectedShiftTeam('');
    }
  }, [selectedDepartment]);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchDepartments = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, company_id')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchShiftTeams = async (departmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('shift_teams')
        .select('id, name, department_id')
        .eq('department_id', departmentId)
        .order('name');

      if (error) throw error;
      setShiftTeams(data || []);
    } catch (error) {
      console.error('Error fetching shift teams:', error);
    }
  };

  const createChatGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Fel', 'Gruppnamn krävs');
      return;
    }

    if (!selectedCompany) {
      Alert.alert('Fel', 'Välj ett företag');
      return;
    }

    setLoading(true);
    try {
      // Skapa chattgrupp
      const { data: group, error: groupError } = await supabase
        .from('chat_groups')
        .insert({
          name: groupName.trim(),
          company_id: selectedCompany,
          department_id: selectedDepartment || null,
          shift_team_id: selectedShiftTeam || null
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Lägg till skaparen som medlem
      const { error: memberError } = await supabase
        .from('chat_group_members')
        .insert({
          group_id: group.id,
          user_id: user?.id,
          is_online: true
        });

      if (memberError) throw memberError;

      Alert.alert('Framgång', 'Chattgrupp skapad!', [
        {
          text: 'OK',
          onPress: () => router.push(`/chat/${group.id}`)
        }
      ]);
    } catch (error) {
      console.error('Error creating chat group:', error);
      Alert.alert('Fel', 'Kunde inte skapa chattgrupp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4 pt-12">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-500 text-lg">← Tillbaka</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-2xl font-bold mb-6">Skapa ny chattgrupp</Text>

        {/* Gruppnamn */}
        <View className="mb-4">
          <Text className="text-lg font-semibold mb-2">Gruppnamn *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 text-lg"
            placeholder="T.ex. Dagskift A, Nattskift B..."
            value={groupName}
            onChangeText={setGroupName}
          />
        </View>

        {/* Företag */}
        <View className="mb-4">
          <Text className="text-lg font-semibold mb-2">Företag *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row">
              {companies.map((company) => (
                <TouchableOpacity
                  key={company.id}
                  className={`mr-2 px-4 py-2 rounded-full border ${
                    selectedCompany === company.id
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white border-gray-300'
                  }`}
                  onPress={() => setSelectedCompany(company.id)}
                >
                  <Text className={
                    selectedCompany === company.id ? 'text-white' : 'text-gray-700'
                  }>
                    {company.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Avdelning */}
        {departments.length > 0 && (
          <View className="mb-4">
            <Text className="text-lg font-semibold mb-2">Avdelning (valfritt)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row">
                {departments.map((department) => (
                  <TouchableOpacity
                    key={department.id}
                    className={`mr-2 px-4 py-2 rounded-full border ${
                      selectedDepartment === department.id
                        ? 'bg-green-500 border-green-500'
                        : 'bg-white border-gray-300'
                    }`}
                    onPress={() => setSelectedDepartment(department.id)}
                  >
                    <Text className={
                      selectedDepartment === department.id ? 'text-white' : 'text-gray-700'
                    }>
                      {department.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Skiftlag */}
        {shiftTeams.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold mb-2">Skiftlag (valfritt)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row">
                {shiftTeams.map((team) => (
                  <TouchableOpacity
                    key={team.id}
                    className={`mr-2 px-4 py-2 rounded-full border ${
                      selectedShiftTeam === team.id
                        ? 'bg-orange-500 border-orange-500'
                        : 'bg-white border-gray-300'
                    }`}
                    onPress={() => setSelectedShiftTeam(team.id)}
                  >
                    <Text className={
                      selectedShiftTeam === team.id ? 'text-white' : 'text-gray-700'
                    }>
                      {team.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Skapa knapp */}
        <TouchableOpacity
          className={`py-4 rounded-lg ${
            loading ? 'bg-gray-400' : 'bg-blue-500'
          }`}
          onPress={createChatGroup}
          disabled={loading}
        >
          <Text className="text-white text-center text-lg font-semibold">
            {loading ? 'Skapar...' : 'Skapa chattgrupp'}
          </Text>
        </TouchableOpacity>

        <View className="mt-6 p-4 bg-gray-100 rounded-lg">
          <Text className="text-sm text-gray-600">
            💡 Tips: Chattgrupper kan kopplas till specifika företag, avdelningar eller skiftlag. 
            Detta hjälper till att organisera kommunikationen och säkerställa att rätt personer 
            får tillgång till rätt information.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}