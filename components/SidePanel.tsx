import React from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { width } = Dimensions.get('window');

  const navigateTo = (route: string) => {
    onClose();
    router.push(route);
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Overlay to close panel when tapping outside */}
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={onClose}
          activeOpacity={1}
        />
        
        {/* Side Panel */}
        <View style={{
          width: Math.min(280, width * 0.8),
          height: '100%',
          backgroundColor: 'white',
          shadowColor: '#000',
          shadowOffset: { width: -2, height: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 8,
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 20,
        }}>
          {/* Close Button */}
          <TouchableOpacity 
            onPress={onClose} 
            style={{
              alignSelf: 'flex-end',
              marginBottom: 30,
              padding: 8,
            }}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>

          {/* Navigation Items */}
          <TouchableOpacity 
            onPress={() => navigateTo('/profile')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 15,
              borderBottomWidth: 1,
              borderBottomColor: '#f0f0f0',
            }}
          >
            <Text style={{ fontSize: 24, marginRight: 15 }}>👤</Text>
            <Text style={{ fontSize: 18, color: '#333' }}>Profil</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigateTo('/chat')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 15,
              borderBottomWidth: 1,
              borderBottomColor: '#f0f0f0',
            }}
          >
            <Text style={{ fontSize: 24, marginRight: 15 }}>💬</Text>
            <Text style={{ fontSize: 18, color: '#333' }}>Chatt</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigateTo('/schedule')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 15,
              borderBottomWidth: 1,
              borderBottomColor: '#f0f0f0',
            }}
          >
            <Text style={{ fontSize: 24, marginRight: 15 }}>📆</Text>
            <Text style={{ fontSize: 18, color: '#333' }}>Mina Skiftscheman</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigateTo('/')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 15,
              borderBottomWidth: 1,
              borderBottomColor: '#f0f0f0',
            }}
          >
            <Text style={{ fontSize: 24, marginRight: 15 }}>🏭</Text>
            <Text style={{ fontSize: 18, color: '#333' }}>Företagsöversikt</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default SidePanel;