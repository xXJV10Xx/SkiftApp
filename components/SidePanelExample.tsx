import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SidePanel from './SidePanel';

const SidePanelExample: React.FC = () => {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  const openSidePanel = () => {
    setIsSidePanelOpen(true);
  };

  const closeSidePanel = () => {
    setIsSidePanelOpen(false);
  };

  return (
    <View style={styles.container}>
      {/* Header with menu button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openSidePanel} style={styles.menuButton}>
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Skiftappen</Text>
      </View>

      {/* Your main content here */}
      <View style={styles.content}>
        <Text style={styles.contentText}>Huvudinnehåll här...</Text>
        
        {/* Example button to open side panel */}
        <TouchableOpacity onPress={openSidePanel} style={styles.exampleButton}>
          <Text style={styles.buttonText}>Öppna Sidopanel</Text>
        </TouchableOpacity>
      </View>

      {/* Side Panel */}
      <SidePanel isOpen={isSidePanelOpen} onClose={closeSidePanel} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuButton: {
    padding: 8,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
  exampleButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SidePanelExample;