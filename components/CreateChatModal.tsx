import { Plus, Users, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  position: string;
  company_id: string;
  is_active: boolean;
}

interface CreateChatModalProps {
  visible: boolean;
  onClose: () => void;
  companyId?: string;
}

export const CreateChatModal: React.FC<CreateChatModalProps> = ({
  visible,
  onClose,
  companyId
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { createChatRoom, fetchChatRooms } = useChat();
  
  const [chatName, setChatName] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (visible && companyId) {
      fetchCompanyEmployees();
      // Always include current user in selected members
      if (user) {
        setSelectedMembers(new Set([user.id]));
      }
    }
  }, [visible, companyId]);

  const fetchCompanyEmployees = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('first_name');

      if (error) {
        console.error('Error fetching employees:', error);
        return;
      }

      setEmployees(data || []);
    } catch (err) {
      console.error('Unexpected error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (employeeId: string) => {
    // Don't allow removing current user
    if (employeeId === user?.id) return;

    setSelectedMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  };

  const handleCreateChat = async () => {
    if (!chatName.trim()) {
      Alert.alert('Fel', 'Ange ett namn för chatten');
      return;
    }

    if (selectedMembers.size < 2) {
      Alert.alert('Fel', 'Välj minst en annan person för chatten');
      return;
    }

    try {
      setCreating(true);

      // Create the chat room
      const { data: chatRoom, error: chatError } = await supabase
        .from('chat_rooms')
        .insert({
          name: chatName.trim(),
          description: `Privat gruppchatt: ${chatName.trim()}`,
          type: 'private',
          is_private: true,
          company_id: companyId,
          created_by: user?.id
        })
        .select()
        .single();

      if (chatError) {
        console.error('Error creating chat room:', chatError);
        Alert.alert('Fel', 'Kunde inte skapa chatten');
        return;
      }

      // Add all selected members
      const members = Array.from(selectedMembers).map(memberId => ({
        chat_room_id: chatRoom.id,
        employee_id: memberId,
        role: memberId === user?.id ? 'admin' : 'member'
      }));

      const { error: membersError } = await supabase
        .from('chat_room_members')
        .insert(members);

      if (membersError) {
        console.error('Error adding members:', membersError);
        Alert.alert('Fel', 'Kunde inte lägga till medlemmar');
        return;
      }

      // Send welcome message
      const memberNames = employees
        .filter(emp => selectedMembers.has(emp.id) && emp.id !== user?.id)
        .map(emp => emp.first_name)
        .join(', ');

      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_room_id: chatRoom.id,
          sender_id: user?.id,
          content: `Välkommen till "${chatName}"! 👋\n\nMedlemmar: ${memberNames}`,
          message_type: 'system'
        });

      if (messageError) {
        console.error('Error sending welcome message:', messageError);
      }

      // Refresh chat rooms
      await fetchChatRooms();

      Alert.alert(
        'Chatt skapad!',
        `"${chatName}" har skapats med ${selectedMembers.size} medlemmar.`,
        [{ text: 'OK', onPress: handleClose }]
      );

    } catch (error) {
      console.error('Error creating chat:', error);
      Alert.alert('Fel', 'Något gick fel när chatten skulle skapas');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setChatName('');
    setSelectedMembers(new Set(user ? [user.id] : []));
    onClose();
  };

  const renderEmployee = ({ item }: { item: Employee }) => {
    const isSelected = selectedMembers.has(item.id);
    const isCurrentUser = item.id === user?.id;

    return (
      <TouchableOpacity
        style={[
          styles.employeeItem,
          { 
            backgroundColor: colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
            borderWidth: isSelected ? 2 : 1,
            opacity: isCurrentUser ? 0.7 : 1
          }
        ]}
        onPress={() => toggleMember(item.id)}
        disabled={isCurrentUser}
      >
        <View style={styles.employeeInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {item.first_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.employeeDetails}>
            <Text style={[styles.employeeName, { color: colors.text }]}>
              {item.first_name} {item.last_name}
              {isCurrentUser && ' (Du)'}
            </Text>
            <Text style={[styles.employeePosition, { color: colors.textSecondary }]}>
              {item.position || 'Medarbetare'} • {item.department}
            </Text>
          </View>
        </View>
        
        <View style={[
          styles.selectIndicator,
          { 
            backgroundColor: isSelected ? colors.primary : colors.border,
            borderColor: colors.primary
          }
        ]}>
          {isSelected && <Text style={styles.checkMark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 20,
      width: '90%',
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    nameInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    memberCount: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    employeesList: {
      maxHeight: 300,
    },
    employeeItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    employeeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    employeeDetails: {
      flex: 1,
    },
    employeeName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
    },
    employeePosition: {
      fontSize: 12,
    },
    selectIndicator: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkMark: {
      color: 'white',
      fontSize: 14,
      fontWeight: 'bold',
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    cancelButton: {
      backgroundColor: colors.textSecondary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      flex: 1,
      marginRight: 8,
    },
    createButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      flex: 1,
      marginLeft: 8,
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    loadingText: {
      textAlign: 'center',
      color: colors.textSecondary,
      padding: 20,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Skapa privat chatt</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chattnamn</Text>
            <TextInput
              style={styles.nameInput}
              value={chatName}
              onChangeText={setChatName}
              placeholder="Ange ett namn för chatten..."
              placeholderTextColor={colors.textSecondary}
              maxLength={50}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Välj medlemmar</Text>
            <Text style={styles.memberCount}>
              {selectedMembers.size} medlemmar valda
            </Text>
            
            {loading ? (
              <Text style={styles.loadingText}>Laddar medarbetare...</Text>
            ) : (
              <FlatList
                data={employees}
                renderItem={renderEmployee}
                keyExtractor={(item) => item.id}
                style={styles.employeesList}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.buttonText}>Avbryt</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.createButton, { opacity: creating ? 0.7 : 1 }]}
              onPress={handleCreateChat}
              disabled={creating}
            >
              <Text style={styles.buttonText}>
                {creating ? 'Skapar...' : 'Skapa chatt'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};