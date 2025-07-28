import { Heart, MessageCircle, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
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
  avatar_url: string | null;
  is_active: boolean;
  company_id: string;
  team_id: string;
}

interface UserListProps {
  companyId?: string;
  teamId?: string;
  onUserInterest?: (userId: string) => void;
}

export const UserList: React.FC<UserListProps> = ({ 
  companyId, 
  teamId, 
  onUserInterest 
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { createChatRoom, joinChatRoom, setCurrentChatRoom } = useChat();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [interestedUsers, setInterestedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (companyId || teamId) {
      fetchEmployees();
    }
  }, [companyId, teamId]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('employees')
        .select('*')
        .eq('is_active', true)
        .neq('id', user?.id); // Exclude current user

      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      
      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data, error } = await query.order('first_name');

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

  const handleInterest = async (targetUser: Employee) => {
    try {
      if (!user) {
        Alert.alert('Fel', 'Du måste vara inloggad');
        return;
      }

      // Add to interested users set for UI feedback
      setInterestedUsers(prev => new Set([...prev, targetUser.id]));

      // Create or find existing private chat room
      const chatRoomName = `Privat: ${user.email?.split('@')[0]} & ${targetUser.first_name}`;
      
      // Check if private chat already exists
      const { data: existingRooms, error: searchError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('type', 'private')
        .or(`name.eq.${chatRoomName},name.eq.Privat: ${targetUser.first_name} & ${user.email?.split('@')[0]}`);

      if (searchError) {
        console.error('Error searching for existing chat:', searchError);
      }

      let chatRoom;

      if (existingRooms && existingRooms.length > 0) {
        // Use existing private chat
        chatRoom = existingRooms[0];
      } else {
        // Create new private chat room
        const { data: newRoom, error: createError } = await supabase
          .from('chat_rooms')
          .insert({
            name: chatRoomName,
            description: `Privat konversation mellan ${user.email?.split('@')[0]} och ${targetUser.first_name}`,
            type: 'private',
            is_private: true,
            created_by: user.id
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating private chat room:', createError);
          Alert.alert('Fel', 'Kunde inte skapa privat chatt');
          return;
        }

        chatRoom = newRoom;

        // Add both users to the private chat
        const members = [
          {
            chat_room_id: chatRoom.id,
            employee_id: user.id,
            role: 'member'
          },
          {
            chat_room_id: chatRoom.id,
            employee_id: targetUser.id,
            role: 'member'
          }
        ];

        const { error: membersError } = await supabase
          .from('chat_room_members')
          .insert(members);

        if (membersError) {
          console.error('Error adding members to chat:', membersError);
          Alert.alert('Fel', 'Kunde inte lägga till medlemmar i chatten');
          return;
        }
      }

      // Send initial interest message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_room_id: chatRoom.id,
          sender_id: user.id,
          content: `Hej ${targetUser.first_name}! Jag är intresserad av att chatta med dig. 😊`,
          message_type: 'interest'
        });

      if (messageError) {
        console.error('Error sending interest message:', messageError);
      }

      // Navigate to the private chat
      setCurrentChatRoom(chatRoom);
      
      Alert.alert(
        'Intresse skickat!', 
        `En privat chatt har startats med ${targetUser.first_name}. Du kan nu chatta privat.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Call optional callback
              onUserInterest?.(targetUser.id);
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error handling interest:', error);
      Alert.alert('Fel', 'Något gick fel när intresset skulle skickas');
    }
  };

  const renderEmployee = ({ item }: { item: Employee }) => {
    const isInterested = interestedUsers.has(item.id);

    return (
      <View style={[styles.employeeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.employeeInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <User size={24} color="white" />
          </View>
          
          <View style={styles.employeeDetails}>
            <Text style={[styles.employeeName, { color: colors.text }]}>
              {item.first_name} {item.last_name}
            </Text>
            <Text style={[styles.employeePosition, { color: colors.textSecondary }]}>
              {item.position || 'Medarbetare'}
            </Text>
            <Text style={[styles.employeeDepartment, { color: colors.textSecondary }]}>
              {item.department}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.interestButton,
              { 
                backgroundColor: isInterested ? colors.success : colors.primary,
                opacity: isInterested ? 0.7 : 1
              }
            ]}
            onPress={() => handleInterest(item)}
            disabled={isInterested}
          >
            <Heart 
              size={16} 
              color="white" 
              fill={isInterested ? "white" : "none"}
            />
            <Text style={styles.interestButtonText}>
              {isInterested ? 'Skickat!' : 'Intresserad'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    employeeCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    employeeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
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
      fontSize: 14,
      marginBottom: 2,
    },
    employeeDepartment: {
      fontSize: 12,
      fontStyle: 'italic',
    },
    actions: {
      alignItems: 'flex-end',
    },
    interestButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 6,
    },
    interestButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>Laddar användare...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Teammedlemmar</Text>
        <Text style={styles.headerSubtitle}>
          Tryck på "Intresserad" för att starta en privat chatt
        </Text>
      </View>

      {employees.length > 0 ? (
        <FlatList
          data={employees}
          renderItem={renderEmployee}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <MessageCircle size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Inga teammedlemmar</Text>
          <Text style={styles.emptySubtitle}>
            Det finns inga andra användare i ditt team än.
          </Text>
        </View>
      )}
    </View>
  );
};