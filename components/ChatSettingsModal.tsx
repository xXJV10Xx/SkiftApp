import { Edit3, Plus, Settings, Trash2, Users, X } from 'lucide-react-native';
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

interface ChatMember {
  id: string;
  employee_id: string;
  role: string;
  joined_at: string;
  employees: {
    first_name: string;
    last_name: string;
    email: string;
    department: string;
    position: string;
  };
}

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

interface OnlineStatus {
  user_id: string;
  is_online: boolean;
  last_seen: string;
}

interface ChatSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  chatRoom: any;
}

export const ChatSettingsModal: React.FC<ChatSettingsModalProps> = ({
  visible,
  onClose,
  chatRoom
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { fetchChatRooms } = useChat();
  
  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'add'>('info');
  const [chatName, setChatName] = useState(chatRoom?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, OnlineStatus>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && chatRoom) {
      setChatName(chatRoom.name);
      fetchMembers();
      fetchOnlineStatuses();
      if (activeTab === 'add') {
        fetchAvailableEmployees();
      }
    }
  }, [visible, chatRoom, activeTab]);

  const fetchMembers = async () => {
    if (!chatRoom) return;

    try {
      const { data, error } = await supabase
        .from('chat_room_members')
        .select(`
          *,
          employees (
            first_name,
            last_name,
            email,
            department,
            position
          )
        `)
        .eq('chat_room_id', chatRoom.id);

      if (error) {
        console.error('Error fetching members:', error);
        return;
      }

      setMembers(data || []);
    } catch (err) {
      console.error('Unexpected error fetching members:', err);
    }
  };

  const fetchOnlineStatuses = async () => {
    if (!chatRoom) return;

    try {
      // Get all member IDs
      const memberIds = members.map(m => m.employee_id);
      
      if (memberIds.length === 0) return;

      const { data, error } = await supabase
        .from('online_status')
        .select('*')
        .in('user_id', memberIds);

      if (error) {
        console.error('Error fetching online statuses:', error);
        return;
      }

      const statusMap: Record<string, OnlineStatus> = {};
      data?.forEach(status => {
        statusMap[status.user_id] = status;
      });

      setOnlineStatuses(statusMap);
    } catch (err) {
      console.error('Unexpected error fetching online statuses:', err);
    }
  };

  const fetchAvailableEmployees = async () => {
    if (!chatRoom?.company_id) return;

    try {
      setLoading(true);
      
      // Get current member IDs
      const currentMemberIds = members.map(m => m.employee_id);
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', chatRoom.company_id)
        .eq('is_active', true)
        .not('id', 'in', `(${currentMemberIds.join(',')})`)
        .order('first_name');

      if (error) {
        console.error('Error fetching available employees:', error);
        return;
      }

      setAvailableEmployees(data || []);
    } catch (err) {
      console.error('Unexpected error fetching available employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateChatName = async () => {
    if (!chatName.trim() || chatName === chatRoom.name) {
      setIsEditing(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_rooms')
        .update({ name: chatName.trim() })
        .eq('id', chatRoom.id);

      if (error) {
        console.error('Error updating chat name:', error);
        Alert.alert('Fel', 'Kunde inte uppdatera chattnamnet');
        return;
      }

      // Send system message about name change
      await supabase
        .from('messages')
        .insert({
          chat_room_id: chatRoom.id,
          sender_id: user?.id,
          content: `Chattnamnet ändrades till "${chatName.trim()}"`,
          message_type: 'system'
        });

      await fetchChatRooms();
      setIsEditing(false);
      Alert.alert('Framgång', 'Chattnamnet har uppdaterats');
    } catch (error) {
      console.error('Error updating chat name:', error);
      Alert.alert('Fel', 'Något gick fel');
    }
  };

  const handleAddMember = async (employee: Employee) => {
    try {
      const { error } = await supabase
        .from('chat_room_members')
        .insert({
          chat_room_id: chatRoom.id,
          employee_id: employee.id,
          role: 'member'
        });

      if (error) {
        console.error('Error adding member:', error);
        Alert.alert('Fel', 'Kunde inte lägga till medlemmen');
        return;
      }

      // Send system message
      await supabase
        .from('messages')
        .insert({
          chat_room_id: chatRoom.id,
          sender_id: user?.id,
          content: `${employee.first_name} ${employee.last_name} lades till i chatten`,
          message_type: 'system'
        });

      await fetchMembers();
      await fetchAvailableEmployees();
      Alert.alert('Framgång', `${employee.first_name} har lagts till i chatten`);
    } catch (error) {
      console.error('Error adding member:', error);
      Alert.alert('Fel', 'Något gick fel');
    }
  };

  const handleRemoveMember = async (member: ChatMember) => {
    if (member.employee_id === user?.id) {
      Alert.alert('Fel', 'Du kan inte ta bort dig själv från chatten');
      return;
    }

    Alert.alert(
      'Ta bort medlem',
      `Är du säker på att du vill ta bort ${member.employees.first_name} från chatten?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('chat_room_members')
                .delete()
                .eq('id', member.id);

              if (error) {
                console.error('Error removing member:', error);
                Alert.alert('Fel', 'Kunde inte ta bort medlemmen');
                return;
              }

              // Send system message
              await supabase
                .from('messages')
                .insert({
                  chat_room_id: chatRoom.id,
                  sender_id: user?.id,
                  content: `${member.employees.first_name} ${member.employees.last_name} togs bort från chatten`,
                  message_type: 'system'
                });

              await fetchMembers();
              await fetchAvailableEmployees();
              Alert.alert('Framgång', `${member.employees.first_name} har tagits bort`);
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Fel', 'Något gick fel');
            }
          }
        }
      ]
    );
  };

  const isOnline = (userId: string) => {
    const status = onlineStatuses[userId];
    if (!status) return false;
    
    // Consider online if last seen within 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const lastSeen = new Date(status.last_seen);
    
    return status.is_online || lastSeen > fiveMinutesAgo;
  };

  const renderMember = ({ item }: { item: ChatMember }) => {
    const online = isOnline(item.employee_id);
    const isCurrentUser = item.employee_id === user?.id;
    const canRemove = chatRoom?.created_by === user?.id && !isCurrentUser;

    return (
      <View style={[styles.memberItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.memberInfo}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {item.employees.first_name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={[
              styles.onlineIndicator,
              { backgroundColor: online ? '#4CAF50' : colors.textSecondary }
            ]} />
          </View>
          
          <View style={styles.memberDetails}>
            <Text style={[styles.memberName, { color: colors.text }]}>
              {item.employees.first_name} {item.employees.last_name}
              {isCurrentUser && ' (Du)'}
            </Text>
            <Text style={[styles.memberPosition, { color: colors.textSecondary }]}>
              {item.employees.position || 'Medarbetare'} • {item.employees.department}
            </Text>
            <Text style={[styles.memberRole, { color: colors.textSecondary }]}>
              {item.role === 'admin' ? 'Administratör' : 'Medlem'} • {online ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        {canRemove && (
          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: colors.error }]}
            onPress={() => handleRemoveMember(item)}
          >
            <Trash2 size={16} color="white" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderAvailableEmployee = ({ item }: { item: Employee }) => (
    <TouchableOpacity
      style={[styles.employeeItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => handleAddMember(item)}
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
          </Text>
          <Text style={[styles.employeePosition, { color: colors.textSecondary }]}>
            {item.position || 'Medarbetare'} • {item.department}
          </Text>
        </View>
      </View>
      
      <View style={[styles.addButton, { backgroundColor: colors.primary }]}>
        <Plus size={16} color="white" />
      </View>
    </TouchableOpacity>
  );

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
    tabs: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginHorizontal: 4,
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    inactiveTab: {
      backgroundColor: colors.surface,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
    },
    activeTabText: {
      color: 'white',
    },
    inactiveTabText: {
      color: colors.textSecondary,
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
    nameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    nameInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    nameText: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      padding: 12,
    },
    editButton: {
      backgroundColor: colors.primary,
      padding: 8,
      borderRadius: 6,
    },
    saveButton: {
      backgroundColor: colors.success,
      padding: 8,
      borderRadius: 6,
    },
    membersList: {
      maxHeight: 400,
    },
    memberItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
    },
    memberInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatarContainer: {
      position: 'relative',
      marginRight: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    onlineIndicator: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.background,
    },
    memberDetails: {
      flex: 1,
    },
    memberName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
    },
    memberPosition: {
      fontSize: 12,
      marginBottom: 2,
    },
    memberRole: {
      fontSize: 11,
      fontStyle: 'italic',
    },
    removeButton: {
      padding: 8,
      borderRadius: 6,
    },
    employeeItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
    },
    employeeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
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
    addButton: {
      padding: 8,
      borderRadius: 6,
    },
    loadingText: {
      textAlign: 'center',
      color: colors.textSecondary,
      padding: 20,
    },
    emptyText: {
      textAlign: 'center',
      color: colors.textSecondary,
      padding: 20,
      fontStyle: 'italic',
    },
  });

  if (!chatRoom) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Chattinställningar</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'info' ? styles.activeTab : styles.inactiveTab]}
              onPress={() => setActiveTab('info')}
            >
              <Text style={[styles.tabText, activeTab === 'info' ? styles.activeTabText : styles.inactiveTabText]}>
                Info
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'members' ? styles.activeTab : styles.inactiveTab]}
              onPress={() => setActiveTab('members')}
            >
              <Text style={[styles.tabText, activeTab === 'members' ? styles.activeTabText : styles.inactiveTabText]}>
                Medlemmar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'add' ? styles.activeTab : styles.inactiveTab]}
              onPress={() => setActiveTab('add')}
            >
              <Text style={[styles.tabText, activeTab === 'add' ? styles.activeTabText : styles.inactiveTabText]}>
                Lägg till
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'info' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chattnamn</Text>
              <View style={styles.nameContainer}>
                {isEditing ? (
                  <>
                    <TextInput
                      style={styles.nameInput}
                      value={chatName}
                      onChangeText={setChatName}
                      placeholder="Chattnamn..."
                      placeholderTextColor={colors.textSecondary}
                      maxLength={50}
                      autoFocus
                    />
                    <TouchableOpacity style={styles.saveButton} onPress={handleUpdateChatName}>
                      <Text style={{ color: 'white', fontSize: 12 }}>Spara</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.nameText}>{chatRoom.name}</Text>
                    {chatRoom.created_by === user?.id && (
                      <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                        <Edit3 size={16} color="white" />
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            </View>
          )}

          {activeTab === 'members' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Medlemmar ({members.length})</Text>
              <FlatList
                data={members}
                renderItem={renderMember}
                keyExtractor={(item) => item.id}
                style={styles.membersList}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}

          {activeTab === 'add' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lägg till medlemmar</Text>
              {loading ? (
                <Text style={styles.loadingText}>Laddar medarbetare...</Text>
              ) : availableEmployees.length > 0 ? (
                <FlatList
                  data={availableEmployees}
                  renderItem={renderAvailableEmployee}
                  keyExtractor={(item) => item.id}
                  style={styles.membersList}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <Text style={styles.emptyText}>
                  Alla medarbetare från företaget är redan medlemmar
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};