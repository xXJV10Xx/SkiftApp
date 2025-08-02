import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SidePanel from './SidePanel';

// Example of how to add SidePanel to your existing HomeScreen
// Add this to the top of your HomeScreen component:

export const useSidePanel = () => {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  const openSidePanel = () => setIsSidePanelOpen(true);
  const closeSidePanel = () => setIsSidePanelOpen(false);

  return {
    isSidePanelOpen,
    openSidePanel,
    closeSidePanel,
  };
};

// Header component with menu button
export const HeaderWithMenu: React.FC<{
  title: string;
  onMenuPress: () => void;
  colors: any;
}> = ({ title, onMenuPress, colors }) => {
  return (
    <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
        <Ionicons name="menu" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
    </View>
  );
};

// Integration example component
const SidePanelIntegration: React.FC = () => {
  const { isSidePanelOpen, openSidePanel, closeSidePanel } = useSidePanel();

  return (
    <View style={styles.container}>
      <HeaderWithMenu 
        title="Skiftappen"
        onMenuPress={openSidePanel}
        colors={{ card: 'white', border: '#e0e0e0', text: '#333' }}
      />
      
      {/* Your existing content goes here */}
      <View style={styles.content}>
        <Text>Ditt befintliga innehåll...</Text>
      </View>

      {/* Add this SidePanel component at the end of your JSX */}
      <SidePanel isOpen={isSidePanelOpen} onClose={closeSidePanel} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  menuButton: {
    padding: 8,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
});

export default SidePanelIntegration;

/*
INTEGRATION INSTRUCTIONS:

1. I din befintliga HomeScreen (app/(tabs)/index.tsx), lägg till:

import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import SidePanel from '../../components/SidePanel';

2. Lägg till state i början av din HomeScreen-komponent:
const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

3. Lägg till funktioner:
const openSidePanel = () => setIsSidePanelOpen(true);
const closeSidePanel = () => setIsSidePanelOpen(false);

4. Lägg till en menyknapp i din header (i din ScrollView):
<View style={styles.header}>
  <TouchableOpacity onPress={openSidePanel} style={styles.menuButton}>
    <Ionicons name="menu" size={24} color={colors.text} />
  </TouchableOpacity>
  <Text style={styles.title}>Välkommen till Skiftappen</Text>
</View>

5. Lägg till SidePanel-komponenten längst ner i din return-statement:
<SidePanel isOpen={isSidePanelOpen} onClose={closeSidePanel} />

6. Lägg till CSS för menyknappen:
menuButton: {
  padding: 8,
  marginRight: 15,
},
*/