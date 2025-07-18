import React, { useState } from 'react';
import { Button, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';

const companies = [
  'SSAB', 'Volvo', 'Scania', 'Ericsson', 'H&M', 'IKEA', 'Sandvik', 'Atlas Copco', 'Electrolux', 'SKF',
  'Securitas', 'Telia', 'Vattenfall', 'ABB', 'Alfa Laval', 'SCA', 'Boliden', 'LKAB', 'Trelleborg', 'Stora Enso'
];

const shifts = ['Skiftlag 1', 'Skiftlag 2', 'Skiftlag 3', 'Dag', 'Natt'];

export default function CompanyShiftScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);

  const filteredCompanies = companies.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, marginBottom: 10 }}>Välj företag</Text>
      <TextInput
        placeholder="Sök företag..."
        value={search}
        onChangeText={setSearch}
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10 }}
      />
      <FlatList
        data={filteredCompanies}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedCompany(item)} style={{ padding: 10, backgroundColor: selectedCompany === item ? '#4e9cff' : '#eee', borderRadius: 8, marginBottom: 5 }}>
            <Text style={{ color: selectedCompany === item ? '#fff' : '#333' }}>{item}</Text>
          </TouchableOpacity>
        )}
        style={{ maxHeight: 150 }}
      />
      {selectedCompany && (
        <>
          <Text style={{ fontSize: 18, marginTop: 20 }}>Välj skiftlag/avdelning</Text>
          {shifts.map(shift => (
            <TouchableOpacity key={shift} onPress={() => setSelectedShift(shift)} style={{ padding: 10, backgroundColor: selectedShift === shift ? '#4e9cff' : '#eee', borderRadius: 8, marginBottom: 5 }}>
              <Text style={{ color: selectedShift === shift ? '#fff' : '#333' }}>{shift}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}
      <Button
        title="Next"
        onPress={() => navigation.navigate('WelcomeCalendar', { company: selectedCompany, shift: selectedShift })}
        disabled={!selectedCompany || !selectedShift}
      />
    </View>
  );
} 